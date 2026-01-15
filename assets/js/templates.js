// ===============================
// TEMPLATES / PLANTILLAS DE UI (LIMPIO)
// - Sin duplicados
// - Acordeón pisos/oficinas con centrado automático
// - Soporta búsqueda (cards) si tu view-main la usa
// ===============================

// -------------------------------
// Helpers
// -------------------------------
function createEl(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined && text !== null) el.textContent = text;
  return el;
}


function truncate(text, max = 150) {
  if (!text) return "";
  const t = String(text).trim();
  return t.length > max ? t.slice(0, max) + "…" : t;
}


// Centra un elemento dentro del contenedor .scroll (el que scrollea en tu HTML)
function centerInScroll(el, offset = -20) {
  if (!el) return;
  const scroll = el.closest(".view")?.querySelector(".scroll") || el.closest(".scroll");
  if (!scroll) return;

  const elRect = el.getBoundingClientRect();
  const scRect = scroll.getBoundingClientRect();

  const target =
    (elRect.top - scRect.top) +
    scroll.scrollTop -
    (scRect.height / 2) +
    (elRect.height / 2) +
    offset;

  scroll.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
}

function getScrollContainer(el) {
  // Busca el contenedor con scroll más cercano (tu .scroll)
  return el?.closest?.(".scroll") || el?.closest?.(".views-container") || null;
}

/**
 * Centra un elemento dentro del scroll contenedor.
 * @param {HTMLElement} el
 * @param {number} offset (px) opcional para subir/bajar un poco
 * @param {"smooth"|"auto"} behavior
 */
function centerInScroll(el, offset = 0, behavior = "smooth") {
  if (!el) return;

  const scroller = getScrollContainer(el);
  if (!scroller) return;

  const sRect = scroller.getBoundingClientRect();
  const eRect = el.getBoundingClientRect();

  // posición del elemento dentro del scroller
  const elTopInScroll = (eRect.top - sRect.top) + scroller.scrollTop;

  const target =
    elTopInScroll - (scroller.clientHeight / 2) + (eRect.height / 2) + offset;

  scroller.scrollTo({
    top: Math.max(0, target),
    behavior
  });
}


// -------------------------------
// QR renderer (ÚNICO)
// -------------------------------
function renderQrTo(container, url) {
  if (!container) return;

  // limpiar SIEMPRE
  container.innerHTML = "";
  container.classList.remove("qr-ready");

  const clean = (url || "").trim();
  if (!clean) return;

  // layout fijo y centrado
  container.style.display = "flex";
  container.style.alignItems = "center";
  container.style.justifyContent = "center";
  container.style.boxSizing = "border-box";

  // tamaño RESPONSIVE real
  const maxSize = window.innerWidth < 600 ? 140 : 180;

  const qrWrap = document.createElement("div");
  qrWrap.style.width = `${maxSize}px`;
  qrWrap.style.height = `${maxSize}px`;
  qrWrap.style.display = "flex";
  qrWrap.style.alignItems = "center";
  qrWrap.style.justifyContent = "center";

  container.appendChild(qrWrap);

  new QRCode(qrWrap, {
    text: clean,
    width: maxSize,
    height: maxSize,
    correctLevel: QRCode.CorrectLevel.H
  });

  // asegurar que NO se desborde
  const qrEl = qrWrap.querySelector("img, canvas");
  if (qrEl) {
    qrEl.style.width = "100%";
    qrEl.style.height = "100%";
    qrEl.style.display = "block";
  }

  container.classList.add("qr-ready");
}




/* helper seguro */
function MathClamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}



// -------------------------------
// Cards (por compatibilidad)
// (si tu búsqueda o vistas antiguas las usan)
// -------------------------------
function createFloorCard(floor) {
  const card = createEl("div", "card floor-card");
  card.onclick = () => {
    if (typeof openFloor === "function") openFloor(floor.id);
    if (typeof window.openTab === "function") window.openTab("view-floor");
  };

  const titleText =
    floor.name || (typeof floor.number === "number" ? `Piso ${floor.number}` : "Piso");

  card.appendChild(createEl("div", "card-title", titleText));
  card.appendChild(createEl("div", "card-subtitle", floor.shortDescription || ""));
  return card;
}

function createOfficeCardInFloor(floor, office) {
  const card = createEl("div", "card office-card");
  card.onclick = () => {
    if (typeof openOffice === "function") openOffice(floor.id, office.id);
    if (typeof window.openTab === "function") window.openTab("view-office");
  };
  card.appendChild(createEl("div", "card-title", office.name || "(Sin nombre)"));
  card.appendChild(
    createEl("div", "card-subtitle", office.location ? `Departamento: ${office.location}` : "")
  );
  return card;
}

function createOfficeSearchResultCard(floor, office) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "acc-row acc-office acc-search";

  btn.innerHTML = `
    <div class="acc-icon">
      ${(office.name || "?").charAt(0).toUpperCase()}
    </div>

    <div class="acc-text">
      <div class="acc-title">${office.name || "Oficina"}</div>
      <div class="acc-subtitle">
        ${floor.name || ""}
       ${office.location ? ` · Dpto ${office.location}` : ""}

      </div>
    </div>

    <div class="acc-chevron">›</div>
  `;

  btn.onclick = () => {
    if (typeof openOfficeFromSearch === "function") {
      openOfficeFromSearch(floor.id, office.id);
    }
  };

  return btn;
}




