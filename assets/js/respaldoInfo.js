// ===============================
// TEMPLATES / PLANTILLAS DE UI
// ===============================

// Helper pequeño para crear elementos


function scrollToCentered(container, element, offset = 0) {
  if (!container || !element) return;

  const cRect = container.getBoundingClientRect();
  const eRect = element.getBoundingClientRect();

  // posición del elemento dentro del scroll
  const current = container.scrollTop;
  const elementTop = (eRect.top - cRect.top) + current;

  const target =
    elementTop - (container.clientHeight / 2) + (eRect.height / 2) + offset;

  container.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
}




function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined && text !== null) el.textContent = text;
  return el;
}


// 1) Plantilla de piso para la lista principal
function createFloorCard(floor) {
  const card = createEl("div", "card floor-card");
  card.onclick = () => {
    openFloor(floor.id);
    window.openTab("view-floor");
  };

  const titleText =
    floor.name ||
    (typeof floor.number === "number" ? `Piso ${floor.number}` : "Piso");

  card.appendChild(createEl("div", "card-title", titleText));
  card.appendChild(createEl("div", "card-subtitle", floor.shortDescription || ""));
  return card;
}



// 2) Plantilla de oficina dentro de un piso (vista de piso)
// 2) Plantilla de oficina dentro de un piso (vista de piso)
function createOfficeCardInFloor(floor, office) {
  const card = createEl("div", "card office-card");
  card.onclick = () => {
    openOffice(floor.id, office.id);
    window.openTab("view-office");
  };

  card.appendChild(createEl("div", "card-title", office.name || "(Sin nombre)"));
  card.appendChild(createEl("div", "card-subtitle", office.location ? `Departamento: ${office.location}` : ""));
  return card;
}



// 3) Plantilla de resultado de búsqueda (oficinas encontradas)
function createOfficeSearchResultCard(floor, office) {
  const card = createEl("div", "card office-card");
card.onclick = () => {
  openOffice(floor.id, office.id);
  window.openTab("view-office");
};



  // ---- LOGO / INICIALES ----
  const logoWrapper = createEl("div", "office-logo");
  if (office.logo) {
    const img = document.createElement("img");
    img.src = office.logo;
    img.alt = office.name || "";
    logoWrapper.appendChild(img);
  } else if (office.name) {
    logoWrapper.textContent = office.name.charAt(0).toUpperCase();
  } else {
    logoWrapper.textContent = "?";
  }

  // ---- TEXTO PRINCIPAL (incluye piso) ----
  const infoWrapper = createEl("div", "office-card-info");

  const title = createEl(
    "div",
    "card-title",
    office.name || "(Sin nombre)"
  );

  const subtitleParts = [];
  // Primero el piso
  subtitleParts.push(floor.name || "");
  // Luego rubro
  if (office.sector) subtitleParts.push(office.sector);
  // Y el departamento
  if (office.location) subtitleParts.push(`Departamento: ${office.location}`);

  const subtitle = createEl(
    "div",
    "card-subtitle",
    subtitleParts.filter(Boolean).join(" · ")
  );

  infoWrapper.appendChild(title);
  infoWrapper.appendChild(subtitle);

  // ---- ESTADO ----
  const stateWrapper = createEl("div", "office-card-state");
  if (office.state) {
    const stateBadge = document.createElement("span");
    stateBadge.className = "state-badge";

    if (office.state === "libre") {
      stateBadge.classList.add("state-libre");
      stateBadge.textContent = "Libre";
    } else if (office.state === "reservada") {
      stateBadge.classList.add("state-reservada");
      stateBadge.textContent = "Reservada";
    } else {
      stateBadge.classList.add("state-ocupada");
      stateBadge.textContent = "Ocupada";
    }

    stateWrapper.appendChild(stateBadge);
  }

  // ---- TAGS ----
  const chipsRow = createEl("div", "chips");
  let tags = office.tags;

  if (typeof tags === "string") {
    tags = tags
      .split(",")
      .map(t => t.trim())
      .filter(Boolean);
  }

  if (Array.isArray(tags)) {
    tags.slice(0, 3).forEach(tagText => {
      const chip = createEl("span", "chip", tagText);
      chipsRow.appendChild(chip);
    });
  }

  const topRow = createEl("div", "office-card-top");
  topRow.appendChild(logoWrapper);
  topRow.appendChild(infoWrapper);
  topRow.appendChild(stateWrapper);

  card.appendChild(topRow);
  if (chipsRow.childNodes.length > 0) {
    card.appendChild(chipsRow);
  }

  return card;
}

