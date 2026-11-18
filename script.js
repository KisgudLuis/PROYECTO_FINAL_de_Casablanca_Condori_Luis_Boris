/* =========================================================
   SIMTELE-WEB - JavaScript
   Aplicación educativa de monitoreo simulado.
   Los datos se guardan únicamente en el navegador.
   ========================================================= */

// Claves utilizadas para guardar los datos en localStorage.
const STORAGE_KEYS = {
  maintenance: "simtele_maintenance",
  sensors: "simtele_sensors",
  alerts: "simtele_alerts",
  log: "simtele_log",
  windHistory: "simtele_wind_history"
};

// Datos que se mantienen mientras dure la sesión del navegador.
let maintenanceRecords = loadData(STORAGE_KEYS.maintenance, []);
let sensorRecords = loadData(STORAGE_KEYS.sensors, []);
let alerts = loadData(STORAGE_KEYS.alerts, []);
let activityLog = loadData(STORAGE_KEYS.log, []);
let windHistory = loadData(STORAGE_KEYS.windHistory, []);
let currentOperator = sessionStorage.getItem("simtele_operator") || "";
let confirmCallback = null;

// -------------------- FUNCIONES GENERALES --------------------
// Estas funciones ayudan a guardar datos, mostrar mensajes, crear identificadores,
// registrar actividades y validar campos. Son utilizadas por varios módulos.

function loadData(key, defaultValue) {
  try {
    const savedData = localStorage.getItem(key);
    return savedData ? JSON.parse(savedData) : defaultValue;
  } catch (error) {
    console.error("No se pudieron leer los datos guardados:", error);
    return defaultValue;
  }
}

function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    showToast("No se pudieron guardar los datos en este navegador.", "error");
    console.error("Error al guardar:", error);
  }
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, function (character) {
    const characters = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return characters[character];
  });
}

function createId() {
  return Date.now().toString() + Math.floor(Math.random() * 1000).toString();
}

function getDateTime(dateValue) {
  const date = dateValue ? new Date(dateValue) : new Date();
  return date.toLocaleString("es-BO", {
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  });
}

function showToast(message, type = "success") {
  const container = document.getElementById("toastContainer");
  const toast = document.createElement("div");
  toast.className = "toast " + type;
  toast.textContent = message;
  container.appendChild(toast);
  setTimeout(function () {
    toast.remove();
  }, 3500);
}

function recordLog(moduleName, detail, type = "Información") {
  activityLog.unshift({
    id: createId(),
    date: new Date().toISOString(),
    operator: currentOperator || "Sistema",
    module: moduleName,
    detail: detail,
    type: type
  });

  // La bitácora se limita a los últimos 200 eventos para evitar crecer indefinidamente.
  if (activityLog.length > 200) {
    activityLog = activityLog.slice(0, 200);
  }

  saveData(STORAGE_KEYS.log, activityLog);
  renderLog();
  updateDashboard();
}

function createAlert(origin, description, level = "warning") {
  alerts.unshift({
    id: createId(),
    date: new Date().toISOString(),
    origin: origin,
    description: description,
    level: level,
    status: "pending"
  });

  saveData(STORAGE_KEYS.alerts, alerts);
  renderAlerts();
  updateDashboard();
}

function requestConfirmation(message, callback, title = "¿Confirmas esta acción?") {
  document.getElementById("confirmTitle").textContent = title;
  document.getElementById("confirmText").textContent = message;
  confirmCallback = callback;
  document.getElementById("confirmModal").classList.remove("hidden");
}

function closeConfirmation() {
  document.getElementById("confirmModal").classList.add("hidden");
  confirmCallback = null;
}

function setFieldError(element, message) {
  element.setCustomValidity(message);
  element.reportValidity();
  element.addEventListener("input", function clearError() {
    element.setCustomValidity("");
    element.removeEventListener("input", clearError);
  });
}

// -------------------- INICIO DE SESIÓN --------------------
// Muestra la aplicación después de ingresar y permite cerrar la sesión.
// El acceso es demostrativo: no constituye un sistema de seguridad real.

