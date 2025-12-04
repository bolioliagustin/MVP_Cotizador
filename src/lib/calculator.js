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

  const manualActive = state.manualEnabled;
  const hasManualHours = manualActive && state.manualHours !== null;
  const totalHours = sinIaHours + iaHours;
  const effectiveHours = hasManualHours ? state.manualHours : totalHours;

  let finalSetupList = setupBase;
  if (manualActive && state.autoSetup) {
    let rate = state.hourType === "custom" ? state.customRate : rateByType(state.hourType);
    if (!rate || rate <= 0) rate = rateByType("sinIa");
    finalSetupList = effectiveHours * rate;
  } else if (manualActive && state.setupOverride !== null) {
    finalSetupList = state.setupOverride;
  }

  let finalMonthlyList = monthlyBase;
  if (manualActive && state.monthlyOverride !== null) {
    finalMonthlyList = state.monthlyOverride;
  }

  const setupMargin = finalSetupList * (1 + partner.setupMargin);
  const monthlyMargin = finalMonthlyList * (1 + partner.monthlyMargin);

  let displaySinIa = sinIaHours;
  let displayIa = iaHours;
  if (hasManualHours) {
    if (state.hourType === "ia") {
      displaySinIa = 0;
      displayIa = effectiveHours;
    } else {
      displaySinIa = effectiveHours;
      displayIa = 0;
    }
  }

  const breakdown = [];
  if (impl.cost)
    breakdown.push({
      label: impl.name,
      value: impl.cost,
      hours: impl.hours,
      labor: impl.labor,
      hourly: impl.hours ? impl.cost / impl.hours : null,
      removable: { type: "implementation", id: impl.id },
      disabled: isDisabled("implementation", impl.id),
      category: "setup",
    });
  implementationExtras.forEach((item) =>
    breakdown.push({
      label: item.name,
      value: item.cost,
      hours: item.hours,
      labor: item.labor,
      hourly: item.hours ? item.cost / item.hours : null,
      removable: { type: "implementationExtras", id: item.id },
      disabled: isDisabled("implementationExtras", item.id),
      category: "setup",
    })
  );
  addons.forEach((item) =>
    breakdown.push({
      label: item.name,
      value: item.cost,
      hours: item.hours,
      labor: item.labor,
      hourly: item.hours ? item.cost / item.hours : null,
      removable: { type: "addons", id: item.id },
      disabled: isDisabled("addons", item.id),
      category: "setup",
    })
  );
  if (integration) {
    breakdown.push({
      label: integration.label,
      value: integration.cost,
      hours: integration.hours,
      labor: integration.labor,
      hourly: integration.hourly,
      note: integration.monthly ? `Mensual ${formatMoney(integration.monthly)}` : undefined,
      removable: { type: "integration", id: integration.id },
      disabled: Boolean(integration.disabled),
      category: "setup",
    });
    if ((integration.monthly ?? 0) > 0) {
      breakdown.push({
        label: `${integration.label} (mensual)`,
        value: integration.monthly,
        removable: { type: "integration", id: integration.id },
        disabled: Boolean(integration.disabled),
        category: "monthly",
      });
    }
  }
  customIntegrations.forEach((custom) =>
    breakdown.push({
      label: custom.label,
      value: custom.cost,
      hours: custom.hours,
      labor: custom.labor,
      hourly: custom.rate,
      note: custom.override ? "Precio manual" : "Horas x tarifa",
      removable: { type: "customIntegrations", id: custom.id },
      disabled: isDisabled("customIntegrations", custom.id),
      category: "setup",
    })
  );
  if (sessionPackage.cost)
    breakdown.push({
      label: sessionPackage.label,
      value: sessionPackage.cost,
      removable: { type: "sessionPackage" },
      disabled: sessionPackageDisabled,
      category: "monthly",
    });
  if (heyBiPlan.cost)
    breakdown.push({
      label: heyBiPlan.label,
      value: heyBiPlan.cost,
      removable: { type: "heyBiPlan" },
      disabled: heyBiDisabled,
      category: "monthly",
    });

  return {
    finalSetupList,
    finalMonthlyList,
    setupBase,
    monthlyBase,
    setupMargin,
    monthlyMargin,
    manualHours: effectiveHours,
    sinIaHours: displaySinIa,
    iaHours: displayIa,
    breakdown,
  };
}

export const helpers = { formatMoney, formatMoneyPrecise, sessionModels };
