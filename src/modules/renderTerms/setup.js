import { catalog } from "../../data/catalog.js";
import { formatMoney, formatMoneyPrecise } from "../../lib/format.js";

export function renderImplementationInfo(implementationId, refs) {
    const impl = catalog.implementations.find((item) => item.id === implementationId);
    if (!impl) {
        refs.implInfoCost.textContent = "$0";
        refs.implInfoHours.textContent = "0 h";
        refs.implInfoRate.textContent = "-";
        return;
    }
    refs.implInfoCost.textContent = formatMoney(impl.cost);
    refs.implInfoHours.textContent = `${impl.hours} h`;
    refs.implInfoRate.textContent = impl.hours ? `${formatMoneyPrecise(impl.cost / impl.hours)}/h` : "-";
}

export function renderIntegrationInfo(integrationId, integrationRate, refs) {
    const def = catalog.integrations.find((item) => item.id === integrationId);
    const rate = catalog.rates[integrationRate ?? "sinIa"] ?? catalog.rates.sinIa;
    if (!def) {
        refs.integrationInfoCost.textContent = "$0";
        refs.integrationInfoHours.textContent = "0 h";
        refs.integrationInfoRate.textContent = "-";
        refs.integrationRateLabel.textContent = "Valor hora";
        return;
    }
    const hours = def.baseHours ?? 0;
    const cost = def.fixedCost ?? hours * rate;
    refs.integrationInfoCost.textContent = formatMoney(cost);
    refs.integrationInfoHours.textContent = `${hours} h`;
    refs.integrationInfoRate.textContent = `${formatMoney(rate)}/h`;
    refs.integrationRateLabel.textContent = integrationRate === "ia" ? "Costo IA" : "Costo sin IA";
}