function renderQrTo(container, url) {
  if (!container) return;

  container.innerHTML = "";

  // Si no hay URL, no renderizamos nada
  if (!url) {
    return;
  }

  // Medidas responsivas según el contenedor
  const size = Math.min(
    container.clientWidth || 140,
    container.clientHeight || 140,
    160
  );

  // Si la librería QR no está disponible → fallback texto
  if (!window.QRCode) {
    const fallback = document.createElement("div");
    fallback.className = "qr-fallback-text";
    fallback.textContent = url;
    container.appendChild(fallback);
    return;
  }

  try {
    const qrDiv = document.createElement("div");
    qrDiv.style.width = `${size}px`;
    qrDiv.style.height = `${size}px`;
    qrDiv.style.margin = "0 auto";

    container.appendChild(qrDiv);

    new QRCode(qrDiv, {
      text: url,
      width: size,
      height: size,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.H
    });
  } catch (err) {
    console.error("[QR] Error generando QR:", err);

    // Fallback final: mostrar el link
    const fallback = document.createElement("div");
    fallback.className = "qr-fallback-text";
    fallback.textContent = url;
    container.appendChild(fallback);
  }
}



// 4) Renderizado del detalle de oficina (vista de oficina)
// Pegá esta función UNA sola vez (arriba o abajo del archivo, fuera de renderOfficeDetail)
function renderQrTo(container, url) {
  if (!container) return;

  container.innerHTML = "";

  if (!url) {
    container.textContent = "QR no disponible";
    return;
  }

  if (!window.QRCode) {
    container.textContent = "QR lib no cargada";
    return;
  }

  const qrDiv = document.createElement("div");
  qrDiv.style.width = "100%";
  qrDiv.style.height = "100%";
  container.appendChild(qrDiv);

  try {
    new QRCode(qrDiv, {
      text: url,
      width: 140,
      height: 140,
      correctLevel: QRCode.CorrectLevel.H
    });
  } catch (e) {
    console.error("[QR] Error generando QR:", e);
    container.textContent = "QR no disponible";
  }
}


