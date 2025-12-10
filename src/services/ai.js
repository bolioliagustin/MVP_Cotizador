import { GoogleGenAI } from "@google/genai";

export const aiService = {
    getKey() {
        return import.meta.env.VITE_GOOGLE_API_KEY || localStorage.getItem("heynow_api_key");
    },

    setKey(key) {
        localStorage.setItem("heynow_api_key", key);
    },

    hasKey() {
        return !!this.getKey();
    },

    getClient() {
        const key = this.getKey();
        if (!key) throw new Error("API Key no configurada");
        return new GoogleGenAI({ apiKey: key });
    },

    async estimateEffort(description) {
        try {
            const ai = this.getClient();
            const prompt = `
        Actua como un experto arquitecto de software y estimador de proyectos.
        Estima las horas de desarrollo necesarias para la siguiente integracion personalizada:
        "${description}"
        
        Responde SOLAMENTE con un numero entero que represente la cantidad de horas estimadas. 
        Si es muy complejo, da tu mejor estimado conservador. 
        No incluyas texto, solo el numero.
      `;

            const response = await ai.models.generateContent({
                model: "gemini-1.5-flash",
                contents: prompt,
            });

            const text = response.text;
            const hours = parseInt(text.trim(), 10);

            if (isNaN(hours)) {
                throw new Error("La IA no devolvio un numero valido");
            }

            return hours;
        } catch (error) {
            console.error("AI Error:", error);
            throw error;
        }
    },

    async generateProposal(context) {
        try {
            const ai = this.getClient();
            const prompt = `
        Actua como un experto consultor de ventas de software.
        Genera un texto persuasivo y profesional para incluir en una propuesta comercial de "HeyNow IA".
        
        Contexto del cliente:
        - Implementacion: ${context.implementation}
        - Integraciones: ${context.integrations}
        - Extras: ${context.extras.join(", ") || "Ninguno"}
        - Modelo de Sesiones: ${context.sessionModel}
        
        Escribe 2 parrafos breves:
        1. Resumen del valor que aporta la solucion elegida.
        2. Justificacion de la inversion basada en eficiencia y automatizacion.
        
        Tono: Profesional, innovador y directo.
        No uses saludos ni despedidas, solo el contenido del cuerpo.
      `;

            const response = await ai.models.generateContent({
                model: "gemini-1.5-flash",
                contents: prompt,
            });

            return response.text;
        } catch (error) {
            console.error("AI Proposal Error:", error);
            throw error;
        }
    },
};
