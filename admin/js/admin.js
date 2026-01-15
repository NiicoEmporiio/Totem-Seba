// ===============================
// PANEL ADMIN - Membrillar Plaza
// ===============================

// IMPORTANTE: API Token de Strapi
const STRAPI_TOKEN = "26a30b22be4e3990fb8edf17ef894d57591515a5d8de316efa2ff73f0bf6c992f1ad361072ff132a01e9025b285c0119db7abc4af0ffbedf9eff3b6dbfb122d3161871f18495e481fe324933e29d66377c925fa66abf113babcafe902cc82a214e526b1e564c83271e47f415fb440bb87e84ab8d834810bd1e76ce31a598706c";
const STRAPI_API = "http://localhost:1337/api";

function getApiBase() {
  return STRAPI_API;
}


let currentFloorId = null;
let currentEditingOffice = null;
let currentEditingFloor = null;

// Filtros oficinas
const officeFilters = {
  search: "",
  state: "all"
};

/* function getApiBase() {
  return "https://nadine-criminative-leif.ngrok-free.dev/api";
}*/

/* ==========================
   TOASTS
   ========================== */

function showToast(message, type = "info") {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  if (type === "success") toast.classList.add("toast-success");
  else if (type === "error") toast.classList.add("toast-error");
  else toast.classList.add("toast-info");

  const msgSpan = document.createElement("span");
  msgSpan.className = "toast-message";
  msgSpan.textContent = message;

  const btnClose = document.createElement("button");
  btnClose.className = "toast-close";
  btnClose.innerHTML = "&times;";
  btnClose.addEventListener("click", () => {
    container.removeChild(toast);
  });

  toast.appendChild(msgSpan);
  toast.appendChild(btnClose);
  container.appendChild(toast);

  setTimeout(() => {
    if (container.contains(toast)) container.removeChild(toast);
  }, 3500);
}

/* ==========================
   INICIALIZACIÓN
   ========================== */

document.addEventListener("DOMContentLoaded", async () => {
  const topbarStatus = document.getElementById("topbarStatus");
console.log("[ADMIN] API BASE:", getApiBase());

  try {
    if (topbarStatus) topbarStatus.textContent = "Cargando datos desde Strapi...";
    await loadBuildingData(); // viene de ../assets/js/api.js
    if (topbarStatus) topbarStatus.textContent = "Conectado a Strapi";
  } catch (err) {
    console.error("[ADMIN] Error cargando datos:", err);
    if (topbarStatus) {
      topbarStatus.textContent = "Error al cargar datos";
      topbarStatus.classList.add("status-error");
    }
    showToast("Error al cargar datos desde Strapi", "error");
  }

  initAdminPanel();
});

function initAdminPanel() {
  setupMenuButtons();
  setupBackButton();
  setupOfficeFilters();
  setupNewOfficeUI();
  setupFloorFormUI();
  setupImportOffices();
  setupRefreshTotemButton(); // 👈 ESTA ERA LA CLAVE

  renderFloorsTable();
  showView("floors");
}
async function safeReadJson(res) {
  const text = await res.text();

  if (!res.ok) {
    console.error("[ADMIN] HTTP error:", res.status, text);
    throw new Error(`HTTP ${res.status}`);
  }

  if (text.trim().startsWith("<!DOCTYPE")) {
    console.error("[ADMIN] HTML recibido en vez de JSON:", text);
    throw new Error("La URL NO apunta a la API de Strapi (/api)");
  }

  return JSON.parse(text);
}





// Canal para enviar mensajes de refresh al tótem (misma origin / mismo navegador)
let totemRefreshChannel = null;
if ("BroadcastChannel" in window) {
  totemRefreshChannel = new BroadcastChannel("totem-refresh");
}
function getApiBase() {
  return "http://localhost:1337/api";
}


function setupRefreshTotemButton() {
  const btn = document.getElementById("btnRefreshTotem");
  if (!btn) return;

  btn.addEventListener("click", async () => {
    await triggerTotemRefresh(btn);
  });
}


async function triggerTotemRefresh(btn) {
  const base = getApiBase();
  if (btn) btn.disabled = true;

  try {
    // 1) Leer el single type "building" completo
    const res = await fetch(`${STRAPI_API}/building?publicationState=preview`, {
      headers: {
        "Authorization": `Bearer ${STRAPI_TOKEN}`
      }
    });

    const json = await safeReadJson(res);

    if (!res.ok) {
      console.error("[ADMIN] Error leyendo refreshVersion:", res.status, json);
      showToast("No se pudo leer el estado del tótem", "error");
      return;
    }

    const data = json?.data || {};
    const attr = data.attributes || data;

    // Versión actual (si no existe, arrancamos en 1)
    const current = typeof attr.refreshVersion === "number" ? attr.refreshVersion : 1;
    const next = current + 1;

    // 2) Armamos payload reenviando campos simples (para no romper validaciones)
    const payload = {
      data: {
        name: attr.name ?? "",
        slogan: attr.slogan ?? "",
        description: attr.description ?? "",
        refreshVersion: next
        // NO tocamos image ni relaciones, para no complicar el update
      }
    };

    console.log("[ADMIN] Actualizando building.refreshVersion:", current, "=>", next);
    console.log("[ADMIN] Payload PUT /building:", payload);

    const resUpdate = await fetch(`${STRAPI_API}/building`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${STRAPI_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    const jsonUpdate = await resUpdate.json();
    if (!resUpdate.ok) {
      console.error(
        "[ADMIN] Error actualizando refreshVersion:",
        resUpdate.status,
        jsonUpdate,
        jsonUpdate?.error?.message
      );
      showToast(jsonUpdate?.error?.message || "No se pudo actualizar el tótem", "error");
      return;
    }

    console.log("[ADMIN] refreshVersion actualizado OK:", jsonUpdate);
    showToast("Se enviaron cambios al tótem", "success");
        if (totemRefreshChannel) {
      console.log("[ADMIN] Enviando mensaje de refresh al tótem vía BroadcastChannel");
      totemRefreshChannel.postMessage("refresh-now");
    }


  } catch (err) {
    console.error("[ADMIN] Error en triggerTotemRefresh:", err);
    showToast("Error al notificar al tótem", "error");
  } finally {
    if (btn) btn.disabled = false;
  }
}


/* ==========================
   VISTAS / MENÚ
   ========================== */

function showView(viewKey) {
  const viewFloors = document.getElementById("view-floors");
  const viewOffices = document.getElementById("view-offices");
  const topbarTitle = document.getElementById("topbarTitle");

  if (viewKey === "floors") {
    viewFloors?.classList.add("active");
    viewOffices?.classList.remove("active");
    if (topbarTitle) topbarTitle.textContent = "Pisos del edificio";
  } else {
    viewOffices?.classList.add("active");
    viewFloors?.classList.remove("active");
    if (topbarTitle) topbarTitle.textContent = "Oficinas";
  }

  document.querySelectorAll(".menu-item").forEach(btn => {
    const key = btn.dataset.view;
    if (key === viewKey) btn.classList.add("active");
    else btn.classList.remove("active");
  });
}

function setupMenuButtons() {
  document.querySelectorAll(".menu-item").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.view;

      if (target === "offices") {
        // Mostrar todas las oficinas del edificio
        currentFloorId = null;
        renderOfficesOfFloor(null);
        showView("offices");
      } else if (target === "floors") {
        showView("floors");
      }
    });
  });
}

