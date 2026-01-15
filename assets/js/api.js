// ===============================
// API: Cargar datos desde Strapi
// ===============================

// Cambiá esta constante según dónde corra Strapi
const STRAPI_BASE = "https://nadine-criminative-leif.ngrok-free.dev";
const API_BASE = `${STRAPI_BASE}/api`;





// Exponer API_BASE para el panel admin
window.API_BASE = API_BASE;

// Helper para leer JSON con manejo de error
async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "ngrok-skip-browser-warning": "true",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`API ${res.status} ${res.statusText}\n${txt.slice(0, 200)}`);
  }
  return res.json();
}

// Convierte un campo media de Strapi en una URL completa
// Soporta dos formas:
// 1) { url: "/uploads/..." }           (forma "plana")
// 2) { data: { attributes: { url } } } (forma clásica v4)
function resolveMediaUrl(mediaField) {
  if (!mediaField) return null;

  // Forma plana: { url: "/uploads/..." }
  if (mediaField.url) {
    const url = mediaField.url;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return STRAPI_BASE + url;
  }

  // Forma clásica: { data: { attributes: { url } } }
  if (
    mediaField.data &&
    mediaField.data.attributes &&
    mediaField.data.attributes.url
  ) {
    const url = mediaField.data.attributes.url;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return STRAPI_BASE + url;
  }

  return null;
}

// ===============================
// Carga datos de Building + Floors + Offices desde Strapi
// ===============================
async function loadBuildingData() {
  // 1) Pedimos building, floors y offices por separado
  const [buildingRes, floorsRes, officesRes] = await Promise.all([
    // Single type "building"
    fetchJson(
      `${API_BASE}/building?populate=*&publicationState=preview`
    ),
    // Floors SIN oficinas anidadas
    fetchJson(
      `${API_BASE}/floors?pagination[pageSize]=100&publicationState=preview`
    ),
    // Offices con floor, logo, qr y contacts
    fetchJson(
      `${API_BASE}/offices?populate[0]=floor&populate[1]=logo&populate[2]=qr&populate[3]=contacts&pagination[pageSize]=500&publicationState=preview`
    )
  ]);
// ---------- BUILDING ----------
const buildingNode = buildingRes && buildingRes.data ? buildingRes.data : {};
const buildingAttr = buildingNode.attributes || buildingNode;

const buildingName = buildingAttr.name || "Edificio";
const buildingSlogan = buildingAttr.slogan || "";
const buildingDescription = buildingAttr.description || "";
const buildingImage = resolveMediaUrl(buildingAttr.image);

const buildingQrLink = buildingAttr.qr_link || "";


// Nuevo: versión de refresco del tótem
let buildingRefreshVersion = 0;
if (typeof buildingAttr.refreshVersion === "number") {
  buildingRefreshVersion = buildingAttr.refreshVersion;
} else if (typeof buildingAttr.refreshVersion === "string") {
  const n = parseInt(buildingAttr.refreshVersion, 10);
  buildingRefreshVersion = Number.isNaN(n) ? 0 : n;
}



  // ---------- FLOORS ----------
  const floorsRaw = Array.isArray(floorsRes?.data) ? floorsRes.data : [];

  // Mapeamos pisos a un objeto simple { id, name, shortDescription, offices: [] }
  const floorsMap = new Map();

  floorsRaw
    .sort((a, b) => {
      const aAttr = a.attributes || a;
      const bAttr = b.attributes || b;
      const ao = aAttr.order ?? aAttr.number ?? 0;
      const bo = bAttr.order ?? bAttr.number ?? 0;
      return ao - bo;
    })
    .forEach(f => {
      const fa = f.attributes || f;

      // 👇 NUEVO: resolvemos logo del piso
      const floorLogo = resolveMediaUrl(fa.logo);

      const floorObj = {
        id: String(f.id ?? fa.id ?? ""),
        name: fa.name || "",
        shortDescription: fa.shortDescription || "",
        logo: floorLogo || null,   // 👈 guardamos el logo en el objeto piso
        offices: []                // se llenan después
      };

      floorsMap.set(floorObj.id, floorObj);
    });

  // ---------- OFFICES ----------
  const officesRaw = Array.isArray(officesRes?.data) ? officesRes.data : [];

  officesRaw.forEach(o => {
    const oa = o.attributes || o || {};

    // ID del piso asociado (a través de la relación "floor")
    let floorId = null;
    if (oa.floor) {
      if (oa.floor.data) {
        floorId = oa.floor.data.id;
      } else if (oa.floor.id) {
        floorId = oa.floor.id;
      }
    }

    const contacts = Array.isArray(oa.contacts) ? oa.contacts : [];

    // tags: en Strapi lo guardamos como string, acá lo pasamos a array
    let tags = [];
    if (typeof oa.tags === "string" && oa.tags.trim().length > 0) {
      tags = oa.tags
        .split(",")
        .map(t => t.trim())
        .filter(Boolean);
    }
    function normalizeOffice(raw) {
  // raw puede venir como { id, attributes } (Strapi v4) o ya plano (depende tu API)
  const a = raw?.attributes || raw || {};

  return {
    id: String(raw?.id ?? a.id ?? ""),
    name: a.name || "",
    sector: a.sector || "",
    location: a.location || "",
    description: a.description || "",
    state: a.state || "",
    tags: Array.isArray(a.tags) ? a.tags : [],

    // ✅ nombres finales que usa el tótem
    qrMainUrl: a.qr_main_url ?? a.qrMainUrl ?? a.qrLink ?? null,
    qrWhatsAppUrl: a.qr_whatsapp_url ?? a.qrWhatsAppUrl ?? null,
    qrExtraUrl: a.qr_extra_url ?? a.qrExtraUrl ?? null,
    scheduleText: a.schedule_text ?? a.scheduleText ?? "",

    // opcional (si después lo usás)
    logo: a.logo?.data?.attributes?.url ? (a.logo.data.attributes.url) : (a.logo || null),
    qrImage: a.qr_image?.data?.attributes?.url ? (a.qr_image.data.attributes.url) : (a.qrImage || null),
  };
}










const officeObj = {
  id: String(o.id ?? oa.id),

  name: oa.name || "",
  sector: oa.sector || "",
  location: oa.location || "",
  description: oa.description || "",
  state: oa.state || "",          // libre | ocupada | reservada
  tags,
  logo: resolveMediaUrl(oa.logo),
  qrImage: resolveMediaUrl(oa.qr),

  // Compatibilidad + campos nuevos:
  qrLink: oa.qr_link || null, // viejo
  qrMainUrl: oa.qr_main_url || oa.qr_link || null,
  qrWhatsAppUrl: oa.qr_whatsapp_url || null,
  qrExtraUrl: oa.qr_extra_url || null,
  scheduleText: oa.schedule_text || "",

  contacts
};


    if (floorId != null) {
      const floorKey = String(floorId);
      const floorRef = floorsMap.get(floorKey);
      if (floorRef) {
        floorRef.offices.push(officeObj);
      }
    }
  });

  const floors = Array.from(floorsMap.values());

  // ---------- Resultado global ----------
window.buildingData = {
  name: buildingName,
  slogan: buildingSlogan,
  description: buildingDescription,
  image: buildingImage,
  qr_link: buildingQrLink,              // 👈 NUEVO
  refreshVersion: buildingRefreshVersion,
  floors
};


  console.log("[API] Datos cargados desde Strapi:", window.buildingData);
}