function showApplication() {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("appShell").classList.remove("hidden");

  const displayName = currentOperator || "Operador";
  const initials = displayName.split(" ").map(part => part[0]).join("").slice(0, 2).toUpperCase();

  document.getElementById("sidebarUserName").textContent = displayName;
  document.getElementById("topUserName").textContent = displayName;
  document.getElementById("welcomeName").textContent = displayName;
  document.getElementById("sidebarAvatar").textContent = initials;
  document.getElementById("topAvatar").textContent = initials;

  renderAll();
  updateClock();
  showView("dashboard");
}

function logout() {
  sessionStorage.removeItem("simtele_logged_in");
  sessionStorage.removeItem("simtele_operator");
  currentOperator = "";

  document.getElementById("appShell").classList.add("hidden");
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("loginForm").reset();
  document.getElementById("loginMessage").textContent = "";

  closeSidebar();
  showToast("Sesión cerrada correctamente.", "info");
}

// -------------------- NAVEGACIÓN --------------------
// Permite cambiar entre las pantallas del panel y abrir o cerrar el menú lateral.

const viewNames = {
  dashboard: "Panel general",
  alerts: "Centro de alertas",
  emergency: "Detención de emergencia",
  maintenance: "Mantenimiento",
  wind: "Viento y oscilación",
  sensors: "Sensores",
  log: "Bitácora de actividad"
};

function showView(viewName) {
  if (!viewNames[viewName]) return;

  document.querySelectorAll(".view-section").forEach(function (section) {
    section.classList.remove("active-view");
  });

  const selectedView = document.getElementById("view-" + viewName);
  if (selectedView) selectedView.classList.add("active-view");

  document.querySelectorAll(".nav-link").forEach(function (button) {
    button.classList.toggle("active", button.dataset.view === viewName);
  });

  document.getElementById("breadcrumbCurrent").textContent = viewNames[viewName];

  closeSidebar();
  window.scrollTo({ top: 0, behavior: "smooth" });

  if (viewName === "dashboard") updateDashboard();
  if (viewName === "alerts") renderAlerts();
  if (viewName === "maintenance") renderMaintenance();
  if (viewName === "sensors") renderSensors();
  if (viewName === "log") renderLog();
  if (viewName === "wind") renderWindHistory();
}

function openSidebar() {
  document.getElementById("sidebar").classList.add("sidebar-open");
  document.getElementById("sidebarBackdrop").classList.add("show");
}

function closeSidebar() {
  document.getElementById("sidebar").classList.remove("sidebar-open");
  document.getElementById("sidebarBackdrop").classList.remove("show");
}

// -------------------- PANEL GENERAL --------------------
// Actualiza los contadores, las alertas recientes, la actividad y el reloj del panel.

// Actualiza los números principales del panel según los datos guardados.
function updateDashboard() {
  document.getElementById("metricAlerts").textContent = alerts.filter(item => item.status === "pending").length;
  document.getElementById("metricMaintenance").textContent = maintenanceRecords.length;
  document.getElementById("metricSensors").textContent = sensorRecords.length;
  document.getElementById("metricLog").textContent = activityLog.length;

  const pendingCount = alerts.filter(item => item.status === "pending").length;

  document.getElementById("sidebarAlertCount").textContent = pendingCount;
  document.getElementById("topAlertDot").classList.toggle("hidden", pendingCount === 0);

  const today = new Date();

  document.getElementById("todayLabel").textContent = today.toLocaleDateString("es-BO", {
    weekday: "short", day: "2-digit", month: "short", year: "numeric"
  });

  renderDashboardAlerts();
  renderDashboardActivity();
}

function renderDashboardAlerts() {
  const container = document.getElementById("dashboardAlerts");
  const pending = alerts.filter(item => item.status === "pending").slice(0, 4);

  if (pending.length === 0) {
    container.innerHTML = '<div class="empty-state-small">No hay alertas pendientes. Los avisos aparecerán cuando un módulo genere una condición de atención.</div>';
    return;
  }

  container.innerHTML = pending.map(function (alert) {
    const color = alert.level === "high" ? "red" : "amber";

    return `<div class="compact-row"><span class="compact-indicator ${color}"></span><div class="compact-content"><strong>${escapeHTML(alert.description)}</strong><small>${escapeHTML(alert.origin)} · ${getDateTime(alert.date)}</small></div><span class="compact-time">${alert.level === "high" ? "ALTA" : "AVISO"}</span></div>`;
  }).join("");
}

