/**
 * Advanced Proposal Modal Handlers
 * Manages all logic for the advanced AI proposal generation modal
 */

import { aiProposalServiceV2 } from '../services/ai-proposal-v2.js';
import { FlowManager } from '../ui/components/flow-manager.js';
import { OutboundManager } from '../ui/components/outbound-manager.js';
import { toast } from '../lib/toast.js';

// Global instances
let flowManager = null;
let outboundManager = null;
let currentQuoterData = null;
let restrictions = [];

/**
 * Initialize the advanced proposal modal
 */
export function initAdvancedProposalModal(refs, store) {
    if (!refs.proposalAdvancedModal) {
        console.warn('Advanced proposal modal not found');
        return;
    }

    // Initialize component managers
    initializeComponents();

    // Setup event listeners
    setupEventListeners(refs, store);
}

/**
 * Initialize FlowManager and OutboundManager components
 */
function initializeComponents() {
    flowManager = new FlowManager('adv-flows-container', (flows) => {
        console.log('Flows updated:', flows.length);
    });

    outboundManager = new OutboundManager('adv-outbound-container', (outbound) => {
        console.log('Outbound updated:', outbound.length);
    });
}

/**
 * Setup all event listeners for the advanced modal
 */
function setupEventListeners(refs, store) {
    // Close modal
    const closeBtn = document.getElementById('close-proposal-advanced-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => closeAdvancedModal());
    }

    const cancelBtn = document.getElementById('cancel-advanced-proposal');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => closeAdvancedModal());
    }

    // Conditional field toggles
    setupConditionalFields();

    // Restrictions management
    setupRestrictionsManagement();

    // Auto-save form data on input changes
    setupAutoSave();

    // Form submission
    const form = document.getElementById('proposal-advanced-form');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleAdvancedFormSubmit(e, store);
        });
    }
}

/**
 * Setup auto-save functionality for form fields
 */
function setupAutoSave() {
    const form = document.getElementById('proposal-advanced-form');
    if (!form) return;

    // Save on input changes (debounced)
    let saveTimeout;
    form.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
            saveFormData();
        }, 1000); // Save after 1 second of inactivity
    });
}

/**
 * Save form data to localStorage
 */
function saveFormData() {
    const formData = {
        clientName: document.getElementById('adv-client-name')?.value || '',
        industry: document.getElementById('adv-industry')?.value || '',
        channels: document.getElementById('adv-channels')?.value || '',
        objective: document.getElementById('adv-objective')?.value || '',
        agentType: document.getElementById('adv-agent-type')?.value || '',
        escalationEnabled: document.getElementById('adv-escalation-enabled')?.checked || false,
        restrictions: restrictions.map(r => r.text),
        timestamp: Date.now()
    };

    localStorage.setItem('heynow_advanced_form_data', JSON.stringify(formData));
    console.log('📁 Form data auto-saved');
}

/**
 * Load saved form data from localStorage
 */
function loadFormData() {
    try {
        const savedData = localStorage.getItem('heynow_advanced_form_data');
        if (!savedData) return false;

        const formData = JSON.parse(savedData);

        // Load basic fields
        if (formData.clientName) document.getElementById('adv-client-name').value = formData.clientName;
        if (formData.industry) document.getElementById('adv-industry').value = formData.industry;
        if (formData.channels) document.getElementById('adv-channels').value = formData.channels;
        if (formData.objective) document.getElementById('adv-objective').value = formData.objective;
        if (formData.agentType) document.getElementById('adv-agent-type').value = formData.agentType;
        if (formData.escalationEnabled) document.getElementById('adv-escalation-enabled').checked = formData.escalationEnabled;

        // Load restrictions
        if (formData.restrictions && formData.restrictions.length > 0) {
            const list = document.getElementById('adv-restrictions-list');
            restrictions = [];
            formData.restrictions.forEach(text => {
                if (text) addRestriction(text, list);
            });
        }

        console.log('✅ Form data loaded from auto-save');
        return true;
    } catch (error) {
        console.error('Error loading form data:', error);
        return false;
    }
}

/**
 * Setup conditional field visibility
 */
function setupConditionalFields() {
    // No conditional fields needed anymore  
    // Escalation is just a simple checkbox now
}


/**
 * Setup restrictions management
 */
function setupRestrictionsManagement() {
    const addBtn = document.getElementById('adv-add-restriction-btn');
    const input = document.getElementById('adv-restriction-input');
    const list = document.getElementById('adv-restrictions-list');

    if (addBtn && input && list) {
        addBtn.addEventListener('click', () => {
            const value = input.value.trim();
            if (value) {
                addRestriction(value, list);
                input.value = '';
            }
        });

        // Also add on Enter key
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addBtn.click();
            }
        });
    }
}

/**
 * Add a restriction to the list
 */
