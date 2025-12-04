import { catalog, sessionModels, sessionPackages, heyBiPlans } from "../data/catalog.js";
import { formatMoney, formatMoneyPrecise } from "../lib/format.js";
import { calculateTotals } from "../lib/calculator.js";
import { renderCustomIntegrations, updateCustomIntegrationPreview } from "./custom-integrations.js";
import { aiService } from "../services/ai.js";

export const refs = {};

export const qs = (sel) => document.querySelector(sel);

export function cacheRefs() {
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

    refs.customIntegrationForm = qs("#custom-integration-form");
    refs.customIntegrationName = qs("#custom-integration-name");
    refs.customIntegrationHours = qs("#custom-integration-hours");
    refs.customIntegrationLabor = qs("#custom-integration-labor");
    refs.customIntegrationRate = qs("#custom-integration-rate");
    refs.customIntegrationOverride = qs("#custom-integration-override");
    refs.customIntegrationError = qs("#custom-integration-error");
    refs.customPreviewDetails = qs("#custom-preview-details");
    refs.customPreviewEmpty = qs("#custom-preview-empty");
    refs.customPreviewName = qs("#custom-preview-name");
    refs.customPreviewHours = qs("#custom-preview-hours");
    refs.customPreviewLabor = qs("#custom-preview-labor");
    refs.customPreviewRate = qs("#custom-preview-rate");
    refs.customPreviewTotal = qs("#custom-preview-total");
    refs.customIntegrationList = qs("#custom-integrations-list");
    refs.addCustomIntegrationBtn = qs("#add-custom-integration");

    refs.resetBtn = qs("#reset-btn");
    refs.exportBtn = qs("#export-json-btn");
    refs.printBtn = qs("#print-btn");

    refs.setupTotal = qs("#setup-total");
    refs.setupMargin = qs("#setup-margin");
    refs.monthlyTotal = qs("#monthly-total");
    refs.monthlyMargin = qs("#monthly-margin");
    refs.hoursTotal = qs("#hours-total");
    refs.breakdownSection = qs("#breakdown-section");
    refs.breakdownSetup = qs("#breakdown-setup");
    refs.breakdownMonthly = qs("#breakdown-monthly");
    refs.hourlyList = qs("#hourly-list");
    refs.proposalPreview = qs("#proposal-preview");
}

export function renderSelect(select, options, formatter) {
    select.innerHTML = "";
    options.forEach((optionDef) => {
        const option = document.createElement("option");
        option.value = optionDef.id;
        option.textContent = formatter(optionDef);
        select.appendChild(option);
    });
}

