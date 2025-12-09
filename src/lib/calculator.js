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
  const disabledComponents = state.disabledComponents instanceof Set ? state.disabledComponents : new Set();
  const isDisabled = (type, id) => disabledComponents.has(componentKey(type, id));

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
  const implDisabled = isDisabled("implementation", impl.id);
  trackHours(impl, implDisabled);
  let setupBase = implDisabled ? 0 : impl.cost;
  let monthlyBase = 0;

  implementationExtras.forEach((item) => {
    const disabled = isDisabled("implementationExtras", item.id);
    trackHours(item, disabled);
    if (!disabled) setupBase += item.cost;
  });
  addons.forEach((addon) => {
    const disabled = isDisabled("addons", addon.id);
    trackHours(addon, disabled);
    if (!disabled) setupBase += addon.cost;
  });

  if (integration) {
    const disabled = isDisabled("integration", integration.id);
    trackHours(integration, disabled);
    if (disabled) {
      integration = { ...integration, disabled: true };
    } else {
      setupBase += integration.cost;
      monthlyBase += integration.monthly ?? 0;
    }
  }

  customIntegrations.forEach((item) => {
    const disabled = isDisabled("customIntegrations", item.id);
    trackHours(item, disabled);
    if (!disabled) setupBase += item.cost;
  });

  const sessionPackageDisabled = isDisabled("sessionPackage");
  const heyBiDisabled = isDisabled("heyBiPlan");
  if (!sessionPackageDisabled) monthlyBase += sessionPackage.cost;
  if (!heyBiDisabled) monthlyBase += heyBiPlan.cost;

  const totalHours = sinIaHours + iaHours;

  // Apply module overrides if they exist
  const getOverriddenValue = (category, type, id, originalValue) => {
    const key = `${category}:${type}:${id ?? 'default'}`;
    return state.moduleOverrides?.[key] ?? originalValue;
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
      disabled: isDisabled("implementation", impl.id),
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
      disabled: isDisabled("implementationExtras", item.id),
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
      disabled: isDisabled("addons", item.id),
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
      disabled: Boolean(integration.disabled),
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
        disabled: Boolean(integration.disabled),
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
      note: custom.override ? "Precio manual" : "Horas x tarifa",
      removable: { type: "customIntegrations", id: custom.id },
      disabled: isDisabled("customIntegrations", custom.id),
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
      disabled: sessionPackageDisabled,
      category: "monthly",
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
      disabled: heyBiDisabled,
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

export const helpers = { formatMoney, formatMoneyPrecise, sessionModels };