function renderOfficeDetail(floor, office) {
  console.log("[DETAIL] renderOfficeDetail floor:", floor);
  console.log("[DETAIL] renderOfficeDetail office:", office);

  // ===========================
  // HEADER
  // ===========================
  const officeTitle = document.getElementById("officeTitle");
  const officeFloorInfo = document.getElementById("officeFloorInfo");

  if (officeTitle) officeTitle.textContent = office.name || "";

  // Arriba no mostramos descripción
  if (officeFloorInfo) {
    officeFloorInfo.textContent = "";
    officeFloorInfo.style.display = "none";
  }

  // Nombre grande dentro del recuadro
  const officeNameEl = document.getElementById("officeName");
  if (officeNameEl) officeNameEl.textContent = office.name || "";

  // Ubicación
  const officeLocationEl = document.getElementById("officeLocation");
  if (officeLocationEl) {
    const loc = (office.location || office.number || "").toString().trim();
    officeLocationEl.textContent = loc ? `Departamento: ${loc}` : "";
  }

  // ===========================
  // LOGO
  // ===========================
  const logoEl = document.getElementById("officeLogo");
  if (logoEl) {
    logoEl.innerHTML = "";
    if (office.logo) {
      const img = document.createElement("img");
      img.src = office.logo;
      img.alt = office.name || "";
      logoEl.appendChild(img);
    } else if (office.name) {
      logoEl.textContent = office.name.charAt(0).toUpperCase();
    } else {
      logoEl.textContent = "?";
    }
  }

  // ===========================
  // SECTOR (si lo usás como chip)
  // ===========================
  const officeSectorEl = document.getElementById("officeSector");
  if (officeSectorEl) {
    officeSectorEl.innerHTML = "";
    const sectorChip = document.createElement("span");
    sectorChip.className = "sector-chip";
    sectorChip.textContent = office.sector || "Sin rubro definido";
    officeSectorEl.appendChild(sectorChip);
  }

  // ===========================
  // DESCRIPCIÓN / INFORMACIÓN
  // ===========================
  const descText = (office.description ?? office.info ?? office.shortDescription ?? "")
    .toString()
    .trim();

  const descEl =
    document.getElementById("officeDescription") ||
    document.getElementById("officeInfo") ||
    document.getElementById("officeInfoText") ||
    document.getElementById("officeInfoBody");

  if (descEl) descEl.textContent = descText || "";

  // ===========================
  // TAGS / SERVICIOS
  // ===========================
  const tagsContainer = document.getElementById("officeTags");
  if (tagsContainer) {
    tagsContainer.innerHTML = "";
    (office.tags || []).forEach(tagText => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = tagText;
      tagsContainer.appendChild(chip);
    });
  }

  // ===========================
  // HORARIOS
  // ===========================
  const scheduleEl = document.getElementById("officeSchedule");
  if (scheduleEl) {
    scheduleEl.textContent = (office.scheduleText || "").trim();
  }

  // ===========================
  // QRs: ocultar tarjetas vacías
  // ===========================
  function setQrItemVisible(placeholderEl, visible) {
    if (!placeholderEl) return;
    const item = placeholderEl.closest(".qr-item");
    if (item) item.style.display = visible ? "" : "none";
  }

  const qrMainEl = document.getElementById("officeQrPlaceholder");
  const qrWhatsappEl = document.getElementById("officeQrWhatsApp");
  const qrExtraEl = document.getElementById("officeQrExtra");

  const mainUrl = (office.qrMainUrl || "").trim();
  const whatsUrl = (office.qrWhatsAppUrl || "").trim();
  const extraUrl = (office.qrExtraUrl || "").trim();

  console.log("[QR] Main:", mainUrl);
  console.log("[QR] WhatsApp:", whatsUrl);
  console.log("[QR] Extra:", extraUrl);

  // Mostrar/ocultar tarjetas
  setQrItemVisible(qrMainEl, !!mainUrl);
  setQrItemVisible(qrWhatsappEl, !!whatsUrl);
  setQrItemVisible(qrExtraEl, !!extraUrl);

  // Render solo si hay URL
  if (mainUrl) renderQrTo(qrMainEl, mainUrl);
  if (whatsUrl) renderQrTo(qrWhatsappEl, whatsUrl);
  if (extraUrl) renderQrTo(qrExtraEl, extraUrl);

  const qrGrid = document.getElementById("officeQrGrid");
if (qrGrid) {
  const visibleQrCount = [mainUrl, whatsUrl, extraUrl].filter(Boolean).length;

  qrGrid.classList.remove("qr-count-1", "qr-count-2", "qr-count-3");

  if (visibleQrCount === 1) qrGrid.classList.add("qr-count-1");
  else if (visibleQrCount === 2) qrGrid.classList.add("qr-count-2");
}




function createOfficeAccordion(office) {
  const wrapper = document.createElement("div");

  const header = createEl("div", "card office-card", office.name);
  const content = document.createElement("div");
  content.className = "accordion-content";

  header.onclick = () => {
    const siblings = wrapper.parentElement.querySelectorAll(".accordion-content.office");
    siblings.forEach(el => el !== content && el.classList.remove("open"));

    content.classList.toggle("open");

    if (!content.hasChildNodes()) {
      const detail = document.createElement("div");
      detail.className = "office-detail";
      renderOfficeDetail(null, office);
      detail.appendChild(document.getElementById("view-office").cloneNode(true));
      content.appendChild(detail);
    }
  };

  content.classList.add("office");

  wrapper.appendChild(header);
  wrapper.appendChild(content);
  return wrapper;
}




