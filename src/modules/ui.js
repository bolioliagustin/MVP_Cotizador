import { catalog, sessionModels, sessionPackages, heyBiPlans } from "../data/catalog.js";
import { formatMoney, formatMoneyPrecise } from "../lib/format.js";
import { calculateTotals } from "../lib/calculator.js";
import { renderCustomIntegrations, updateCustomIntegrationPreview } from "./custom-integrations.js";
import { renderImplementationInfo, renderIntegrationInfo } from "./renderTerms/setup.js";
import { renderProposalSheet } from "./renderTerms/proposal.js";
export { renderProposalSheet };

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

export function renderSelectableOptions(container, items) {
    container.innerHTML = "";
    items.forEach((item) => {
        const label = document.createElement("label");
        label.className = "chip-option";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = item.id;
        // input.checked handled by sync

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

    // Render static/catalog options
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
        renderSelectableOptions(refs.implExtras, catalog.implementationExtras);
    }
    if (refs.addons) {
        renderSelectableOptions(refs.addons, catalog.addons);
    }

    // Sync initial state
    syncFormState(state);
}

export function syncFormState(state) {
    if (refs.implementation) refs.implementation.value = state.implementation;
    if (refs.integrations) refs.integrations.value = state.integrations;
    if (refs.integrationRateToggle) refs.integrationRateToggle.checked = state.integrationRate === "ia";
    if (refs.partner) refs.partner.value = state.partner;
    if (refs.sessionModel) refs.sessionModel.value = state.sessionModel;
    if (refs.sessionPackage) refs.sessionPackage.value = state.sessionPackage;
    if (refs.heyBiSelect) refs.heyBiSelect.value = state.heyBiPlan;

    if (refs.implExtras) {
        updateSelectableOptions(refs.implExtras, state.implementationExtras);
    }
    if (refs.addons) {
        updateSelectableOptions(refs.addons, state.addons);
    }

    renderSessionPackages(state.sessionModel, state.sessionPackage);
    renderImplementationInfo(state.implementation, refs);
    renderIntegrationInfo(state.integrations, state.integrationRate, refs);
    renderSessionModelInfo(state.sessionModel);
    renderSessionPackageInfo(state.sessionPackage);
    updateCustomIntegrationPreview();
}

function updateSelectableOptions(container, selectedSet) {
    const inputs = container.querySelectorAll('input[type="checkbox"]');
    inputs.forEach(input => {
        input.checked = selectedSet.has(input.value);
    });
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
    syncFormState(state);
    const totals = calculateTotals(state);
    const disabledSet = state.disabledComponents || new Set();

    renderExtrasSummary();

    refs.setupTotal.textContent = formatMoney(totals.finalSetupList);
    refs.setupMargin.textContent = formatMoney(totals.setupMargin);
    refs.monthlyTotal.textContent = formatMoney(totals.finalMonthlyList);
    refs.monthlyMargin.textContent = formatMoney(totals.monthlyMargin);
    refs.hoursTotal.textContent = `${totals.manualHours.toFixed(0)} h`;

    const hourlyEntries = getHourlyEntries(totals, false, state, false, catalog.rates.sinIa);
    renderHourlyList(hourlyEntries);

    renderBreakdown(totals, disabledSet, state);
}


function renderBreakdown(totals, disabledSet, state) {
    if (refs.breakdownSetup) refs.breakdownSetup.innerHTML = "";
    if (refs.breakdownMonthly) refs.breakdownMonthly.innerHTML = "";
    totals.breakdown.forEach((item) => {
        const li = document.createElement("li");
        li.className = "breakdown-card";
        if (!item.disabled) li.classList.add("enabled");
        else li.classList.add("breakdown-card-disabled");

        if (item.disabled && !(item.removable && !disabledSet.has(componentKey(item.removable.type, item.removable.id)))) {
            // If disabled completely (not just removable-hidden), don't show or show faded?
            // The legacy logic showed it if !disabled OR if it was a removable that was active.
            // Actually the legacy logic was: li.classList.toggle("breakdown-card-disabled", !enabled);
            // where enabled = !item.disabled. And if removable, check disabledSet.
            // Let's stick to simple: if disabled and not hidden by user, show as disabled.
            // If hidden by user (remove btn), it's hidden.
        }

        // Logic for visibility
        let isVisible = !item.disabled;
        if (item.removable) {
            const key = componentKey(item.removable.type, item.removable.id);
            isVisible = !disabledSet.has(key);
        }

        if (!isVisible) {
            li.style.display = "none";
            const targetList = item.category === "monthly" ? refs.breakdownMonthly : refs.breakdownSetup;
            if (targetList) targetList.appendChild(li);
            return;
        }

        // --- Layout Container ---
        // Left: Info (Title + Details)
        // Right: Meta (Price + Controls)

        const infoCol = document.createElement("div");
        infoCol.className = "breakdown-info";

        const title = document.createElement("span");
        title.className = "breakdown-title";
        title.textContent = item.label;
        infoCol.appendChild(title);

        const details = [];
        if (item.note) {
            details.push(item.note);
        } else {
            if (item.hours) details.push(`${item.hours} h`);
            if (item.hourly) details.push(`${formatMoneyPrecise(item.hourly)}/h`);
        }
        if (details.length) {
            const detailEl = document.createElement("div");
            detailEl.className = "breakdown-details";
            detailEl.textContent = details.join(" • ");
            infoCol.appendChild(detailEl);
        }

        // --- Price & Controls ---
        const metaCol = document.createElement("div");
        metaCol.className = "breakdown-meta";

        // Price Wrapper (Display + Input + Original) implementation
        const priceWrapper = document.createElement("div");
        priceWrapper.className = "breakdown-price-wrapper";

        // Tracking key
        const moduleKey = `${item.category}:${item.removable.type}:${item.removable.id ?? 'default'}`;
        priceWrapper.dataset.moduleKey = moduleKey;

        // 1. Price Display
        const priceDisplay = document.createElement("div");
        priceDisplay.className = "breakdown-price-display";
        const priceAmount = document.createElement("strong");
        priceAmount.className = "breakdown-price-amount";
        priceAmount.textContent = formatMoney(item.value);
        priceDisplay.appendChild(priceAmount);
        priceWrapper.appendChild(priceDisplay);

        // 2. Input Container (Hidden by default)
        const inputContainer = document.createElement("div");
        inputContainer.className = "breakdown-price-input-container";
        inputContainer.style.display = "none";

        const priceInput = document.createElement("input");
        priceInput.type = "number";
        priceInput.className = "breakdown-price-input";
        priceInput.min = "0";
        priceInput.step = "50";
        priceInput.value = item.value;
        inputContainer.appendChild(priceInput);

        const saveBtn = document.createElement("button");
        saveBtn.className = "breakdown-save-btn";
        saveBtn.textContent = "✓";
        saveBtn.dataset.action = "save-price";
        inputContainer.appendChild(saveBtn); // Event listener handles click via bubble

        const cancelBtn = document.createElement("button");
        cancelBtn.className = "breakdown-cancel-btn";
        cancelBtn.textContent = "✕";
        cancelBtn.dataset.action = "cancel-edit";
        inputContainer.appendChild(cancelBtn);

        priceWrapper.appendChild(inputContainer);

        // 3. Original Price (if override)
        if (item.hasOverride) {
            const originalPrice = document.createElement("div");
            originalPrice.className = "original-price";
            originalPrice.textContent = `Original: ${formatMoney(item.originalValue)}`;
            priceWrapper.appendChild(originalPrice);
        }

        metaCol.appendChild(priceWrapper);

        // --- Controls Row (Edit | Remove) ---
        const controls = document.createElement("div");
        controls.className = "breakdown-controls";

        // Edit Button
        const editBtn = document.createElement("button");
        editBtn.className = "breakdown-control-btn edit";
        editBtn.type = "button";
        editBtn.dataset.action = "edit-price";
        editBtn.textContent = "Editar";
        controls.appendChild(editBtn);

        // Remove Button
        if (item.removable) {
            const removeBtn = document.createElement("button");
            removeBtn.className = "breakdown-control-btn remove";
            removeBtn.type = "button";
            removeBtn.dataset.action = "remove-component";
            removeBtn.dataset.removeType = item.removable.type;
            if ("id" in item.removable) removeBtn.dataset.removeId = item.removable.id ?? "";
            removeBtn.textContent = "Quitar";
            controls.appendChild(removeBtn);
        }

        metaCol.appendChild(controls);

        li.appendChild(infoCol);
        li.appendChild(metaCol);

        const targetList = item.category === "monthly" ? refs.breakdownMonthly : refs.breakdownSetup;
        if (targetList) targetList.appendChild(li);
    });
}
