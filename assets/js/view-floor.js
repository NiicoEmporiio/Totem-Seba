// ===============================
// VISTA DE PISO
// ===============================
let lastFloorId = null;

let currentFloorId = null;

function renderFloorView() {
  const bd = window.buildingData;
  if (!bd) {
    console.warn("[FLOOR] window.buildingData no está definido aún");
    return;
  }

  const floors = Array.isArray(bd.floors) ? bd.floors : [];
  const floor = floors.find((f) => String(f.id) === String(currentFloorId));

  if (!floor) {
    console.warn("[FLOOR] Piso no encontrado:", currentFloorId);
    if (typeof renderMainView === "function") renderMainView();
    if (typeof showView === "function") showView("view-main");
    return;
  }

  // Título / info del piso
  const titleEl = document.getElementById("floorTitle") || document.getElementById("floor-title");
  const infoEl = document.getElementById("floorInfo") || document.getElementById("floor-info");

  if (titleEl) titleEl.textContent = floor.name || "Piso";
  if (infoEl) infoEl.textContent = floor.shortDescription || floor.info || "";


  // Contenedor de oficinas (ajusté a ids típicos)
  const listEl =
    document.getElementById("officesGrid") ||
    document.getElementById("offices-list") ||
    document.querySelector(".offices-list");

  if (!listEl) {
    console.error("[FLOOR] No encuentro contenedor de oficinas (officesGrid / offices-list / .offices-list)");
    return;
  }

  listEl.innerHTML = "";

  const offices = Array.isArray(floor.offices) ? floor.offices.slice() : [];

  // Orden
  offices.sort((a, b) => {
    const oa = Number(a.order ?? 0);
    const ob = Number(b.order ?? 0);
    if (oa !== ob) return oa - ob;
    return String(a.name || "").localeCompare(String(b.name || ""));
  });

  offices.forEach((office) => {
    const card = createOfficeCardInFloor(floor, office);

    listEl.appendChild(card);
  });

  //showView("view-floor");
  if (typeof resetInactivityTimer === "function") resetInactivityTimer();
}

function openFloor(floorId) {
  currentFloorId = String(floorId);
  lastFloorId = String(floorId);

  // Guardar estado (por refresh)
  window.totemState = window.totemState || { view: "view-main", floorId: null, officeId: null };
  window.totemState.floorId = currentFloorId;
  window.totemState.officeId = null;

  renderFloorView();
}

// Permite que el botón "Volver" funcione desde la oficina
window.renderLastFloorView = function () {
  // ✅ prioridad: el estado real guardado
  const fid = window.totemState?.floorId || lastFloorId;

  if (fid) {
    openFloor(fid);
  } else {
    // fallback: si no hay piso guardado, volvemos al inicio
    if (typeof renderMainView === "function") renderMainView();
    if (typeof showView === "function") showView("view-main");
  }
};





// ✅ IMPORTANTE: exponer para templates.js
window.openFloor = openFloor;
