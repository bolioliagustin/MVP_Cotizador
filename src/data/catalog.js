export const catalog = {
  implementations: [
    { id: "bot1", name: "Bot 1ra gen - 1 canal", cost: 1200, hours: 30, labor: "sinIa" },
    { id: "bot4", name: "Bot 1ra gen - 4 canales", cost: 1400, hours: 35, labor: "sinIa" },
    { id: "botcat", name: "Bot 1ra gen - Catalogo", cost: 2000, hours: 50, labor: "sinIa" },
    { id: "agent", name: "IA Agent - 1 caso", cost: 2025, hours: 45, labor: "ia" },
    { id: "hyper", name: "IA Hyper Agent", cost: 5250, hours: 75, labor: "ia" },
  ],
  implementationExtras: [
    { id: "outbound", name: "Agente IA outbound", cost: 2100, hours: 30, labor: "ia" },
    { id: "voicebot", name: "Voicebot 1 caso", cost: 5950, hours: 85, labor: "ia" },
    { id: "replica", name: "Replicas canales", cost: 480, hours: 12, labor: "sinIa" },
  ],
  addons: [
    { id: "img-fixed", name: "Imagebot formato fijo", cost: 1200, hours: 20, labor: "ia" },
    { id: "img-var", name: "Imagebot formato variable", cost: 2400, hours: 40, labor: "ia" },
  ],
  integrations: [
    { id: "none", label: "Sin integraciones adicionales", cases: 0, baseHours: 0 },
    { id: "one", label: "Integraciones para 1 caso", cases: 1, baseHours: 30 },
    { id: "two", label: "Integraciones para 2 casos", cases: 2, baseHours: 60 },
    { id: "three", label: "Integraciones para 3 casos", cases: 3, baseHours: 90 },
    { id: "four", label: "Integraciones para 4 casos", cases: 4, baseHours: 120 },
    { id: "five", label: "Integraciones para 5 casos", cases: 5, baseHours: 150 },
    { id: "six", label: "Integraciones para 6 casos", cases: 6, baseHours: 180 },
    { id: "ten", label: "Integraciones para 10 casos", cases: 10, baseHours: 300 },
    { id: "fifteen", label: "Integraciones para 15 casos", cases: 15, baseHours: 450 },
    { id: "vpn", label: "Seguridad extendida VPN - Azure", cases: 0, baseHours: 8, fixedCost: 360, monthly: 190 },
  ],
  partners: [
    { id: "direct", name: "Cliente directo (0%)", setupMargin: 0, monthlyMargin: 0 },
    { id: "partner", name: "Partner estandar (10% / 8%)", setupMargin: 0.1, monthlyMargin: 0.08 },
    { id: "gold", name: "Partner Gold (15% / 12%)", setupMargin: 0.15, monthlyMargin: 0.12 },
  ],
  rates: { sinIa: 45, ia: 70 },
};

export const sessionModels = [
  { id: "sinIa", label: "Sin IA", description: "Motores sin IA activos" },
  { id: "iaBasico", label: "IA Modelo Basico", description: "Modelo IA basico" },
  { id: "iaIntermedio", label: "IA Modelo Intermedio", description: "Imagebot fijo o Voice2Text" },
  { id: "iaAvanzado", label: "IA Modelo Avanzado", description: "Imagebot variable" },
  { id: "iaPremium", label: "IA Modelo Premium", description: "Motores premium" },
];

