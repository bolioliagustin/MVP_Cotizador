import { GoogleGenerativeAI } from "@google/generative-ai";
import { catalog } from "../data/catalog.js";

/**
 * Service for generating project scope proposals using Google Gemini AI
 */
class AIProposalService {
    constructor() {
        this.apiKey = null;
        this.model = null;
    }

    /**
     * Set and persist API key
     */
    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('gemini_api_key', key);
        this.initializeModel();
    }

    /**
     * Get stored API key
     */
    getKey() {
        if (!this.apiKey) {
            this.apiKey = localStorage.getItem('gemini_api_key');
            if (this.apiKey) {
                this.initializeModel();
            }
        }
        return this.apiKey;
    }

    /**
     * Check if API key is configured
     */
    hasKey() {
        return !!this.getKey();
    }

    /**
     * Initialize Gemini model
     */
    initializeModel() {
        if (!this.apiKey) return;
        const genAI = new GoogleGenerativeAI(this.apiKey);
        this.model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }

    /**
     * Generate project scope proposal
     * @param {Object} quoterData - Data from the quoter (state, totals)
     * @param {Object} clientContext - Additional client context
     * @returns {Promise<string>} Generated proposal text
     */
    async generateProposal(quoterData, clientContext) {
        if (!this.hasKey()) {
            throw new Error("API Key de Google Gemini no configurada. Por favor configúrala primero.");
        }

        const prompt = this.buildPrompt(quoterData, clientContext);

        try {
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error("Error generating proposal:", error);
            if (error.message && error.message.includes('API_KEY_INVALID')) {
                throw new Error("API Key inválida. Por favor verifica tu clave de Google Gemini.");
            }
            throw new Error("No se pudo generar la propuesta. Intenta nuevamente.");
        }
    }

    /**
     * Build the AI prompt with all context
     */
    buildPrompt(quoterData, clientContext) {
        const { totals, state } = quoterData;
        const {
            clientName,
            industry,
            objective,
            useCase,
            agentType,
            knowledgeSources,
            integrationSystems,
            dataRequired,
            volume,
            painPoints
        } = clientContext;

        // Determine agent type label
        const agentTypeLabel = {
            'estatico': 'Base de Conocimiento Estática',
            'integracion': 'Con Integraciones a Servicios',
            'hibrido': 'Híbrido (Base de Conocimiento + Integraciones)'
        }[agentType] || agentType;

        return `Eres un consultor comercial experto en soluciones de Agentes IA conversacionales de HeyNow.

**DATOS DEL CLIENTE:**
- Cliente: ${clientName}
- Industria: ${industry}
- Objetivo: ${objective}
- Caso de Uso: ${useCase}
- Tipo de Agente: ${agentTypeLabel}
${knowledgeSources ? `- Fuentes de Conocimiento: ${knowledgeSources}` : ''}
${integrationSystems ? `- Sistemas/Servicios a Integrar: ${integrationSystems}` : ''}
${dataRequired ? `- Datos a Solicitar al Usuario: ${dataRequired}` : ''}
${volume ? `- Volumen Esperado: ${this.formatVolume(volume)}` : ''}
${painPoints ? `- Puntos de Dolor: ${painPoints}` : ''}

**SOLUCIÓN TÉCNICA PROPUESTA:**
- Implementación Base: ${this.getImplementationName(state.implementation)}
${this.formatComponents(state, totals)}

**INVERSIÓN:**
- Setup (pago único): USD $${totals.setupMargin.toLocaleString()}
- Mensual (recurrente): USD $${totals.monthlyMargin.toLocaleString()}
- Horas totales estimadas: ${totals.manualHours}h

**INSTRUCCIONES CRÍTICAS:**

Genera ÚNICAMENTE la sección de "Alcance del Proyecto" para un **Agente IA conversacional** de HeyNow.

**ESTRUCTURA REQUERIDA:**

1. **Breve Introducción de la Solución** (2-3 líneas)
   - Qué problema resuelve
   - Canal principal (WhatsApp, etc.)
   - Tipo de agente (estático/integraciones)

2. **Detalle de Casos de Uso**
   
   Para CADA caso de uso, debes explicar:
   
   **SI ES ESTÁTICO (Base de conocimiento):**
   - Mencionar SIEMPRE el "entrenamiento de la base de conocimiento"
   - Especificar fuentes: documentos (PDFs, Word, TXT), scraping web, FAQs
   - Explicar que el agente responde basándose en esta información estática
   - Ejemplo: "El agente será entrenado con una base de conocimiento construida a partir de [fuentes], permitiendo responder consultas sobre [temas] de forma automática."
   
   **SI TIENE INTEGRACIONES:**
   - Qué datos se le solicitan al usuario (DNI, número de cliente, etc.)
   - Con qué sistema/servicio se conecta (CRM, API, base de datos)
   - Cómo se realiza la integración (API REST, webhooks, consulta a BD)
   - Qué información dinámica se obtiene y se devuelve al usuario
   - Ejemplo: "El asistente solicitará al usuario su [dato X], se conectará con [sistema Y] mediante [método Z], y devolverá información personalizada sobre [resultado]."
   
   **SI ES HÍBRIDO:**
   - Explicar AMBAS partes claramente
   - Diferenciar qué se resuelve con conocimiento estático vs qué requiere integración

3. **Flujos Adicionales** (solo si aplica)
   - Escalación a agente humano
   - Modificación/cancelación
   - Mensajes proactivos (outbound)

**ESTILO DE ESCRITURA:**

✅ **Técnico pero claro** - No jerga excesiva, explicativo
✅ **Centrado en PROCESOS y FLUJOS** - Explicar el CÓMO paso a paso
✅ **Usar negritas** para términos clave y nombres de sistemas
✅ **Listas numeradas** para pasos del proceso
✅ **Actores claros** - Especificar quién hace qué (asistente IA, usuario, sistema, agente humano)
✅ **Mencionar integraciones específicas** cuando aplique (nombre del CRM, API, etc.)

**DIFERENCIACIÓN CLAVE (MUY IMPORTANTE):**

🔴 **Para casos ESTÁTICOS**: SIEMPRE mencionar explícitamente:
   - "Entrenamiento de base de conocimiento"
   - "A través de documentos" o "mediante scraping web"
   - Esto evita confusiones con integraciones

🔴 **Para casos con INTEGRACIONES**: SIEMPRE detallar:
   - Qué datos se solicitan
   - A qué servicio se conecta
   - Cómo se conecta (API, webhook, etc.)
   - Qué datos dinámicos devuelve

**EXTENSIÓN:**
- Si la información del cliente es ESCASA → Propuesta CORTA y simple
- Si la información del cliente es COMPLETA → Propuesta MÁS DETALLADA
- Sé claro y explicativo, pero NO extensivo ni repetitivo

**LO QUE NO DEBES INCLUIR:**
❌ Resumen ejecutivo
❌ Cronograma detallado
❌ Desglose de inversión (ya está en otra sección)
❌ Próximos pasos comerciales
❌ Supuestos y exclusiones
❌ Lenguaje de venta agresiva
❌ Features listadas sin explicar el flujo

**IMPORTANTE:** 
- Genera SOLO el contenido del alcance
- NO agregues introducciones como "Aquí está el alcance..."
- Empieza directo con el título del proyecto
- Enfócate en EXPLICAR CÓMO FUNCIONA el agente IA, no solo QUÉ hace`;
    }

    getImplementationName(implId) {
        const impl = catalog.implementations.find(i => i.id === implId);
        return impl ? impl.name : implId;
    }

    formatVolume(volume) {
        const volumeLabels = {
            'bajo': 'Bajo (< 1,000 conv/mes)',
            'medio': 'Medio (1K - 10K conv/mes)',
            'alto': 'Alto (10K - 50K conv/mes)',
            'muy-alto': 'Muy Alto (> 50K conv/mes)'
        };
        return volumeLabels[volume] || volume;
    }

    formatComponents(state, totals) {
        let output = '';

        if (state.addons && state.addons.size > 0) {
            const addonNames = Array.from(state.addons).map(id => {
                const addon = catalog.addons.find(a => a.id === id);
                return addon ? addon.name : id;
            });
            output += `\n- Add-ons: ${addonNames.join(', ')}`;
        }

        if (state.integrations) {
            const integration = catalog.integrations.find(i => i.id === state.integrations);
            if (integration) {
                output += `\n- Integración de Catálogo: ${integration.name}`;
            }
        }

        if (state.customIntegrations && state.customIntegrations.length > 0) {
            const customList = state.customIntegrations.map(ci => ci.name).join(', ');
            output += `\n- Integraciones Personalizadas: ${customList}`;
        }

        // Session packages
        if (state.sessionPackageId) {
            const pkg = catalog.sessionPackages.find(p => p.id === state.sessionPackageId);
            if (pkg) {
                output += `\n- Paquete de Sesiones: ${pkg.name}`;
            }
        }

        return output;
    }
}

export const aiProposalService = new AIProposalService();
