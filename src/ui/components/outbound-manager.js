/**
 * OutboundManager Component
 * Manages CRUD operations for outbound flows in the advanced proposal form
 */
export class OutboundManager {
    constructor(containerId, onOutboundChange) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.outboundFlows = [];
        this.onOutboundChange = onOutboundChange || (() => { });
        this.editingFlowId = null;

        if (!this.container) {
            console.error(`Container with id "${containerId}" not found`);
            return;
        }

        this.render();
    }

    /**
     * Render the complete OutboundManager UI
     */
    render() {
        this.container.innerHTML = `
            <div class="outbound-manager">
                <div class="outbound-list" id="${this.containerId}-list">
                    ${this.renderOutboundList()}
                </div>
                
                <button type="button" class="btn ghost outbound-add-btn" id="${this.containerId}-add-btn">
                    ➕ Agregar Flujo Outbound
                </button>
                
                <div class="outbound-form-modal" id="${this.containerId}-modal" style="display: none;">
                    <div class="outbound-form-content">
                        <div class="outbound-form-header">
                            <h4 id="${this.containerId}-form-title">Nuevo Flujo Outbound</h4>
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
     * Render the list of outbound flows
     */
    renderOutboundList() {
        if (this.outboundFlows.length === 0) {
            return `
                <div class="outbound-empty-state">
                    <p>No hay flujos outbound definidos. Agrega flujos de mensajes salientes si aplica.</p>
                </div>
            `;
        }

        return this.outboundFlows.map(flow => `
            <div class="outbound-card" data-outbound-id="${flow.id}">
                <div class="outbound-card-header">
                    <h5>📤 ${flow.nombre}</h5>
                    <div class="outbound-card-actions">
                        <button type="button" class="btn-icon edit-outbound" data-outbound-id="${flow.id}" title="Editar">
                            ✏️
                        </button>
                        <button type="button" class="btn-icon remove-outbound" data-outbound-id="${flow.id}" title="Eliminar">
                            🗑️
                        </button>
                    </div>
                </div>
                <div class="outbound-card-body">
                    <div class="outbound-details">
                        <div class="outbound-detail-item">
                            <strong>Trigger:</strong> ${flow.trigger}
                        </div>
                        <div class="outbound-detail-item">
                            <strong>Sistema fuente:</strong> ${flow.sistemaFuente}
                        </div>
                        <div class="outbound-detail-item">
                            <strong>Canal:</strong> ${flow.canal}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render the outbound form
     */
    renderOutboundForm() {
        const flow = this.editingFlowId ? this.outboundFlows.find(f => f.id === this.editingFlowId) : null;

        return `
            <form id="${this.containerId}-form" class="outbound-form">
                <div class="form-group">
                    <label for="${this.containerId}-nombre">Nombre del Flujo *</label>
                    <input 
                        type="text" 
                        id="${this.containerId}-nombre" 
                        name="nombre"
                        value="${flow ? flow.nombre : ''}"
                        placeholder="Ej: Recordatorio de cita"
                        required
                    />
                </div>

                <div class="form-group">
                    <label for="${this.containerId}-trigger">Evento que dispara el mensaje *</label>
                    <textarea 
                        id="${this.containerId}-trigger" 
                        name="trigger"
                        rows="2"
                        placeholder="Ej: Cita agendada para el día siguiente"
                        required
                    >${flow ? flow.trigger : ''}</textarea>
                </div>

                <div class="form-group">
                    <label for="${this.containerId}-sistemaFuente">Sistema Fuente *</label>
                    <input 
                        type="text" 
                        id="${this.containerId}-sistemaFuente" 
                        name="sistemaFuente"
                        value="${flow ? flow.sistemaFuente : ''}"
                        placeholder="Ej: Sistema de Agendas, ERP, CRM"
                        required
                    />
                </div>

                <div class="form-group">
                    <label for="${this.containerId}-canal">Canal de Envío *</label>
                    <select id="${this.containerId}-canal" name="canal" required>
                        <option value="">Seleccionar...</option>
                        <option value="WhatsApp" ${flow && flow.canal === 'WhatsApp' ? 'selected' : ''}>WhatsApp</option>
                        <option value="Email" ${flow && flow.canal === 'Email' ? 'selected' : ''}>Email</option>
                        <option value="SMS" ${flow && flow.canal === 'SMS' ? 'selected' : ''}>SMS</option>
                        <option value="Push Notification" ${flow && flow.canal === 'Push Notification' ? 'selected' : ''}>Push Notification</option>
                    </select>
                </div>

                <div class="outbound-form-actions">
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
     * Attach event listeners
     */
    attachEventListeners() {
        // Add outbound button
        const addBtn = document.getElementById(`${this.containerId}-add-btn`);
        if (addBtn) {
            addBtn.addEventListener('click', () => this.openModal());
        }

        // Close modal button
        const closeBtn = document.getElementById(`${this.containerId}-close-modal`);
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }

        // Cancel button
        const cancelBtn = document.getElementById(`${this.containerId}-cancel-btn`);
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.closeModal());
        }

        // Form submission
        const form = document.getElementById(`${this.containerId}-form`);
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Edit and remove buttons (event delegation)
        const outboundList = document.getElementById(`${this.containerId}-list`);
        if (outboundList) {
            outboundList.addEventListener('click', (e) => {
                if (e.target.classList.contains('edit-outbound') || e.target.closest('.edit-outbound')) {
                    const btn = e.target.classList.contains('edit-outbound') ? e.target : e.target.closest('.edit-outbound');
                    const flowId = btn.dataset.outboundId;
                    this.editOutbound(flowId);
                } else if (e.target.classList.contains('remove-outbound') || e.target.closest('.remove-outbound')) {
                    const btn = e.target.classList.contains('remove-outbound') ? e.target : e.target.closest('.remove-outbound');
                    const flowId = btn.dataset.outboundId;
                    this.removeOutbound(flowId);
                }
            });
        }
    }

    /**
     * Open modal for adding/editing outbound flow
     */
    openModal(flowId = null) {
        this.editingFlowId = flowId;
        const modal = document.getElementById(`${this.containerId}-modal`);
        const title = document.getElementById(`${this.containerId}-form-title`);

        if (modal) {
            // Update form content
            const formContainer = modal.querySelector('.outbound-form-content');
            const header = formContainer.querySelector('.outbound-form-header');
            const existingForm = formContainer.querySelector('.outbound-form');
            if (existingForm) {
                existingForm.remove();
            }
            header.insertAdjacentHTML('afterend', this.renderOutboundForm());
            this.attachEventListeners(); // Re-attach for form

            modal.style.display = 'flex';

            if (title) {
                title.textContent = flowId ? 'Editar Flujo Outbound' : 'Nuevo Flujo Outbound';
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
            id: this.editingFlowId || `outbound-${Date.now()}`,
            nombre: formData.get('nombre'),
            trigger: formData.get('trigger'),
            sistemaFuente: formData.get('sistemaFuente'),
            canal: formData.get('canal')
        };

        if (this.editingFlowId) {
            // Update existing flow
            const index = this.outboundFlows.findIndex(f => f.id === this.editingFlowId);
            if (index !== -1) {
                this.outboundFlows[index] = flowData;
            }
        } else {
            // Add new flow
            this.outboundFlows.push(flowData);
        }

        this.closeModal();
        this.updateOutboundList();
        this.onOutboundChange(this.outboundFlows);
    }

    /**
     * Edit outbound flow
     */
    editOutbound(flowId) {
        this.openModal(flowId);
    }

    /**
     * Remove outbound flow
     */
    removeOutbound(flowId) {
        if (confirm('¿Estás seguro de eliminar este flujo outbound?')) {
            this.outboundFlows = this.outboundFlows.filter(f => f.id !== flowId);
            this.updateOutboundList();
            this.onOutboundChange(this.outboundFlows);
        }
    }

    /**
     * Update outbound list display
     */
    updateOutboundList() {
        const listContainer = document.getElementById(`${this.containerId}-list`);
        if (listContainer) {
            listContainer.innerHTML = this.renderOutboundList();
        }
    }

    /**
     * Get all outbound flows
     */
    getOutboundFlows() {
        return this.outboundFlows;
    }

    /**
     * Set outbound flows (for pre-filling)
     */
    setOutboundFlows(flows) {
        this.outboundFlows = flows || [];
        this.updateOutboundList();
    }

    /**
     * Validate (outbound flows are optional)
     */
    validate() {
        return {
            valid: true,
            error: null
        };
    }

    /**
     * Add a single outbound flow programmatically
     */
    addOutbound(flowData) {
        this.outboundFlows.push({
            id: flowData.id || `outbound-${Date.now()}`,
            ...flowData
        });
        this.updateOutboundList();
        this.onOutboundChange(this.outboundFlows);
    }
}