function setupBackButton() {
  const btnBack = document.getElementById("btnBackToFloors");
  if (!btnBack) return;
  btnBack.addEventListener("click", () => showView("floors"));
}

/* ==========================
   FILTROS OFICINAS
   ========================== */

function setupOfficeFilters() {
  const searchInput = document.getElementById("officeSearchInput");
  const stateSelect = document.getElementById("officeStateFilter");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      officeFilters.search = searchInput.value.toLowerCase();
      renderOfficesOfFloor(currentFloorId || null);
    });
  }

  if (stateSelect) {
    stateSelect.addEventListener("change", () => {
      officeFilters.state = stateSelect.value;
      renderOfficesOfFloor(currentFloorId || null);
    });
  }
}

/* ==========================
   FORM OFICINA
   ========================== */

function setupNewOfficeUI() {
  const btnNewOffice = document.getElementById("btnNewOffice");
  const officeForm = document.getElementById("officeForm");
  const btnCancel = document.getElementById("btnCancelOfficeForm");

  if (btnNewOffice) {
    btnNewOffice.addEventListener("click", () => {
      if (!currentFloorId) return;
      currentEditingOffice = null;
      showOfficeForm();
    });
  }

  if (btnCancel) {
    btnCancel.addEventListener("click", () => {
      currentEditingOffice = null;
      hideOfficeForm();
    });
  }

  if (officeForm) {
    officeForm.addEventListener("submit", onOfficeFormSubmit);
  }
}

function showOfficeForm(office) {
  const officeFormCard = document.getElementById("officeFormCard");
  const officeFormMessage = document.getElementById("officeFormMessage");
  const officeFormTitle = document.getElementById("officeFormTitle");
  const descriptionInput = document.getElementById("officeDescriptionInput");


  const nameInput = document.getElementById("officeNameInput");
  const sectorInput = document.getElementById("officeSectorInput");
  const locationInput = document.getElementById("officeLocationInput");
  const stateSelect = document.getElementById("officeStateSelect");
  const tagsInput = document.getElementById("officeTagsInput");
  const qrLinkInput = document.getElementById("officeQrLinkInput");
 


// Campos QR / horarios (mismos fallbacks que showOfficeForm)
// Campos Links / horarios (mismos IDs que tu UI)
const qrMainInput =
  document.getElementById("officeQrMainUrlInput") ||
  document.getElementById("officeQrMainInput") ||
  document.getElementById("officeQrLinkInput");

const qrWhatsappInput =
  document.getElementById("officeQrWhatsAppUrlInput") ||
  document.getElementById("officeQrWhatsappUrlInput") ||
  document.getElementById("officeWhatsAppInput") ||
  document.getElementById("officeWhatsappInput");

const qrExtraInput =
  document.getElementById("officeQrExtraUrlInput") ||
  document.getElementById("officeExtraLinkInput") ||
  document.getElementById("officeExtraInput");

const scheduleInput =
  document.getElementById("officeScheduleTextInput") ||
  document.getElementById("officeScheduleInput") ||
  document.getElementById("officeScheduleText");




  if (!officeFormCard) return;

  if (officeFormMessage) {
    officeFormMessage.textContent = "";
    officeFormMessage.className = "form-message";
  }
  if (office) {
    if (officeFormTitle) officeFormTitle.textContent = "Editar oficina";
    if (nameInput) nameInput.value = office.name || "";
    if (sectorInput) sectorInput.value = office.sector || "";
    if (locationInput) locationInput.value = office.location || "";
    if (stateSelect) stateSelect.value = office.state || "ocupada";

    if (tagsInput) {
      if (Array.isArray(office.tags)) tagsInput.value = office.tags.join(", ");
      else if (typeof office.tags === "string") tagsInput.value = office.tags;
      else tagsInput.value = "";
    }

    if (qrLinkInput) qrLinkInput.value = office.qrLink || office.qr_link || "";
   if (qrMainInput) qrMainInput.value = office.qrMainUrl || office.qr_main_url || office.qrLink || office.qr_link || "";
if (qrWhatsappInput) qrWhatsappInput.value = office.qrWhatsAppUrl || office.qr_whatsapp_url || "";
if (qrExtraInput) qrExtraInput.value = office.qrExtraUrl || office.qr_extra_url || "";
if (scheduleInput) scheduleInput.value = office.scheduleText || office.schedule_text || "";


    // 👉 NUEVO: descripción
    if (descriptionInput) descriptionInput.value = office.description || "";
  } else {
    const officeForm = document.getElementById("officeForm");
    if (officeForm) officeForm.reset();
    if (officeFormTitle) officeFormTitle.textContent = "Nueva oficina";

    // 👉 limpiar descripción al crear nueva
    if (descriptionInput) descriptionInput.value = "";
  }



  officeFormCard.classList.remove("hidden");
}

function hideOfficeForm() {
  const officeFormCard = document.getElementById("officeFormCard");
  const officeFormMessage = document.getElementById("officeFormMessage");
  if (officeFormCard) officeFormCard.classList.add("hidden");
  if (officeFormMessage) {
    officeFormMessage.textContent = "";
    officeFormMessage.className = "form-message";
  }
}
/* ==========================
   SUBIR ARCHIVOS A STRAPI
   ========================== */
/* ==========================
   SUBIR ARCHIVOS A STRAPI
   ========================== */
/* ==========================
   SUBIR ARCHIVOS A STRAPI
   ========================== */
