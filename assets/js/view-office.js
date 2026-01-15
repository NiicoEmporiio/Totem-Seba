// ===============================
// VISTA DE OFICINA (DETALLE)
// ===============================

if (typeof window.openOffice !== "function") {
  window.openOffice = function (floorId, officeId) {
    console.log("[OFFICE] openOffice llamado con:", { floorId, officeId });

    if (!window.buildingData) {
      console.warn("[OFFICE] window.buildingData no está definido");
      return;
    }

    const floors = Array.isArray(window.buildingData.floors) ? window.buildingData.floors : [];
    const floor = floors.find((f) => String(f.id) === String(floorId));
    if (!floor) {
      console.warn("[OFFICE] Piso no encontrado:", floorId);
      return;
    }

    const office = (floor.offices || []).find((o) => String(o.id) === String(officeId));
    if (!office) {
      console.warn("[OFFICE] Oficina no encontrada:", officeId);
      return;
    }

    const infoTop = document.getElementById("officeFloorInfo");
    if (infoTop) infoTop.textContent = "";

    // 👉 SOLO renderiza
    renderOfficeDetail(floor, office);

    // 👉 Guardamos estado (para refresh)
    window.totemState = window.totemState || { view: "view-main", floorId: null, officeId: null };
    window.totemState.view = "view-office";
    window.totemState.floorId = String(floorId);
    window.totemState.officeId = String(officeId);

    // ❌ NO showView acá
    if (typeof resetInactivityTimer === "function") {
      resetInactivityTimer();
    }
  };
}
