// ===============================
// VISTA PRINCIPAL (HOME)
// ===============================

function getEl(...idsOrSelectors) {
  for (const key of idsOrSelectors) {
    if (!key) continue;

    // si empieza con . o # lo tratamos como selector
    if (key.startsWith(".") || key.startsWith("#")) {
      const el = document.querySelector(key);
      if (el) return el;
    } else {
      const el = document.getElementById(key);
      if (el) return el;
    }
  }
  return null;
}

// Render: vista principal (home)
function renderMainView() {
  const bd = window.buildingData;
  if (!bd) {
    console.warn("[MAIN] window.buildingData no está definido aún");
    return;
  }
  

  // Header
  const headerTitle = getEl("headerTitle", "header-title", "#headerTitle");
  const headerSubtitle = getEl("headerSubtitle", "header-subtitle", "#headerSubtitle");
  if (headerTitle) headerTitle.textContent = "DIRECTORIO";
  if (headerSubtitle) headerSubtitle.textContent = "Guía de oficinas y profesionales";

  // Título y descripción arriba (si existen en tu HTML)
  const mainTitle = getEl("mainTitle", "main-title", "#mainTitle");
  const mainDesc = getEl("mainDescription", "main-description", "#mainDescription");
  if (mainTitle) mainTitle.textContent = "";
  if (mainDesc) mainDesc.textContent = "";

  // Captions (izquierda)
  const buildingNameCaption = getEl("buildingNameCaption", "building-name", "building-name-caption", "#buildingNameCaption");
  const buildingSloganCaption = getEl("buildingSloganCaption", "building-slogan", "building-slogan-caption", "#buildingSloganCaption");
  if (buildingNameCaption) buildingNameCaption.textContent = bd.name || "Membrillar Plaza";
  if (buildingSloganCaption) buildingSloganCaption.textContent = bd.slogan || "";

  // Texto fijo / info del edificio (izquierda)
  const contactText = getEl("buildingContactText", "building-contact-text", "#buildingContactText");
  if (contactText) contactText.textContent = bd.contactInfo || bd.description || "";

  // Botones/contacto (si existe ese contenedor)
  const contactButtons = getEl("buildingContactButtons", "building-contact-buttons", "#buildingContactButtons");
  if (contactButtons) contactButtons.innerHTML = ""; // (opcional)
  

  // ✅ Lista de pisos (DERECHA)
  // Tu CSS tiene ".floors-list", y en algunos builds el id puede ser "floors-list"
  const floorsList =
    getEl("floorsList", "floors-list", "#floorsList", "#floors-list", ".floors-list") ||
    null;

  if (!floorsList) {
    console.error("[MAIN] No encuentro el contenedor de lista de pisos. Revisá tu HTML: id='floorsList' o id='floors-list' o class='floors-list'");
    return;
  }

  floorsList.innerHTML = "";

  let floors = Array.isArray(bd.floors) ? bd.floors.slice() : [];

  // ===============================
// BRANDING (Logo + QR) desde Strapi
// ===============================
function resolveMediaUrl(media) {
  // soporta: {url:"/uploads/..."} o Strapi v4: {data:{attributes:{url}}}
  const url =
    media?.url ||
    media?.data?.attributes?.url ||
    media?.attributes?.url ||
    "";

  if (!url) return "";

  if (url.startsWith("http")) return url;

  // intentamos construir base desde API (si tu API es .../api)
  const apiBase =
    (window.API_BASE || window.STRAPI_API || window.STRAPI_URL || "").toString();

  const base = apiBase
    ? apiBase.replace(/\/api\/?$/i, "")
    : "";

  return base ? base + url : url;
}

const brandLogoImg = getEl("brandLogoImg", "#brandLogoImg");
const brandQrImg = getEl("brandQrImg", "#brandQrImg");
const brandAddress = getEl("brandAddress", "#brandAddress");

// Si en Strapi guardaste el logo/qr en building:
if (brandLogoImg) {
  const logoUrl = resolveMediaUrl(bd.logo || bd.image);
  if (logoUrl) brandLogoImg.src = logoUrl;
  if (!brandLogoImg.src) brandLogoImg.style.display = "none";
}

if (brandQrImg) {
  const qrLink = (bd.qr_link || "").toString().trim();

  if (qrLink) {
    brandQrImg.src =
      "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" +
      encodeURIComponent(qrLink);
    brandQrImg.style.display = "";
  } else {
    // Si no hay link, ocultamos el QR para que no aparezca roto
    brandQrImg.style.display = "none";
  }
}

if (brandAddress) {
  // si lo tenés en Strapi, mejor:
  brandAddress.textContent = bd.address || "Membrillar 74, CABA";
}


  // Orden por order, si no por número en name, si no por nombre
  floors.sort((a, b) => {
    const oa = Number(a.order ?? 0);
    const ob = Number(b.order ?? 0);
    if (oa !== ob) return oa - ob;

    const na = parseInt(String(a.name || "").replace(/\D+/g, ""), 10);
    const nb = parseInt(String(b.name || "").replace(/\D+/g, ""), 10);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;

    return String(a.name || "").localeCompare(String(b.name || ""));
  });

floorsList.innerHTML = "";

floors.forEach((floor) => {
const acc = createFloorAccordion(floor);
floorsList.appendChild(acc);

});



if (typeof resetInactivityTimer === "function") resetInactivityTimer();

}