function renderDashboardActivity() {
  const container = document.getElementById("dashboardActivity");
  const latest = activityLog.slice(0, 4);

  if (latest.length === 0) {
    container.innerHTML = '<div class="empty-state-small">Aún no hay actividad registrada.</div>';
    return;
  }

  container.innerHTML = latest.map(function (item) {
    return `<div class="compact-row"><span class="compact-indicator green"></span><div class="compact-content"><strong>${escapeHTML(item.detail)}</strong><small>${escapeHTML(item.module)} · ${escapeHTML(item.operator)}</small></div><span class="compact-time">${new Date(item.date).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })}</span></div>`;
  }).join("");
}

function updateClock() {
  const now = new Date();
  document.getElementById("currentClock").textContent = now.toLocaleTimeString("es-BO", { hour12: false });
}

// -------------------- MÓDULO 1: DETENCIÓN DE EMERGENCIA --------------------
// ¿QUÉ HACE?
// Recibe la velocidad y el tiempo de reacción ingresados por el usuario.
// Valida los datos, calcula la distancia recorrida durante la reacción y muestra
// un nivel de referencia. Los umbrales son ficticios y solo sirven para la práctica.

document.getElementById("emergencyForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const speedText = document.getElementById("speed").value.trim();
  const timeText = document.getElementById("reactionTime").value.trim();
  const speed = parseFloat(speedText);
  const reactionTime = parseFloat(timeText);

  if (speedText === "" || timeText === "" || Number.isNaN(speed) || Number.isNaN(reactionTime)) {
    showToast("Completa ambos campos con valores numéricos.", "error");
    return;
  }

  if (speed <= 0 || speed > 100 || reactionTime <= 0 || reactionTime > 30) {
    showToast("Verifica los rangos permitidos: velocidad hasta 100 km/h y reacción hasta 30 s.", "error");
    return;
  }

  // Fórmula solicitada por el desafío: distancia = (velocidad / 3.6) * tiempo.
  const distance = (speed / 3.6) * reactionTime;

  let level = "low";
  let levelText = "REFERENCIA BAJA";
  let explanation = "La distancia calculada está por debajo del umbral didáctico de precaución.";

  if (distance > 50) {
    level = "high";
    levelText = "ALERTA ALTA";
    explanation = "El resultado supera los 50 metros del umbral ficticio. Revisa los datos del escenario.";
  } else if (distance >= 20) {
    level = "medium";
    levelText = "PRECAUCIÓN";
    explanation = "El resultado se encuentra entre 20 y 50 metros según los umbrales de esta práctica.";
  }

  document.getElementById("emergencyResult").innerHTML = `
    <div class="calculated-result">
      <span class="result-level ${level === "high" ? "level-high" : level === "medium" ? "level-medium" : "level-low"}">${levelText}</span>
      <div class="big-result">${distance.toFixed(2)} <span>metros</span></div>
      <p class="result-explanation">${explanation}</p>
      <div class="result-details">
        <div class="result-detail"><small>Velocidad ingresada</small><strong>${speed.toFixed(1)} km/h</strong></div>
        <div class="result-detail"><small>Tiempo de reacción</small><strong>${reactionTime.toFixed(1)} s</strong></div>
      </div>
    </div>`;

  const detail = `Cálculo de reacción: ${speed} km/h durante ${reactionTime} s = ${distance.toFixed(2)} m (${levelText}).`;

  recordLog("Detención", detail, level === "high" ? "Alerta" : "Análisis");

  if (level === "high") {
    createAlert("Detención de emergencia", `Distancia estimada de ${distance.toFixed(2)} m: supera el umbral didáctico de 50 m.`, "high");
    showToast("Se generó una alerta alta en la simulación.", "error");
  } else if (level === "medium") {
    createAlert("Detención de emergencia", `Distancia estimada de ${distance.toFixed(2)} m: requiere precaución en el escenario.`, "warning");
    showToast("Análisis completado: se generó una advertencia.", "info");
  } else {
    showToast("Cálculo realizado correctamente.", "success");
  }
});