async function uploadFileToStrapi(file) {
  if (!file) return null;

  const apiBase = getApiBase(); // ej: http://localhost:1337/api
  const url = `${apiBase}/upload`;

  const formData = new FormData();
  formData.append("files", file);

  console.log("[ADMIN] Subiendo archivo a:", url);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${STRAPI_API}`
      // NO seteamos Content-Type, FormData se encarga solo
    },
    body: formData
  });

  let json;
  try {
    json = await safeReadJson(res);

  } catch (e) {
    console.warn("[ADMIN] Respuesta upload no es JSON válido:", e);
    json = null;
  }

  if (!res.ok) {
    console.error("[ADMIN] Error subiendo archivo a Strapi:", res.status, json);
    throw new Error(json?.error?.message || "Error al subir archivo");
  }

  // Strapi suele devolver un array
  const uploaded = Array.isArray(json) ? json[0] : json?.[0] || json?.data?.[0];
  console.log("[ADMIN] Archivo subido OK:", uploaded);
  return uploaded?.id || null;
}




async function onOfficeFormSubmit(event) {
  event.preventDefault();

  if (!currentFloorId) {
    alert("Primero seleccioná un piso.");
    return;
  }

  const nameInput = document.getElementById("officeNameInput");
  const sectorInput = document.getElementById("officeSectorInput");
  const locationInput = document.getElementById("officeLocationInput");
  const stateSelect = document.getElementById("officeStateSelect");
  const tagsInput = document.getElementById("officeTagsInput");
  const descriptionInput = document.getElementById("officeDescriptionInput");

// Campos Links / horarios (robusto con fallbacks)

const qrMainInput = document.getElementById("officeQrMainInput");
const qrWhatsInput = document.getElementById("officeQrWhatsInput");
const qrExtraInput = document.getElementById("officeQrExtraInput");
const scheduleInput = document.getElementById("officeScheduleInput");







  const logoInput = document.getElementById("officeLogoInput");
  const msgEl = document.getElementById("officeFormMessage");

  const name = (nameInput?.value || "").trim();
  if (!name) {
    if (msgEl) {
      msgEl.textContent = "El nombre de la oficina es obligatorio.";
      msgEl.className = "form-message error";
    }
    return;
  }

  const sector = (sectorInput?.value || "").trim();
  const location = (locationInput?.value || "").trim();
  const state = stateSelect?.value || "ocupada";
  const rawTags = (tagsInput?.value || "").trim();
  const description = (descriptionInput?.value || "").trim();

  // URLs
const qrMainUrl = (qrMainInput?.value || "").trim();
const qrWhatsUrl = (qrWhatsInput?.value || "").trim();
const qrExtraUrl = (qrExtraInput?.value || "").trim();
const scheduleText = (scheduleInput?.value || "").trim();





  // === Validar duplicados (nombre + ubicación) en el mismo piso ===
  const bd = window.buildingData || { floors: [] };
  const floors = bd.floors || [];
  const floor = floors.find(f => String(f.id) === String(currentFloorId));

  if (floor) {
    const offices = floor.offices || [];
    const lowerName = name.toLowerCase();
    const lowerLoc = location.toLowerCase();

    const existsDup = offices.some(o => {
      if (currentEditingOffice && String(o.id) === String(currentEditingOffice.id)) return false;
      const oName = (o.name || "").toLowerCase();
      const oLoc = (o.location || "").toLowerCase();
      return oName === lowerName && oLoc === lowerLoc;
    });

    if (existsDup) {
      if (msgEl) {
        msgEl.textContent = "Ya existe una oficina con el mismo nombre y ubicación en este piso.";
        msgEl.className = "form-message error";
      }
      if (typeof showToast === "function") showToast("Oficina duplicada en este piso (nombre + ubicación)", "error");
      return;
    }
  }

  if (msgEl) {
    msgEl.textContent = currentEditingOffice
      ? "Preparando vista previa de la edición..."
      : "Preparando vista previa de la nueva oficina...";
    msgEl.className = "form-message";
  }

  return showPreview(
    currentEditingOffice ? "Confirmar edición de oficina" : "Confirmar nueva oficina",
    `
      <p><strong>Nombre:</strong> ${name || "-"}</p>
      <p><strong>Rubro / Sector:</strong> ${sector || "-"}</p>
      <p><strong>Ubicación:</strong> ${location || "-"}</p>
      <p><strong>Estado:</strong> ${state}</p>
      <p><strong>Tags:</strong> ${rawTags || "-"}</p>
      <p><strong>QR principal:</strong> ${qrMainUrl || "-"}</p>
      <p><strong>QR WhatsApp:</strong> ${qrWhatsUrl || "-"}</p>
      <p><strong>QR extra:</strong> ${qrExtraUrl || "-"}</p>
      <p><strong>Horarios:</strong> ${scheduleText || "-"}</p>
    `,
    async () => {
      try {
        if (msgEl) {
          msgEl.textContent = currentEditingOffice ? "Actualizando oficina..." : "Guardando oficina...";
          msgEl.className = "form-message";
        }

        // 1) Subir logo si hay
        let logoId = null;
        const file = logoInput?.files?.[0];
        if (file) {
          try {
            logoId = await uploadFileToStrapi(file);
          } catch (e) {
            console.error("[ADMIN] No se pudo subir el logo de oficina:", e);
            if (typeof showToast === "function") showToast("No se pudo subir el logo de la oficina", "error");
          }
        }

        // 2) Payload final para Strapi
        const officePayload = {
          name,
          sector,
          location,
          description,
          state,
          tags: rawTags,

          // compatibilidad vieja (si la usabas en algún lado)
          qr_link: qrMainUrl || null,

          // campos nuevos (los del content-type)
          qr_main_url: qrMainUrl || null,
          qr_whatsapp_url: qrWhatsUrl || null,
          qr_extra_url: qrExtraUrl || null,
          schedule_text: scheduleText || null
        };

        if (logoId) officePayload.logo = logoId;

        // 3) Crear o actualizar en Strapi
        if (currentEditingOffice) {
          await updateOfficeInStrapi(currentEditingOffice, officePayload, currentFloorId);
          if (msgEl) {
            msgEl.textContent = "Oficina actualizada correctamente.";
            msgEl.className = "form-message ok";
          }
          if (typeof showToast === "function") showToast("Oficina actualizada", "success");
        } else {
          await createOfficeInStrapi(officePayload, currentFloorId);
          if (msgEl) {
            msgEl.textContent = "Oficina creada correctamente.";
            msgEl.className = "form-message ok";
          }
          if (typeof showToast === "function") showToast("Oficina creada", "success");
        }

        // Recargar data + refrescar UI
        await loadBuildingData();
        if (typeof renderFloorsTable === "function") renderFloorsTable();
        if (typeof renderOfficesOfFloor === "function") renderOfficesOfFloor(currentFloorId);

        currentEditingOffice = null;
        if (typeof hideOfficeForm === "function") hideOfficeForm();

      } catch (err) {
        console.error("[ADMIN] Error guardando oficina:", err);
        if (msgEl) {
          msgEl.textContent = "Error al guardar la oficina. Revisá la consola.";
          msgEl.className = "form-message error";
        }
        if (typeof showToast === "function") showToast("Error al guardar oficina", "error");
      }
    }
  );
}





/* ==========================
   STRAPI: OFICINAS
   ========================== */

/* ==========================
   STRAPI: OFICINAS
   ========================== */

async function findOfficeIdInStrapi(officeOriginal, floorId) {
  const base = getApiBase();
  const params = new URLSearchParams();
  params.append("pagination[limit]", "1");
  if (officeOriginal.name) params.append("filters[name][$eq]", officeOriginal.name);
  if (officeOriginal.sector) params.append("filters[sector][$eq]", officeOriginal.sector);
  if (officeOriginal.location) params.append("filters[location][$eq]", officeOriginal.location);
  if (floorId != null) params.append("filters[floor][id][$eq]", String(floorId));

  const url = `${base}/offices?${params.toString()}`;
  console.log("[ADMIN] Buscando officeId en Strapi:", url);

  const res = await fetch(url, {
    headers: { "Authorization": `Bearer ${STRAPI_TOKEN}` }
  });

  const json = await safeReadJson(res);

  console.log("[ADMIN] Resultado búsqueda office:", json);

  if (!res.ok || !json.data.length) {
    throw new Error("No se encontró la oficina en Strapi");
  }

  const item = json.data[0];

  // 👇 En Strapi 5 la URL usa documentId
  const realId = item.documentId || item.id;

  console.log(
    "[ADMIN] ID devuelto por Strapi -> id:",
    item.id,
    "documentId:",
    item.documentId,
    "usando (para la URL):",
    realId
  );

  return realId;
}


async function createOfficeInStrapi(office, floorId) {
  try {
    const base = getApiBase();

    // calcular próximo "order" dentro de ese piso
    let nextOrder = 1;
    const bd = window.buildingData || { floors: [] };
    const floors = bd.floors || [];
    const floor = floors.find(f => String(f.id) === String(floorId));
    if (floor && Array.isArray(floor.offices) && floor.offices.length > 0) {
      const maxOrder = Math.max(
        ...floor.offices.map(o => (o.order != null ? o.order : 0))
      );
      nextOrder = maxOrder + 1;
    }

    // Unificamos el QR principal
    const qrMainUrl = office.qr_main_url || office.qr_link || null;

    const payload = {
      data: {
        name: office.name,
        sector: office.sector,
        location: office.location,
        description: office.description || "",
        tags: typeof office.tags === "string" ? office.tags : "",
        state: office.state,

        // QRs y horarios
        qr_main_url: qrMainUrl,
        qr_whatsapp_url: office.qr_whatsapp_url || null,
        qr_extra_url: office.qr_extra_url || null,
        schedule_text: office.schedule_text || "",

        // compatibilidad con modelo viejo
        qr_link: qrMainUrl,

        // relación y orden
        floor: floorId,
        order: nextOrder,
        ...(office.logo ? { logo: office.logo } : {})
      }
    };

    console.log("[ADMIN] Enviando payload (crear oficina):", payload);

    const res = await fetch(`${STRAPI_API}/offices`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${STRAPI_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    const json = await safeReadJson(res);

    if (!res.ok) {
      console.error("[ADMIN] Respuesta Strapi no OK (crear office):", res.status, json);
      throw new Error("Error al crear oficina en Strapi");
    }

    console.log("[ADMIN] Oficina creada OK:", json);
    return json;
  } catch (err) {
    console.error("[ADMIN] Error creando oficina:", err);
    throw err;
  }
}



async function updateOfficeInStrapi(officeOriginal, officeNewValues, floorId) {
  try {
    const base = getApiBase();
    const officeId = await findOfficeIdInStrapi(officeOriginal, floorId);

    const currentOrder = officeOriginal.order != null ? officeOriginal.order : 0;

    // Valor principal de QR (nuevo o viejo)
    const qrMainUrl =
      officeNewValues.qr_main_url ||
      officeNewValues.qr_link ||
      officeOriginal.qr_main_url ||
      officeOriginal.qr_link ||
      null;

    const payload = {
      data: {
        name: officeNewValues.name,
        sector: officeNewValues.sector,
        location: officeNewValues.location,
        description: officeNewValues.description || "",
        tags:
          typeof officeNewValues.tags === "string"
            ? officeNewValues.tags
            : "",

        state: officeNewValues.state,

        // QRs y horarios
        qr_main_url: qrMainUrl,
        qr_whatsapp_url: officeNewValues.qr_whatsapp_url || null,
        qr_extra_url: officeNewValues.qr_extra_url || null,
        schedule_text: officeNewValues.schedule_text || "",

        // compatibilidad con modelo viejo
        qr_link: qrMainUrl,

        // dejamos el mismo piso y orden
        floor: floorId,
        order: currentOrder
      }
    };

    // Solo cambiamos el logo si vino uno nuevo
    if (officeNewValues.logo) {
      payload.data.logo = officeNewValues.logo;
    }

    console.log("[ADMIN] Editando officeId REAL:", officeId);
    console.log("[ADMIN] Enviando payload (editar office):", payload);

    const res = await fetch(`${STRAPI_API}/offices/${officeId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${STRAPI_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    const json = await safeReadJson(res);

    if (!res.ok) {
      console.error(
        "[ADMIN] Respuesta Strapi no OK (editar office):",
        res.status,
        json,
        "mensaje:",
        json?.error?.message,
        "detalles:",
        json?.error?.details
      );
      throw new Error("Error al editar oficina en Strapi");
    }

    console.log("[ADMIN] Oficina actualizada OK:", json);
    return json;
  } catch (err) {
    console.error("[ADMIN] Error editando oficina:", err);
    throw err;
  }
}



async function deleteOfficeInStrapiByOriginal(officeOriginal, floorId) {
  try {
    const base = getApiBase();
    const officeId = await findOfficeIdInStrapi(officeOriginal, floorId);

    console.log("[ADMIN] Eliminando oficina con id real:", officeId);

    const res = await fetch(`${STRAPI_API}/offices/${officeId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${STRAPI_TOKEN}` }
    });

    let json = null;
    const text = await res.text();
    if (text) {
      try {
        json = JSON.parse(text);
      } catch (e) {
        console.warn("[ADMIN] Respuesta DELETE office no es JSON válido:", text);
      }
    }

    if (!res.ok) {
      console.error("[ADMIN] Respuesta Strapi no OK (delete office):", res.status, json);
      throw new Error("Error al eliminar oficina en Strapi");
    }

    console.log("[ADMIN] Oficina eliminada OK:", json || "(sin body)");
    return json;

  } catch (err) {
    console.error("[ADMIN] Error eliminando oficina:", err);
    throw err;
  }
}

