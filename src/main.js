import "./styles/main.scss";
import { catalog, sessionModels, sessionPackages, heyBiPlans } from "./data/catalog.js";
import { createStore, defaultState } from "./state/store.js";
import { calculateTotals } from "./lib/calculator.js";
import { formatMoney, formatMoneyPrecise } from "./lib/format.js";

const store = createStore(defaultState);
const refs = {};

const qs = (sel) => document.querySelector(sel);

document.addEventListener("DOMContentLoaded", () => {
  cacheRefs();
  hydrateForm();
  bindEvents();
  store.subscribe(render);
});

function cacheRefs() {
  refs.implementation = qs("#implementation");
  refs.implInfoName = qs("#implementation-info-name");
  refs.implInfoCost = qs("#implementation-info-cost");
  refs.implInfoHours = qs("#implementation-info-hours");
  refs.implInfoRate = qs("#implementation-info-rate");

  refs.integrations = qs("#integrations");
  refs.integrationInfoLabel = qs("#integrations-info-label");
  refs.integrationInfoCost = qs("#integration-info-cost");
  refs.integrationInfoHours = qs("#integration-info-hours");
  refs.integrationInfoRate = qs("#integration-info-rate");
  refs.integrationRateToggle = qs("#integration-rate-toggle");
  refs.integrationRateLabel = qs("#integration-rate-label");

  refs.implExtras = qs("#implementation-extras");
  refs.implExtrasSummary = qs("#implementation-extras-summary");

  refs.addons = qs("#addons");
  refs.sessionModel = qs("#session-model");
  refs.sessionPackage = qs("#session-package");
  refs.sessionModelInfo = qs("#session-model-info");
  refs.sessionPackageInfo = qs("#session-package-info");
  refs.heyBiSelect = qs("#heybi-plan");
  refs.partner = qs("#partner");

  refs.manualToggle = qs("#manual-toggle");
  refs.manualHours = qs("#manual-hours");
  refs.hourlyRateInfo = qs("#hourly-rate-info");
  refs.hourTypeRadios = document.querySelectorAll('input[name="hourType"]');
  refs.customRate = qs("#custom-rate");
  refs.customRateError = qs("#custom-rate-error");
  refs.autoHourly = qs("#auto-hourly");
  refs.setupOverride = qs("#setup-override");
  refs.monthlyOverride = qs("#monthly-override");

  refs.customIntegrationList = qs("#custom-integrations-list");
  refs.addCustomIntegrationBtn = qs("#add-custom-integration");

  renderCustomIntegrations();

  refs.resetBtn = qs("#reset-btn");
  refs.exportBtn = qs("#export-json-btn");
  refs.printBtn = qs("#print-btn");

  refs.setupTotal = qs("#setup-total");
  refs.setupNote = qs("#setup-note");
  refs.setupMargin = qs("#setup-margin");
  refs.monthlyTotal = qs("#monthly-total");
  refs.monthlyMargin = qs("#monthly-margin");
  refs.hoursTotal = qs("#hours-total");
  refs.hoursBreakdown = qs("#hours-breakdown");
  refs.hoursNonIa = qs("#hours-non-ia");
  refs.hoursIa = qs("#hours-ia");
  refs.hourRateSinIa = qs("#hour-rate-sin-ia");
  refs.hourRateIa = qs("#hour-rate-ia");
  refs.breakdown = qs("#breakdown");
}