// -------------------- MÓDULO 2: MANTENIMIENTO --------------------
// ¿QUÉ HACE?
// Registra componentes, código, horas de uso, estado y observaciones.
// Muestra los componentes en una tabla y permite agregarlos o eliminarlos.
// Los registros se guardan en el navegador, no en una base de datos central.

// Dibuja en la tabla los componentes que están guardados.
function renderMaintenance() {
  const body = document.getElementById("maintenanceTableBody");

  document.getElementById("maintenanceCountLabel").textContent = `${maintenanceRecords.length} registro(s) guardado(s) localmente.`;

  if (maintenanceRecords.length === 0) {
    body.innerHTML = '<tr><td colspan="5" class="table-empty">Todavía no hay componentes. Agrega el primero mediante el formulario.</td></tr>';
    return;
  }

  body.innerHTML = maintenanceRecords.map(function (item) {
    let statusName = "Normal";
    let statusClass = "pill-normal";

    if (item.status === "revision") {
      statusName = "Revisión";
      statusClass = "pill-review";
    }

    if (item.status === "urgente") {
      statusName = "Urgente";
      statusClass = "pill-urgent";
    }

    return `<tr>
      <td><strong>${escapeHTML(item.name)}</strong>${item.notes ? `<span class="alert-description">${escapeHTML(item.notes)}</span>` : ""}</td>
      <td>${escapeHTML(item.code || "—")}</td>
      <td>${Number(item.hours).toLocaleString("es-BO")} h</td>
      <td><span class="status-pill ${statusClass}">${statusName}</span></td>
      <td><button class="action-delete" type="button" data-delete-maintenance="${item.id}">Eliminar</button></td>
    </tr>`;
  }).join("");
}

document.getElementById("maintenanceForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const name = document.getElementById("componentName").value.trim();
  const code = document.getElementById("componentCode").value.trim();
  const hoursText = document.getElementById("usageHours").value.trim();
  const hours = parseFloat(hoursText);
  const status = document.getElementById("componentStatus").value;
  const notes = document.getElementById("componentNotes").value.trim();

  if (!name || hoursText === "" || Number.isNaN(hours)) {
    showToast("El nombre y las horas de uso son obligatorios.", "error");
    return;
  }

  if (hours < 0 || hours > 200000) {
    showToast("Las horas deben estar entre 0 y 200.000.", "error");
    return;
  }

  if (code && !/^[A-Za-z0-9-]{2,20}$/.test(code)) {
    showToast("El código interno solo admite letras, números y guiones.", "error");
    return;
  }

  const record = {
    id: createId(), name: name, code: code, hours: hours,
    status: status, notes: notes, date: new Date().toISOString()
  };

  maintenanceRecords.push(record); // push agrega un objeto al arreglo.
  saveData(STORAGE_KEYS.maintenance, maintenanceRecords);
  renderMaintenance();
  updateDashboard();

  recordLog("Mantenimiento", `Se registró ${name} (${status}) con ${hours} horas de uso.`, "Registro");

  if (status === "urgente") {
    createAlert("Mantenimiento", `El componente ${name} fue registrado con estado URGENTE.`, "high");
  } else if (status === "revision") {
    createAlert("Mantenimiento", `El componente ${name} requiere revisión en el escenario.`, "warning");
  }

  this.reset();
  showToast("Componente registrado correctamente.", "success");
});

// -------------------- MÓDULO 3: VIENTO Y OSCILACIÓN --------------------
// ¿QUÉ HACE?
// Recibe cinco mediciones de viento, calcula el promedio y el valor máximo,
// clasifica el promedio con rangos didácticos y muestra un gráfico y el historial.

// Decide cómo describir el viento según el promedio calculado.
function classifyWind(average) {
  if (average >= 60) return { name: "MUY ELEVADO", className: "level-high", alert: "high" };
  if (average >= 40) return { name: "ELEVADO", className: "level-medium", alert: "warning" };
  if (average >= 20) return { name: "MODERADO", className: "level-medium", alert: "none" };

  return { name: "BAJO", className: "level-low", alert: "none" };
}

// Dibuja las barras que representan las mediciones de viento.
function renderWindBars(values) {
  const container = document.getElementById("windBars");

  container.innerHTML = values.map(function (value, index) {
    const height = Math.max(3, (value / 150) * 75);

    return `<div class="wind-bar-item"><span class="wind-bar-value">${value}</span><div class="wind-bar" style="height:${height}px"></div><span class="wind-bar-label">M${index + 1}</span></div>`;
  }).join("");
}

