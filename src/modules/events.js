import { refs, renderSessionPackages, renderSessionModelInfo, renderSessionPackageInfo, componentKey, hydrateForm, renderProposalSheet, getHourlyEntries, qs } from "./ui.js";
import { toPng } from "html-to-image";
import { saveAs } from "file-saver";
import { catalog, messageCosts } from "../data/catalog.js";
import { calculateTotals, analyzeHourlyRates } from "../lib/calculator.js";
import { defaultState } from "../state/store.js";
import { coerceNumberInput } from "../lib/utils.js";
import { formatMoneyPrecise, formatMessageCost } from "../lib/format.js";
import {
    addCustomIntegration,
    updateCustomIntegrationPreview,
    handleCustomIntegrationInput,
    handleCustomIntegrationClick,
    resetCustomIntegrationForm,
} from "./custom-integrations.js";
import { aiProposalService } from "../services/ai-proposal.js";
import { toast } from "../lib/toast.js";

export function bindEvents(store) {
    refs.implementation.addEventListener("change", (e) => store.setState({ implementation: e.target.value }));
    refs.integrations.addEventListener("change", (e) => store.setState({ integrations: e.target.value }));
    refs.integrationRateToggle.addEventListener("change", (e) =>
        store.setState({ integrationRate: e.target.checked ? "ia" : "sinIa" })
    );
    refs.partner.addEventListener("change", (e) => store.setState({ partner: e.target.value }));

    bindMultiSelect(refs.implExtras, "implementationExtras", store);
    bindMultiSelect(refs.addons, "addons", store);

    if (refs.sessionPackage) {
        refs.sessionPackage.addEventListener("change", (e) => store.setState({ sessionPackage: e.target.value }));
    }

    if (refs.heyBiSelect) {
        refs.heyBiSelect.addEventListener("change", (e) => store.setState({ heyBiPlan: e.target.value }));
    }

    if (refs.setupMarginOverrideInput) {
        refs.setupMarginOverrideInput.addEventListener("input", (e) => {
            store.setState({ setupMarginOverride: coerceNumberInput(e.target.value) });
        });
    }

    if (refs.monthlyMarginOverrideInput) {
        refs.monthlyMarginOverrideInput.addEventListener("input", (e) => {
            store.setState({ monthlyMarginOverride: coerceNumberInput(e.target.value) });
        });
    }

    if (refs.sessionModel) {
        refs.sessionModel.addEventListener("change", (e) => {
            store.setState({ sessionModel: e.target.value });
        });
    }

    if (refs.sessionQuantityInput) {
        refs.sessionQuantityInput.addEventListener("input", (e) => {
            const qty = parseInt(e.target.value, 10);
            store.setState({ sessionQuantity: isNaN(qty) ? 0 : Math.max(0, qty) });
        });
    }

    if (refs.customIntegrationList) {
        refs.customIntegrationList.addEventListener("click", (e) => {
            handleCustomIntegrationClick(e, store);
        });
        refs.customIntegrationList.addEventListener("input", (e) => {
            handleCustomIntegrationInput(e, store);
        });
    }

    if (refs.addCustomIntegrationBtn) {
        refs.addCustomIntegrationBtn.addEventListener("click", () => {
            addCustomIntegration(store);
        });
    }

    if (refs.customIntegrationForm) {
        refs.customIntegrationForm.addEventListener("input", () => {
            updateCustomIntegrationPreview();
        });
    }

    if (refs.companySelect) {
        refs.companySelect.addEventListener("change", (e) => {
            store.setState({ selectedCompany: e.target.value });
        });
    }

    // Message region selector - show/hide costs table and update values
    if (refs.messageRegion) {
        refs.messageRegion.addEventListener("change", (e) => {
            const regionId = e.target.value;
            store.setState({ messageRegion: regionId });

            // Show/hide table
            if (refs.messageCostsTable) {
                if (regionId) {
                    refs.messageCostsTable.style.display = "block";

                    // Update table values
                    const region = messageCosts.find(r => r.id === regionId);
                    if (region) {
                        const marketingEl = document.getElementById("message-cost-marketing");
                        const utilityEl = document.getElementById("message-cost-utility");
                        const authEl = document.getElementById("message-cost-authentication");

                        if (marketingEl) marketingEl.textContent = formatMessageCost(region.marketing);
                        if (utilityEl) utilityEl.textContent = formatMessageCost(region.utility);
                        if (authEl) authEl.textContent = formatMessageCost(region.authentication);
                    }
                } else {
                    refs.messageCostsTable.style.display = "none";
                }
            }
        });
    }

    Object.entries(messageCosts).forEach(([platform, costs]) => {
        Object.entries(costs).forEach(([region, cost]) => {
            const inputId = `msg-cost-${platform}-${region}`;
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener("input", (e) => {
                    const value = parseFloat(e.target.value);
                    if (!isNaN(value) && value >= 0) {
                        store.setState((prevState) => ({
                            messageCostOverrides: {
                                ...prevState.messageCostOverrides,
                                [`${platform}_${region}`]: value,
                            },
                        }));
                    }
                });
            }
        });
    });

    // Event delegation for breakdown card buttons
    document.addEventListener("click", (e) => {
        const target = e.target;
        const action = target.dataset.action;

        if (!action) return;

        // Edit Price Button
        if (action === "edit-price") {
            const card = target.closest(".breakdown-card");
            if (card) {
                card.classList.add("editing");
                const input = card.querySelector(".breakdown-price-input");
                if (input) {
                    input.focus();
                    input.select();
                }
            }
        }

        // Cancel Edit Button
        if (action === "cancel-edit") {
            const card = target.closest(".breakdown-card");
            if (card) {
                card.classList.remove("editing");
                const input = card.querySelector(".breakdown-price-input");
                if (input) {
                    // Reset to current value (will be updated on next render)
                    input.value = input.dataset.currentValue || "";
                }
            }
        }

        // Save Edit Button
        if (action === "save-edit") {
            const card = target.closest(".breakdown-card");
            if (!card) return;

            const input = card.querySelector(".breakdown-price-input");
            if (!input) return;

            const newValue = parseFloat(input.value);
            console.log(newValue)
            if (isNaN(newValue) || newValue < 0) {
                toast.warning("Por favor ingresa un valor válido");
                return;
            }

            const componentType = input.dataset.componentType;
            const componentId = input.dataset.componentId;
            const category = input.dataset.category || "setup"; // Default to setup if not specified

            if (componentType && componentId) {
                console.log(componentType, componentId, category)
                // Use same format as calculator.js: category:type:id
                const overrideKey = `${category}:${componentType}:${componentId}`;
                console.log('Override key:', overrideKey);
                store.setState(prevState => ({
                    moduleOverrides: {
                        ...prevState.moduleOverrides,
                        [overrideKey]: newValue
                    }
                }));
            }

            card.classList.remove("editing");
        }

        // Remove Component Button
        if (action === "remove-component") {
            const removeType = target.dataset.removeType;
            const removeId = target.dataset.removeId;

            if (removeType) {
                // Remove from the actual state instead of hiding
                const currentState = store.getState();

                // Handle different component types
                if (removeType === "addons" || removeType === "implementationExtras") {
                    // For Sets, remove the item
                    const currentSet = currentState[removeType];
                    if (currentSet && currentSet.has(removeId)) {
                        const newSet = new Set(currentSet);
                        newSet.delete(removeId);
                        store.setState({ [removeType]: newSet });
                    }
                } else if (removeType === "sessionPackage") {
                    // For sessionPackage, clear it
                    store.setState({ sessionPackage: "" });
                } else if (removeType === "heyBiPlan") {
                    // For heyBiPlan, clear it
                    store.setState({ heyBiPlan: "" });
                } else if (removeType === "implementation") {
                    store.setState({ implementation: "" });
                } else if (removeType === "customIntegrations") {
                    const currentIntegrations = currentState.customIntegrations || [];
                    const newIntegrations = currentIntegrations.filter(ci => ci.id !== removeId);
                    store.setState({ customIntegrations: newIntegrations });
                } else if (removeType === "integration") {
                    store.setState({ integrations: "" });
                }
            }
        }
    });

    refs.resetBtn.addEventListener("click", () => store.setState(defaultState));

    refs.importInput.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            handleImportJSON(data, store);
            toast.success("Configuración importada correctamente");
            e.target.value = "";
        } catch (error) {
            toast.error("Error al importar: " + error.message);
            e.target.value = "";
        }
    });

    refs.importBtn.addEventListener("click", () => {
        refs.importInput.click();
    });

    // Export button now opens save modal for cloud save
    refs.exportBtn.addEventListener("click", () => {
        // Show save modal
        if (refs.saveQuoteModal) {
            refs.saveQuoteModal.style.display = "flex";
        }
    });

    // Close save modal handlers
    if (refs.closeSaveModal) {
        refs.closeSaveModal.addEventListener("click", () => {
            refs.saveQuoteModal.style.display = "none";
        });
    }

    if (refs.cancelSave) {
        refs.cancelSave.addEventListener("click", () => {
            refs.saveQuoteModal.style.display = "none";
        });
    }

    // Handle save quote form submission
    if (refs.saveQuoteForm) {
        refs.saveQuoteForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const submitBtn = refs.saveQuoteForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;

            try {
                // Disable button and show loading
                submitBtn.disabled = true;
                submitBtn.textContent = "⏳ Guardando...";

                // Get form data
                const clientName = refs.quoteClientName.value;
                const tagsInput = refs.quoteTags.value;
                const tags = tagsInput ? tagsInput.split(',').map(t => t.trim()).filter(t => t) : [];

                // Get current quote  data
                const state = store.getState();
                const totals = calculateTotals(state);

                // Prepare quote data
                const quoteData = {
                    ...state,
                    addons: Array.from(state.addons),
                    customIntegrations: state.customIntegrations,
                    implementationExtras: Array.from(state.implementationExtras),
                };

                // Import and use quotes service
                const { quotesService } = await import('../services/quotes-service.js');
                const result = await quotesService.saveQuote(clientName, quoteData, totals, tags);

                if (result.success) {
                    // Success!
                    toast.success(`Cotización guardada exitosamente para "${clientName}"`);

                    // Close modal
                    refs.saveQuoteModal.style.display = "none";

                    // Reset form
                    refs.saveQuoteForm.reset();
                } else {
                    throw new Error(result.error || "Error desconocido");
                }
            } catch (error) {
                console.error("Error saving quote:", error);
                toast.error(`Error al guardar: ${error.message}`);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });
    }

    if (refs.printBtn) {
        refs.printBtn.addEventListener("click", () => handleExportImage(store));
    }

    // ============================================
    // AI Proposal Generator Events
    // ============================================

    // Opening modal requires API key
    if (refs.generateProposalBtn && refs.proposalModal) {
        refs.generateProposalBtn.addEventListener("click", async () => {
            // Check if API key exists
            if (!aiProposalService.hasKey()) {
                const key = prompt("Por favor ingresa tu API Key de Google Gemini:\n\n(Se guardará localmente para futuros usos)");
                if (!key) return;
                aiProposalService.setApiKey(key.trim());
            }

            // Show modal 
            refs.proposalModal.style.display = "flex";
        });

        // Close modals
        refs.closeProposalModal.addEventListener("click", () => {
            refs.proposalModal.style.display = "none";
        });

        refs.cancelProposal.addEventListener("click", () => {
            refs.proposalModal.style.display = "none";
        });

        refs.closeResultModal.addEventListener("click", () => {
            refs.proposalResultModal.style.display = "none";
        });

        // Handle agent type selection to show/hide conditional fields
        const agentTypeSelect = document.getElementById("agent-type");
        const knowledgeSourcesGroup = document.getElementById("knowledge-sources-group");
        const integrationSystemsGroup = document.getElementById("integration-systems-group");
        const dataRequiredGroup = document.getElementById("data-required-group");

        if (agentTypeSelect) {
            agentTypeSelect.addEventListener("change", (e) => {
                const type = e.target.value;

                // Hide all conditional fields first
                knowledgeSourcesGroup.style.display = "none";
                integrationSystemsGroup.style.display = "none";
                dataRequiredGroup.style.display = "none";

                // Show relevant fields based on selection
                if (type === "estatico" || type === "hibrido") {
                    knowledgeSourcesGroup.style.display = "block";
                }
                if (type === "integracion" || type === "hibrido") {
                    integrationSystemsGroup.style.display = "block";
                    dataRequiredGroup.style.display = "block";
                }
            });
        }

        // Handle form submission
        refs.proposalForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const submitBtn = refs.proposalForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;

            try {
                //Disable button and show loading
                submitBtn.disabled = true;
                submitBtn.textContent = "⏳ Generando...";

                // Collect form data
                const clientContext = {
                    clientName: document.getElementById("client-name").value,
                    industry: document.getElementById("client-industry").value,
                    objective: document.getElementById("client-objective").value,
                    useCase: document.getElementById("use-case-description").value,
                    agentType: document.getElementById("agent-type").value,
                    knowledgeSources: document.getElementById("knowledge-sources").value,
                    integrationSystems: document.getElementById("integration-systems").value,
                    dataRequired: document.getElementById("data-required").value,
                    volume: document.getElementById("expected-volume").value,
                    painPoints: document.getElementById("pain-points").value
                };

                // Get current quote data
                const quoterData = {
                    state: store.getState(),
                    totals: calculateTotals(store.getState())
                };

                // Generate proposal
                const proposalText = await aiProposalService.generateProposal(quoterData, clientContext);

                // Show result
                showProposalResult(proposalText, clientContext, quoterData);

                // Close form modal
                refs.proposalModal.style.display = "none";

                // Reset form
                refs.proposalForm.reset();

            } catch (error) {
                toast.error(`Error: ${error.message}`);
                console.error("Proposal generation error:", error);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = originalText;
            }
        });

        // Copy proposal to clipboard
        refs.copyProposal.addEventListener("click", async () => {
            const content = refs.proposalContent.textContent;
            try {
                await navigator.clipboard.writeText(content);
                const originalText = refs.copyProposal.textContent;
                refs.copyProposal.textContent = "✅ Copiado";
                setTimeout(() => {
                    refs.copyProposal.textContent = originalText;
                }, 2000);
            } catch (error) {
                toast.error("No se pudo copiar al portapapeles");
            }
        });

        // Edit proposal (convert to editable)
        refs.editProposal.addEventListener("click", () => {
            const currentContent = refs.proposalContent.textContent;
            refs.proposalContent.contentEditable = "true";
            refs.proposalContent.style.border = "2px solid var(--primary)";
            refs.proposalContent.focus();

            // Change button to "Guardar"
            refs.editProposal.textContent = "💾 Guardar";
            refs.editProposal.onclick = () => {
                refs.proposalContent.contentEditable = "false";
                refs.proposalContent.style.border = "none";
                refs.editProposal.textContent = "✏️ Editar";
                refs.editProposal.onclick = null;
            };
        });

        // Regenerate proposal
        refs.regenerateProposal.addEventListener("click", () => {
            refs.proposalResultModal.style.display = "none";
            refs.proposalModal.style.display = "flex";
        });
    }
}

