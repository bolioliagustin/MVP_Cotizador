import { catalog, sessionPackages, heyBiPlans, sessionModels } from "../data/catalog.js";
import { formatMoney, formatMoneyPrecise } from "./format.js";

const rateByType = (type) => catalog.rates[type] ?? catalog.rates.sinIa;
const componentKey = (type, id) => `${type}:${id ?? "default"}`;

const buildCustomIntegrations = (state) =>
  (state.customIntegrations ?? [])
    .map((integration) => {
      const hours = integration.hours ?? 0;
      const labor = integration.labor ?? "sinIa";
      const rate = integration.rate && integration.rate > 0 ? integration.rate : rateByType(labor);
      const autoCost = hours * rate;
      const cost =
        integration.override && integration.override > 0 ? integration.override : autoCost;
      return {
        id: integration.id,
        label: integration.name?.trim() || "Integracion personalizada",
        hours,
        labor,
        rate,
        cost,
        override: Boolean(integration.override && integration.override > 0),
      };
    })
    .filter((item) => item.hours > 0 || item.override);

const buildCatalogIntegration = (state) => {
  const def = catalog.integrations.find((item) => item.id === state.integrations);
  if (!def) return null;
  const rateType = state.integrationRate ?? "sinIa";
  const rate = rateByType(rateType);
  const hours = def.baseHours ?? 0;
  const cost = def.fixedCost ?? hours * rate;
  const monthly = def.monthly ?? 0;
  if ((cost === 0 && hours === 0 && monthly === 0) || def.id === "none") return null;
  return {
    id: def.id,
    label: def.label,
    hours,
    cost,
    labor: rateType === "ia" ? "ia" : "sinIa",
    hourly: hours ? rate : null,
    monthly,
  };
};