// Muestra los análisis de viento que se registraron anteriormente.
function renderWindHistory() {
  const body = document.getElementById("windHistoryBody");

  if (windHistory.length === 0) {
    body.innerHTML = '<tr><td colspan="5" class="table-empty">No hay análisis registrados.</td></tr>';
    return;
  }

  body.innerHTML = windHistory.map(function (item) {
    return `<tr><td>${getDateTime(item.date)}</td><td>${item.values.map(value => Number(value).toFixed(1)).join(" · ")}</td><td><strong>${Number(item.average).toFixed(2)} km/h</strong></td><td>${Number(item.maximum).toFixed(2)} km/h</td><td><span class="status-pill ${item.className === "level-high" ? "pill-urgent" : item.className === "level-medium" ? "pill-review" : "pill-normal"}">${escapeHTML(item.classification)}</span></td></tr>`;
  }).join("");
}

document.getElementById("windForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const values = [];

  // El ciclo for permite leer las cinco mediciones ingresadas.
  for (let i = 1; i <= 5; i++) {
    const textValue = document.getElementById("wind" + i).value.trim();
    const value = parseFloat(textValue);

    if (textValue === "" || Number.isNaN(value)) {
      showToast(`Completa la medición ${i} con un número.`, "error");
      return;
    }

    if (value < 0 || value > 150) {
      showToast(`La medición ${i} debe estar entre 0 y 150 km/h.`, "error");
      return;
    }

    values.push(value);
  }

  // Se suman las mediciones y se busca el valor máximo.
  let sum = 0;
  let maximum = values[0];

  for (let i = 0; i < values.length; i++) {
    sum += values[i];

    if (values[i] > maximum) maximum = values[i];
  }

  const average = sum / values.length;
  const classification = classifyWind(average);

  document.getElementById("windResult").innerHTML = `
    <div class="wind-metrics">
      <div class="wind-metric"><small>Promedio de las 5 lecturas</small><strong>${average.toFixed(2)} <span>km/h</span></strong></div>
      <div class="wind-metric"><small>Máximo registrado</small><strong>${maximum.toFixed(2)} <span>km/h</span></strong></div>
    </div>
    <span class="wind-classification ${classification.className}">${classification.name}</span>
    <p class="result-explanation">Clasificación descriptiva calculada usando el promedio de las cinco mediciones.</p>`;

  renderWindBars(values);

  const historyItem = {
    id: createId(), date: new Date().toISOString(), values: values,
    average: average, maximum: maximum, classification: classification.name,
    className: classification.className
  };

  windHistory.unshift(historyItem);

  if (windHistory.length > 30) windHistory = windHistory.slice(0, 30);

  saveData(STORAGE_KEYS.windHistory, windHistory);
  renderWindHistory();

  recordLog("Viento y oscilación", `Se analizaron cinco mediciones. Promedio: ${average.toFixed(2)} km/h; máximo: ${maximum.toFixed(2)} km/h.`, "Análisis");

  if (classification.alert === "high") {
    createAlert("Viento y oscilación", `Promedio de viento ${average.toFixed(2)} km/h: clasificación muy elevada en la simulación.`, "high");
  } else if (classification.alert === "warning") {
    createAlert("Viento y oscilación", `Promedio de viento ${average.toFixed(2)} km/h: clasificación elevada en la simulación.`, "warning");
  }

  showToast("Las cinco mediciones fueron analizadas.", "success");
});

// -------------------- MÓDULO 4: SENSORES --------------------
// ¿QUÉ HACE?
// Registra sensores y sus lecturas. Comprueba que el código tenga
// el formato SEN- seguido de tres números y valida que los datos estén completos.
// Después muestra los registros válidos y permite eliminarlos.