function hydrateForm() {
  const state = store.getState();

  renderSelect(
    refs.implementation,
    [{ id: "", name: "Selecciona implementacion" }, ...catalog.implementations],
    (item) => item.name
  );
  renderSelect(refs.integrations, catalog.integrations, (item) => item.label);
  renderSelect(refs.partner, catalog.partners, (item) => item.name);
  renderSelect(refs.sessionModel, [{ id: "", label: "Selecciona modelo" }, ...sessionModels], (item) => item.label);
  renderSelect(
    refs.heyBiSelect,
    [{ id: "", label: "Sin Hey BI" }, ...heyBiPlans],
    (item) => (item.id ? `${item.label} - ${formatMoney(item.cost)}` : item.label)
  );

  if (refs.implExtras) {
    renderSelectableOptions(refs.implExtras, catalog.implementationExtras, state.implementationExtras);
  }
  if (refs.addons) {
    renderSelectableOptions(refs.addons, catalog.addons, state.addons);
  }

  refs.implementation.value = state.implementation;
  refs.integrations.value = state.integrations;
  refs.integrationRateToggle.checked = state.integrationRate === "ia";
  refs.partner.value = state.partner;
  refs.sessionModel.value = state.sessionModel;
  refs.sessionPackage.value = state.sessionPackage;
  refs.heyBiSelect.value = state.heyBiPlan;

  refs.manualToggle.checked = state.manualEnabled;
  refs.manualHours.value = state.manualHours ?? "";
  refs.customRate.value = state.customRate ?? "";
  refs.autoHourly.checked = state.autoSetup;
  refs.setupOverride.value = state.setupOverride ?? "";
  refs.monthlyOverride.value = state.monthlyOverride ?? "";

  renderSessionPackages(state.sessionModel, state.sessionPackage);
  renderImplementationInfo(state.implementation);
  renderIntegrationInfo(state.integrations);
  renderExtrasSummary();
  renderCustomIntegrations();
  renderCustomIntegrations();
  renderSessionModelInfo(state.sessionModel);
  renderSessionPackageInfo(state.sessionPackage);
}

function renderSelect(select, options, formatter) {
  select.innerHTML = "";
  options.forEach((optionDef) => {
    const option = document.createElement("option");
    option.value = optionDef.id;
    option.textContent = formatter(optionDef);
    select.appendChild(option);
  });
}

function renderSelectableOptions(container, items, selectedSet) {
  container.innerHTML = "";
  items.forEach((item) => {
    const label = document.createElement("label");
    label.className = "chip-option";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = item.id;
    input.checked = selectedSet.has(item.id);

    label.appendChild(input);
    const body = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = item.name;
    const detail = document.createElement("small");
    const hourly = item.hours ? `${formatMoneyPrecise(item.cost / item.hours)}/h` : "-";
    detail.textContent = `${formatMoney(item.cost)} • ${item.hours} h • ${hourly}`;
    body.appendChild(title);
    body.appendChild(detail);
    label.appendChild(body);
    container.appendChild(label);
  });
}