// ===============================
// ACORDEÓN DE PISOS
// ===============================

// ===============================
// ACORDEÓN DE OFICINAS
// ===============================
function createOfficeAccordion(floor, office) {
  const wrapper = document.createElement("div");

  const header = createEl("div", "card office-card");
header.innerHTML = `
  <div class="acc-icon">🏢</div>

  <div class="acc-text">
    <div class="acc-title">${floor.name || "Piso"}</div>
    <div class="acc-subtitle">${floor.shortDescription || ""}</div>
  </div>

  <div class="acc-chevron">▾</div>
`;


  const content = document.createElement("div");
  content.className = "accordion-content office";

  header.onclick = () => {
    // cerrar otras oficinas del mismo piso
    wrapper.parentElement
      .querySelectorAll(".accordion-content.office.open")
      .forEach(el => { if (el !== content) el.classList.remove("open"); });

    // rotar flecha en siblings
    wrapper.parentElement
      .querySelectorAll(".office-card .chev")
      .forEach(el => el.textContent = "▾");

    content.classList.toggle("open");
    header.querySelector(".chev").textContent = content.classList.contains("open") ? "▴" : "▾";

    // renderizar solo una vez dentro del acordeón
    if (!content.dataset.rendered) {
      content.innerHTML = buildOfficeDetailHTML(office);
      // generar QRs dentro del detalle
      mountOfficeDetailQrs(content, office);
      content.dataset.rendered = "true";
    }
  };

  wrapper.appendChild(header);
  wrapper.appendChild(content);
  return wrapper;
}



function setQrIcon(placeholderId, emoji) {
  const placeholder = document.getElementById(placeholderId);
  if (!placeholder) return;

  const item = placeholder.closest(".qr-item");
  const label = item?.querySelector(".qr-label");
  if (!label) return;

  // ✅ Guardar el texto original una sola vez
  if (!label.dataset.baseText) {
    label.dataset.baseText = label.textContent.trim();
  }

  // ✅ Resetear y aplicar icono (sin acumular)
  label.innerHTML = `<span class="qr-icon">${emoji}</span> ${label.dataset.baseText}`;
}


if (mainUrl) setQrIcon("officeQrPlaceholder", "🌐");
if (whatsUrl) setQrIcon("officeQrWhatsApp", "💬");
if (extraUrl) setQrIcon("officeQrExtra", "🔗");


}





// ===============================
// ACORDEÓN DE PISOS (FIX + DETALLE DENTRO DEL ACORDEÓN)
// ===============================





officeBtn.onclick = () => {
  // cerrar otros detalles del mismo piso
  content.querySelectorAll(".accordion-content.office.open").forEach(el => {
    if (el !== detail) el.classList.remove("open");
  });
  content.querySelectorAll(".acc-header.office.open").forEach(btn => {
    if (btn !== officeBtn) btn.classList.remove("open");
  });

  // primera vez: render del HTML dentro del acordeón
  if (!detail.dataset.ready) {
    detail.innerHTML = buildOfficeDetailHTML(office);
    mountOfficeDetail(detail, office);
    detail.dataset.ready = "1";
  }

  officeBtn.classList.toggle("open");
  detail.classList.toggle("open");

  // ✅ centrar oficina y luego el detalle (cuando termina de abrir)
  scrollCenter(officeBtn);
  requestAnimationFrame(() => scrollCenter(detail));
};


function smoothCenter(el){
  try{
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }catch(e){}
}


// Centra un elemento dentro del contenedor scrolleable más cercano (.scroll)
function centerInScroll(el) {
  if (!el) return;

  const scroller =
    el.closest(".scroll") ||
    el.closest(".views-container") ||
    document.scrollingElement;

  if (!scroller) return;

  const elRect = el.getBoundingClientRect();
  const scRect = scroller.getBoundingClientRect();

  const currentTop = scroller.scrollTop;
  const elTopInsideScroller = (elRect.top - scRect.top) + currentTop;

  const targetTop =
    elTopInsideScroller - (scRect.height / 2) + (elRect.height / 2);

  scroller.scrollTo({
    top: Math.max(0, targetTop),
    behavior: "smooth",
  });
}


