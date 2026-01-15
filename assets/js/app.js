// ===============================
// APP PRINCIPAL TOTEM
// ===============================

let currentRefreshVersion = null;
let refreshIntervalId = null;
const REFRESH_POLL_MS = 5000; // 5s

const IDLE_MS = 60_000; // 60s (cambialo a gusto: 120_000 = 2 min, etc.)
let idleTimer = null;

function getSplashEl() {
  return document.getElementById("idleSplash");
}

function showSplash() {
  const el = getSplashEl();
  if (!el) return;
  el.classList.remove("hidden");
}

function hideSplash() {
  const el = getSplashEl();
  if (!el) return;
  el.classList.add("hidden");
}


// Estado mínimo (si lo usás para el refresh “mantener vista”)
window.totemState = window.totemState || {
  view: "view-main",
  floorId: null,
  officeId: null
};
const viewStack = [];

//VISTA NUEVA PARA LAS SOLAPAS 
window.viewStack = window.viewStack || [];

window.openTab = function(viewId) {
  const view = document.getElementById(viewId);
  if (!view) return;

  // oculta solo la actual
  if (window.viewStack.length) {
    const current = document.getElementById(window.viewStack[window.viewStack.length - 1]);
    current && current.classList.add("hidden");
  }

  view.classList.remove("hidden");
  window.viewStack.push(viewId);

  console.log("[TABS] open", window.viewStack);
};






// Centrar un elemento dentro del scroll contenedor (suave)
window.scrollIntoCenter = function (el, containerSelector = ".views-container") {
  if (!el) return;

  const container = document.querySelector(containerSelector) || el.closest(".scroll") || window;
  const isWindow = container === window;

  const rect = el.getBoundingClientRect();
  const cRect = isWindow ? { top: 0, height: window.innerHeight } : container.getBoundingClientRect();

  const currentScroll = isWindow ? window.scrollY : container.scrollTop;
  const elCenter = rect.top - cRect.top + currentScroll + rect.height / 2;
  const target = elCenter - (cRect.height / 2);

  if (isWindow) {
    window.scrollTo({ top: target, behavior: "smooth" });
  } else {
    container.scrollTo({ top: target, behavior: "smooth" });
  }
};



window.closeTab = function() {
  if (window.viewStack.length <= 1) return;

  const currentId = window.viewStack.pop();
  document.getElementById(currentId)?.classList.add("hidden");

  const prevId = window.viewStack[window.viewStack.length - 1];
  document.getElementById(prevId)?.classList.remove("hidden");

  console.log("[TABS] close", window.viewStack);
};


function truncate(text, max = 150) {
  if (!text) return "";
  const t = String(text).trim();
  return t.length > max ? t.slice(0, max) + "…" : t;
}


// ====== HELPERS ======
function closeAllAccordions() {
  document.querySelectorAll(".acc-panel-floor.open, .acc-panel-office.open").forEach(el => el.classList.remove("open"));
  document.querySelectorAll(".acc-floor.open, .acc-office.open").forEach(el => el.classList.remove("open"));
}

function clearSearchUI() {
  const input = document.querySelector("#searchInput");
  if (input) input.value = "";
  
  // si tu búsqueda cambia títulos, los limpiamos
  const mainTitle = document.querySelector("#mainTitle");
  const mainDesc  = document.querySelector("#mainDescription");
  if (mainTitle) mainTitle.textContent = "";
  if (mainDesc)  mainDesc.textContent = "";
}

function scrollRightPanelToTop() {
  const scroller = document.querySelector("#view-main .scroll") || document.querySelector(".scroll");
  if (scroller) scroller.scrollTo({ top: 0, behavior: "smooth" });
}

