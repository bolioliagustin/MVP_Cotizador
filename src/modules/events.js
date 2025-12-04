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

    refs.manualToggle.addEventListener("change", (e) => {
        const enabled = e.target.checked;
        if (enabled) {
            const snapshotTotals = calculateTotals(store.getState());
            store.setState({
                manualEnabled: true,
                manualHours: snapshotTotals.manualHours,
            });
        } else {
            store.setState({
                manualEnabled: false,
                manualHours: null,
                hourType: "sinIa",
                customRate: null,
            });
        }
    });
    refs.manualHours.addEventListener("input", (e) =>
        store.setState({ manualHours: coerceNumberInput(e.target.value) })
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
        store.setState({ customRate: coerceNumberInput(e.target.value) })
    );
    refs.autoHourly.addEventListener("change", (e) => store.setState({ autoSetup: e.target.checked }));
    refs.setupOverride.addEventListener("input", (e) =>
        store.setState({ setupOverride: coerceNumberInput(e.target.value) })
    );
    refs.monthlyOverride.addEventListener("input", (e) =>
        store.setState({ monthlyOverride: coerceNumberInput(e.target.value) })
    );

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
        refs.breakdownSection.addEventListener("change", (e) => handleBreakdownChange(e, store));
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
    if (!target.matches('input[data-action="remove-component"]')) return;
    const type = target.dataset.removeType;
    const id = target.dataset.removeId ?? null;
    toggleBreakdownComponent(type, id, target.checked, store);
}

function toggleBreakdownComponent(type, id, enabled, store) {
    if (!type) return;
    const next = new Set(store.getState().disabledComponents);
    const key = componentKey(type, id);
    if (enabled) next.delete(key);
    else next.add(key);
    store.setState({ disabledComponents: next });
}

async function handleExportImage(store) {
    if (!refs.proposalPreview) return;
    const state = store.getState();
    const totals = calculateTotals(state);
    const manualActive = state.manualEnabled;
    const currentRate =
        manualActive && state.hourType === "custom" && state.customRate
            ? state.customRate
            : catalog.rates[state.hourType] || catalog.rates.sinIa;
    const customRateInvalid =
        manualActive && state.hourType === "custom" && (!state.customRate || state.customRate <= 0);
    const hourlyEntries = getHourlyEntries(totals, manualActive, state, customRateInvalid, currentRate);

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