function openOfficeFromSearch(floorId, officeId) {
  // 1. Volvemos a vista principal
  showView("view-main");

  // 2. Render normal (pisos)
  renderMainView();

  // 3. Esperamos render
  setTimeout(() => {
    const floor = window.buildingData.floors.find(f => f.id === floorId);
    if (!floor) return;

    const floorAcc = [...document.querySelectorAll(".acc-floor")]
      .find(h => h.textContent.includes(floor.name));
    if (!floorAcc) return;

    // abrir piso
    floorAcc.click();

    setTimeout(() => {
      const officeBtn = [...document.querySelectorAll(".acc-office")]
        .find(b => b.textContent.includes(
          (floor.offices.find(o => o.id === officeId)?.name || "")
        ));

      if (officeBtn) officeBtn.click();
    }, 250);
  }, 200);
}





// -------------------------------
// Acordeón: detalle de oficina (HTML + mount)
// -------------------------------
function buildOfficeDetailHTML(office) {
 const desc = truncate((office.description || office.info || "").toString().trim(), 150);

  const schedule = (office.scheduleText || "").toString().trim();

  let tags = office.tags;
  if (typeof tags === "string") tags = tags.split(",").map((t) => t.trim()).filter(Boolean);
  if (!Array.isArray(tags)) tags = [];

  const tagsHtml = tags.length
    ? tags.map((t) => `<span class="chip">${t}</span>`).join("")
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
            <div class="qr-text">Escaneá para ver más información.</div>
          </div>

          <div class="qr-item" data-qr-item="whats">
            <div class="qr-box" data-qr="whats"></div>
            <div class="qr-label" data-base-text="WhatsApp / Turnos">WhatsApp / Turnos</div>
            <div class="qr-text">Escaneá para chatear o pedir turnos.</div>
          </div>

          <div class="qr-item" data-qr-item="extra">
            <div class="qr-box" data-qr="extra"></div>
            <div class="qr-label" data-base-text="Otro enlace">Otro enlace</div>
            <div class="qr-text">Redes, formulario u otro recurso.</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function mountOfficeDetail(detailRoot, office) {
  const mainUrl  = (office.qrMainUrl || "").toString().trim();
  const whatsUrl = (office.qrWhatsAppUrl || "").toString().trim();
  const extraUrl = (office.qrExtraUrl || "").toString().trim();

  const grid = detailRoot.querySelector("[data-qr-grid]");
  const items = {
    main:  detailRoot.querySelector('[data-qr-item="main"]'),
    whats: detailRoot.querySelector('[data-qr-item="whats"]'),
    extra: detailRoot.querySelector('[data-qr-item="extra"]'),
  };
  const boxes = {
    main:  detailRoot.querySelector('[data-qr="main"]'),
    whats: detailRoot.querySelector('[data-qr="whats"]'),
    extra: detailRoot.querySelector('[data-qr="extra"]'),
  };

  // --- helpers ---
  const removeItem = (itemEl) => {
    if (!itemEl) return;
    // elimina el nodo completo (evita que CSS con !important lo muestre)
    itemEl.remove();
  };

  // URLs presentes
  const present = {
    main:  !!mainUrl,
    whats: !!whatsUrl,
    extra: !!extraUrl,
  };

  // 1) ELIMINAR QRs VACÍOS (NO display:none)
  if (!present.main)  removeItem(items.main);
  if (!present.whats) removeItem(items.whats);
  if (!present.extra) removeItem(items.extra);

  // 2) Recalcular cantidad real (por si se removieron nodos)
  const count = [mainUrl, whatsUrl, extraUrl].filter(Boolean).length;

  // 3) Ajustar clases grilla
  if (grid) {
    grid.classList.remove("qr-count-1", "qr-count-2", "qr-count-3");
    if (count === 1) grid.classList.add("qr-count-1");
    else if (count === 2) grid.classList.add("qr-count-2");
    else if (count === 3) grid.classList.add("qr-count-3");
  }

  // 4) Render QRs SOLO si existe URL
  if (mainUrl && boxes.main)  renderQrTo(boxes.main, mainUrl);
  if (whatsUrl && boxes.whats) renderQrTo(boxes.whats, whatsUrl);
  if (extraUrl && boxes.extra) renderQrTo(boxes.extra, extraUrl);

  // 5) Iconos sin duplicar
  const setIcon = (itemEl, emoji) => {
    if (!itemEl) return;
    const label = itemEl.querySelector(".qr-label");
    if (!label) return;
    const base = label.dataset.baseText || label.textContent.trim();
    label.dataset.baseText = base;
    label.innerHTML = `<span class="qr-icon">${emoji}</span> ${base}`;
  };

  // ojo: items.* pudo haber sido removido, re-consultamos si hace falta
  const liveMain  = detailRoot.querySelector('[data-qr-item="main"]');
  const liveWhats = detailRoot.querySelector('[data-qr-item="whats"]');
  const liveExtra = detailRoot.querySelector('[data-qr-item="extra"]');

  if (mainUrl)  setIcon(liveMain, "🌐");
  if (whatsUrl) setIcon(liveWhats, "💬");
  if (extraUrl) setIcon(liveExtra, "🔗");

  // 6) CLICK PARA ABRIR LINK: SOLO MOBILE (en tótem NO)
  const isMobile =
    window.matchMedia("(pointer: coarse)").matches ||
    window.matchMedia("(max-width: 768px)").matches;

  const bindQrClick = (itemEl, url) => {
    if (!itemEl || !url || !isMobile) return;

    itemEl.style.cursor = "pointer";
    itemEl.setAttribute("role", "link");
    itemEl.tabIndex = 0;

    const go = () => {
      // mobile: abrir en la misma pestaña
      window.location.href = url;
    };

    itemEl.addEventListener("click", go);
    itemEl.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        go();
      }
    });
  };

  if (mainUrl)  bindQrClick(liveMain, mainUrl);
  if (whatsUrl) bindQrClick(liveWhats, whatsUrl);
  if (extraUrl) bindQrClick(liveExtra, extraUrl);
}