// Esto es "volver a inicio" en tu app
function goHomeIdle() {
  // 1) mostrar vista principal
  if (typeof showView === "function") showView("view-main");

  // 2) re-render lista principal si existe
  if (typeof renderMainView === "function") renderMainView();

  // 3) cerrar acordeones + limpiar search + ir arriba
  closeAllAccordions();
  clearSearchUI();

  setTimeout(() => {
    scrollRightPanelToTop();
  }, 50);
    // Mostrar pantalla "Toque la pantalla"
  showSplash();

}

// ====== TIMER ======
function resetInactivityTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(goHomeIdle, IDLE_MS);
}

// ====== EVENTOS que resetean idle ======
function bindIdleEvents() {
  const events = ["pointerdown", "pointermove", "keydown", "touchstart", "wheel"];
  events.forEach(evt => window.addEventListener(evt, resetInactivityTimer, { passive: true }));
  resetInactivityTimer();
}

// Llamalo una vez cuando arranca la app:
bindIdleEvents();



function getFloorById(id) {
  const floors = window.buildingData?.floors || [];
  return floors.find(f => String(f.id) === String(id)) || null;
}
function getOfficeById(floor, id) {
  const offices = floor?.offices || [];
  return offices.find(o => String(o.id) === String(id)) || null;
}

function updateBreadcrumb() {
  const el = document.getElementById("breadcrumb");
  if (!el) return;

  const state = window.totemState || {};
  const parts = [];

  parts.push(`<span>Inicio</span>`);

  if (state.floorId) {
    const floor = getFloorById(state.floorId);
    parts.push(`<span class="sep">›</span>`);
    parts.push(`<span class="muted">${floor?.name || "Piso"}</span>`);
  }

  if (state.floorId && state.officeId) {
    const floor = getFloorById(state.floorId);
    const office = getOfficeById(floor, state.officeId);
    parts.push(`<span class="sep">›</span>`);
    parts.push(`<span class="muted">${office?.name || "Oficina"}</span>`);
  }

  el.innerHTML = parts.join("");
}




//TERMINA LAS SOLAPAS 


function openTab(viewId) {
  const view = document.getElementById(viewId);
  if (!view) return;

  // ocultamos la vista actual (si hay)
  if (viewStack.length) {
    const currentView = document.getElementById(viewStack[viewStack.length - 1]);
    currentView?.classList.add("hidden");
  }


  // marcar la actual como "debajo" (solapa anterior)
if (window.viewStack.length) {
  const current = document.getElementById(window.viewStack[window.viewStack.length - 1]);
  if (current) current.classList.add("tab-under");
}


  // mostramos la nueva
  view.classList.remove("hidden");
  viewStack.push(viewId);

  view.classList.remove("tab-under");
view.style.zIndex = String(100 + window.viewStack.length);


  console.log("[TAB] open:", viewStack);
}

function closeTab() {
  if (viewStack.length <= 1) return;

  // cerramos la actual
  const currentViewId = viewStack.pop();
  document.getElementById(currentViewId)?.classList.add("hidden");

  // mostramos la anterior
  const prevViewId = viewStack[viewStack.length - 1];
  document.getElementById(prevViewId)?.classList.remove("hidden");

  // al volver, la anterior deja de estar "debajo"
prev && prev.classList.remove("tab-under");
updateBreadcrumb();


  console.log("[TAB] close:", viewStack);
}

function showView(viewId) {
  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  const view = document.getElementById(viewId);
  if (view) view.classList.remove("hidden");

  // Guardamos vista actual
  window.totemState.view = viewId;
}

function setupGlobalNavigation() {
  // ← Inicio (desde vista piso)
btnBackToMain.addEventListener("click", () => {
  window.closeTab();
  if (typeof resetInactivityTimer === "function") resetInactivityTimer();
});



  // ← Piso (desde vista oficina)
  const btnBackToFloor = document.getElementById("btnBackToFloor");
  if (btnBackToFloor) {
  btnBackToFloor.addEventListener("click", () => {
  window.closeTab();
  if (typeof resetInactivityTimer === "function") resetInactivityTimer();
});



  }
  updateBreadcrumb();

}