/* ==========================
   FORM PISO
   ========================== */

function setupFloorFormUI() {
  const btnNewFloor = document.getElementById("btnNewFloor");
  const floorForm = document.getElementById("floorForm");
  const btnCancelFloor = document.getElementById("btnCancelFloorForm");

  if (btnNewFloor) {
    btnNewFloor.addEventListener("click", () => {
      currentEditingFloor = null;
      showFloorForm();
    });
  }

  if (btnCancelFloor) {
    btnCancelFloor.addEventListener("click", () => {
      currentEditingFloor = null;
      hideFloorForm();
    });
  }

  if (floorForm) {
    floorForm.addEventListener("submit", onFloorFormSubmit);
  }
}

function showFloorForm(floor) {
  const floorFormCard = document.getElementById("floorFormCard");
  const floorFormMessage = document.getElementById("floorFormMessage");
  const floorFormTitle = document.getElementById("floorFormTitle");

  const nameInput = document.getElementById("floorNameInput");
  const shortDescInput = document.getElementById("floorShortDescInput");
  const numberInput = document.getElementById("floorNumberInput");

  if (!floorFormCard) return;

  if (floorFormMessage) {
    floorFormMessage.textContent = "";
    floorFormMessage.className = "form-message";
  }

  if (floor) {
    if (floorFormTitle) floorFormTitle.textContent = "Editar piso";
    if (nameInput) nameInput.value = floor.name || "";
    if (shortDescInput) shortDescInput.value = floor.shortDescription || "";
    if (numberInput) numberInput.value = floor.number != null ? floor.number : "";
  } else {
    if (floorFormTitle) floorFormTitle.textContent = "Nuevo piso";
    if (nameInput) nameInput.value = "";
    if (shortDescInput) shortDescInput.value = "";
    if (numberInput) numberInput.value = "";
  }

  floorFormCard.classList.remove("hidden");
}

function hideFloorForm() {
  const floorFormCard = document.getElementById("floorFormCard");
  const floorFormMessage = document.getElementById("floorFormMessage");
  if (floorFormCard) floorFormCard.classList.add("hidden");
  if (floorFormMessage) {
    floorFormMessage.textContent = "";
    floorFormMessage.className = "form-message";
  }
}

