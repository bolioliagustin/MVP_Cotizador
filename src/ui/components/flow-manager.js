/**
 * FlowManager Component
 * Manages CRUD operations for assistant flows in the advanced proposal form
 */
export class FlowManager {
    constructor(containerId, onFlowsChange) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.flows = [];
        this.onFlowsChange = onFlowsChange || (() => { });
        this.editingFlowId = null;

        if (!this.container) {
            console.error(`Container with id "${containerId}" not found`);
            return;
        }

        this.render();
    }

    /**
     * Render the complete FlowManager UI
     */
    render() {
        this.container.innerHTML = `
            <div class="flow-manager">
                <div class="flow-list" id="${this.containerId}-list">
                    ${this.renderFlowsList()}
                </div>
                
                <button type="button" class="btn ghost flow-add-btn" id="${this.containerId}-add-btn">
                    ➕ Agregar Flujo
                </button>
                
                <div class="flow-form-modal" id="${this.containerId}-modal" style="display: none;">
                    <div class="flow-form-content">
                        <div class="flow-form-header">
                            <h4 id="${this.containerId}-form-title">Nuevo Flujo</h4>
                            <button type="button" class="close-btn" id="${this.containerId}-close-modal">×</button>
                        </div>
                        <!-- Form will be added dynamically by openModal() -->
                    </div>
                </div>
            </div>
        `;

        this.attachEventListeners();
    }

    /**
     * Render the list of flows
     */
    renderFlowsList() {
        if (this.flows.length === 0) {
            return `
                <div class="flow-empty-state">
                    <p>No hay flujos definidos. Agrega al menos un flujo del asistente.</p>
                </div>
            `;
        }

        return this.flows.map(flow => `
            <div class="flow-card" data-flow-id="${flow.id}">
                <div class="flow-card-header">
                    <h5>${flow.nombre}</h5>
                    <div class="flow-card-actions">
                        <button type="button" class="btn-icon edit-flow" data-flow-id="${flow.id}" title="Editar">
                            ✏️
                        </button>
                        <button type="button" class="btn-icon remove-flow" data-flow-id="${flow.id}" title="Eliminar">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="flow-card-body">
                    <p class="flow-description">${flow.descripcion}</p>
                    <div class="flow-details">
                        ${flow.datosSolicitados && flow.datosSolicitados.length > 0 ?
                `<div class="flow-detail-item">
                                <strong>Datos solicitados:</strong> ${flow.datosSolicitados.join(', ')}
                            </div>` : ''}
                        <div class="flow-detail-item">
                            <strong>Fuente:</strong> ${flow.fuenteInfo}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render the flow form
     */
    renderFlowForm() {
        const flow = this.editingFlowId ? this.flows.find(f => f.id === this.editingFlowId) : null;

        return `
            <form id="${this.containerId}-form" class="flow-form">
                <div class="form-group">
                    <label for="${this.containerId}-nombre">Nombre del Flujo *</label>
                    <input 
                        type="text" 
                        id="${this.containerId}-nombre" 
                        name="nombre"
                        value="${flow ? flow.nombre : ''}"
                        placeholder="Ej: Consulta de estado de pedido"
                        required
                    />
                </div>

                <div class="form-group">
                    <label for="${this.containerId}-descripcion">Descripción Funcional *</label>
                    <textarea 
                        id="${this.containerId}-descripcion" 
                        name="descripcion"
                        rows="3"
                        placeholder="Describe qué hace este flujo y cómo se activa"
                        required
                    >${flow ? flow.descripcion : ''}</textarea>
                </div>

                <div class="form-group">
                    <label for="${this.containerId}-fuenteInfo">Fuente de Información *</label>
                    <select id="${this.containerId}-fuenteInfo" name="fuenteInfo" required>
                        <option value="">Seleccionar...</option>
                        <option value="Base de Conocimiento" ${flow && flow.fuenteInfo === 'Base de Conocimiento' ? 'selected' : ''}>Base de Conocimiento</option>
                        <option value="Integración" ${flow && flow.fuenteInfo === 'Integración' ? 'selected' : ''}>Integración (API/Sistema)</option>
                        <option value="JSON-CSV" ${flow && flow.fuenteInfo === 'JSON-CSV' ? 'selected' : ''}>JSON-CSV</option>
                        <option value="Mixto" ${flow && flow.fuenteInfo === 'Mixto' ? 'selected' : ''}>Mixto (KB + API)</option>
                    </select>
                </div>

                <!-- Campos condicionales para Base de Conocimiento -->
                <div id="${this.containerId}-kb-fields" class="conditional-fields" style="display: ${flow && flow.fuenteInfo === 'Base de Conocimiento' ? 'block' : 'none'};">
                    <div class="form-group">
                        <label for="${this.containerId}-kbSources">Fuentes de KB</label>
                        <input 
                            type="text" 
                            id="${this.containerId}-kbSources" 
                            name="kbSources"
                            value="${flow && flow.kbSources ? flow.kbSources : ''}"
                            placeholder="Ej: PDFs, FAQs, Manuales"
                        />
                        <small>Tipos de documentos que se cargarán</small>
                    </div>
                    <div class="form-group">
                        <label for="${this.containerId}-kbVolume">Volumen estimado</label>
                        <input 
                            type="text" 
                            id="${this.containerId}-kbVolume" 
                            name="kbVolume"
                            value="${flow && flow.kbVolume ? flow.kbVolume : ''}"
                            placeholder="Ej: 50 documentos, 200 páginas"
                        />
                    </div>
                </div>

                <!-- Campos condicionales para Integración -->
                <div id="${this.containerId}-integration-fields" class="conditional-fields" style="display: ${flow && flow.fuenteInfo === 'Integración' ? 'block' : 'none'};">
                    <div class="form-group">
                        <label for="${this.containerId}-datosSolicitados">Datos Solicitados al Usuario</label>
                        <input 
                            type="text" 
                            id="${this.containerId}-datosSolicitados" 
                            name="datosSolicitados"
                            value="${flow && flow.datosSolicitados ? flow.datosSolicitados.join(', ') : ''}"
                            placeholder="Ej: DNI, Email, Número de pedido"
                        />
                        <small>Datos que solicita al usuario para consultar la API</small>
                    </div>
                    <div class="form-group">
                        <label for="${this.containerId}-systemName">Sistema/API *</label>
                        <input 
                            type="text" 
                            id="${this.containerId}-systemName" 
                            name="systemName"
                            value="${flow && flow.systemName ? flow.systemName : ''}"
                            placeholder="Ej: Salesforce, ERP, API REST Interna"
                        />
                    </div>
                    <div class="form-group">
                        <label for="${this.containerId}-integrationType">Tipo de Integración</label>
                        <select id="${this.containerId}-integrationType" name="integrationType">
                            <option value="REST API" ${flow && flow.integrationType === 'REST API' ? 'selected' : ''}>REST API</option>
                            <option value="SOAP" ${flow && flow.integrationType === 'SOAP' ? 'selected' : ''}>SOAP</option>
                            <option value="GraphQL" ${flow && flow.integrationType === 'GraphQL' ? 'selected' : ''}>GraphQL</option>
                            <option value="Webhook" ${flow && flow.integrationType === 'Webhook' ? 'selected' : ''}>Webhook</option>
                            <option value="Base de datos" ${flow && flow.integrationType === 'Base de datos' ? 'selected' : ''}>Base de datos</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label for="${this.containerId}-acciones">Acciones del Asistente *</label>
                    <textarea 
                        id="${this.containerId}-acciones" 
                        name="acciones"
                        rows="2"
                        placeholder="Ej: Consultar API, validar información y responder al usuario"
                        required
                    >${flow ? flow.acciones : ''}</textarea>
                </div>

                <div class="flow-form-actions">
                    <button type="button" class="btn ghost" id="${this.containerId}-cancel-btn">
                        Cancelar
                    </button>
                    <button type="submit" class="btn primary">
                        ${flow ? 'Actualizar Flujo' : 'Agregar Flujo'}
                    </button>
                </div>
            </form>
        `;
    }

    /**
     * Attach event listeners (for main list and add button only)
     */
    attachEventListeners() {
        // Add flow button
        const addBtn = document.getElementById(`${this.containerId}-add-btn`);
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openModal());
        }

        // Edit and remove buttons (event delegation on list)
        const flowList = document.getElementById(`${this.containerId}-list`);
        if (flowList) {
            flowList.addEventListener('click', (e) => {
                if (e.target.classList.contains('edit-flow') || e.target.closest('.edit-flow')) {
                    const btn = e.target.classList.contains('edit-flow') ? e.target : e.target.closest('.edit-flow');
                    const flowId = btn.dataset.flowId;
                    this.editFlow(flowId);
                } else if (e.target.classList.contains('remove-flow') || e.target.closest('.remove-flow')) {
                    const btn = e.target.classList.contains('remove-flow') ? e.target : e.target.closest('.remove-flow');
                    const flowId = btn.dataset.flowId;
                    this.removeFlow(flowId);
                }
            });
        }
    }

    /**
     * Attach event listeners specifically for the modal form
     * This prevents duplication when reopening the modal
     */
    attachFormEventListeners(form) {
        // Close modal button (in header, outside form)
        const closeBtn = document.getElementById(`${this.containerId}-close-modal`);
        if (closeBtn) {
            // Clone to remove old listeners
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            newCloseBtn.addEventListener('click', () => this.closeModal());
        }

        // Cancel button (inside form  
        const cancelBtn = form.querySelector(`#${this.containerId}-cancel-btn`);
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeModal());
        }

        // Toggle conditional fields based on fuenteInfo selection
        const fuenteInfoSelect = form.querySelector(`#${this.containerId}-fuenteInfo`);
        const kbFields = form.querySelector(`#${this.containerId}-kb-fields`);
        const integrationFields = form.querySelector(`#${this.containerId}-integration-fields`);

        if (fuenteInfoSelect && kbFields && integrationFields) {
            fuenteInfoSelect.addEventListener('change', (e) => {
                const value = e.target.value;

                // Hide all conditional fields first
                kbFields.style.display = 'none';
                integrationFields.style.display = 'none';

                // Show relevant fields
                if (value === 'Base de Conocimiento') {
                    kbFields.style.display = 'block';
                } else if (value === 'Integración') {
                    integrationFields.style.display = 'block';
                } else if (value === 'Mixto') {
                    // Show both for mixed
                    kbFields.style.display = 'block';
                    integrationFields.style.display = 'block';
                }
            });
        }

        // Form submission
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    /**
     * Open modal for adding/editing flow
     */
    openModal(flowId = null) {
        this.editingFlowId = flowId;
        const modal = document.getElementById(`${this.containerId}-modal`);
        const title = document.getElementById(`${this.containerId}-form-title`);

        if (modal) {
            // Completely replace the form content to avoid duplication
            const formContainer = modal.querySelector('.flow-form-content');
            const existingForm = formContainer.querySelector('form');
            if (existingForm) {
                existingForm.remove();
            }

            // Create form element from HTML string
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = this.renderFlowForm();
            const newForm = tempDiv.firstElementChild;

            // Append new form to container
            formContainer.appendChild(newForm);

            // Attach event listeners ONLY to the new form
            this.attachFormEventListeners(newForm);

            modal.style.display = 'flex';

            if (title) {
                title.textContent = flowId ? 'Editar Flujo' : 'Nuevo Flujo';
            }
        }
    }

    /**
     * Close modal
     */
    closeModal() {
        const modal = document.getElementById(`${this.containerId}-modal`);
        if (modal) {
            modal.style.display = 'none';
        }
        this.editingFlowId = null;
    }

    /**
     * Handle form submission
     */
    handleFormSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const flowData = {
            id: this.editingFlowId || `flow-${Date.now()}`,
            nombre: formData.get('nombre'),
            descripcion: formData.get('descripcion'),
            datosSolicitados: formData.get('datosSolicitados')
                ? formData.get('datosSolicitados').split(',').map(d => d.trim()).filter(d => d)
                : [],
            fuenteInfo: formData.get('fuenteInfo'),
            acciones: formData.get('acciones'),
            // KB fields (if applicable)
            kbSources: formData.get('kbSources') || '',
            kbVolume: formData.get('kbVolume') || '',
            // Integration fields (if applicable)
            systemName: formData.get('systemName') || '',
            integrationType: formData.get('integrationType') || 'REST API'
        };

        if (this.editingFlowId) {
            // Update existing flow
            const index = this.flows.findIndex(f => f.id === this.editingFlowId);
            if (index !== -1) {
                this.flows[index] = flowData;
            }
        } else {
            // Add new flow
            this.flows.push(flowData);
        }

        this.closeModal();
        this.updateFlowsList();
        this.onFlowsChange(this.flows);
    }

    /**
     * Edit flow
     */
    editFlow(flowId) {
        this.openModal(flowId);
    }

    /**
     * Remove flow
     */
    removeFlow(flowId) {
        if (confirm('¿Estás seguro de eliminar este flujo?')) {
            this.flows = this.flows.filter(f => f.id !== flowId);
            this.updateFlowsList();
            this.onFlowsChange(this.flows);
        }
    }

    /**
     * Update flows list display
     */
    updateFlowsList() {
        const listContainer = document.getElementById(`${this.containerId}-list`);
        if (listContainer) {
            listContainer.innerHTML = this.renderFlowsList();
        }
    }

    /**
     * Get all flows
     */
    getFlows() {
        return this.flows;
    }

    /**
     * Set flows (for pre-filling)
     */
    setFlows(flows) {
        this.flows = flows || [];
        this.updateFlowsList();
    }

    /**
     * Validate that at least one flow exists
     */
    validate() {
        return {
            valid: this.flows.length > 0,
            error: this.flows.length === 0 ? 'Debe definir al menos un flujo del asistente' : null
        };
    }

    /**
     * Add a single flow programmatically
     */
    addFlow(flowData) {
        this.flows.push({
            id: flowData.id || `flow-${Date.now()}`,
            ...flowData
        });
        this.updateFlowsList();
        this.onFlowsChange(this.flows);
    }
}
