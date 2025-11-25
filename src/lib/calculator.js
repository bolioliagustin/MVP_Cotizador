import { catalog, sessionPackages, heyBiPlans, sessionModels } from "../data/catalog.js";
import { formatMoney, formatMoneyPrecise } from "./format.js";

const rateByType = (type) => catalog.rates[type] ?? catalog.rates.sinIa;

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
  return {
    label: def.label,
    hours,
    cost,
    labor: rateType === "ia" ? "ia" : "sinIa",
    hourly: hours ? rate : null,
    monthly: def.monthly ?? 0,
  };
};

export function calculateTotals(state) {
  const impl = catalog.implementations.find((item) => item.id === state.implementation) ?? {
    cost: 0,
    hours: 0,
    labor: "sinIa",
  };
  const implementationExtras = catalog.implementationExtras.filter((item) =>
    state.implementationExtras.has(item.id)
  );
  const addons = catalog.addons.filter((addon) => state.addons.has(addon.id));
  const integration = buildCatalogIntegration(state);
  const sessionPackage =
    sessionPackages.find((pkg) => pkg.id === state.sessionPackage) ?? { cost: 0, extraCost: null, label: "" };
  const heyBiPlan = heyBiPlans.find((plan) => plan.id === state.heyBiPlan) ?? { cost: 0 };
  const partner = catalog.partners.find((item) => item.id === state.partner) ?? catalog.partners[0];
  const customIntegrations = buildCustomIntegrations(state);

  let sinIaHours = 0;
  let iaHours = 0;
  const trackHours = (item) => {
    if (!item) return;
    const hours = item.hours ?? 0;
    if (item.labor === "ia") iaHours += hours;
    else sinIaHours += hours;
  };
  trackHours(impl);
  implementationExtras.forEach(trackHours);
  addons.forEach(trackHours);
  trackHours(integration);
  customIntegrations.forEach(trackHours);

  const setupBase =
    impl.cost +
    implementationExtras.reduce((sum, item) => sum + item.cost, 0) +
    addons.reduce((sum, addon) => sum + addon.cost, 0) +
    (integration?.cost ?? 0) +
    customIntegrations.reduce((sum, item) => sum + item.cost, 0);
  const monthlyBase = sessionPackage.cost + heyBiPlan.cost + (integration?.monthly ?? 0);

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
    });
  implementationExtras.forEach((item) =>
    breakdown.push({
      label: item.name,
      value: item.cost,
      hours: item.hours,
      labor: item.labor,
      hourly: item.hours ? item.cost / item.hours : null,
    })
  );
  addons.forEach((item) =>
    breakdown.push({
      label: item.name,
      value: item.cost,
      hours: item.hours,
      labor: item.labor,
      hourly: item.hours ? item.cost / item.hours : null,
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
    });
  }
  customIntegrations.forEach((custom) =>
    breakdown.push({
      label: custom.label,
      value: custom.cost,
      hours: custom.hours,
      labor: custom.labor,
      hourly: custom.rate,
      note: custom.override ? "Precio manual" : "Horas x tarifa",
    })
  );
  if (sessionPackage.cost) breakdown.push({ label: sessionPackage.label, value: sessionPackage.cost });
  if (heyBiPlan.cost) breakdown.push({ label: heyBiPlan.label, value: heyBiPlan.cost });

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
