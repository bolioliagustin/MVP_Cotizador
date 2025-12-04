import { refs } from "./ui.js";
import { catalog } from "../data/catalog.js";
import { formatMoney, formatMoneyPrecise } from "../lib/format.js";
import { coerceNumberInput, generateId } from "../lib/utils.js";
import { aiService } from "../services/ai.js";

export function renderCustomIntegrations(store) {
    if (!refs.customIntegrationList) return;
    const listElement = refs.customIntegrationList;
    const activeElement = document.activeElement;
    let activeMeta = null;

    if (activeElement && listElement.contains(activeElement)) {
        const host = activeElement.closest("[data-id]");
        if (host) {
            activeMeta = {
                id: host.dataset.id,
                field: activeElement.dataset.field,
                selectionStart:
                    typeof activeElement.selectionStart === "number" ? activeElement.selectionStart : null,
                selectionEnd:
                    typeof activeElement.selectionEnd === "number" ? activeElement.selectionEnd : null,
            };
        }
    }

    const list = store.getState().customIntegrations;
    listElement.innerHTML = "";
    if (!list.length) {
        const empty = document.createElement("p");
        empty.className = "state-info";
        empty.textContent = "No agregaste integraciones manuales.";
        listElement.appendChild(empty);
        return;
    }

    const createWrapper = (labelText, fieldEl, helperText) => {
        const wrapper = document.createElement("div");
        const label = document.createElement("label");
        label.textContent = labelText;
        wrapper.appendChild(label);
        wrapper.appendChild(fieldEl);
        if (helperText) {
            const helper = document.createElement("small");
            helper.className = "state-info";
            helper.textContent = helperText;
            wrapper.appendChild(helper);
        }
        return wrapper;
    };

    const createInputField = (labelText, field, value, options = {}) => {
        const input = document.createElement("input");
        input.type = options.type ?? "text";
        input.dataset.field = field;
        ["min", "max", "step", "placeholder"].forEach((attr) => {
            if (options[attr] !== undefined) input[attr] = options[attr];
        });
        if (value === null || value === undefined) input.value = "";
        else input.value = value;
        return createWrapper(labelText, input, options.helperText);
    };

    const createNumberField = (labelText, field, value, options = {}) =>
        createInputField(labelText, field, value, { ...options, type: "number" });

    const createLaborField = (value) => {
        const select = document.createElement("select");
        select.dataset.field = "labor";
        [
            { id: "sinIa", label: "Sin IA" },
            { id: "ia", label: "IA" },
        ].forEach((item) => {
            const option = document.createElement("option");
            option.value = item.id;
            option.textContent = item.label;
            select.appendChild(option);
        });
        select.value = value === "ia" ? "ia" : "sinIa";
        return createWrapper("Clasificacion", select);
    };

    const createActions = () => {
        const container = document.createElement("div");
        container.className = "custom-actions";
        const button = document.createElement("button");
        button.type = "button";
        button.className = "btn ghost small";
        button.dataset.action = "remove";
        button.textContent = "Eliminar";
        container.appendChild(button);
        return container;
    };

    list.forEach((integration) => {
        const card = document.createElement("div");
        card.className = "custom-card manual-grid";
        card.dataset.id = integration.id;

        card.appendChild(createInputField("Nombre", "name", integration.name ?? ""));
        card.appendChild(
            createNumberField("Horas", "hours", integration.hours, { min: 0, step: 1 })
        );
        card.appendChild(createLaborField(integration.labor ?? "sinIa"));
        card.appendChild(
            createNumberField("Valor hora", "rate", integration.rate, {
                min: 0,
                step: 5,
                helperText: "Deja vacio para usar la tarifa segun clasificacion.",
            })
        );
        card.appendChild(
            createNumberField("Precio manual (opcional)", "override", integration.override, {
                min: 0,
                step: 50,
            })
        );
        card.appendChild(createActions());

        listElement.appendChild(card);
    });

    if (activeMeta?.id && activeMeta.field) {
        const next = listElement.querySelector(
            `[data-id="${activeMeta.id}"] [data-field="${activeMeta.field}"]`
        );
        if (next) {
            next.focus();
            if (
                typeof activeMeta.selectionStart === "number" &&
                typeof next.setSelectionRange === "function"
            ) {
                const end =
                    typeof activeMeta.selectionEnd === "number"
                        ? activeMeta.selectionEnd
                        : activeMeta.selectionStart;
                next.setSelectionRange(activeMeta.selectionStart, end);
            }
        }
    }
}

export function addCustomIntegration(store) {
    if (!refs.customIntegrationForm) return;
    const payload = getCustomIntegrationFormValues();
    const hoursValid = payload.hours !== null && payload.hours > 0;
    const overrideValid = payload.override !== null && payload.override > 0;
    if (!hoursValid && !overrideValid) {
        setCustomIntegrationFormError("Carga horas o un precio manual para agregarla.");
        return;
    }
    setCustomIntegrationFormError("");
    const newIntegration = {
        id: generateId(),
        name: payload.name,
        hours: payload.hours,
        labor: payload.labor === "ia" ? "ia" : "sinIa",
        rate: payload.rate,
        override: payload.override,
    };
    store.setState({ customIntegrations: [...store.getState().customIntegrations, newIntegration] });
    resetCustomIntegrationForm();
}