function bindEvents() {
  refs.implementation.addEventListener("change", (e) => store.setState({ implementation: e.target.value }));
  refs.integrations.addEventListener("change", (e) => store.setState({ integrations: e.target.value }));
  refs.integrationRateToggle.addEventListener("change", (e) =>
    store.setState({ integrationRate: e.target.checked ? "ia" : "sinIa" })
  );
  refs.partner.addEventListener("change", (e) => store.setState({ partner: e.target.value }));

  bindMultiSelect(refs.implExtras, "implementationExtras");
  bindMultiSelect(refs.addons, "addons");

  refs.sessionModel.addEventListener("change", (e) => {
    const sessionModel = e.target.value;
    renderSessionPackages(sessionModel, "");
    renderSessionModelInfo(sessionModel);
    store.setState({ sessionModel, sessionPackage: "" });
  });

  refs.sessionPackage.addEventListener("change", (e) => {
    renderSessionPackageInfo(e.target.value);
    store.setState({ sessionPackage: e.target.value });
  });

  refs.heyBiSelect.addEventListener("change", (e) => store.setState({ heyBiPlan: e.target.value }));

  refs.manualToggle.addEventListener("change", (e) => store.setState({ manualEnabled: e.target.checked }));
  refs.manualHours.addEventListener("input", (e) =>
    store.setState({ manualHours: e.target.value ? Number(e.target.value) : null })
  );
  refs.hourTypeRadios.forEach((radio) =>
    radio.addEventListener("change", (e) => {
      const value = e.target.value;
      store.setState({
        hourType: value,
        customRate: value === "custom" ? store.getState().customRate : null,
      });
    })
  );
  refs.customRate.addEventListener("input", (e) =>
    store.setState({ customRate: e.target.value ? Number(e.target.value) : null })
  );
  refs.autoHourly.addEventListener("change", (e) => store.setState({ autoSetup: e.target.checked }));
  refs.setupOverride.addEventListener("input", (e) =>
    store.setState({ setupOverride: e.target.value ? Number(e.target.value) : null })
  );
  refs.monthlyOverride.addEventListener("input", (e) =>
    store.setState({ monthlyOverride: e.target.value ? Number(e.target.value) : null })
  );

  document.addEventListener("click", (event) => {
    if (event.target.closest("#add-custom-integration")) {
      event.preventDefault();
      addCustomIntegration();
    }
  });
  if (refs.customIntegrationList) {
    refs.customIntegrationList.addEventListener("input", handleCustomIntegrationInput);
    refs.customIntegrationList.addEventListener("change", handleCustomIntegrationInput);
    refs.customIntegrationList.addEventListener("click", handleCustomIntegrationClick);
  }

  refs.resetBtn.addEventListener("click", () => {
    store.setState({
      ...defaultState,
      addons: new Set(),
      implementationExtras: new Set(),
      customIntegrations: [],
    });
    hydrateForm();
  });
  refs.exportBtn.addEventListener("click", () => {
    const snapshot = {
      ...store.getState(),
      addons: Array.from(store.getState().addons),
      implementationExtras: Array.from(store.getState().implementationExtras),
      totals: calculateTotals(store.getState()),
      generatedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "cotizacion-heynow.json";
    link.click();
    URL.revokeObjectURL(url);
  });
  refs.printBtn.addEventListener("click", () => window.print());
}

function bindMultiSelect(container, key) {
  if (!container) return;
  container.addEventListener("change", (e) => {
    if (!e.target.matches('input[type="checkbox"]')) return;
    const next = new Set(store.getState()[key]);
    if (e.target.checked) next.add(e.target.value);
    else next.delete(e.target.value);
    store.setState({ [key]: next });
  });
}

function renderSessionPackages(modelId, selectedId) {
  refs.sessionPackage.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = modelId ? "Selecciona paquete" : "Selecciona modelo primero";
  refs.sessionPackage.appendChild(placeholder);

  if (!modelId) {
    refs.sessionPackage.value = "";
    return;
  }

  sessionPackages
    .filter((pkg) => pkg.modelId === modelId)
    .forEach((pkg) => {
      const option = document.createElement("option");
      option.value = pkg.id;
      option.textContent = `${pkg.label} - ${formatMoney(pkg.cost)}`;
      refs.sessionPackage.appendChild(option);
    });

  refs.sessionPackage.value = selectedId || "";
}

function renderImplementationInfo(implementationId) {
  const impl = catalog.implementations.find((item) => item.id === implementationId);
  if (!impl) {
    refs.implInfoName.textContent = "Selecciona una opcion para ver detalles.";
    refs.implInfoCost.textContent = "$0";
    refs.implInfoHours.textContent = "0 h";
    refs.implInfoRate.textContent = "-";
    return;
  }
  refs.implInfoName.textContent = impl.name;
  refs.implInfoCost.textContent = formatMoney(impl.cost);
  refs.implInfoHours.textContent = `${impl.hours} h`;
  refs.implInfoRate.textContent = impl.hours ? `${formatMoneyPrecise(impl.cost / impl.hours)}/h` : "-";
}

function renderIntegrationInfo(integrationId) {
  const state = store.getState();
  const def = catalog.integrations.find((item) => item.id === integrationId);
  const rate = catalog.rates[state.integrationRate ?? "sinIa"] ?? catalog.rates.sinIa;
  if (!def) {
    refs.integrationInfoLabel.textContent = "Selecciona una opcion.";
    refs.integrationInfoCost.textContent = "$0";
    refs.integrationInfoHours.textContent = "0 h";
    refs.integrationInfoRate.textContent = "-";
    refs.integrationRateLabel.textContent = "Valor hora";
    return;
  }
  const hours = def.baseHours ?? 0;
  const cost = def.fixedCost ?? hours * rate;
  refs.integrationInfoLabel.textContent = def.label;
  refs.integrationInfoCost.textContent = formatMoney(cost);
  refs.integrationInfoHours.textContent = `${hours} h`;
  refs.integrationInfoRate.textContent = `${formatMoney(rate)}/h`;
  refs.integrationRateLabel.textContent = state.integrationRate === "ia" ? "Costo IA" : "Costo sin IA";
}

function renderExtrasSummary() {
  if (!refs.implExtrasSummary) return;
  const state = store.getState();
  const extras = catalog.implementationExtras.filter((item) => state.implementationExtras.has(item.id));
  refs.implExtrasSummary.innerHTML = "";
  if (!extras.length) {
    refs.implExtrasSummary.innerHTML = "<p>No hay automatismos seleccionados.</p>";
    return;
  }
  extras.forEach((item) => {
    const hourly = item.hours ? `${formatMoneyPrecise(item.cost / item.hours)}/h` : "-";
    const p = document.createElement("p");
    p.innerHTML = `<strong>${item.name}</strong><br/>${formatMoney(item.cost)} • ${item.hours} h • ${hourly}`;
    refs.implExtrasSummary.appendChild(p);
  });
}

function renderCustomIntegrations() {
  if (!refs.customIntegrationList) return;
  const list = store.getState().customIntegrations;
  refs.customIntegrationList.innerHTML = "";
  if (!list.length) {
    const empty = document.createElement("p");
    empty.className = "state-info";
    empty.textContent = "No agregaste integraciones manuales.";
    refs.customIntegrationList.appendChild(empty);
    return;
  }

  list.forEach((integration) => {
    const card = document.createElement("div");
    card.className = "custom-card manual-grid";
    card.dataset.id = integration.id;
    card.innerHTML = `
      <div>
        <label>Nombre</label>
        <input type="text" data-field="name" value="${integration.name ?? ""}" />
      </div>
      <div>
        <label>Horas</label>
        <input type="number" data-field="hours" min="0" step="1" value="${integration.hours ?? ""}" />
      </div>
      <div>
        <label>Clasificacion</label>
        <select data-field="labor">
          <option value="sinIa" ${integration.labor === "sinIa" ? "selected" : ""}>Sin IA</option>
          <option value="ia" ${integration.labor === "ia" ? "selected" : ""}>IA</option>
        </select>
      </div>
      <div>
        <label>Valor hora</label>
        <input type="number" data-field="rate" min="0" step="5" value="${integration.rate ?? ""}" />
        <small class="state-info">Deja vacio para usar la tarifa segun clasificacion.</small>
      </div>
      <div>
        <label>Precio manual (opcional)</label>
        <input type="number" data-field="override" min="0" step="50" value="${integration.override ?? ""}" />
      </div>
      <div class="custom-actions">
        <button type="button" class="btn ghost small" data-action="remove">Eliminar</button>
      </div>
    `;
    refs.customIntegrationList.appendChild(card);
  });
}

function addCustomIntegration() {
  const newIntegration = {
    id: generateId(),
    name: "",
    hours: null,
    labor: "sinIa",
    rate: null,
    override: null,
  };
  store.setState({ customIntegrations: [...store.getState().customIntegrations, newIntegration] });
}

function handleCustomIntegrationInput(event) {
  const card = event.target.closest("[data-id]");
  if (!card) return;
  const id = card.dataset.id;
  const field = event.target.dataset.field;
  if (!field) return;
  let value = event.target.value;
  if (["hours", "rate", "override"].includes(field)) {
    value = value !== "" ? Number(value) : null;
  }
  updateCustomIntegration(id, { [field]: value });
}

function handleCustomIntegrationClick(event) {
  const action = event.target.dataset.action;
  if (!action) return;
  const card = event.target.closest("[data-id]");
  if (!card) return;
  if (action === "remove") {
    removeCustomIntegration(card.dataset.id);
  }
}

function updateCustomIntegration(id, patch) {
  const next = store
    .getState()
    .customIntegrations.map((integration) => (integration.id === id ? { ...integration, ...patch } : integration));
  store.setState({ customIntegrations: next });
}

function removeCustomIntegration(id) {
  const next = store.getState().customIntegrations.filter((integration) => integration.id !== id);
  store.setState({ customIntegrations: next });
}

function generateId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

function renderSessionModelInfo(modelId) {
  const model = sessionModels.find((m) => m.id === modelId);
  refs.sessionModelInfo.textContent = model?.description ?? "";
}

function renderSessionPackageInfo(packageId) {
  const pkg = sessionPackages.find((p) => p.id === packageId);
  refs.sessionPackageInfo.textContent = pkg ? `Costo extra por sesion: ${formatMoneyPrecise(pkg.extraCost)}` : "";
}

function render() {
  const state = store.getState();
  const totals = calculateTotals(state);
  const manualActive = state.manualEnabled;

  renderImplementationInfo(state.implementation);
  renderIntegrationInfo(state.integrations);
  renderExtrasSummary();

  const currentRate =
    manualActive && state.hourType === "custom" && state.customRate
      ? state.customRate
      : catalog.rates[state.hourType] || catalog.rates.sinIa;
  refs.hourlyRateInfo.textContent = formatMoney(currentRate);

  refs.setupTotal.textContent = formatMoney(totals.finalSetupList);
  refs.setupMargin.textContent = formatMoney(totals.setupMargin);
  refs.monthlyTotal.textContent = formatMoney(totals.finalMonthlyList);
  refs.monthlyMargin.textContent = formatMoney(totals.monthlyMargin);
  refs.hoursTotal.textContent = `${totals.manualHours.toFixed(0)} h`;
  refs.hoursBreakdown.textContent = `Sin IA ${totals.sinIaHours.toFixed(0)}h / IA ${totals.iaHours.toFixed(0)}h`;
  refs.hoursNonIa.textContent = totals.sinIaHours.toFixed(0);
  refs.hoursIa.textContent = totals.iaHours.toFixed(0);
  refs.hourRateSinIa.textContent = formatMoney(catalog.rates.sinIa);
  refs.hourRateIa.textContent = formatMoney(catalog.rates.ia);

  if (manualActive && state.setupOverride !== null && !state.autoSetup) {
    refs.setupNote.textContent = `Override manual - base ${formatMoney(totals.setupBase)}`;
  } else if (manualActive && state.autoSetup) {
    refs.setupNote.textContent = `Auto por horas - base ${formatMoney(totals.setupBase)}`;
  } else {
    refs.setupNote.textContent = "Desde catalogo";
  }

  refs.manualHours.disabled = !manualActive;
  refs.autoHourly.disabled = !manualActive;
  refs.monthlyOverride.disabled = !manualActive;
  refs.setupOverride.disabled = state.autoSetup || !manualActive;
  refs.hourTypeRadios.forEach((radio) => (radio.disabled = !manualActive));
  refs.customRate.disabled = !manualActive || state.hourType !== "custom";
  refs.customRate.style.display = manualActive && state.hourType === "custom" ? "block" : "none";

  const customRateInvalid =
    manualActive && state.hourType === "custom" && (!state.customRate || state.customRate <= 0);
  refs.customRate.classList.toggle("invalid", customRateInvalid);
  refs.customRateError.style.display = customRateInvalid ? "block" : "none";
  refs.customRateError.textContent = customRateInvalid ? "Ingrese un valor por hora valido." : "";
  refs.exportBtn.disabled = customRateInvalid;

  refs.breakdown.innerHTML = "";
  totals.breakdown.forEach((item) => {
    const li = document.createElement("li");
    li.className = "breakdown-card";

    const header = document.createElement("div");
    header.className = "breakdown-header";
    header.innerHTML = `<span>${item.label}</span><strong>${formatMoney(item.value)}</strong>`;
    li.appendChild(header);

    const details = [];
    if (item.hours) details.push(`${item.hours} h`);
    if (item.hourly) details.push(`${formatMoneyPrecise(item.hourly)}/h`);
    if (item.note) details.push(item.note);
    if (details.length) {
      const detailEl = document.createElement("div");
      detailEl.className = "breakdown-details";
      detailEl.textContent = details.join(" • ");
      li.appendChild(detailEl);
    }

    refs.breakdown.appendChild(li);
  });

}