function createFloorAccordion(floor) {
  const wrapper = document.createElement("div");
  wrapper.className = "acc-wrap";

  // Header piso (fila lista)
  const header = document.createElement("button");
  header.type = "button";
  header.className = "acc-row acc-floor";
  header.innerHTML = `
    <div class="acc-left">
      <span class="acc-dot acc-dot-floor">🏢</span>
    </div>

    <div class="acc-mid">
      <div class="acc-title">${floor.name || "Piso"}</div>
      <div class="acc-sub">${floor.shortDescription || ""}</div>
    </div>

    <div class="acc-right">
      <span class="acc-chevron">▾</span>
    </div>
  `;

  // Contenido piso
  const content = document.createElement("div");
  content.className = "acc-panel acc-panel-floor";

header.onclick = () => {
  const isOpening = !content.classList.contains("open");

  // Cerrar otros pisos abiertos
  document.querySelectorAll(".accordion-content.floor.open").forEach((el) => {
    if (el !== content) el.classList.remove("open");
  });
  document.querySelectorAll(".acc-header.floor.open").forEach((btn) => {
    if (btn !== header) btn.classList.remove("open");
  });

  // Toggle del piso actual
  header.classList.toggle("open", isOpening);
  content.classList.toggle("open", isOpening);

  // Si abro el piso, centro el header en pantalla (modo kiosco)
  if (isOpening) {
    requestAnimationFrame(() => centerInScroll(header));
  }
};




  // Oficinas
  (floor.offices || []).forEach((office) => {
    const officeBtn = document.createElement("button");
    officeBtn.type = "button";
    officeBtn.className = "acc-row acc-office";
officeBtn.innerHTML = `
  <div class="acc-icon">●</div>

  <div class="acc-text">
    <div class="acc-title">${office.name || "Oficina"}</div>
    <div class="acc-subtitle">
      ${((office.sector || "").trim() || "Sin rubro")}
      ${office.location ? ` · Dpto: ${office.location}` : ""}
    </div>
  </div>

  <div class="acc-chevron">▾</div>
`;



    const detail = document.createElement("div");
    detail.className = "acc-panel acc-panel-office";

officeBtn.onclick = () => {
  const isOpening = !detail.classList.contains("open");

  // Cerrar otros detalles dentro del MISMO piso
  content.querySelectorAll(".accordion-content.office.open").forEach((el) => {
    if (el !== detail) el.classList.remove("open");
  });
  content.querySelectorAll(".acc-header.office.open").forEach((btn) => {
    if (btn !== officeBtn) btn.classList.remove("open");
  });

  // Render 1ra vez
  if (isOpening && !detail.dataset.ready) {
    detail.innerHTML = buildOfficeDetailHTML(office);
    mountOfficeDetail(detail, office);
    detail.dataset.ready = "1";
  }

  // Toggle
  officeBtn.classList.toggle("open", isOpening);
  detail.classList.toggle("open", isOpening);

  // Si abro la oficina, centro el header (y si querés, el detalle también)
  if (isOpening) {
    requestAnimationFrame(() => {
      centerInScroll(officeBtn);
      // opcional: centrar el detalle luego de que expanda un poco
      setTimeout(() => centerInScroll(detail), 220);
    });
  }
};




    content.appendChild(officeBtn);
    content.appendChild(detail);
  });

  wrapper.appendChild(header);
  wrapper.appendChild(content);
  return wrapper;
}