// Muestra en la tabla los sensores registrados y sus lecturas.
function renderSensors() {
  const body = document.getElementById("sensorsTableBody");

  document.getElementById("sensorCountLabel").textContent = `${sensorRecords.length} sensor(es) registrado(s).`;

  if (sensorRecords.length === 0) {
    body.innerHTML = '<tr><td colspan="6" class="table-empty">No hay sensores registrados.</td></tr>';
    return;
  }

  body.innerHTML = sensorRecords.map(function (sensor) {
    return `<tr>
      <td class="code-cell">${escapeHTML(sensor.code)}</td>
      <td>${escapeHTML(sensor.type)}</td>
      <td><strong>${Number(sensor.reading).toLocaleString("es-BO")}</strong> ${escapeHTML(sensor.unit)}</td>
      <td>${getDateTime(sensor.date)}</td>
      <td><span class="status-pill pill-normal">✓ Válido</span></td>
      <td><button class="action-delete" type="button" data-delete-sensor="${sensor.id}">Eliminar</button></td>
    </tr>`;
  }).join("");
}

document.getElementById("sensorForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const code = document.getElementById("sensorCode").value.trim();
  const type = document.getElementById("sensorType").value;
  const readingText = document.getElementById("sensorReading").value.trim();
  const reading = Number(readingText);

  // Expresión regular real solicitada: SEN- seguido de exactamente tres dígitos.
  const sensorPattern = /^SEN-\d{3}$/;

  if (code === "") {
    showToast("El código del sensor no puede estar vacío.", "error");
    document.getElementById("sensorCode").focus();
    return;
  }

  if (!sensorPattern.test(code)) {
    showToast("Código inválido. Utiliza el formato SEN-001.", "error");
    document.getElementById("sensorCode").focus();
    return;
  }

  if (readingText === "" || !Number.isFinite(reading)) {
    showToast("La lectura debe ser un valor numérico.", "error");
    document.getElementById("sensorReading").focus();
    return;
  }

  if (sensorRecords.some(sensor => sensor.code === code)) {
    showToast("Ese código ya está registrado. Utiliza otro código.", "error");
    return;
  }

  const units = {
    "Temperatura": "°C", "Vibración": "mm/s", "Velocidad": "km/h",
    "Tensión": "kN", "Otro": "unid."
  };

  sensorRecords.push({
    id: createId(), code: code, type: type, reading: reading,
    unit: units[type] || "unid.", date: new Date().toISOString()
  });

  saveData(STORAGE_KEYS.sensors, sensorRecords);
  renderSensors();
  updateDashboard();

  recordLog("Sensores", `Se registró el sensor ${code}, tipo ${type}, lectura ${reading} ${units[type]}.`, "Registro");

  this.reset();
  showToast("Sensor validado y registrado correctamente.", "success");
});

// -------------------- CENTRO DE ALERTAS --------------------
// Reúne los avisos creados por los módulos. Permite filtrar alertas pendientes
// o atendidas y marcar una alerta como atendida.

// Construye la tabla de alertas y actualiza sus contadores y filtros.
function renderAlerts() {
  const body = document.getElementById("alertsTableBody");
  const filter = document.getElementById("alertFilter").value;

  const filteredAlerts = alerts.filter(function (item) {
    if (filter === "pending") return item.status === "pending";
    if (filter === "resolved") return item.status === "resolved";
    return true;
  });

  const highCount = alerts.filter(item => item.status === "pending" && item.level === "high").length;
  const warningCount = alerts.filter(item => item.status === "pending" && item.level === "warning").length;
  const resolvedCount = alerts.filter(item => item.status === "resolved").length;

  document.getElementById("criticalAlertCount").textContent = highCount;
  document.getElementById("warningAlertCount").textContent = warningCount;
  document.getElementById("resolvedAlertCount").textContent = resolvedCount;

  if (filteredAlerts.length === 0) {
    body.innerHTML = '<tr><td colspan="6" class="table-empty">No hay alertas para mostrar con este filtro.</td></tr>';
    updateDashboard();
    return;
  }

  body.innerHTML = filteredAlerts.map(function (alert) {
    const levelName = alert.level === "high" ? "Alta" : "Advertencia";
    const levelClass = alert.level === "high" ? "pill-urgent" : "pill-review";
    const statusName = alert.status === "pending" ? "Pendiente" : "Atendida";
    const statusClass = alert.status === "pending" ? "state-pending" : "state-resolved";

    const action = alert.status === "pending"
      ? `<button class="action-resolve" type="button" data-resolve-alert="${alert.id}">Marcar atendida</button>`
      : `<span class="log-type">Revisada</span>`;

    return `<tr>
      <td>${getDateTime(alert.date)}</td>
      <td><strong>${escapeHTML(alert.origin)}</strong></td>
      <td><span class="alert-row-title">${escapeHTML(alert.description)}</span></td>
      <td><span class="status-pill ${levelClass}">${levelName}</span></td>
      <td><span class="status-pill ${statusClass}">${statusName}</span></td>
      <td>${action}</td>
    </tr>`;
  }).join("");

  updateDashboard();
}