async function onFloorFormSubmit(event) {
  event.preventDefault();

  const nameInput = document.getElementById("floorNameInput");
  const shortDescInput = document.getElementById("floorShortDescInput");
  const numberInput = document.getElementById("floorNumberInput");
  const logoInput = document.getElementById("floorLogoInput");
  const msgEl = document.getElementById("floorFormMessage");

  const name = nameInput.value.trim();
  const shortDesc = shortDescInput.value.trim();
  let numberRaw = numberInput.value.trim();

  if (!name) {
    if (msgEl) {
      msgEl.textContent = "El nombre del piso es obligatorio.";
      msgEl.className = "form-message error";
    }
    return;
  }

  const allFloors = (window.buildingData && window.buildingData.floors) || [];

  let number;
  if (numberRaw === "") {
    const nextNumber =
      allFloors.length > 0
        ? Math.max(...allFloors.map(f => f.number || 0)) + 1
        : 1;
    number = nextNumber;
  } else {
    number = parseInt(numberRaw, 10);
    if (Number.isNaN(number)) number = 1;
  }

  // Validar número de piso duplicado
  const existSameNumber = allFloors.some(f =>
    (f.number || 0) === number &&
    (!currentEditingFloor || String(f.id) !== String(currentEditingFloor.id))
  );

  if (existSameNumber) {
    if (msgEl) {
      msgEl.textContent = `Ya existe un piso con el número ${number}. Usá otro número.`;
      msgEl.className = "form-message error";
    }
    showToast(`Número de piso ${number} duplicado`, "error");
    return;
  }

  if (msgEl) {
    msgEl.textContent = currentEditingFloor
      ? "Actualizando piso..."
      : "Guardando piso...";
    msgEl.className = "form-message";
  }

  // 👇 si hay archivo seleccionado, lo subimos a Strapi
  let logoId = null;
  const file = logoInput && logoInput.files && logoInput.files[0];
  if (file) {
    try {
      logoId = await uploadFileToStrapi(file);
    } catch (e) {
      console.error("[ADMIN] No se pudo subir el logo:", e);
      showToast("No se pudo subir el logo del piso", "error");
      // seguimos igual pero sin logo
    }
  }

  const floorPayload = {
    name,
    shortDescription: shortDesc,
    number
  };

  if (logoId) {
    // este campo tiene que llamarse igual que en Strapi (media single)
    floorPayload.logo = logoId;
  }

  try {
    if (currentEditingFloor) {
      await updateFloorInStrapi(currentEditingFloor, floorPayload);
      if (msgEl) {
        msgEl.textContent = "Piso actualizado correctamente.";
        msgEl.className = "form-message ok";
      }
      showToast("Piso actualizado", "success");
    } else {
      await createFloorInStrapi(floorPayload);
      if (msgEl) {
        msgEl.textContent = "Piso creado correctamente.";
        msgEl.className = "form-message ok";
      }
      showToast("Piso creado", "success");
    }

    await loadBuildingData();
    renderFloorsTable();

    currentEditingFloor = null;
    hideFloorForm();

  } catch (err) {
    console.error("[ADMIN] Error guardando piso:", err);
    if (msgEl) {
      msgEl.textContent = "Error al guardar el piso. Revisá la consola.";
      msgEl.className = "form-message error";
    }
    showToast("Error al guardar piso", "error");
  }
}


/* ==========================
   STRAPI: PISOS
   ========================== */

async function findFloorIdInStrapi(floorOriginal) {
  const base = getApiBase();
  const params = new URLSearchParams();
  params.append("pagination[limit]", "1");
  if (floorOriginal.name) params.append("filters[name][$eq]", floorOriginal.name);
  if (floorOriginal.number != null) params.append("filters[number][$eq]", floorOriginal.number);

  const url = `${base}/floors?${params.toString()}`;
  console.log("[ADMIN] Buscando floorId en Strapi:", url);

  const res = await fetch(url, {
    headers: { "Authorization": `Bearer ${STRAPI_API}` }
  });

const json = await safeReadJson(res);

  console.log("[ADMIN] Resultado búsqueda floor:", json);

  if (!res.ok || !json.data.length) {
    throw new Error("No se encontró el piso en Strapi");
  }

  const item = json.data[0];
  const realId = item.documentId ?? item.id;
  console.log("[ADMIN] Floor ID -> id:", item.id, "documentId:", item.documentId, "usando:", realId);
  return realId;
}