// === HTML del detalle (con placeholders propios para QR dentro del acordeón)
function buildOfficeDetailHTML(office) {
  const desc = (office.description || "").trim();
  const schedule = (office.scheduleText || "").trim();

  let tags = office.tags;
  if (typeof tags === "string") tags = tags.split(",").map(t => t.trim()).filter(Boolean);
  if (!Array.isArray(tags)) tags = [];

  const tagsHtml = tags.length
    ? tags.map(t => `<span class="chip">${t}</span>`).join("")
    : `<span class="muted">Sin tags</span>`;

  return `
    <div class="office-detail">
      <div class="detail-grid">
        <div class="detail-section">
          <div class="detail-title">Información</div>
          <div class="detail-body">${desc || `<span class="muted">Sin descripción</span>`}</div>
        </div>

        <div class="detail-section">
          <div class="detail-title">Servicios / Rubros</div>
          <div class="chips">${tagsHtml}</div>
        </div>

        <div class="detail-section">
          <div class="detail-title">Horarios</div>
          <div class="detail-body">${schedule || `<span class="muted">Sin horarios</span>`}</div>
        </div>
      </div>

      <div class="detail-section">
        <div class="detail-title">Contacto / QRs</div>

        <div class="qr-grid" data-qr-grid>
          <div class="qr-item" data-qr-item="main">
            <div class="qr-box" data-qr="main"></div>
            <div class="qr-label" data-base-text="Sitio web / Ficha completa">Sitio web / Ficha completa</div>
          </div>

          <div class="qr-item" data-qr-item="whats">
            <div class="qr-box" data-qr="whats"></div>
            <div class="qr-label" data-base-text="WhatsApp / Turnos">WhatsApp / Turnos</div>
          </div>

          <div class="qr-item" data-qr-item="extra">
            <div class="qr-box" data-qr="extra"></div>
            <div class="qr-label" data-base-text="Otro enlace">Otro enlace</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// === monta QRs + oculta vacíos + iconos SIN DUPLICAR
function mountOfficeDetail(detailRoot, office) {
  const mainUrl = (office.qrMainUrl || "").trim();
  const whatsUrl = (office.qrWhatsAppUrl || "").trim();
  const extraUrl = (office.qrExtraUrl || "").trim();

  const grid = detailRoot.querySelector("[data-qr-grid]");
  const mainItem = detailRoot.querySelector('[data-qr-item="main"]');
  const whatsItem = detailRoot.querySelector('[data-qr-item="whats"]');
  const extraItem = detailRoot.querySelector('[data-qr-item="extra"]');

  const mainBox = detailRoot.querySelector('[data-qr="main"]');
  const whatsBox = detailRoot.querySelector('[data-qr="whats"]');
  const extraBox = detailRoot.querySelector('[data-qr="extra"]');

  // ocultar vacíos
  if (mainItem) mainItem.style.display = mainUrl ? "" : "none";
  if (whatsItem) whatsItem.style.display = whatsUrl ? "" : "none";
  if (extraItem) extraItem.style.display = extraUrl ? "" : "none";

  // alinear grilla según cantidad visible
  if (grid) {
    const count = [mainUrl, whatsUrl, extraUrl].filter(Boolean).length;
    grid.classList.remove("qr-count-1", "qr-count-2", "qr-count-3");
    if (count === 1) grid.classList.add("qr-count-1");
    else if (count === 2) grid.classList.add("qr-count-2");
    else if (count === 3) grid.classList.add("qr-count-3");
  }

  // render QRs
  if (mainUrl) renderQrTo(mainBox, mainUrl);
  if (whatsUrl) renderQrTo(whatsBox, whatsUrl);
  if (extraUrl) renderQrTo(extraBox, extraUrl);

  // iconos sin duplicar (usa data-base-text SIEMPRE)
  const setIcon = (itemEl, emoji) => {
    if (!itemEl) return;
    const label = itemEl.querySelector(".qr-label");
    if (!label) return;
    const base = label.dataset.baseText || label.textContent.replace(/^[^\w]+/, "").trim();
    label.dataset.baseText = base;
    label.innerHTML = `<span class="qr-icon">${emoji}</span> ${base}`;
  };

  if (mainUrl) setIcon(mainItem, "🌐");
  if (whatsUrl) setIcon(whatsItem, "💬");
  if (extraUrl) setIcon(extraItem, "🔗");
}