function setupSwipeBack() {
  const area = document.querySelector(".views-container");
  if (!area) return;

  let startX = 0, startY = 0, tracking = false;

  area.addEventListener("touchstart", (e) => {
    if (!e.touches || e.touches.length !== 1) return;
    tracking = true;
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });

  area.addEventListener("touchmove", (e) => {
    if (!tracking || !e.touches || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;

    // si es más vertical que horizontal, ignoramos
    if (Math.abs(dy) > Math.abs(dx)) return;

    // si está haciendo swipe a la derecha fuerte, evitamos scroll lateral raro
    if (dx > 30) e.preventDefault();
  }, { passive: false });

  area.addEventListener("touchend", (e) => {
    if (!tracking) return;
    tracking = false;

    const t = e.changedTouches && e.changedTouches[0];
    if (!t) return;

    const dx = t.clientX - startX;
    const dy = t.clientY - startY;

    // Umbral swipe (ajustable)
    if (dx > 90 && Math.abs(dy) < 60) {
      if (typeof window.closeTab === "function") window.closeTab();
      if (typeof resetInactivityTimer === "function") resetInactivityTimer();
    }
  }, { passive: true });
}



function initTotem() {
  console.log("[APP] buildingData listo para usar:", JSON.stringify(window.buildingData, null, 2));

  if (typeof setupSearch === "function") {
    setupSearch();
  }

  setupSwipeBack();
updateBreadcrumb();

  setupGlobalNavigation();

  // ✅ CLAVE: aseguramos la vista visible
  if (typeof showView === "function") showView("view-main");

  // ✅ Render home
  renderMainView();

  if (typeof resetInactivityTimer === "function") {
    resetInactivityTimer();
  }
 //SOLAPA PRUEBA
  window.viewStack = ["view-main"];

}

async function pollRefreshVersion() {
  try {
    const res = await fetchJson(
      `${API_BASE}/building?fields[0]=refreshVersion&publicationState=preview`
    );
    const data = res?.data || {};
    const attr = data.attributes || data;
    const newVersion = attr.refreshVersion || 1;

    if (currentRefreshVersion !== null && newVersion !== currentRefreshVersion) {
      console.log("[APP] Detectado cambio en refreshVersion:", currentRefreshVersion, "=>", newVersion);

      currentRefreshVersion = newVersion;

      // Recargamos todo desde Strapi
      if (typeof loadBuildingData === "function") {
        await loadBuildingData();
      }

      // Re-render según vista actual
      const mainView = document.getElementById("view-main");
      const floorView = document.getElementById("view-floor");
      const officeView = document.getElementById("view-office");

      if (mainView && !mainView.classList.contains("hidden")) {
        renderMainView();
      } else if (floorView && !floorView.classList.contains("hidden")) {
        // Si estabas en un piso, renderFloorView usa currentFloorId interno,
        // así que lo más seguro es volver a abrir el piso guardado:
        if (window.totemState?.floorId) {
          openFloor(window.totemState.floorId);
        } else {
          renderMainView();
          showView("view-main");
        }
      } else if (officeView && !officeView.classList.contains("hidden")) {
        // En esta versión simple, volvemos al home si estaba en oficina
        renderMainView();
        showView("view-main");
      } else {
        renderMainView();
        showView("view-main");
      }
    } else {
      // Primera vez o sin cambios
      currentRefreshVersion = newVersion;
    }
  } catch (err) {
    console.error("[APP] Error al chequear refreshVersion:", err);
  }
}

function startAutoRefresh() {
  if (refreshIntervalId) clearInterval(refreshIntervalId);
  refreshIntervalId = setInterval(pollRefreshVersion, REFRESH_POLL_MS);
}

document.addEventListener("DOMContentLoaded", async () => {
  console.log("[APP] buildingData inicial (de data.js):", JSON.stringify(window.buildingData, null, 2));

  try {
    if (typeof loadBuildingData === "function") {
      await loadBuildingData();
      console.log("[APP] buildingData después de Strapi:", JSON.stringify(window.buildingData, null, 2));
    } else {
      console.warn("[APP] loadBuildingData no definida");
    }
  } catch (err) {
    console.error("[APP] Error al cargar desde Strapi, usando data.js:", err);
  }

  if (window.buildingData) {
    currentRefreshVersion = window.buildingData.refreshVersion || 1;
  }

  startAutoRefresh();
  initTotem();
});



// ===============================
// KIOSK MODE (FULLSCREEN + IDLE)
// ===============================
(function setupKioskMode() {
  // 1) bloquear gestos “web”
  document.addEventListener("contextmenu", (e) => e.preventDefault());
  document.addEventListener("dragstart", (e) => e.preventDefault());

  // evita zoom por ctrl+rueda
  window.addEventListener("wheel", (e) => {
    if (e.ctrlKey) e.preventDefault();
  }, { passive: false });

  // 2) fullscreen al primer toque (requisito del navegador)
  async function enterFullscreen() {
    try {
      const el = document.documentElement;
      if (!document.fullscreenElement && el.requestFullscreen) {
        await el.requestFullscreen({ navigationUI: "hide" });
      }
    } catch (err) {
      console.warn("[KIOSK] No se pudo fullscreen:", err);
    }
  }

  // 3) Wake Lock (si el navegador lo soporta)
  let wakeLock = null;
  async function enableWakeLock() {
    try {
      if ("wakeLock" in navigator) {
        wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => console.log("[KIOSK] WakeLock released"));
        console.log("[KIOSK] WakeLock active");
      }
    } catch (e) {
      console.warn("[KIOSK] WakeLock no disponible:", e);
    }
  }

  // reintenta wakeLock al volver a la pestaña
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") enableWakeLock();
  });

  // 4) Idle reset (vuelve a inicio)
  const IDLE_MS = 60_000; // ajustá: 60s
  let idleTimer = null;

  function goHome() {
    // tu app ya usa showView y/o renderMainView
    if (typeof renderMainView === "function") renderMainView();
    if (typeof showView === "function") showView("view-main");
  }

  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(goHome, IDLE_MS);
  }

  ["pointerdown","mousemove","touchstart","keydown"].forEach(evt =>
    window.addEventListener(evt, resetIdle, { passive: true })
  );

  // 5) auto-reload diario (opcional para kiosco estable)
  // setInterval(() => location.reload(), 1000 * 60 * 60 * 6); // cada 6h

  // primer toque: fullscreen + wakelock
  window.addEventListener("pointerdown", () => {
    enterFullscreen();
    enableWakeLock();
  }, { once: false, passive: true });

  resetIdle();
})();

(function disableAutoFullscreen(){
  const deny = () => {
    console.warn("[KIOSK] Fullscreen bloqueado (no solicitado)");
    return Promise.reject(new Error("Fullscreen bloqueado"));
  };

  const elProto = Element.prototype;

  if (elProto.requestFullscreen) elProto.requestFullscreen = deny;
  if (elProto.webkitRequestFullscreen) elProto.webkitRequestFullscreen = deny;
  if (elProto.msRequestFullscreen) elProto.msRequestFullscreen = deny;

  if (document.documentElement && document.documentElement.webkitRequestFullscreen) {
    document.documentElement.webkitRequestFullscreen = deny;
  }
})();
// Splash visible al iniciar
document.addEventListener("DOMContentLoaded", () => {
  showSplash();

  // Primer toque/click: ocultar splash
  const onFirstInteract = () => {
    hideSplash();
    resetInactivityTimer(); // arranca el conteo de idle desde cero
  };

  window.addEventListener("pointerdown", onFirstInteract, { passive: true });
});