export const sessionPackages = [
  { id: "sinIa-2500", modelId: "sinIa", label: "2500 sesiones Hey Now", cost: 300, extraCost: 0.1 },
  { id: "sinIa-5000", modelId: "sinIa", label: "5000 sesiones Hey Now", cost: 500, extraCost: 0.1 },
  { id: "sinIa-10000", modelId: "sinIa", label: "10000 sesiones Hey Now", cost: 700, extraCost: 0.1 },
  { id: "sinIa-30000", modelId: "sinIa", label: "30000 sesiones Hey Now", cost: 1200, extraCost: 0.1 },
  { id: "sinIa-50000", modelId: "sinIa", label: "50000 sesiones Hey Now", cost: 1750, extraCost: 0.1 },
  { id: "sinIa-100000", modelId: "sinIa", label: "100000 sesiones Hey Now", cost: 2100, extraCost: 0.1 },
  { id: "sinIa-300000", modelId: "sinIa", label: "300000 sesiones Hey Now", cost: 4000, extraCost: 0.1 },

  { id: "iaBasico-2500", modelId: "iaBasico", label: "2500 sesiones IA basico", cost: 325, extraCost: 0.14 },
  { id: "iaBasico-5000", modelId: "iaBasico", label: "5000 sesiones IA basico", cost: 550, extraCost: 0.12 },
  { id: "iaBasico-10000", modelId: "iaBasico", label: "10000 sesiones IA basico", cost: 800, extraCost: 0.09 },
  { id: "iaBasico-30000", modelId: "iaBasico", label: "30000 sesiones IA basico", cost: 1440, extraCost: 0.05 },
  { id: "iaBasico-50000", modelId: "iaBasico", label: "50000 sesiones IA basico", cost: 2150, extraCost: 0.05 },
  { id: "iaBasico-100000", modelId: "iaBasico", label: "100000 sesiones IA basico", cost: 2900, extraCost: 0.03 },
  { id: "iaBasico-300000", modelId: "iaBasico", label: "300000 sesiones IA basico", cost: 6400, extraCost: 0.02 },

  { id: "iaIntermedio-2500", modelId: "iaIntermedio", label: "2500 sesiones IA intermedio", cost: 400, extraCost: 0.18 },
  { id: "iaIntermedio-5000", modelId: "iaIntermedio", label: "5000 sesiones IA intermedio", cost: 700, extraCost: 0.15 },
  { id: "iaIntermedio-10000", modelId: "iaIntermedio", label: "10000 sesiones IA intermedio", cost: 1100, extraCost: 0.12 },
  { id: "iaIntermedio-30000", modelId: "iaIntermedio", label: "30000 sesiones IA intermedio", cost: 2400, extraCost: 0.1 },
  { id: "iaIntermedio-50000", modelId: "iaIntermedio", label: "50000 sesiones IA intermedio", cost: 3750, extraCost: 0.08 },
  { id: "iaIntermedio-100000", modelId: "iaIntermedio", label: "100000 sesiones IA intermedio", cost: 6100, extraCost: 0.07 },
  { id: "iaIntermedio-300000", modelId: "iaIntermedio", label: "300000 sesiones IA intermedio", cost: 16000, extraCost: 0.06 },

  { id: "iaAvanzado-2500", modelId: "iaAvanzado", label: "2500 sesiones IA avanzado", cost: 600, extraCost: 0.26 },
  { id: "iaAvanzado-5000", modelId: "iaAvanzado", label: "5000 sesiones IA avanzado", cost: 1100, extraCost: 0.24 },
  { id: "iaAvanzado-10000", modelId: "iaAvanzado", label: "10000 sesiones IA avanzado", cost: 1900, extraCost: 0.2 },
  { id: "iaAvanzado-30000", modelId: "iaAvanzado", label: "30000 sesiones IA avanzado", cost: 4200, extraCost: 0.15 },
  { id: "iaAvanzado-50000", modelId: "iaAvanzado", label: "50000 sesiones IA avanzado", cost: 6750, extraCost: 0.15 },
  { id: "iaAvanzado-100000", modelId: "iaAvanzado", label: "100000 sesiones IA avanzado", cost: 12100, extraCost: 0.13 },
  { id: "iaAvanzado-300000", modelId: "iaAvanzado", label: "300000 sesiones IA avanzado", cost: 34000, extraCost: 0.12 },

  { id: "iaPremium-2500", modelId: "iaPremium", label: "2500 sesiones IA premium", cost: 925, extraCost: 0.41 },
  { id: "iaPremium-5000", modelId: "iaPremium", label: "5000 sesiones IA premium", cost: 1750, extraCost: 0.39 },
  { id: "iaPremium-10000", modelId: "iaPremium", label: "10000 sesiones IA premium", cost: 3200, extraCost: 0.35 },
  { id: "iaPremium-30000", modelId: "iaPremium", label: "30000 sesiones IA premium", cost: 7800, extraCost: 0.29 },
  { id: "iaPremium-50000", modelId: "iaPremium", label: "50000 sesiones IA premium", cost: 12500, extraCost: 0.28 },
  { id: "iaPremium-100000", modelId: "iaPremium", label: "100000 sesiones IA premium", cost: 26700, extraCost: 0.27 },
  { id: "iaPremium-300000", modelId: "iaPremium", label: "300000 sesiones IA premium", cost: 70000, extraCost: 0.25 },
];

export const heyBiPlans = [
  { id: "heybi-2500", label: "Hey BI hasta 2500 sesiones", cost: 98 },
  { id: "heybi-5000", label: "Hey BI hasta 5000 sesiones", cost: 165 },
  { id: "heybi-10000", label: "Hey BI hasta 10000 sesiones", cost: 240 },
  { id: "heybi-30000", label: "Hey BI hasta 30000 sesiones", cost: 432 },
  { id: "heybi-50000", label: "Hey BI hasta 50000 sesiones", cost: 645 },
  { id: "heybi-50000plus", label: "Hey BI mas de 50000 sesiones", cost: 870 },
];