// -------------------- BITÁCORA --------------------
// Muestra las acciones realizadas en el sistema y permite exportarlas a un archivo CSV.

// Coloca en la tabla el historial de acciones realizadas.
function renderLog() {
  const body = document.getElementById("logTableBody");

  document.getElementById("logCountBadge").textContent = `${activityLog.length} EVENTOS`;

  if (activityLog.length === 0) {
    body.innerHTML = '<tr><td colspan="5" class="table-empty">No hay actividades registradas.</td></tr>';
    return;
  }

  body.innerHTML = activityLog.map(function (item) {
    return `<tr><td>${getDateTime(item.date)}</td><td>${escapeHTML(item.operator)}</td><td>${escapeHTML(item.module)}</td><td>${escapeHTML(item.detail)}</td><td><span class="log-type">${escapeHTML(item.type)}</span></td></tr>`;
  }).join("");
}

// Descarga la bitácora como archivo CSV para abrirla en una hoja de cálculo.
function exportLogCSV() {
  if (activityLog.length === 0) {
    showToast("No hay registros para exportar.", "info");
    return;
  }

  const rows = [["Fecha y hora", "Operador", "Módulo", "Detalle", "Tipo"]];

  activityLog.forEach(function (item) {
    rows.push([getDateTime(item.date), item.operator, item.module, item.detail, item.type]);
  });

  const csv = rows.map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(",")).join("\n");
  const file = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = url;
  link.download = "simtele-bitacora.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);

  showToast("Bitácora exportada en formato CSV.", "success");
}

// -------------------- EVENTOS DE LA INTERFAZ --------------------
// Conecta botones, formularios y tablas con sus acciones: iniciar sesión, navegar,
// eliminar registros, atender alertas, exportar y confirmar operaciones.

document.getElementById("loginForm").addEventListener("submit", function (event) {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;
  const message = document.getElementById("loginMessage");

  if (!username || !password) {
    message.textContent = "Completa el usuario y la contraseña.";
    return;
  }

  // Credenciales fijas para la demostración. No usar este método en producción.
  if (username.toLowerCase() === "operador" && password === "teleferico123") {
    currentOperator = "Operador";

    sessionStorage.setItem("simtele_logged_in", "true");
    sessionStorage.setItem("simtele_operator", currentOperator);

    message.textContent = "";
    showApplication();

    recordLog("Acceso", "Inicio de sesión en el entorno de práctica.", "Acceso");
  } else {
    message.textContent = "Usuario o contraseña incorrectos. Revisa las credenciales de demostración.";
  }
});

document.getElementById("togglePassword").addEventListener("click", function () {
  const passwordField = document.getElementById("password");
  const isPassword = passwordField.type === "password";

  passwordField.type = isPassword ? "text" : "password";
  this.textContent = isPassword ? "Ocultar" : "Ver";
  this.setAttribute("aria-label", isPassword ? "Ocultar contraseña" : "Mostrar contraseña");
});

document.querySelectorAll(".nav-link").forEach(function (button) {
  button.addEventListener("click", function () {
    showView(this.dataset.view);
  });
});

document.querySelectorAll("[data-go]").forEach(function (button) {
  button.addEventListener("click", function () {
    showView(this.dataset.go);
  });
});

document.getElementById("topAlertButton").addEventListener("click", function () {
  showView("alerts");
});

document.getElementById("menuToggle").addEventListener("click", openSidebar);
document.getElementById("closeSidebar").addEventListener("click", closeSidebar);
document.getElementById("sidebarBackdrop").addEventListener("click", closeSidebar);
document.getElementById("topLogout").addEventListener("click", logout);
document.getElementById("sidebarLogout").addEventListener("click", logout);

