import { catalog } from "../data/catalog.js";

/**
 * Advanced AI Proposal Service (v2)
 * Implements the master prompt with complete proposal structure
 * Uses OpenRouter API for multi-model access
 */
class AIProposalServiceV2 {
    constructor() {
        this.apiKey = null;
        this.baseURL = 'https://openrouter.ai/api/v1';
        this.model = 'google/gemini-3-pro-preview'; // Default model
    }

    /**
     * Set and persist API key
     */
    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('openrouter_api_key', key);
    }

    /**
     * Get stored API key
     */
    getKey() {
        if (!this.apiKey) {
            // Try environment variable first
            const envKey = import.meta.env.VITE_OPENROUTER_API_KEY;
            if (envKey) {
                this.apiKey = envKey;
                return this.apiKey;
            }

            // Fallback to localStorage
            this.apiKey = localStorage.getItem('openrouter_api_key');
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
     * Set model to use (can be changed dynamically)
     */
    setModel(model) {
        this.model = model;
    }

    /**
     * Generate advanced proposal using master prompt via OpenRouter
     * @param {Object} advancedData - Complete proposal data (see schema in plan)
     * @returns {Promise<string>} Generated proposal text
     */
    async generateAdvancedProposal(advancedData, retryCount = 0) {
        if (!this.hasKey()) {
            throw new Error("API Key de OpenRouter no configurada. Por favor configúrala primero.");
        }

        // Validate input data
        const validation = this.validateAdvancedData(advancedData);
        if (!validation.valid) {
            throw new Error(`Datos inválidos: ${validation.errors.join(', ')}`);
        }

        const prompt = this.buildMasterPrompt(advancedData);
        const maxRetries = 2;

        try {
            const response = await fetch(`${this.baseURL}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': window.location.origin,
                    'X-Title': 'Heynow Cotizador'
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.7,
                    max_tokens: 4000
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                throw new Error('Respuesta inválida de OpenRouter');
            }

            return data.choices[0].message.content;

        } catch (error) {
            console.error("Error generating advanced proposal:", error);

            // Error handling
            if (error.message && error.message.includes('401')) {
                throw new Error("API Key inválida. Por favor verifica tu clave de OpenRouter.");
            }

            if (error.message && (error.message.includes('503') || error.message.includes('overloaded'))) {
                if (retryCount < maxRetries) {
                    const waitTime = Math.pow(2, retryCount) * 1000;
                    console.log(`Model overloaded. Retrying in ${waitTime / 1000}s...`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                    return this.generateAdvancedProposal(advancedData, retryCount + 1);
                } else {
                    throw new Error("El modelo de IA está sobrecargado. Intenta nuevamente en unos minutos.");
                }
            }

            if (error.message && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('rate limit'))) {
                throw new Error("Has excedido el límite de solicitudes. Espera unos minutos antes de intentar nuevamente.");
            }

            throw new Error("No se pudo generar la propuesta. Error: " + (error.message || "Desconocido"));
        }
    }

    /**
     * Build the master prompt with all sections
     */
    buildMasterPrompt(data) {
        const { general, solution, flujos, knowledgeBase, integraciones, derivacion, outbound, restricciones } = data;

        // Format context sections
        const contextSection = this.formatGeneralContext(general, solution);
        const flujosSection = this.formatFlujosSection(flujos);
        const kbSection = knowledgeBase?.habilitado ? this.formatKnowledgeBaseSection(knowledgeBase) : '';
        const integracionesSection = integraciones?.length > 0 ? this.formatIntegracionesSection(integraciones) : '';
        const derivacionSection = derivacion?.habilitado ? this.formatDerivacionSection(derivacion) : '';
        const outboundSection = outbound?.length > 0 ? this.formatOutboundSection(outbound) : '';

        return `Eres un **especialista en pre-venta y diseño de soluciones conversacionales** para Heynow. Tu tarea es redactar el **Alcance del Proyecto** de una propuesta comercial en español, con estilo profesional, claro y consistente.

El texto final debe quedar **listo para pegar en PPT o documento** (PDF). Debe describir qué se va a construir, cómo funcionará y qué dependencias requiere del cliente.

---

## DATOS DEL CLIENTE:

${contextSection}

---

## REGLAS CRÍTICAS DE NOMENCLATURA:

**OBLIGATORIO:**
- Referirse al agente siempre como **"Agente IA"** (nunca "bot", "asistente virtual", etc.)
- Escribir **"Heynow"** con H mayúscula (nunca "heynow", "HeyNow")
- NO inventar datos, funcionalidades o capacidades no mencionadas
- NO repetir la misma idea con otras palabras
- NO agregar ejemplos ficticios

---

## INTRODUCCIÓN OBLIGATORIA:

**La primera sección DEBE comenzar así:**
"El proyecto contempla el desarrollo de un Agente IA para [NOMBRE_EMPRESA] capaz de asistir a los usuarios [SEGÚN_OBJETIVO]."

Ejemplos:
- "...capaz de asistir a los usuarios en la gestión de citas médicas y consultas frecuentes."
- "...capaz de asistir a los usuarios en el proceso de compra y consulta de productos."

---

## ESTRUCTURA DEL DOCUMENTO:

1. **Alcance del proyecto** (usar intro obligatoria)
2. **Flujos del Agente IA** (narrativo, NO solo bullets)
${kbSection ? '3. **Base de conocimiento**\n' : ''}${integracionesSection ? (kbSection ? '4' : '3') + '. **Integraciones**\n' : ''}${derivacionSection ? (kbSection && integracionesSection ? '5' : kbSection || integracionesSection ? '4' : '3') + '. **Derivación a atención humana**\n' : ''}${outboundSection ? 'N. **Flujos de servicio (Outbound)**\n' : ''}${restricciones?.length > 0 ? 'N+1. **Consideraciones**' : ''}

---

## INSTRUCCIONES DE REDACCIÓN:

**Estilo:**
- Español neutro profesional
- Frases claras, párrafos cortos (máximo 4-5 líneas)
- SER CONCISO - evitar redundancia
- NO usar bullets excesivos

**Para describir cada flujo (NARRATIVO):**

Describe cada flujo como párrafo narrativo explicando:
- Cómo se activa (pregunta, opción de menú)
- Proceso paso a paso del Agente IA
- Qué datos solicita - SOLO LOS MENCIONADOS
- De dónde obtiene info (API/KB/sistema específico)
- Qué responde al usuario
- Qué pasa si no puede resolver

Ejemplo: "El flujo de consulta de saldo se activa cuando el usuario pregunta por su saldo. El Agente IA solicita el DNI, consulta la API bancaria y presenta el saldo disponible. Si hay error, ofrece derivar a asesor."

**Para Base de Conocimiento:**
- Explicar que el asistente será entrenado con contenidos provistos por el cliente
- Enumerar formatos permitidos según los datos provistos
- Aclarar que la capacidad de respuesta depende del contenido cargado
- Si no está en KB o requiere validación → derivar a humano o ticket

**Para Integraciones:**
- Indicar propósito de cada integración
- Aclarar dependencia: "El cliente deberá proporcionar documentación técnica, accesos y endpoints"
- Si hay múltiples sistemas, dejar explícito cuál es para qué

**Para Derivación humana:**
- Explicar que el usuario puede solicitarlo en cualquier momento
- Indicar que se mantiene contexto de la conversación
- Si hay habilidades/niveles, describirlo

**Para Outbound:**
- Debe ir al final, separado del asistente
- Explicar que es proceso automático
- Mencionar que frecuencia se define durante desarrollo
- Qué pasa si el usuario responde

**Consideraciones finales:**
- Contenido extra o nuevos flujos → cotización adicional
- Documentación técnica y accesos → a cargo del cliente
- Frecuencia de procesos → definida durante desarrollo

---

## REGLAS CRÍTICAS:

✅ USAR SOLO datos proporcionados
✅ Técnico pero claro
✅ Narrativo en flujos
✅ "Agente IA" y "Heynow" correctamente
✅ Usar **negritas** para términos clave

❌ NO inventar datos/funcionalidades
❌ NO repetir conceptos
❌ NO incluir: cronograma, inversión, supuestos
❌ NO agregar "Aquí está el alcance..."
❌ Empezar directo con intro obligatoria

**CRÍTICO:** Usa SOLO información proporcionada. Si falta algo, omítelo.

Genera ÚNICAMENTE el contenido del alcance en formato Markdown simple.`;
    }

    /**
     * Format general context section
     */
    formatGeneralContext(general, solution) {
        let context = '';

        if (general.cliente) context += `- **Cliente:** ${general.cliente}\n`;
        if (general.industria) context += `- **Industria:** ${general.industria}\n`;
        if (general.canales && general.canales.length > 0) {
            context += `- **Canales:** ${general.canales.join(', ')}\n`;
        }
        if (general.objetivo) context += `- **Objetivo:** ${general.objetivo}\n`;

        if (solution.tipoAgente) context += `- **Tipo de Agente:** ${solution.tipoAgente}\n`;
        if (solution.idiomas && solution.idiomas.length > 0) {
            context += `- **Idiomas:** ${solution.idiomas.join(', ')}\n`;
        }
        if (solution.tono) context += `- **Tono:** ${solution.tono}\n`;

        return context;
    }

    /**
     * Format flows section
     */
    formatFlujosSection(flujos) {
        if (!flujos || flujos.length === 0) return '';

        // Debug: Log what we're receiving
        console.log('🔍 formatFlujosSection received:', JSON.stringify(flujos, null, 2));

        let section = '\n**FLUJOS DEFINIDOS:**\n\n';

        flujos.forEach((flujo, index) => {
            section += `**Flujo ${index + 1}: ${flujo.nombre}**\n`;
            if (flujo.descripcion) section += `- Descripción: ${flujo.descripcion}\n`;
            if (flujo.datosSolicitados && flujo.datosSolicitados.length > 0) {
                section += `- Datos solicitados: ${flujo.datosSolicitados.join(', ')}\n`;
            }
            if (flujo.fuenteInfo) section += `- Fuente de información: ${flujo.fuenteInfo}\n`;

            // Include KB details if present
            if (flujo.fuenteInfo === 'Base de Conocimiento' || flujo.fuenteInfo === 'Mixto') {
                if (flujo.kbSources) section += `  - Fuentes KB: ${flujo.kbSources}\n`;
                if (flujo.kbVolume) section += `  - Volumen: ${flujo.kbVolume}\n`;
            }

            // Include integration details if present
            if (flujo.fuenteInfo === 'Integración' || flujo.fuenteInfo === 'Mixto') {
                console.log(`🔍 Flujo ${index + 1} is Integration/Mixto, systemName:`, flujo.systemName, 'integrationType:', flujo.integrationType);
                if (flujo.systemName) section += `  - Sistema/API: ${flujo.systemName}\n`;
                if (flujo.integrationType) section += `  - Tipo: ${flujo.integrationType}\n`;
            }

            if (flujo.acciones) section += `- Acciones: ${flujo.acciones}\n`;
            if (flujo.derivacion && flujo.derivacion !== 'Ninguna') {
                section += `- Derivación: ${flujo.derivacion}\n`;
            }
            if (flujo.sistemas && flujo.sistemas.length > 0) {
                section += `- Sistemas involucrados: ${flujo.sistemas.join(', ')}\n`;
            }
            section += '\n';
        });

        console.log('📝 formatFlujosSection output:', section);
        return section;
    }

    /**
     * Format knowledge base section
     */
    formatKnowledgeBaseSection(kb) {
        let section = '\n**BASE DE CONOCIMIENTO:**\n';

        if (kb.fuentes && kb.fuentes.length > 0) {
            section += `- Fuentes: ${kb.fuentes.join(', ')}\n`;
        }
        if (kb.volumen) section += `- Volumen: ${kb.volumen}\n`;
        if (kb.metodoCarga) section += `- Método de carga: ${kb.metodoCarga}\n`;
        if (kb.frecuenciaActualizacion) {
            section += `- Frecuencia de actualización: ${kb.frecuenciaActualizacion}\n`;
        }

        return section;
    }

    /**
     * Format integrations section
     */
    formatIntegracionesSection(integraciones) {
        let section = '\n**INTEGRACIONES:**\n\n';

        integraciones.forEach((integ, index) => {
            section += `${index + 1}. **${integ.sistema}**\n`;
            if (integ.proposito) section += `   - Propósito: ${integ.proposito}\n`;
            if (integ.tipo) section += `   - Tipo: ${integ.tipo}\n`;
            if (integ.responsable) section += `   - Responsable: ${integ.responsable}\n`;
        });

        return section;
    }

    /**
     * Format escalation section
     */
    formatDerivacionSection(derivacion) {
        let section = '\n**DERIVACIÓN A HUMANO:**\n';

        if (derivacion.momento) section += `- Momento: ${derivacion.momento}\n`;
        if (derivacion.destino) section += `- Destino: ${derivacion.destino}\n`;
        if (derivacion.habilidades) section += `- Uso de habilidades/routing: Sí\n`;
        if (derivacion.niveles) section += `- Niveles: ${derivacion.niveles}\n`;

        return section;
    }

    /**
     * Format outbound section
     */
    formatOutboundSection(outbound) {
        let section = '\n**FLUJOS OUTBOUND:**\n\n';

        outbound.forEach((flow, index) => {
            section += `**${index + 1}. ${flow.nombre}**\n`;
            if (flow.trigger) section += `- Trigger: ${flow.trigger}\n`;
            if (flow.sistemaFuente) section += `- Sistema fuente: ${flow.sistemaFuente}\n`;
            if (flow.canal) section += `- Canal: ${flow.canal}\n`;
            if (flow.respuestaUsuario) section += `- Si el usuario responde: ${flow.respuestaUsuario}\n`;
            if (flow.frecuencia) section += `- Frecuencia: ${flow.frecuencia}\n`;
            section += '\n';
        });

        return section;
    }

    /**
     * Validate advanced data structure
     */
    validateAdvancedData(data) {
        const errors = [];

        // Validate general section
        if (!data.general) {
            errors.push("Sección 'general' es obligatoria");
        } else {
            if (!data.general.cliente) errors.push("Nombre del cliente es obligatorio");
            if (!data.general.objetivo) errors.push("Objetivo es obligatorio");
        }

        // Validate solution section
        if (!data.solution) {
            errors.push("Sección 'solution' es obligatoria");
        } else {
            if (!data.solution.tipoAgente) errors.push("Tipo de agente es obligatorio");
        }

        // Validate flows (at least one required)
        if (!data.flujos || data.flujos.length === 0) {
            errors.push("Debe definir al menos un flujo del asistente");
        } else {
            data.flujos.forEach((flujo, index) => {
                if (!flujo.nombre) errors.push(`Flujo ${index + 1}: nombre es obligatorio`);
                if (!flujo.descripcion) errors.push(`Flujo ${index + 1}: descripción es obligatoria`);
            });
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Map quoter data to pre-fill advanced form
     * This helps integrate with the existing quoter
     */
    mapQuoterToAdvancedData(quoterData) {
        const { state, totals } = quoterData;
        const mapped = {
            general: {
                cliente: '',
                industria: '',
                canales: ['WhatsApp'], // Default
                objetivo: ''
            },
            solution: {
                tipoAgente: 'IA Generativa',
                idiomas: ['Español'],
                tono: 'profesional'
            },
            flujos: [],
            knowledgeBase: {
                habilitado: false,
                fuentes: [],
                volumen: '',
                metodoCarga: '',
                frecuenciaActualizacion: 'A definir'
            },
            integraciones: [],
            derivacion: {
                habilitado: false,
                momento: '',
                destino: '',
                habilidades: false,
                niveles: ''
            },
            outbound: [],
            restricciones: [],
            quoterData: quoterData
        };

        // Map catalog integrations
        if (state.integrations) {
            const integration = catalog.integrations.find(i => i.id === state.integrations);
            if (integration) {
                mapped.integraciones.push({
                    sistema: integration.name,
                    proposito: 'Según configuración del catálogo',
                    tipo: 'REST API',
                    responsable: 'Cliente'
                });
            }
        }

        // Map custom integrations
        if (state.customIntegrations && state.customIntegrations.length > 0) {
            state.customIntegrations.forEach(ci => {
                mapped.integraciones.push({
                    sistema: ci.name,
                    proposito: 'Integración personalizada',
                    tipo: 'REST API',
                    responsable: 'Cliente'
                });
            });
        }

        // Suggest flows based on addons (DISABLED - users define flows manually)
        // if (state.addons && state.addons.size > 0) {
        //     const addonsList = Array.from(state.addons);
        //     addonsList.forEach(addonId => {
        //         const addon = catalog.addons.find(a => a.id === addonId);
        //         if (addon) {
        //             mapped.flujos.push({
        //                 id: `flow-${addonId}`,
        //                 nombre: addon.name,
        //                 descripcion: `Flujo basado en ${addon.name}`,
        //                 datosSolicitados: [],
        //                 fuenteInfo: 'A definir',
        //                 acciones: 'Responder al usuario',
        //                 derivacion: 'Ninguna',
        //                 sistemas: []
        //             });
        //         }
        //     });
        // }

        return mapped;
    }
}

export const aiProposalServiceV2 = new AIProposalServiceV2();