async function createFloorInStrapi(floor) {
  try {
    const base = getApiBase();
    const payload = {
      data: {
        name: floor.name,
        shortDescription: floor.shortDescription || "",
        number: floor.number || 1,
        // solo mandamos logo si viene
        ...(floor.logo ? { logo: floor.logo } : {})
      }
    };

    console.log("[ADMIN] Enviando payload (crear piso):", payload);

    const res = await fetch(`${STRAPI_API}/floors`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${STRAPI_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    const json = await safeReadJson(res);

    if (!res.ok) {
      console.error("[ADMIN] Respuesta Strapi no OK (crear piso):", res.status, json);
      throw new Error("Error al crear piso en Strapi");
    }

    console.log("[ADMIN] Piso creado OK:", json);
    return json;
  } catch (err) {
    console.error("[ADMIN] Error creando piso:", err);
    throw err;
  }
}


async function updateFloorInStrapi(floorOriginal, floorNewValues) {
  try {
    const base = getApiBase();
    const floorId = await findFloorIdInStrapi(floorOriginal);

    const payload = {
      data: {
        name: floorNewValues.name,
        shortDescription: floorNewValues.shortDescription || "",
        number: floorNewValues.number || 1
      }
    };

    // si viene logo nuevo lo mandamos, si no, no tocamos el actual
    if (floorNewValues.logo) {
      payload.data.logo = floorNewValues.logo;
    }

    console.log("[ADMIN] Editando floorId REAL:", floorId);
    console.log("[ADMIN] Enviando payload (editar piso):", payload);

    const res = await fetch(`${STRAPI_API}/floors/${floorId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${STRAPI_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

   const json = await safeReadJson(res);

    if (!res.ok) {
      console.error("[ADMIN] Respuesta Strapi no OK (editar piso):", res.status, json);
      throw new Error("Error al editar piso en Strapi");
    }

    console.log("[ADMIN] Piso actualizado OK:", json);
    return json;
  } catch (err) {
    console.error("[ADMIN] Error editando piso:", err);
    throw err;
  }
}


async function deleteFloorInStrapi(floorOriginal) {
  try {
    const base = getApiBase();
    const floorId = await findFloorIdInStrapi(floorOriginal);

    console.log("[ADMIN] Eliminando piso con id real:", floorId);

    const res = await fetch(`${STRAPI_API}/floors/${floorId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${STRAPI_TOKEN}` }
    });

    let json = null;
    const text = await res.text();
    if (text) {
      try {
        json = JSON.parse(text);
      } catch (e) {
        console.warn("[ADMIN] Respuesta DELETE floor no es JSON válido:", text);
      }
    }

    if (!res.ok) {
      console.error("[ADMIN] Respuesta Strapi no OK (delete floor):", res.status, json);
      throw new Error("Error al eliminar piso en Strapi");
    }

    console.log("[ADMIN] Piso eliminado OK:", json || "(sin body)");
    return json;
  } catch (err) {
    console.error("[ADMIN] Error eliminando piso:", err);
    throw err;
  }
}

/* ==========================
   TABLA DE PISOS
   ========================== */

function renderFloorsTable() {
  const bd = window.buildingData || { floors: [] };
  let floors = bd.floors || [];

  // ordenar por número
  floors = floors.slice().sort((a, b) => {
    const na = a.number || 0;
    const nb = b.number || 0;
    if (na !== nb) return na - nb;
    return (a.name || "").localeCompare(b.name || "");
  });

  const tbody = document.getElementById("floorsTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";

  floors.forEach((floor, index) => {
    const offices = floor.offices || [];
    const total = offices.length;
    const libres = offices.filter(o => o.state === "libre").length;
    const ocupadas = offices.filter(o => o.state === "ocupada").length;
    const reservadas = offices.filter(o => o.state === "reservada").length;

    const tr = document.createElement("tr");

    // ⬇️⬇️ AQUÍ VAN LAS CLASES SEGÚN ESTADO DEL PISO ⬇️⬇️
    if (libres > 0) {
      tr.classList.add("has-libres");
    }
    if (ocupadas === total && total > 0) {
      tr.classList.add("all-ocupadas");
    }

    tr.addEventListener("click", () => {
      currentFloorId = floor.id;
      renderOfficesOfFloor(floor.id);
      showView("offices");
    });

    const tdIndex = document.createElement("td");
    tdIndex.textContent = String(index + 1);

    const tdName = document.createElement("td");
    const num = floor.number != null ? floor.number : "";
    if (num !== "") {
      tdName.textContent = `Piso ${num} · ${floor.name || ""}`;
    } else {
      tdName.textContent = floor.name || "(sin nombre)";
    }

    const tdDesc = document.createElement("td");
    tdDesc.textContent = floor.shortDescription || "";

    const tdTotal = document.createElement("td");
    tdTotal.textContent = total === 1 ? "1 oficina" : `${total} oficinas`;

    const tdLibres = document.createElement("td");
    tdLibres.textContent = libres || "0";

    const tdOcupadas = document.createElement("td");
    tdOcupadas.textContent = ocupadas || "0";

    const tdReservadas = document.createElement("td");
    tdReservadas.textContent = reservadas || "0";

    const tdActions = document.createElement("td");

    const btnView = document.createElement("button");
    btnView.className = "btn-secondary";
    btnView.textContent = "Ver oficinas";
    btnView.addEventListener("click", (e) => {
      e.stopPropagation();
      currentFloorId = floor.id;
      renderOfficesOfFloor(floor.id);
      showView("offices");
    });

    const btnEditFloor = document.createElement("button");
    btnEditFloor.className = "btn-secondary";
    btnEditFloor.textContent = "Editar";
    btnEditFloor.style.marginLeft = "0.5rem";
    btnEditFloor.addEventListener("click", (e) => {
      e.stopPropagation();
      currentEditingFloor = floor;
      showFloorForm(floor);
    });

    const btnDeleteFloor = document.createElement("button");
    btnDeleteFloor.className = "btn-secondary btn-danger";
    btnDeleteFloor.textContent = "Eliminar";
    btnDeleteFloor.style.marginLeft = "0.5rem";
    btnDeleteFloor.addEventListener("click", async (e) => {
      e.stopPropagation();
      const officesCount = offices.length;
      let msg = `¿Seguro que querés eliminar el piso "${floor.name || floor.id}"?`;
      if (officesCount > 0) {
        msg += `\nAtención: tiene ${officesCount} oficinas asociadas.`;
      }
      if (!confirm(msg)) return;

      try {
        await deleteFloorInStrapi(floor);
        if (currentFloorId === floor.id) {
          currentFloorId = null;
          const officesTableContainer = document.getElementById("officesTableContainer");
          const officesInfo = document.getElementById("officesInfo");
          if (officesTableContainer) officesTableContainer.classList.add("hidden");
          if (officesInfo) officesInfo.textContent = "Seleccioná un piso para ver sus oficinas.";
        }
        await loadBuildingData();
        renderFloorsTable();
        showToast("Piso eliminado", "success");
      } catch (err) {
        alert("No se pudo eliminar el piso. Revisá la consola.");
        showToast("Error al eliminar piso", "error");
      }
    });

    tdActions.appendChild(btnView);
    tdActions.appendChild(btnEditFloor);
    tdActions.appendChild(btnDeleteFloor);

    tr.appendChild(tdIndex);
    tr.appendChild(tdName);
    tr.appendChild(tdDesc);
    tr.appendChild(tdTotal);
    tr.appendChild(tdLibres);
    tr.appendChild(tdOcupadas);
    tr.appendChild(tdReservadas);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });

  const topbarStatus = document.getElementById("topbarStatus");
  if (topbarStatus) {
    topbarStatus.textContent =
      floors.length === 1 ? "1 piso cargado" : `${floors.length} pisos cargados`;
  }
}


/* ==========================
   TABLA OFICINAS
   ========================== */

function renderOfficesOfFloor(floorId) {
  const bd = window.buildingData || { floors: [] };
  const floors = bd.floors || [];

  const officesInfo = document.getElementById("officesInfo");
  const officesTableContainer = document.getElementById("officesTableContainer");
  const tbody = document.getElementById("officesTableBody");
  const btnNewOffice = document.getElementById("btnNewOffice");
  const toolbarTitle = document.getElementById("officesToolbarTitle");
  const officeFormCard = document.getElementById("officeFormCard");

  if (!officesInfo || !officesTableContainer || !tbody) return;

  let list = [];
  floors.forEach(floor => {
    const offices = floor.offices || [];
    if (floorId && String(floor.id) !== String(floorId)) return;
    offices.forEach(office => {
      list.push({ floor, office });
    });
  });

  let filtered = list.slice();

  if (officeFilters.state !== "all") {
    filtered = filtered.filter(item => item.office.state === officeFilters.state);
  }

  if (officeFilters.search) {
    const term = officeFilters.search;
    filtered = filtered.filter(({ floor, office }) => {
      const text =
        (office.name || "") + " " +
        (office.sector || "") + " " +
        (office.location || "") + " " +
        (typeof office.tags === "string"
          ? office.tags
          : Array.isArray(office.tags)
          ? office.tags.join(" ")
          : "") + " " +
        (floor.name || "");
      return text.toLowerCase().includes(term);
    });
  }

 filtered.sort((a, b) => {
  const floorA = a.floor.number || 0;
  const floorB = b.floor.number || 0;
  if (floorA !== floorB) return floorA - floorB;

  const orderA = a.office.order != null ? a.office.order : 0;
  const orderB = b.office.order != null ? b.office.order : 0;
  if (orderA !== orderB) return orderA - orderB;

  return (a.office.name || "").localeCompare(b.office.name || "");
});


  const total = filtered.length;
  const libres = filtered.filter(item => item.office.state === "libre").length;
  const ocupadas = filtered.filter(item => item.office.state === "ocupada").length;
  const reservadas = filtered.filter(item => item.office.state === "reservada").length;

  if (floorId) {
    const selectedFloor = floors.find(f => String(f.id) === String(floorId));
    if (toolbarTitle) {
      toolbarTitle.textContent = selectedFloor
        ? `Oficinas del piso: ${selectedFloor.name}`
        : "Oficinas";
    }
    if (officesInfo) {
      if (selectedFloor) {
        officesInfo.textContent =
          total === 0
            ? `El piso "${selectedFloor.name}" actualmente no tiene oficinas cargadas.`
            : `Piso "${selectedFloor.name}" · ${total} oficinas (Libres: ${libres} · Ocupadas: ${ocupadas} · Reservadas: ${reservadas}).`;
      } else {
        officesInfo.textContent =
          total === 0
            ? "No hay oficinas cargadas para este piso."
            : `${total} oficinas (Libres: ${libres} · Ocupadas: ${ocupadas} · Reservadas: ${reservadas}).`;
      }
    }
  } else {
    if (toolbarTitle) toolbarTitle.textContent = "Oficinas del edificio";
    if (officesInfo) {
      officesInfo.textContent =
        total === 0
          ? "El edificio actualmente no tiene oficinas cargadas."
          : `Edificio completo · ${total} oficinas (Libres: ${libres} · Ocupadas: ${ocupadas} · Reservadas: ${reservadas}).`;
    }
  }

  const summaryTotalValue = document.getElementById("summaryTotalValue");
  const summaryLibresValue = document.getElementById("summaryLibresValue");
  const summaryOcupadasValue = document.getElementById("summaryOcupadasValue");
  const summaryReservadasValue = document.getElementById("summaryReservadasValue");

  if (summaryTotalValue) summaryTotalValue.textContent = String(total);
  if (summaryLibresValue) summaryLibresValue.textContent = String(libres);
  if (summaryOcupadasValue) summaryOcupadasValue.textContent = String(ocupadas);
  if (summaryReservadasValue) summaryReservadasValue.textContent = String(reservadas);

  officesTableContainer.classList.remove("hidden");
  if (btnNewOffice) btnNewOffice.disabled = !floorId;
  if (officeFormCard) officeFormCard.classList.add("hidden");

  tbody.innerHTML = "";

  filtered.forEach(({ floor, office }) => {
    const tr = document.createElement("tr");

    if (office.state) {
      tr.classList.add(`row-state-${office.state}`);
    }

    tr.addEventListener("click", () => {
      currentFloorId = floor.id;
      currentEditingOffice = office;
      showOfficeForm(office);
    });

    const tdFloor = document.createElement("td");
    const num = floor.number != null ? floor.number : "";
    if (num !== "") {
      tdFloor.textContent = `Piso ${num} · ${floor.name || ""}`;
    } else {
      tdFloor.textContent = floor.name || "(sin nombre)";
    }

    const tdName = document.createElement("td");
    tdName.textContent = office.name || "(sin nombre)";

    const tdSector = document.createElement("td");
    tdSector.textContent = office.sector || "-";

    const tdLocation = document.createElement("td");
    tdLocation.textContent = office.location || "-";

    const tdState = document.createElement("td");
    if (office.state) {
      const span = document.createElement("span");
      span.className = "state-badge state-" + office.state;
      span.textContent = getStateLabel(office.state);
      tdState.appendChild(span);
    } else {
      tdState.textContent = "-";
    }

    const tdTags = document.createElement("td");
    let tags = office.tags;
    if (!tags || (Array.isArray(tags) && tags.length === 0) || (typeof tags === "string" && !tags.trim())) {
      tdTags.textContent = "-";
    } else {
      if (typeof tags === "string") {
        tags = tags.split(",").map(t => t.trim()).filter(Boolean);
      }
      tags.forEach(tag => {
        const chip = document.createElement("span");
        chip.className = "tag-pill";
        chip.textContent = tag;
        tdTags.appendChild(chip);
      });
    }

   const tdQr = document.createElement("td");
  const qrLink = office.qrMainUrl || office.qrLink || office.qr_link;

    if (qrLink) {
      const link = document.createElement("a");
      link.href = qrLink;
      link.target = "_blank";
      link.className = "btn-link";
      link.textContent = "Abrir link";
      tdQr.appendChild(link);
    } else {
      tdQr.textContent = "-";
    }

    const tdActions = document.createElement("td");

    const btnEdit = document.createElement("button");
    btnEdit.className = "btn-secondary";
    btnEdit.textContent = "Editar";
    btnEdit.addEventListener("click", (e) => {
      e.stopPropagation();
      currentFloorId = floor.id;
      currentEditingOffice = office;
      showOfficeForm(office);
    });
const btnDuplicate = document.createElement("button");
btnDuplicate.className = "btn-secondary";
btnDuplicate.textContent = "Duplicar";
btnDuplicate.addEventListener("click", (e) => {
  e.stopPropagation();
  duplicateOffice(office, floor.id);
});
tdActions.appendChild(btnDuplicate);

    const btnDelete = document.createElement("button");
    btnDelete.className = "btn-secondary btn-danger";
    btnDelete.textContent = "Eliminar";
    btnDelete.style.marginLeft = "0.5rem";
    btnDelete.addEventListener("click", async (e) => {
      e.stopPropagation();
      if (!confirm(`¿Seguro que querés eliminar la oficina "${office.name || ""}"?`)) return;
      try {
        await deleteOfficeInStrapiByOriginal(office, floor.id);
        await loadBuildingData();
        renderFloorsTable();
        renderOfficesOfFloor(floorId || null);
        showToast("Oficina eliminada", "success");
      } catch (err) {
        alert("No se pudo eliminar la oficina. Revisá la consola.");
        showToast("Error al eliminar oficina", "error");
      }
    });

    tdActions.appendChild(btnEdit);
    
    tdActions.appendChild(btnDelete);

    tr.appendChild(tdFloor);
    tr.appendChild(tdName);
    tr.appendChild(tdSector);
    tr.appendChild(tdLocation);
    tr.appendChild(tdState);
    tr.appendChild(tdTags);
    tr.appendChild(tdQr);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });
}
/* ==========================
   IMPORTAR OFICINAS DESDE CSV
   ========================== */

function setupImportOffices() {
  const btnImport = document.getElementById("btnImportOffices");
  const fileInput = document.getElementById("importOfficesFile");

  if (!btnImport || !fileInput) return;

  btnImport.addEventListener("click", () => {
    fileInput.value = ""; // resetea selección anterior
    fileInput.click();
  });

  fileInput.addEventListener("change", async () => {
    if (!fileInput.files || fileInput.files.length === 0) return;
    const file = fileInput.files[0];

    try {
      showToast(`Leyendo archivo: ${file.name}`, "info");
      const text = await file.text();
      const rows = parseCsvToRows(text);

      if (rows.length === 0) {
        showToast("El archivo CSV está vacío o no se pudo leer.", "error");
        return;
      }

      // Confirmación básica
      if (!confirm(`Se encontraron ${rows.length} filas de oficinas.\n¿Querés importarlas?`)) {
        return;
      }

      await bulkImportOfficesFromRows(rows);

      await loadBuildingData();
      renderFloorsTable();
      if (currentFloorId) {
        renderOfficesOfFloor(currentFloorId);
      } else {
        // si no hay piso seleccionado, mostramos todas las oficinas del edificio
        renderOfficesOfFloor(null);
      }

      showToast("Importación de oficinas finalizada.", "success");

    } catch (err) {
      console.error("[ADMIN] Error importando oficinas:", err);
      showToast("Error al importar oficinas. Revisá la consola.", "error");
    }
  });
}

// Convierte CSV (texto) a array de objetos { piso, oficina, sector, ubicacion, estado, tags, qr }
function parseCsvToRows(csvText) {
  // Normalizamos saltos de línea
  const lines = csvText
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) return [];

  // Soportamos tanto ; como , como separador.
  const firstLine = lines[0];
  const delimiter = firstLine.includes(";") ? ";" : ",";

  const headers = firstLine
    .split(delimiter)
    .map(h => h.trim().toLowerCase());

  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cols = line.split(delimiter).map(c => c.trim());

    if (cols.length === 0 || cols.every(c => c === "")) continue;

    const rowObj = {};
    headers.forEach((h, idx) => {
      rowObj[h] = cols[idx] ?? "";
    });

    rows.push(rowObj);
  }

  return rows;
}

// Busca piso por número o nombre y crea oficinas en Strapi
async function bulkImportOfficesFromRows(rows) {
  const bd = window.buildingData || { floors: [] };
  const floors = bd.floors || [];

  let createdCount = 0;
  let skippedCount = 0;
  let duplicateCount = 0;
  let errorCount = 0;

  // 1) Mapear pisos existentes por número y por nombre
  const floorsById = new Map();
  const floorsByNumber = new Map();   // number -> floor
  const floorsByName = new Map();     // nombre normalizado -> floor

  floors.forEach(f => {
    if (!f) return;
    floorsById.set(f.id, f);

    const num = Number(f.number);
    if (!Number.isNaN(num)) {
      floorsByNumber.set(num, f);
    }

    if (f.name) {
      floorsByName.set(normalizeStr(f.name), f);
    }
  });

  // 2) Construir set de "oficinas ya existentes" para detectar duplicados
  // clave: floorId || nombreNormalizado
  const existingOfficeKeys = new Set();

  floors.forEach(floor => {
    const offs = floor.offices || [];
    offs.forEach(office => {
      const key = `${floor.id}||${normalizeStr(office.name)}`;
      existingOfficeKeys.add(key);
    });
  });

  // 3) Recorrer filas del CSV
  for (const row of rows) {
    try {
      // Mapeo de columnas según el CSV:
      // piso, numero, nombre, sector, ubicacion, estado, tags, qr
      const pisoRaw = (row["piso"] || row["floor"] || "").toString().trim();
      const numero = (row["numero"] || row["nro"] || "").toString().trim();
      const oficinaName = (row["nombre"] || row["oficina"] || row["name"] || "").toString().trim();
      const sector = (row["sector"] || row["rubro"] || "").toString().trim();
      let ubicacion = (row["ubicacion"] || row["dpto"] || row["departamento"] || "").toString().trim();
      const estado = (row["estado"] || "").toString().trim().toLowerCase();
      const tags = (row["tags"] || "").toString().trim();
      const qr = (row["qr"] || row["qr_link"] || "").toString().trim();

      // piso y nombre son obligatorios
      if (!pisoRaw || !oficinaName) {
        console.warn("[ADMIN] Fila saltada por faltarle piso o nombre de oficina:", row);
        skippedCount++;
        continue;
      }

      // Si no hay ubicacion, usamos el numero como tal (para que algo vaya a location)
      if (!ubicacion && numero) {
        ubicacion = numero;
      }

      // Buscar piso: primero por número, después por nombre
      let floorFound = null;
      const pisoNum = parseInt(pisoRaw, 10);

      if (!Number.isNaN(pisoNum)) {
        const byNum = floorsByNumber.get(pisoNum);
        if (byNum) floorFound = byNum;
      }

      if (!floorFound) {
        const byName = floorsByName.get(normalizeStr(pisoRaw));
        if (byName) floorFound = byName;
      }

      if (!floorFound) {
        console.warn("[ADMIN] No se encontró piso para:", pisoRaw, "Fila:", row);
        skippedCount++;
        continue;
      }

      const floorId = floorFound.id;
      const officeKey = `${floorId}||${normalizeStr(oficinaName)}`;

      // 4) Detección de duplicados (en Strapi + en este mismo CSV)
      if (existingOfficeKeys.has(officeKey)) {
        console.warn("[ADMIN] Oficina duplicada detectada, se salta:", oficinaName, "en piso", pisoRaw);
        duplicateCount++;
        continue;
      }

      // Estado por defecto, aunque no se use visualmente
      let stateFinal = "ocupada";
      if (["libre", "ocupada", "reservada"].includes(estado)) {
        stateFinal = estado;
      }

        const officePayload = {
        name: oficinaName,
        sector,
        location: ubicacion,
        state: stateFinal,
        description, 
        tags,
        qr_main_url: qr || null,
        qr_whatsapp_url: null,
        qr_extra_url: null,
        schedule_text: ""
      };



      await createOfficeInStrapi(officePayload, floorId);

      // Si llegó acá sin tirar error, la marcamos como existente para
      // detectar duplicados dentro del mismo CSV también.
      existingOfficeKeys.add(officeKey);
      createdCount++;

    } catch (err) {
      console.error("[ADMIN] Error creando oficina desde CSV:", err);
      errorCount++;
    }
  }

  console.log(
    `[ADMIN] Importación oficinas: creadas=${createdCount}, saltadas_por_datos_incompletos=${skippedCount}, duplicadas=${duplicateCount}, errores=${errorCount}`
  );

  let msg = `Importación terminada.\nCreadas: ${createdCount}.\nSaltadas por datos incompletos: ${skippedCount}.\nDuplicadas: ${duplicateCount}.\nErrores: ${errorCount}.`;

  showToast(
    msg.replace(/\n/g, " "),
    errorCount > 0 ? "error" : (duplicateCount > 0 ? "info" : "success")
  );
}



async function duplicateOffice(office, floorId) {
  const copy = {
    name: office.name + " (copia)",
    sector: office.sector,
    location: office.location,
    state: office.state,
    tags: typeof office.tags === "string" ? office.tags : office.tags.join(", "),
    qr_link: office.qr_link || null,
    qr_main_url: office.qr_main_url || office.qrMainUrl || null,
  qr_whatsapp_url: office.qr_whatsapp_url || office.qrWhatsAppUrl || null,
  qr_extra_url: office.qr_extra_url || office.qrExtraUrl || null,
  schedule_text: office.schedule_text || office.scheduleText || ""
  };

  await createOfficeInStrapi(copy, floorId);
  await loadBuildingData();
  renderOfficesOfFloor(floorId);
  showToast("Oficina duplicada", "success");
}

/* ==========================
   PREVIEW TÓTEM
   ========================== */

function setupPreview() {
  const btnRefresh = document.getElementById("btnRefreshPreview");
  const iframe = document.getElementById("totemPreviewFrame");
  if (!btnRefresh || !iframe) return;

  // Guardamos el src base para poder forzar recarga
  const baseSrc = iframe.getAttribute("src");

  btnRefresh.addEventListener("click", () => {
    // Forzamos recarga agregando un timestamp
    iframe.setAttribute("src", baseSrc.split("?")[0] + "?t=" + Date.now());
  });
}

function showPreview(title, html, onConfirm) {
  const modal = document.getElementById("previewModal");
  const body = document.getElementById("previewBody");
  const previewTitle = document.getElementById("previewTitle");
  const btnCancel = document.getElementById("previewCancel");
  const btnConfirm = document.getElementById("previewConfirm");

  previewTitle.textContent = title;
  body.innerHTML = html;

  modal.classList.remove("hidden");

  btnCancel.onclick = () => modal.classList.add("hidden");
  btnConfirm.onclick = () => {
    modal.classList.add("hidden");
    onConfirm();
  };
}
function normalizeStr(value) {
  return (value || "").toString().trim().toLowerCase();
}


/* ==========================
   HELPERS
   ========================== */

function getStateLabel(state) {
  if (state === "libre") return "Libre";
  if (state === "reservada") return "Reservada";
  if (state === "ocupada") return "Ocupada";
  return state || "-";
}