document.getElementById("refreshDashboard").addEventListener("click", function () {
  renderAll();
  showToast("Panel actualizado con los datos locales.", "success");
});

// Evento para eliminar componentes del módulo de mantenimiento.
document.getElementById("maintenanceTableBody").addEventListener("click", function (event) {
  const button = event.target.closest("[data-delete-maintenance]");
  if (!button) return;

  const id = button.dataset.deleteMaintenance;

  requestConfirmation("Se eliminará este componente del inventario local.", function () {
    const item = maintenanceRecords.find(record => record.id === id);

    maintenanceRecords = maintenanceRecords.filter(record => record.id !== id);

    saveData(STORAGE_KEYS.maintenance, maintenanceRecords);
    renderMaintenance();
    updateDashboard();

    recordLog("Mantenimiento", `Se eliminó el componente ${item ? item.name : "registrado"}.`, "Eliminación");

    showToast("Registro eliminado.", "success");
  }, "Eliminar componente");
});

// Evento para eliminar sensores registrados.
document.getElementById("sensorsTableBody").addEventListener("click", function (event) {
  const button = event.target.closest("[data-delete-sensor]");
  if (!button) return;

  const id = button.dataset.deleteSensor;

  requestConfirmation("Se eliminará este sensor de la lista de registros válidos.", function () {
    const item = sensorRecords.find(record => record.id === id);

    sensorRecords = sensorRecords.filter(record => record.id !== id);

    saveData(STORAGE_KEYS.sensors, sensorRecords);
    renderSensors();
    updateDashboard();

    recordLog("Sensores", `Se eliminó el sensor ${item ? item.code : "registrado"}.`, "Eliminación");

    showToast("Sensor eliminado.", "success");
  }, "Eliminar sensor");
});

// Evento para marcar una alerta como atendida.
document.getElementById("alertsTableBody").addEventListener("click", function (event) {
  const button = event.target.closest("[data-resolve-alert]");
  if (!button) return;

  const id = button.dataset.resolveAlert;
  const alert = alerts.find(item => item.id === id);

  if (!alert || alert.status === "resolved") return;

  alert.status = "resolved";
  alert.resolvedDate = new Date().toISOString();

  saveData(STORAGE_KEYS.alerts, alerts);
  renderAlerts();

  recordLog("Centro de alertas", `Se marcó como atendida la alerta: ${alert.description}`, "Atención");

  showToast("La alerta fue marcada como atendida.", "success");
});

document.getElementById("alertFilter").addEventListener("change", renderAlerts);
document.getElementById("exportLog").addEventListener("click", exportLogCSV);

document.getElementById("clearLog").addEventListener("click", function () {
  requestConfirmation("Se eliminarán todos los eventos de la bitácora local. Esta acción no se puede deshacer.", function () {
    activityLog = [];

    saveData(STORAGE_KEYS.log, activityLog);
    renderLog();
    updateDashboard();

    showToast("La bitácora fue limpiada.", "success");
  }, "Limpiar bitácora");
});

document.getElementById("cancelConfirm").addEventListener("click", closeConfirmation);

document.getElementById("acceptConfirm").addEventListener("click", function () {
  if (typeof confirmCallback === "function") confirmCallback();
  closeConfirmation();
});

document.getElementById("confirmModal").addEventListener("click", function (event) {
  if (event.target === this) closeConfirmation();
});

document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeConfirmation();
    closeSidebar();
  }
});

// -------------------- RENDERIZADO INICIAL --------------------
// Carga las tablas y los indicadores al iniciar o recuperar la sesión.
// También actualiza el reloj cada segundo mientras la aplicación está abierta.

function renderAll() {
  renderMaintenance();
  renderSensors();
  renderAlerts();
  renderLog();
  renderWindHistory();
  updateDashboard();
}

// Mantiene la hora visible mientras la sesión esté abierta.
setInterval(function () {
  if (!document.getElementById("appShell").classList.contains("hidden")) {
    updateClock();
  }
}, 1000);

// Recupera la sesión solo durante la vida de esta pestaña del navegador.
if (sessionStorage.getItem("simtele_logged_in") === "true" && currentOperator) {
  showApplication();
} else {
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("appShell").classList.add("hidden");
}