export function calculateTotals(state) {
  const overrides = state.priceOverrides || {};
  const impl =
    catalog.implementations.find((item) => item.id === state.implementation) ?? {
      id: "implementation-default",
      name: "Implementacion base",
      cost: 0,
      hours: 0,
      labor: "sinIa",
    };
  const implementationExtras = catalog.implementationExtras.filter((item) =>
    state.implementationExtras.has(item.id)
  );
  const addons = catalog.addons.filter((addon) => state.addons.has(addon.id));
  let integration = buildCatalogIntegration(state);
  const sessionPackage =
    sessionPackages.find((pkg) => pkg.id === state.sessionPackage) ?? { cost: 0, extraCost: null, label: "" };
  const heyBiPlan = heyBiPlans.find((plan) => plan.id === state.heyBiPlan) ?? { cost: 0 };
  const partner = catalog.partners.find((item) => item.id === state.partner) ?? catalog.partners[0];
  const customIntegrations = buildCustomIntegrations(state);

  let sinIaHours = 0;
  let iaHours = 0;
  const trackHours = (item, disabled) => {
    if (!item || disabled) return;
    const hours = item.hours ?? 0;
    if (item.labor === "ia") iaHours += hours;
    else sinIaHours += hours;
  };

  trackHours(impl, false);
  let setupBase = impl.cost;
  let monthlyBase = 0;

  implementationExtras.forEach((item) => {
    trackHours(item, false);
    setupBase += item.cost;
  });

  addons.forEach((addon) => {
    trackHours(addon, false);
    setupBase += addon.cost;
  });

  if (integration) {
    trackHours(integration, false);
    setupBase += integration.cost;
    monthlyBase += integration.monthly ?? 0;
  }

  customIntegrations.forEach((item) => {
    trackHours(item, false);
    setupBase += item.cost;
  });

  monthlyBase += sessionPackage.cost;
  monthlyBase += heyBiPlan.cost;

  const totalHours = sinIaHours + iaHours;

  // Apply module overrides if they exist
  const getOverriddenValue = (category, type, id, originalValue) => {
    const key = `${category}:${type}:${id ?? 'default'}`;
    console.log('Looking for override:', key, 'in', state.moduleOverrides);
    const result = state.moduleOverrides?.[key] ?? originalValue;
    console.log('Result:', result);
    return result;
  };

  // Calculate final totals with overrides applied at the breakdown level
  let finalSetupList = setupBase;
  let finalMonthlyList = monthlyBase;



  const breakdown = [];
  if (impl.cost) {
    const overriddenValue = getOverriddenValue('setup', 'implementation', impl.id, impl.cost);
    breakdown.push({
      label: impl.name,
      value: overriddenValue,
      originalValue: impl.cost,
      hasOverride: overriddenValue !== impl.cost,
      hours: impl.hours,
      labor: impl.labor,
      hourly: impl.hours ? impl.cost / impl.hours : null,
      removable: { type: "implementation", id: impl.id },
      category: "setup",
    });
  }

  implementationExtras.forEach((item) => {
    const overriddenValue = getOverriddenValue('setup', 'implementationExtras', item.id, item.cost);
    breakdown.push({
      label: item.name,
      value: overriddenValue,
      originalValue: item.cost,
      hasOverride: overriddenValue !== item.cost,
      hours: item.hours,
      labor: item.labor,
      hourly: item.hours ? item.cost / item.hours : null,
      removable: { type: "implementationExtras", id: item.id },
      category: "setup",
    });
  });
  addons.forEach((item) => {
    const overriddenValue = getOverriddenValue('setup', 'addons', item.id, item.cost);
    breakdown.push({
      label: item.name,
      value: overriddenValue,
      originalValue: item.cost,
      hasOverride: overriddenValue !== item.cost,
      hours: item.hours,
      labor: item.labor,
      hourly: item.hours ? item.cost / item.hours : null,
      removable: { type: "addons", id: item.id },
      category: "setup",
    });
  });
  if (integration) {
    const overriddenSetup = getOverriddenValue('setup', 'integration', integration.id, integration.cost);
    breakdown.push({
      label: integration.label,
      value: overriddenSetup,
      originalValue: integration.cost,
      hasOverride: overriddenSetup !== integration.cost,
      hours: integration.hours,
      labor: integration.labor,
      hourly: integration.hourly,
      note: integration.monthly ? `Mensual ${formatMoney(integration.monthly)}` : undefined,
      removable: { type: "integration", id: integration.id },
      category: "setup",
    });
    if ((integration.monthly ?? 0) > 0) {
      const overriddenMonthly = getOverriddenValue('monthly', 'integration', integration.id, integration.monthly);
      breakdown.push({
        label: `${integration.label} (mensual)`,
        value: overriddenMonthly,
        originalValue: integration.monthly,
        hasOverride: overriddenMonthly !== integration.monthly,
        removable: { type: "integration", id: integration.id },
        category: "monthly",
      });
    }
  }
  customIntegrations.forEach((custom) => {
    const overriddenValue = getOverriddenValue('setup', 'customIntegrations', custom.id, custom.cost);
    breakdown.push({
      label: custom.label,
      value: overriddenValue,
      originalValue: custom.cost,
      hasOverride: overriddenValue !== custom.cost,
      hours: custom.hours,
      labor: custom.labor,
      hourly: custom.rate,
      removable: { type: "customIntegrations", id: custom.id },
      category: "setup",
    });
  });
  if (sessionPackage.cost) {
    const overriddenValue = getOverriddenValue('monthly', 'sessionPackage', null, sessionPackage.cost);
    breakdown.push({
      label: sessionPackage.label,
      value: overriddenValue,
      originalValue: sessionPackage.cost,
      hasOverride: overriddenValue !== sessionPackage.cost,
      removable: { type: "sessionPackage" },
      category: "monthly",
      extraCost: sessionPackage.extraCost, // Costo por sesión adicional
    });
  }
  if (heyBiPlan.cost) {
    const overriddenValue = getOverriddenValue('monthly', 'heyBiPlan', null, heyBiPlan.cost);
    breakdown.push({
      label: heyBiPlan.label,
      value: overriddenValue,
      originalValue: heyBiPlan.cost,
      hasOverride: overriddenValue !== heyBiPlan.cost,
      removable: { type: "heyBiPlan" },
      category: "monthly",
    });
  }

  // Recalculate totals from breakdown (with overrides applied)
  finalSetupList = breakdown
    .filter(item => item.category === 'setup' && !item.disabled)
    .reduce((sum, item) => sum + item.value, 0);

  finalMonthlyList = breakdown
    .filter(item => item.category === 'monthly' && !item.disabled)
    .reduce((sum, item) => sum + item.value, 0);

  const setupMargin = finalSetupList * (1 + partner.setupMargin);
  const monthlyMargin = finalMonthlyList * (1 + partner.monthlyMargin);

  return {
    finalSetupList,
    finalMonthlyList,
    setupBase,
    monthlyBase,
    setupMargin,
    monthlyMargin,
    manualHours: totalHours,
    sinIaHours,
    iaHours,
    breakdown,
  };
}

// Función auxiliar para analizar las tarifas por hora en el breakdown
export function analyzeHourlyRates(breakdown) {
  const ratesWithHours = breakdown
    .filter(item => !item.disabled && item.category === 'setup' && item.hours && item.hourly)
    .map(item => ({
      rate: item.hourly,
      hours: item.hours
    }));

  if (ratesWithHours.length === 0) {
    return { hasMultipleRates: false, weightedAverage: 0, uniqueRates: [] };
  }

  const uniqueRates = [...new Set(ratesWithHours.map(r => r.rate))];
  const hasMultipleRates = uniqueRates.length > 1;

  // Calcular promedio ponderado
  const totalHours = ratesWithHours.reduce((sum, item) => sum + item.hours, 0);
  const weightedSum = ratesWithHours.reduce((sum, item) => sum + (item.rate * item.hours), 0);
  const weightedAverage = totalHours > 0 ? weightedSum / totalHours : 0;

  return {
    hasMultipleRates,
    weightedAverage,
    uniqueRates: uniqueRates.sort((a, b) => a - b),
    minRate: Math.min(...uniqueRates),
    maxRate: Math.max(...uniqueRates)
  };
}

export const helpers = { formatMoney, formatMoneyPrecise, sessionModels };