/**
 * Show proposal result in modal
 */
function showProposalResult(proposalText, clientContext, quoterData) {
    // Format text with line breaks preserved
    refs.proposalContent.innerHTML = proposalText
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'); // Bold markdown

    refs.proposalResultModal.style.display = "flex";
}

function bindMultiSelect(container, stateKey, store) {
    container.addEventListener("change", (e) => {
        if (!e.target.matches('input[type="checkbox"]')) return;
        const val = e.target.value;
        const currentSet = store.getState()[stateKey];
        const newSet = new Set(currentSet);
        if (e.target.checked) {
            newSet.add(val);
        } else {
            newSet.delete(val);
        }
        store.setState({ [stateKey]: newSet });
    });
}

async function handleExportImage(store) {
    if (!refs.proposalPreview) return;
    const state = store.getState();
    const totals = calculateTotals(state);

    // Determinar la tarifa a usar en el resumen exportado
    const rateAnalysis = analyzeHourlyRates(totals.breakdown);

    // Usar tarifa personalizada si existe, sino usar promedio ponderado
    const currentRate = state.customSummaryRate !== null && state.customSummaryRate !== undefined
        ? state.customSummaryRate
        : (rateAnalysis.weightedAverage > 0 ? rateAnalysis.weightedAverage : catalog.rates.sinIa);

    const hourlyEntries = getHourlyEntries(totals, false, state, false, currentRate);

    refs.proposalPreview.innerHTML = "";
    const sheet = renderProposalSheet(state, totals, hourlyEntries, currentRate);
    refs.proposalPreview.appendChild(sheet);
    refs.proposalPreview.style.display = "block";

    try {
        const dataUrl = await toPng(sheet, {
            cacheBust: true,
            pixelRatio: 3,
            quality: 0.95,
            skipFonts: true, // Evita error de CORS con Google Fonts
            preferredFontFormat: 'woff2'
        });
        const date = new Date().toISOString().split("T")[0];
        // Convertir data URL a blob
        const byteString = atob(dataUrl.split(',')[1]);
        const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
        }
        const blob = new Blob([ab], { type: mimeString });
        const filename = `heynow-cotizacion-${date}.png`;

        // Try multiple approaches for maximum browser compatibility
        try {
            // Approach 1: FileSaver (best cross-browser)
            saveAs(blob, filename);
        } catch (e) {
            // Approach 2: Manual link with explicit setAttribute
            console.warn("FileSaver failed for image, using fallback", e);
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.style.display = "none";
            link.href = url;
            link.setAttribute("download", filename);
            document.body.appendChild(link);
            link.click();
            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);
        }
    } catch (error) {
        console.error("No se pudo generar la imagen", error);
        toast.error("No pudimos generar la imagen. Intenta nuevamente.");
    } finally {
        refs.proposalPreview.style.display = "none";
        refs.proposalPreview.innerHTML = "";
    }
}

function handleImportJSON(data, store) {
    validateImportedData(data);
    const restored = {
        ...data,
        addons: new Set(data.addons || []),
        implementationExtras: new Set(data.implementationExtras || []),
        customIntegrations: data.customIntegrations || [],
    };
    delete restored.totals;
    delete restored.generatedAt;
    store.setState(restored);
}

function validateImportedData(data) {
    if (!data || typeof data !== "object") {
        throw new Error("Formato de archivo inválido");
    }
    if (typeof data.implementation !== "string") {
        throw new Error("Campo 'implementation' debe ser una cadena de texto");
    }
    if (typeof data.partner !== "string") {
        throw new Error("Campo 'partner' debe ser una cadena de texto");
    }
}