export function renderSelectableOptions(container, items, selectedSet) {
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

export function hydrateForm(store) {
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
    renderIntegrationInfo(state.integrations, state.integrationRate);
    renderExtrasSummary();
    renderCustomIntegrations(store);
    renderSessionModelInfo(state.sessionModel);
    renderSessionPackageInfo(state.sessionPackage);
    updateCustomIntegrationPreview();
}

export function renderSessionPackages(modelId, selectedId) {
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

export function renderImplementationInfo(implementationId) {
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

export function renderIntegrationInfo(integrationId, integrationRate) {
    const def = catalog.integrations.find((item) => item.id === integrationId);
    const rate = catalog.rates[integrationRate ?? "sinIa"] ?? catalog.rates.sinIa;
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
    refs.integrationRateLabel.textContent = integrationRate === "ia" ? "Costo IA" : "Costo sin IA";
}

export function renderExtrasSummary() { }

export function renderSessionModelInfo(modelId) {
    const model = sessionModels.find((m) => m.id === modelId);
    refs.sessionModelInfo.textContent = model?.description ?? "";
}

export function renderSessionPackageInfo(packageId) {
    const pkg = sessionPackages.find((p) => p.id === packageId);
    refs.sessionPackageInfo.textContent = pkg ? `Costo extra por sesion: ${formatMoneyPrecise(pkg.extraCost)}` : "";
}

export function renderHourlyList(entries) {
    if (!refs.hourlyList) return;
    refs.hourlyList.innerHTML = "";
    if (!entries.length) {
        const empty = document.createElement("li");
        empty.className = "state-info";
        empty.textContent = "Sin tarifas aplicadas";
        refs.hourlyList.appendChild(empty);
        return;
    }
    entries.forEach((entry) => {
        const li = document.createElement("li");
        const strong = document.createElement("strong");
        strong.textContent = `${formatMoneyPrecise(entry.rate)}/h`;
        const span = document.createElement("span");
        span.textContent = entry.label;
        li.appendChild(strong);
        li.appendChild(span);
        refs.hourlyList.appendChild(li);
    });
}

export function componentKey(type, id) {
    return `${type}:${id ?? "default"}`;
}

export function renderProposalSheet(state, totals, hourlyEntries, currentRate) {
    const partner = catalog.partners.find((item) => item.id === state.partner) ?? catalog.partners[0];
    const sheet = document.createElement("div");
    sheet.className = "proposal-sheet";

    const header = document.createElement("div");
    header.className = "proposal-sheet-header";
    const logo = document.createElement("img");
    logo.src = "/assets/images/heynow-negro-largo.avif";
    logo.alt = "HeyNow IA";
    header.appendChild(logo);
    const title = document.createElement("div");
    title.className = "proposal-sheet-title";
    const date = new Date().toLocaleDateString();
    title.innerHTML = `<strong>Cotizacion HeyNow</strong><br/><span>${date}</span>`;
    header.appendChild(title);
    sheet.appendChild(header);

    const summaryGrid = document.createElement("div");
    summaryGrid.className = "proposal-summary-grid";
    summaryGrid.appendChild(
        createSummaryCard("Pago único", formatMoney(totals.setupMargin), "+ Impuestos", { noteClass: "summary-inline-note subtle" })
    );
    summaryGrid.appendChild(
        createSummaryCard("Pago mensual", formatMoney(totals.monthlyMargin), "+ Impuestos", { noteClass: "summary-inline-note subtle" })
    );
    summaryGrid.appendChild(
        createSummaryCard(
            "Horas incluidas",
            `${totals.manualHours.toFixed(0)} h`,
            `Hora adicional: ${formatMoney(currentRate)}/h + Impuestos`,
            { noteClass: "summary-inline-note subtle" }
        )
    );
    sheet.appendChild(summaryGrid);

    const sessionPkg = sessionPackages.find((pkg) => pkg.id === state.sessionPackage);
    const sessionExtraLabel =
        sessionPkg && sessionPkg.extraCost !== null && sessionPkg.extraCost !== undefined
            ? `${formatMoneyPrecise(sessionPkg.extraCost)}/sesión`
            : "-";


    sheet.appendChild(buildCostTable("Costos de implementación - Pago único al inicio del proyecto", totals, partner, "setup"));
    sheet.appendChild(
        buildCostTable("Costos de uso - Pago mensual", totals, partner, "monthly", {
            label: "Sesión adicional",
            value: sessionExtraLabel,
        })
    );

    const footer = document.createElement("div");
    footer.className = "proposal-footer";
    sheet.appendChild(footer);

    // AI Proposal Section
    const aiSection = document.createElement("div");
    aiSection.className = "proposal-ai-section";
    aiSection.style.marginTop = "20px";
    aiSection.style.padding = "15px";
    aiSection.style.backgroundColor = "#f9fafb";
    aiSection.style.borderRadius = "8px";
    aiSection.style.border = "1px dashed #d1d5db";

    const aiBtn = document.createElement("button");
    aiBtn.className = "btn-secondary small";
    aiBtn.textContent = "✨ Generar Propuesta con IA";
    aiBtn.onclick = async () => {
        if (!aiService.hasKey()) {
            alert("Configura tu API Key primero.");
            return;
        }
        aiBtn.disabled = true;
        aiBtn.textContent = "Escribiendo...";
        try {
            const context = {
                implementation: catalog.implementations.find(i => i.id === state.implementation)?.name || "",
                integrations: catalog.integrations.find(i => i.id === state.integrations)?.label || "",
                extras: [...state.implementationExtras, ...state.addons].map(id =>
                    [...catalog.implementationExtras, ...catalog.addons].find(i => i.id === id)?.name
                ).filter(Boolean),
                sessionModel: sessionModels.find(m => m.id === state.sessionModel)?.label || ""
            };
            const text = await aiService.generateProposal(context);

            const textContainer = document.createElement("div");
            textContainer.className = "proposal-ai-text";
            textContainer.style.marginTop = "10px";
            textContainer.style.whiteSpace = "pre-line";
            textContainer.style.fontSize = "0.9rem";
            textContainer.style.color = "#374151";
            textContainer.innerHTML = text; // Using innerHTML to allow basic formatting if AI sends it

            aiSection.innerHTML = ""; // Clear button
            aiSection.appendChild(document.createElement("h4")).textContent = "Propuesta Comercial";
            aiSection.lastChild.style.marginBottom = "8px";
            aiSection.appendChild(textContainer);
        } catch (e) {
            alert("Error: " + e.message);
            aiBtn.disabled = false;
            aiBtn.textContent = "✨ Generar Propuesta con IA";
        }
    };
    aiSection.appendChild(aiBtn);
    sheet.appendChild(aiSection);

    return sheet;
}

function createSummaryCard(title, value, note, options = {}) {
    const card = document.createElement("div");
    card.className = "proposal-summary-card";
    const h4 = document.createElement("h4");
    h4.textContent = title;
    const valueEl = document.createElement("p");
    valueEl.textContent = value;
    card.appendChild(h4);
    card.appendChild(valueEl);
    if (note) {
        if (options.inlineNote) {
            card.classList.add("summary-card-inline-note");
            const span = document.createElement("span");
            span.className = options.noteClass || "summary-inline-note";
            span.textContent = note;
            valueEl.appendChild(span);
        } else if (options.inlineSuffix) {
            const suffix = document.createElement("span");
            suffix.className = options.suffixClass || "summary-inline-note";
            suffix.textContent = note;
            valueEl.appendChild(suffix);
        } else {
            const small = document.createElement("small");
            small.textContent = note;
            card.appendChild(small);
        }
    }
    return card;
}

function buildCostTable(title, totals, partner, category, extraColumn) {
    const tableContainer = document.createElement("div");
    const heading = document.createElement("h4");
    heading.textContent = title;
    heading.style.marginBottom = "8px";
    heading.style.textTransform = "uppercase";
    heading.style.letterSpacing = "0.18em";
    heading.style.fontSize = "0.78rem";
    heading.style.color = "#6b7280";
    tableContainer.appendChild(heading);

    const table = document.createElement("table");
    table.className = "proposal-breakdown-table";
    table.innerHTML = `
    <thead>
      <tr>
        <th>Componente</th>
        <th>Monto</th>
      </tr>
    </thead>
  `;
    const tbody = document.createElement("tbody");

    totals.breakdown
        .filter((item) => !item.disabled && item.category === category)
        .forEach((item) => {
            const tr = document.createElement("tr");
            const multiplier = category === "monthly" ? 1 + partner.monthlyMargin : 1 + partner.setupMargin;
            const valueWithMargin = item.value * multiplier;
            tr.innerHTML = `
        <td>${item.label}</td>
        <td>${formatMoney(valueWithMargin)} <span class="table-note">+ Impuestos</span></td>
      `;
            tbody.appendChild(tr);
        });

    if (!tbody.children.length) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="2">Sin componentes en esta sección</td>`;
        tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    tableContainer.appendChild(table);
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    return tableContainer;
}

export function getHourlyEntries(totals, manualActive, state, customRateInvalid, currentRate) {
    const entries = [];
    if (manualActive) {
        if (!customRateInvalid || state.hourType !== "custom") {
            const manualLabel =
                state.hourType === "custom"
                    ? "Manual personalizado"
                    : state.hourType === "ia"
                        ? "Manual IA"
                        : "Manual sin IA";
            entries.push({ label: manualLabel, rate: currentRate });
        }
    } else {
        totals.breakdown.forEach((item) => {
            if (item.hourly && !item.disabled) {
                entries.push({ label: item.label, rate: item.hourly });
            }
        });
    }
    return entries;
}

export function render(state) {
    const totals = calculateTotals(state);
    const manualActive = state.manualEnabled;
    const disabledSet = state.disabledComponents || new Set();

    renderImplementationInfo(state.implementation);
    renderIntegrationInfo(state.integrations, state.integrationRate);
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
    const setupNote =
        manualActive && state.setupOverride !== null && !state.autoSetup
            ? `Override manual - base ${formatMoney(totals.setupBase)}`
            : manualActive && state.autoSetup
                ? `Auto por horas - base ${formatMoney(totals.setupBase)}`
                : "Desde catalogo";
    refs.setupMargin.parentElement?.setAttribute("data-note", setupNote);

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

    const hourlyEntries = getHourlyEntries(totals, manualActive, state, customRateInvalid, currentRate);
    renderHourlyList(hourlyEntries);

    renderBreakdown(totals, disabledSet);
}

function renderBreakdown(totals, disabledSet) {
    if (refs.breakdownSetup) refs.breakdownSetup.innerHTML = "";
    if (refs.breakdownMonthly) refs.breakdownMonthly.innerHTML = "";
    totals.breakdown.forEach((item) => {
        const li = document.createElement("li");
        li.className = "breakdown-card";

        const header = document.createElement("div");
        header.className = "breakdown-header";
        const title = document.createElement("span");
        title.className = "breakdown-title";
        title.textContent = item.label;
        const amount = document.createElement("strong");
        amount.textContent = formatMoney(item.value);
        header.appendChild(title);
        header.appendChild(amount);

        let enabled = !item.disabled;
        if (item.removable) {
            const key = componentKey(item.removable.type, item.removable.id);
            enabled = !disabledSet.has(key);
            const control = document.createElement("label");
            control.className = "component-remove";
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = enabled;
            checkbox.dataset.action = "remove-component";
            checkbox.dataset.removeType = item.removable.type;
            if ("id" in item.removable) checkbox.dataset.removeId = item.removable.id ?? "";
            const text = document.createElement("span");
            text.textContent = "Quitar";
            control.appendChild(checkbox);
            control.appendChild(text);
            header.appendChild(control);
        }

        li.classList.toggle("breakdown-card-disabled", !enabled);

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

        const targetList = item.category === "monthly" ? refs.breakdownMonthly : refs.breakdownSetup;
        if (targetList) targetList.appendChild(li);
    });
}
