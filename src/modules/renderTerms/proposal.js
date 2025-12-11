import { catalog, sessionPackages, sessionModels } from "../../data/catalog.js";
import { formatMoney, formatMoneyPrecise, formatMessageCost } from "../../lib/format.js";
import { messageCosts } from "../../data/catalog.js";

export function renderProposalSheet(state, totals, hourlyEntries, currentRate) {
    const partner = catalog.partners.find((item) => item.id === state.partner) ?? catalog.partners[0];
    const sheet = document.createElement("div");
    sheet.className = "proposal-sheet";

    const header = document.createElement("div");
    header.className = "proposal-sheet-header";
    const logo = document.createElement("img");
    logo.src = "/assets/images/heynow-negro-largo.avif";
    logo.alt = "HeyNow IA";
    header.appendChild(logo);
    const title = document.createElement("div");
    title.className = "proposal-sheet-title";
    const date = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    title.innerHTML = `<strong>Cotizacion HeyNow</strong><br/><span>${date}</span>`;
    header.appendChild(title);
    sheet.appendChild(header);

    // Calcular el costo de sesión adicional
    const sessionPkg = sessionPackages.find((pkg) => pkg.id === state.sessionPackage);
    const sessionExtraLabel =
        sessionPkg && sessionPkg.extraCost !== null && sessionPkg.extraCost !== undefined
            ? `Sesión adicional: ${formatMoneyPrecise(sessionPkg.extraCost)} + Impuestos`
            : null;

    const summaryGrid = document.createElement("div");
    summaryGrid.className = "proposal-summary-grid";
    summaryGrid.appendChild(
        createSummaryCard("Pago único", formatMoney(totals.setupMargin), "+ Impuestos", { noteClass: "summary-inline-note subtle" })
    );
    summaryGrid.appendChild(
        createSummaryCard("Pago mensual", formatMoney(totals.monthlyMargin), sessionExtraLabel || "+ Impuestos", { noteClass: "summary-inline-note subtle" })
    );
    summaryGrid.appendChild(
        createSummaryCard(
            "Horas incluidas",
            `${totals.manualHours.toFixed(0)} h`,
            `Hora adicional: ${formatMoney(currentRate)}/h + Impuestos`,
            { noteClass: "summary-inline-note subtle" }
        )
    );
    sheet.appendChild(summaryGrid);

    const sessionExtraTableLabel =
        sessionPkg && sessionPkg.extraCost !== null && sessionPkg.extraCost !== undefined
            ? `${formatMoneyPrecise(sessionPkg.extraCost)}`
            : "-";


    sheet.appendChild(buildCostTable("Costos de implementación - Pago único al inicio del proyecto", totals, partner, "setup"));

    // Solo mostrar tabla mensual si hay componentes mensuales
    const hasMonthlyComponents = totals.breakdown.some(item => item.category === "monthly" && !item.disabled);
    if (hasMonthlyComponents) {
        sheet.appendChild(
            buildCostTable("Costos de uso - Pago mensual", totals, partner, "monthly", {
                label: "Sesión adicional",
                value: sessionExtraTableLabel,
            })
        );
    }

    // Tabla de costos de mensajes (si está seleccionado)
    if (state.messageRegion) {
        const selectedRegion = messageCosts.find(r => r.id === state.messageRegion);
        if (selectedRegion && selectedRegion.marketing !== null) {
            sheet.appendChild(buildMessageCostsTable(selectedRegion));
        }
    }

    const footer = document.createElement("div");
    footer.className = "proposal-footer";
    sheet.appendChild(footer);

    return sheet;
}

function createSummaryCard(title, value, note, options = {}) {
    const card = document.createElement("div");
    card.className = "proposal-summary-card";
    const h4 = document.createElement("h4");
    h4.textContent = title;
    const valueEl = document.createElement("p");
    valueEl.textContent = value;
    card.appendChild(h4);
    card.appendChild(valueEl);
    if (note) {
        if (options.inlineNote) {
            card.classList.add("summary-card-inline-note");
            const span = document.createElement("span");
            span.className = options.noteClass || "summary-inline-note";
            span.textContent = note;
            valueEl.appendChild(span);
        } else if (options.inlineSuffix) {
            const suffix = document.createElement("span");
            suffix.className = options.suffixClass || "summary-inline-note";
            suffix.textContent = note;
            valueEl.appendChild(suffix);
        } else {
            const small = document.createElement("small");
            small.textContent = note;
            card.appendChild(small);
        }
    }
    return card;
}

function buildCostTable(title, totals, partner, category, extraColumn) {
    const tableContainer = document.createElement("div");
    const heading = document.createElement("h4");
    heading.textContent = title;
    heading.style.marginBottom = "8px";
    heading.style.textTransform = "uppercase";
    heading.style.letterSpacing = "0.18em";
    heading.style.fontSize = "0.78rem";
    heading.style.color = "#6b7280";
    tableContainer.appendChild(heading);

    const table = document.createElement("table");
    table.className = "proposal-breakdown-table";
    table.innerHTML = `
    <thead>
      <tr>
        <th>Componente</th>
        <th>Monto</th>
      </tr>
    </thead>
  `;
    const tbody = document.createElement("tbody");

    totals.breakdown
        .filter((item) => !item.disabled && item.category === category)
        .forEach((item) => {
            const tr = document.createElement("tr");
            const multiplier = category === "monthly" ? 1 + partner.monthlyMargin : 1 + partner.setupMargin;
            const valueWithMargin = item.value * multiplier;
            tr.innerHTML = `
        <td>${item.label}</td>
        <td>${formatMoney(valueWithMargin)} <span class="table-note">+ Impuestos</span></td>
      `;
            tbody.appendChild(tr);
        });

    if (!tbody.children.length) {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="2">Sin componentes en esta sección</td>`;
        tbody.appendChild(tr);
    }

    table.appendChild(tbody);
    tableContainer.appendChild(table);
    table.appendChild(tbody);
    tableContainer.appendChild(table);
    return tableContainer;
}

function buildMessageCostsTable(region) {
    const tableContainer = document.createElement("div");
    const heading = document.createElement("h4");
    heading.textContent = `Costos de mensajes salientes WhatsApp - ${region.region}`;
    heading.style.marginBottom = "8px";
    heading.style.textTransform = "uppercase";
    heading.style.letterSpacing = "0.18em";
    heading.style.fontSize = "0.78rem";
    heading.style.color = "#6b7280";
    tableContainer.appendChild(heading);

    const table = document.createElement("table");
    table.className = "proposal-breakdown-table";
    table.innerHTML = `
    <thead>
      <tr>
        <th>Tipo de mensaje</th>
        <th>Costo por mensaje (USD)</th>
      </tr>
    </thead>
  `;
    const tbody = document.createElement("tbody");

    const rows = [
        { label: "Marketing", value: region.marketing },
        { label: "Utilidad / Servicio", value: region.utility },
        { label: "Autenticación", value: region.authentication }
    ];

    rows.forEach((row) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
        <td>${row.label}</td>
        <td>US$ ${formatMessageCost(row.value).replace('US$', '').trim()}</td>
      `;
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    tableContainer.appendChild(table);
    return tableContainer;
}