// -------------------------------
// Acordeón: pisos/oficinas (principal)
// -------------------------------
function createFloorAccordion(floor) {
  const wrapper = document.createElement("div");
  wrapper.className = "acc-wrapper"; // ✅ ahora sí aplica el margin del CSS

  // Header piso
  const header = document.createElement("button");
  header.type = "button";
  header.className = "acc-row acc-floor";
header.innerHTML = `
  <div class="acc-icon">🏢</div>
  <div class="acc-text">
    <div class="acc-title">${floor.name || "Piso"}</div>
  </div>
  <div class="acc-chevron">▾</div>
`;


  // Panel piso
  const content = document.createElement("div");
  content.className = "acc-panel acc-panel-floor";

  header.onclick = () => {
    const isOpen = content.classList.contains("open");

    document.querySelectorAll(".acc-panel-floor.open").forEach(p => {
      if (p !== content) p.classList.remove("open");
    });
    document.querySelectorAll(".acc-floor.open").forEach(h => {
      if (h !== header) h.classList.remove("open");
    });

    header.classList.toggle("open", !isOpen);
    content.classList.toggle("open", !isOpen);

    if (!isOpen) {
      setTimeout(() => centerInScroll(header), 220);
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
    <div class="acc-title">
      ${office.location ? `<span class="acc-depto">${office.location}</span><span class="acc-sep"> – </span>` : ""}
      <span class="acc-company">${office.name || "Oficina"}</span>
    </div>
    <div class="acc-subtitle"></div>
  </div>
  <div class="acc-chevron">▾</div>
`;


    const detail = document.createElement("div");
    detail.className = "acc-panel acc-panel-office";

    officeBtn.onclick = () => {
      const isOpen = detail.classList.contains("open");

      content.querySelectorAll(".acc-panel-office.open").forEach(d => {
        if (d !== detail) d.classList.remove("open");
      });
      content.querySelectorAll(".acc-office.open").forEach(b => {
        if (b !== officeBtn) b.classList.remove("open");
      });

      if (!detail.dataset.ready) {
        detail.innerHTML = buildOfficeDetailHTML(office);
        mountOfficeDetail(detail, office);
        detail.dataset.ready = "1";
      }

      officeBtn.classList.toggle("open", !isOpen);
      detail.classList.toggle("open", !isOpen);

      if (!isOpen) setTimeout(() => centerInScroll(officeBtn), 260);
    };

    content.appendChild(officeBtn);
    content.appendChild(detail);
  });

  wrapper.appendChild(header);
  wrapper.appendChild(content);
  return wrapper;
}




function centerInScroll(element) {
  if (!element) return;

  const scrollContainer = element.closest(".scroll");
  if (!scrollContainer) return;

  const containerRect = scrollContainer.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  const currentScroll = scrollContainer.scrollTop;

  const elementCenter =
    elementRect.top - containerRect.top + currentScroll + elementRect.height / 2;

  const containerCenter = scrollContainer.clientHeight / 2;

  const targetScroll = elementCenter - containerCenter;

  scrollContainer.scrollTo({
    top: targetScroll,
    behavior: "smooth",
  });
}


function openFloorById(floorId) {
  const header = document.querySelector(`.acc-floor[data-floor-id="${floorId}"]`);
  if (!header) return false;

  const panel = header.nextElementSibling;
  if (panel && panel.classList.contains("open")) return true;

  header.click();
  return true;
}

function openOfficeById(floorId, officeId) {
  const floorPanel = document.querySelector(
    `.acc-floor[data-floor-id="${floorId}"] + .acc-panel-floor`
  );
  if (!floorPanel) return false;

  const officeBtn = floorPanel.querySelector(`.acc-office[data-office-id="${officeId}"]`);
  if (!officeBtn) return false;

  officeBtn.click();
  return true;
}