function addRestriction(text, list) {
    const id = `restriction-${Date.now()}`;
    restrictions.push({ id, text });

    const item = document.createElement('div');
    item.className = 'restriction-item';
    item.dataset.restrictionId = id;

    const textSpan = document.createElement('span');
    textSpan.className = 'restriction-item-text';
    textSpan.textContent = text;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-restriction';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
        restrictions = restrictions.filter(r => r.id !== id);
        item.remove();
    });

    item.appendChild(textSpan);
    item.appendChild(removeBtn);
    list.appendChild(item);
}

/**
 * Open the advanced modal and pre-fill with quoter data
 */
export function openAdvancedModal(quoterData) {
    currentQuoterData = quoterData;

    // Try to load saved form data first
    const hasLoadedData = loadFormData();

    // If no saved data, pre-fill from quoter
    if (!hasLoadedData) {
        const mappedData = aiProposalServiceV2.mapQuoterToAdvancedData(quoterData);
        preFillForm(mappedData);
    }

    // Show modal
    const modal = document.getElementById('proposal-advanced-modal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

/**
 * Close the advanced modal
 */
function closeAdvancedModal() {
    const modal = document.getElementById('proposal-advanced-modal');
    if (modal) {
        modal.style.display = 'none';
    }

    // Reset form
    const form = document.getElementById('proposal-advanced-form');
    if (form) {
        form.reset();
    }

    // Clear components
    flowManager.setFlows([]);
    outboundManager.setOutboundFlows([]);
    restrictions = [];
    document.getElementById('adv-restrictions-list').innerHTML = '';
}

/**
 * Pre-fill the form with mapped quoter data
 */
function preFillForm(mappedData) {
    // General data
    document.getElementById('adv-client-name').value = mappedData.general.cliente || '';
    document.getElementById('adv-industry').value = mappedData.general.industria || '';
    document.getElementById('adv-channels').value = mappedData.general.canales?.join(', ') || 'WhatsApp';
    document.getElementById('adv-objective').value = mappedData.general.objetivo || '';

    // Solution type (only agent type now)
    document.getElementById('adv-agent-type').value = mappedData.solution.tipoAgente || '';

    // Set flows (KB and Integration data is now within flows)
    if (flowManager) {
        flowManager.setFlows(mappedData.flujos || []);
    }

    // Set outbound
    if (outboundManager) {
        outboundManager.setOutboundFlows(mappedData.outbound || []);
    }
}

// displayIntegrations function removed - integrations are now part of individual flows

/**
 * Handle advanced form submission
 */
async function handleAdvancedFormSubmit(e, store) {
    const submitBtn = document.getElementById('submit-advanced-proposal');
    if (!submitBtn) return;

    try {
        // Add loading state
        submitBtn.disabled = true;
        submitBtn.classList.add('loading');

        // Collect all form data
        const advancedData = collectFormData();

        // Validate (FlowManager has built-in validation)
        const flowValidation = flowManager.validate();
        if (!flowValidation.valid) {
            toast.error(flowValidation.error);
            return;
        }

        // Generate proposal
        const proposalText = await aiProposalServiceV2.generateAdvancedProposal(advancedData);

        // Show result in the same result modal as simple mode
        const resultModal = document.getElementById('proposal-result-modal');
        const proposalContent = document.getElementById('proposal-content');

        if (proposalContent && resultModal) {
            // Convert markdown to HTML using marked.js
            if (typeof marked !== 'undefined') {
                proposalContent.innerHTML = marked.parse(proposalText);
            } else {
                // Fallback if marked.js not loaded
                proposalContent.innerHTML = `<pre style="white-space: pre-wrap; font-family: inherit; line-height: 1.8;">${proposalText}</pre>`;
            }
            resultModal.style.display = 'flex';
        }

        // Close advanced modal
        closeAdvancedModal();

        // Success feedback
        toast.success('¡Propuesta generada exitosamente!');

    } catch (error) {
        toast.error(`Error: ${error.message}`);
        console.error('Advanced proposal generation error:', error);
    } finally {
        submitBtn.disabled = false;
        submitBtn.classList.remove('loading');
    }
}

/**
 * Collect all form data into the schema format
 */
function collectFormData() {
    return {
        general: {
            cliente: document.getElementById('adv-client-name').value,
            industria: document.getElementById('adv-industry').value,
            canales: document.getElementById('adv-channels').value.split(',').map(c => c.trim()).filter(c => c),
            objetivo: document.getElementById('adv-objective').value
        },
        solution: {
            tipoAgente: document.getElementById('adv-agent-type').value
            // idiomas and tono removed - not needed for commercial proposals
        },
        flujos: flowManager.getFlows(),
        // KB and Integrations are now part of individual flows, not separate sections
        knowledgeBase: null,
        integraciones: null,
        derivacion: {
            habilitado: document.getElementById('adv-escalation-enabled').checked
            // habilidades and niveles removed - not needed for commercial proposals
        },
        outbound: outboundManager.getOutboundFlows(),
        restricciones: restrictions.map(r => r.text),
        quoterData: currentQuoterData
    };
}