// ===============================
// Buscador (HOME)
// ===============================
// ===============================
// Buscador (HOME)
// ===============================
function setupSearch() {
  const input = getEl("searchInput", "search-input", "#searchInput", "#search-input");
  if (!input) return;

  const floorsList = getEl("floorsList", "floors-list", "#floorsList", "#floors-list", ".floors-list");
  if (!floorsList) return;

  const mainTitle = getEl("mainTitle", "main-title", "#mainTitle");
  const mainDesc = getEl("mainDescription", "main-description", "#mainDescription");

  // Saca el "Inicio" si lo tenías
  if (mainTitle && mainTitle.textContent.trim().toLowerCase() === "inicio") mainTitle.textContent = "";

  input.addEventListener("input", () => {
    if (typeof resetInactivityTimer === "function") resetInactivityTimer();

    const term = input.value.trim().toLowerCase();
    const bd = window.buildingData;
    if (!bd || !Array.isArray(bd.floors)) return;

    // Si no hay término -> volvemos a vista normal
    if (!term) {
      floorsList.classList.remove("is-search-results");
      if (mainTitle) mainTitle.textContent = "";
      if (mainDesc) mainDesc.textContent = "";
      if (typeof renderMainView === "function") renderMainView();
      return;
    }

    // Modo búsqueda
    floorsList.classList.add("is-search-results");
    floorsList.innerHTML = "";

    let count = 0;

    bd.floors.forEach((floor) => {
      (floor.offices || []).forEach((office) => {
        const name = (office.name || "").toLowerCase();
        const sector = (office.sector || "").toLowerCase();

        let tags = office.tags;
        if (typeof tags === "string") tags = tags.split(",").map(t => t.trim()).filter(Boolean);
        if (!Array.isArray(tags)) tags = [];

        const match =
          name.includes(term) ||
          sector.includes(term) ||
          tags.some(t => String(t).toLowerCase().includes(term));

        if (match) {
          floorsList.appendChild(createOfficeSearchResultCard(floor, office));
          count++;
        }
      });
    });

    if (mainTitle) mainTitle.textContent = `Resultados para “${term}”`;
    if (mainDesc) mainDesc.textContent = `${count} resultado(s)`;

    if (count === 0) {
      const empty = document.createElement("div");
      empty.className = "search-empty";
      empty.textContent = "No se encontraron oficinas con ese criterio.";
      floorsList.appendChild(empty);
    }

    if (typeof showView === "function") showView("view-main");
  });
}