export function handleCustomIntegrationInput(event, store) {
    const card = event.target.closest("[data-id]");
    if (!card) return;
    const id = card.dataset.id;
    const field = event.target.dataset.field;
    if (!field) return;
    let value = event.target.value;
    if (["hours", "rate", "override"].includes(field)) {
        value = coerceNumberInput(value);
    }
    updateCustomIntegration(id, { [field]: value }, store);
}

export function handleCustomIntegrationClick(event, store) {
    const action = event.target.dataset.action;
    if (!action) return;
    const card = event.target.closest("[data-id]");
    if (!card) return;
    if (action === "remove") {
        removeCustomIntegration(card.dataset.id, store);
    }
}

function updateCustomIntegration(id, patch, store) {
    const next = store
        .getState()
        .customIntegrations.map((integration) => (integration.id === id ? { ...integration, ...patch } : integration));
    store.setState({ customIntegrations: next });
}

function removeCustomIntegration(id, store) {
    const next = store.getState().customIntegrations.filter((integration) => integration.id !== id);
    store.setState({ customIntegrations: next });
}

export function getCustomIntegrationFormValues() {
    return {
        name: refs.customIntegrationName?.value.trim() ?? "",
        hours: coerceNumberInput(refs.customIntegrationHours?.value ?? ""),
        labor: refs.customIntegrationLabor?.value ?? "sinIa",
        rate: coerceNumberInput(refs.customIntegrationRate?.value ?? ""),
        override: coerceNumberInput(refs.customIntegrationOverride?.value ?? ""),
    };
}

export function resetCustomIntegrationForm() {
    if (!refs.customIntegrationForm) return;
    if (refs.customIntegrationName) refs.customIntegrationName.value = "";
    if (refs.customIntegrationHours) refs.customIntegrationHours.value = "";
    if (refs.customIntegrationRate) refs.customIntegrationRate.value = "";
    if (refs.customIntegrationOverride) refs.customIntegrationOverride.value = "";
    if (refs.customIntegrationLabor) refs.customIntegrationLabor.value = "sinIa";
    updateCustomIntegrationPreview();

    // Ensure Estimate button exists
    if (!document.getElementById("estimate-btn") && refs.customIntegrationName) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.id = "estimate-btn";
        btn.className = "btn-secondary";
        btn.textContent = "✨ Estimar con IA";
        btn.style.marginTop = "8px";
        btn.onclick = async () => {
            const desc = refs.customIntegrationName.value;
            if (!desc) {
                alert("Por favor describe la integracion primero.");
                return;
            }
            if (!aiService.hasKey()) {
                alert("Por favor configura tu API Key primero (icono de engranaje).");
                return;
            }

            btn.disabled = true;
            btn.textContent = "Estimando...";
            try {
                const hours = await aiService.estimateEffort(desc);
                refs.customIntegrationHours.value = hours;
                updateCustomIntegrationPreview();
            } catch (e) {
                alert("Error al estimar: " + e.message);
            } finally {
                btn.disabled = false;
                btn.textContent = "✨ Estimar con IA";
            }
        };
        // Insert after name input
        refs.customIntegrationName.parentNode.insertBefore(btn, refs.customIntegrationName.nextSibling);
    }
}

function setCustomIntegrationFormError(message) {
    if (!refs.customIntegrationError) return;
    refs.customIntegrationError.textContent = message;
    refs.customIntegrationError.classList.toggle("visible", Boolean(message));
}

export function updateCustomIntegrationPreview() {
    if (!refs.customPreviewDetails || !refs.customPreviewEmpty) return;
    const payload = getCustomIntegrationFormValues();
    const hasContent =
        Boolean(payload.name) ||
        payload.hours !== null ||
        payload.rate !== null ||
        payload.override !== null;

    refs.customPreviewDetails.hidden = !hasContent;
    refs.customPreviewEmpty.style.display = hasContent ? "none" : "block";
    if (!hasContent) return;

    const laborLabel = payload.labor === "ia" ? "IA" : "Sin IA";
    const defaultRate = catalog.rates[payload.labor === "ia" ? "ia" : "sinIa"] ?? catalog.rates.sinIa;
    const effectiveRate = payload.rate && payload.rate > 0 ? payload.rate : defaultRate;
    const hoursValue = payload.hours ?? 0;
    const autoTotal = hoursValue * effectiveRate;
    const finalTotal = payload.override && payload.override > 0 ? payload.override : autoTotal;

    refs.customPreviewName.textContent = payload.name || "Integracion personalizada";
    refs.customPreviewHours.textContent = `${hoursValue || 0} h`;
    refs.customPreviewLabor.textContent = laborLabel;
    refs.customPreviewRate.textContent = formatMoneyPrecise(effectiveRate || 0);
    refs.customPreviewTotal.textContent = formatMoney(finalTotal || 0);
}
