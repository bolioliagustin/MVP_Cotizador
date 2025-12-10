import { refs, renderSessionPackages, renderSessionModelInfo, renderSessionPackageInfo, componentKey, hydrateForm, renderProposalSheet, getHourlyEntries, qs } from "./ui.js";
import { toPng } from "html-to-image";
import { catalog } from "../data/catalog.js";
import { calculateTotals } from "../lib/calculator.js";
import { defaultState } from "../state/store.js";
import { coerceNumberInput } from "../lib/utils.js";
import {
    addCustomIntegration,
    updateCustomIntegrationPreview,
    handleCustomIntegrationInput,
    handleCustomIntegrationClick,
    resetCustomIntegrationForm,
} from "./custom-integrations.js";
import { aiService } from "../services/ai.js";

export function bindEvents(store) {
    refs.implementation.addEventListener("change", (e) => store.setState({ implementation: e.target.value }));
    refs.integrations.addEventListener("change", (e) => store.setState({ integrations: e.target.value }));
    refs.integrationRateToggle.addEventListener("change", (e) =>
        store.setState({ integrationRate: e.target.checked ? "ia" : "sinIa" })
    );
    refs.partner.addEventListener("change", (e) => store.setState({ partner: e.target.value }));

    bindMultiSelect(refs.implExtras, "implementationExtras", store);
    bindMultiSelect(refs.addons, "addons", store);

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



    if (refs.customIntegrationForm) {
        refs.customIntegrationForm.addEventListener("submit", (event) => {
            event.preventDefault();
            addCustomIntegration(store);
        });
        refs.customIntegrationForm.addEventListener("input", updateCustomIntegrationPreview);
        refs.customIntegrationForm.addEventListener("change", updateCustomIntegrationPreview);
        updateCustomIntegrationPreview();
        refs.customIntegrationForm.addEventListener("change", updateCustomIntegrationPreview);
        updateCustomIntegrationPreview();

        // Add AI Key configuration if not present
        if (!document.getElementById("ai-config-btn")) {
            const header = qs(".section-header");
            if (header) {
                const configBtn = document.createElement("button");
                configBtn.id = "ai-config-btn";
                configBtn.className = "btn-text";
                configBtn.textContent = "⚙️ Configurar IA";
                configBtn.style.marginLeft = "auto";
                configBtn.onclick = () => {
                    const current = aiService.getKey() || "";
                    const key = prompt("Ingresa tu API Key de Google Gemini:", current);
                    if (key !== null) {
                        aiService.setKey(key);
                        alert("API Key guardada.");
                    }
                };
                header.appendChild(configBtn);
            }
        }
    }
    if (refs.customIntegrationList) {
        refs.customIntegrationList.addEventListener("input", (e) => handleCustomIntegrationInput(e, store));
        refs.customIntegrationList.addEventListener("change", (e) => handleCustomIntegrationInput(e, store));
        refs.customIntegrationList.addEventListener("click", (e) => handleCustomIntegrationClick(e, store));
    }
    if (refs.breakdownSection) {

        refs.breakdownSection.addEventListener("click", (e) => {
            const action = e.target.dataset.action;
            if (action === "edit-price") {
                handleEditPriceClick(e);
            } else if (action === "save-price") {
                handleSavePriceClick(e, store);
            } else if (action === "cancel-edit") {
                handleCancelEditClick(e);
            } else if (action === "remove-component") {
                handleBreakdownChange(e, store);
            }
        });
    }

    refs.resetBtn.addEventListener("click", () => {
        store.setState({
            ...defaultState,
            addons: new Set(),
            implementationExtras: new Set(),
            customIntegrations: [],
            disabledComponents: new Set(),
        });
        hydrateForm(store);
    });

    refs.exportBtn.addEventListener("click", () => {
        const snapshot = {
            ...store.getState(),
            addons: Array.from(store.getState().addons),
            implementationExtras: Array.from(store.getState().implementationExtras),
            disabledComponents: Array.from(store.getState().disabledComponents),
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
    refs.printBtn.addEventListener("click", () => handleExportImage(store));
}

function bindMultiSelect(container, key, store) {
    if (!container) return;
    container.addEventListener("change", (e) => {
        if (!e.target.matches('input[type="checkbox"]')) return;
        const next = new Set(store.getState()[key]);
        if (e.target.checked) next.add(e.target.value);
        else next.delete(e.target.value);
        store.setState({ [key]: next });
    });
}

function handleBreakdownChange(event, store) {
    const target = event.target;
    if (!target.matches('button[data-action="remove-component"]')) return;
    const type = target.dataset.removeType;
    const id = target.dataset.removeId ?? null;
    removeComponent(type, id, store);
}

function removeComponent(type, id, store) {
    if (!type) return;
    const state = store.getState();

    // 1. Manejo de Sets (Checkbox groups)
    if (type === 'implementationExtras' || type === 'addons') {
        if (!id) return;
        const currentSet = new Set(state[type]);
        currentSet.delete(id);
        store.setState({ [type]: currentSet });
        return;
    }

    // 2. Manejo de Integraciones Personalizadas (Array)
    if (type === 'customIntegrations') {
        if (!id) return;
        const next = state.customIntegrations.filter(item => item.id !== id);
        store.setState({ customIntegrations: next });
        return;
    }

    // 3. Manejo de Selects únicos (Reseteo a string vacío)
    const stateMap = {
        'implementation': 'implementation',
        'integration': 'integrations', // Singular type -> Plural state key
        'sessionPackage': 'sessionPackage',
        'heyBiPlan': 'heyBiPlan'
    };

    const stateKey = stateMap[type];
    if (stateKey) {
        store.setState({ [stateKey]: "" });

        // Si removemos el modelo de sesión, también quitamos el paquete?
        // El breakdown usa 'sessionPackage', así que solo quitamos el paquete.

        // Si removemos la integración, tal vez querramos resetear el toggle de IA? 
        // Por ahora solo reseteamos la selección principal.
        return;
    }

    // Fallback por si hay algún otro tipo no manejado (para evitar errores)
    const next = new Set(state.disabledComponents);
    const key = componentKey(type, id);
    next.add(key);
    store.setState({ disabledComponents: next });
}

function handleEditPriceClick(event) {
    const button = event.target;
    const card = button.closest(".breakdown-card");
    if (!card) return;

    const display = card.querySelector(".breakdown-price-display");
    const inputContainer = card.querySelector(".breakdown-price-input-container");
    const input = inputContainer.querySelector(".breakdown-price-input");
    const controls = card.querySelector(".breakdown-controls"); // Actions row

    // Hide display, show input
    if (display) display.style.display = "none";
    if (controls) controls.style.display = "none"; // Hide edit/remove buttons while editing
    if (inputContainer) inputContainer.style.display = "flex";

    // Focus the input
    setTimeout(() => input.focus(), 0);
}

function handleSavePriceClick(event, store) {
    const button = event.target;
    // Save button is INSIDE the input container, so closest is fine or we use card
    const card = button.closest(".breakdown-card");
    if (!card) return;

    // The module key is on a container - let's put it on the input container or the card?
    // Let's expect it on the input container or a dedicated wrapper. 
    // In ui.js I will put data-module-key on the input-container or price-wrapper.
    // Let's modify ui.js to put it on .breakdown-price-wrapper

    const wrapper = card.querySelector(".breakdown-price-wrapper");
    const moduleKey = wrapper.dataset.moduleKey;

    const input = card.querySelector(".breakdown-price-input");
    const rawValue = input.value.trim();

    const moduleOverrides = { ...store.getState().moduleOverrides };

    if (rawValue === '' || rawValue === null) {
        // Reset to original value
        delete moduleOverrides[moduleKey];
    } else {
        const numericValue = parseFloat(rawValue);
        if (!isNaN(numericValue) && numericValue >= 0) {
            moduleOverrides[moduleKey] = numericValue;
        } else {
            // Invalid input, don't save
            handleCancelEditClick(event);
            return;
        }
    }

    store.setState({ moduleOverrides });
    // UI update happens via re-render, so we don't need to manually toggle display usually,
    // but just in case of lag/opt:
    handleCancelEditClick(event); // Reverts visibility state
}

function handleCancelEditClick(event) {
    const button = event.target;
    const card = button.closest(".breakdown-card");
    if (!card) return;

    const display = card.querySelector(".breakdown-price-display");
    const inputContainer = card.querySelector(".breakdown-price-input-container");
    const input = inputContainer.querySelector(".breakdown-price-input");
    const controls = card.querySelector(".breakdown-controls");

    // Reset input to current display value (cancel changes)
    if (display) {
        const displayAmount = display.querySelector(".breakdown-price-amount")?.textContent || "0";
        const currentValue = displayAmount.replace(/[^0-9.-]/g, '');
        if (input) input.value = currentValue;
    }

    // Hide input, show display
    if (inputContainer) inputContainer.style.display = "none";
    if (display) display.style.display = "flex";
    if (controls) controls.style.display = "flex";
}

async function handleExportImage(store) {
    if (!refs.proposalPreview) return;
    const state = store.getState();
    const totals = calculateTotals(state);
    const currentRate = catalog.rates.sinIa;
    const hourlyEntries = getHourlyEntries(totals, false, state, false, currentRate);

    refs.proposalPreview.innerHTML = "";
    const sheet = renderProposalSheet(state, totals, hourlyEntries, currentRate);
    refs.proposalPreview.appendChild(sheet);
    refs.proposalPreview.style.display = "block";

    try {
        const dataUrl = await toPng(sheet, { cacheBust: true, pixelRatio: 2 });
        const link = document.createElement("a");
        const date = new Date().toISOString().split("T")[0];
        link.download = `heynow-resumen-${date}.png`;
        link.href = dataUrl;
        link.click();
    } catch (error) {
        console.error("No se pudo generar la imagen", error);
        alert("No pudimos generar la imagen. Intenta nuevamente.");
    } finally {
        refs.proposalPreview.style.display = "none";
        refs.proposalPreview.innerHTML = "";
    }
}
