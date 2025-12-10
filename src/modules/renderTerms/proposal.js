import { catalog, sessionPackages, sessionModels } from "../../data/catalog.js";
import { formatMoney, formatMoneyPrecise } from "../../lib/format.js";
import { aiService } from "../../services/ai.js";

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
    const date = new Date().toLocaleDateString();
    title.innerHTML = `<strong>Cotizacion HeyNow</strong><br/><span>${date}</span>`;
    header.appendChild(title);
    sheet.appendChild(header);

    const summaryGrid = document.createElement("div");
    summaryGrid.className = "proposal-summary-grid";
    summaryGrid.appendChild(
        createSummaryCard("Pago único", formatMoney(totals.setupMargin), "+ Impuestos", { noteClass: "summary-inline-note subtle" })
    );
    summaryGrid.appendChild(
        createSummaryCard("Pago mensual", formatMoney(totals.monthlyMargin), "+ Impuestos", { noteClass: "summary-inline-note subtle" })
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

    const sessionPkg = sessionPackages.find((pkg) => pkg.id === state.sessionPackage);
    const sessionExtraLabel =
        sessionPkg && sessionPkg.extraCost !== null && sessionPkg.extraCost !== undefined
            ? `${formatMoneyPrecise(sessionPkg.extraCost)}/sesión`
            : "-";


    sheet.appendChild(buildCostTable("Costos de implementación - Pago único al inicio del proyecto", totals, partner, "setup"));
    sheet.appendChild(
        buildCostTable("Costos de uso - Pago mensual", totals, partner, "monthly", {
            label: "Sesión adicional",
            value: sessionExtraLabel,
        })
    );

    const footer = document.createElement("div");
    footer.className = "proposal-footer";
    sheet.appendChild(footer);

    // AI Proposal Section
    const aiSection = document.createElement("div");
    aiSection.className = "proposal-ai-section";
    aiSection.style.marginTop = "20px";
    aiSection.style.padding = "15px";
    aiSection.style.backgroundColor = "#f9fafb";
    aiSection.style.borderRadius = "8px";
    aiSection.style.border = "1px dashed #d1d5db";

    const aiBtn = document.createElement("button");
    aiBtn.className = "btn-secondary small";
    aiBtn.textContent = "✨ Generar Propuesta con IA";
    aiBtn.onclick = async () => {
        const errorEl = aiSection.querySelector(".ai-error-msg");
        if (errorEl) errorEl.remove();

        if (!aiService.hasKey()) {
            showInlineError(aiSection, "⚠️ Configura tu API Key primero (⚙️).");
            return;
        }

        const originalText = aiBtn.textContent;
        aiBtn.disabled = true;
        aiBtn.innerHTML = `
            <span class="spinner">⏳</span> Generando...
        `;

        try {
            const context = {
                implementation: catalog.implementations.find(i => i.id === state.implementation)?.name || "",
                integrations: catalog.integrations.find(i => i.id === state.integrations)?.label || "",
                extras: [...state.implementationExtras, ...state.addons].map(id =>
                    [...catalog.implementationExtras, ...catalog.addons].find(i => i.id === id)?.name
                ).filter(Boolean),
                sessionModel: sessionModels.find(m => m.id === state.sessionModel)?.label || ""
            };
            const text = await aiService.generateProposal(context);

            const textContainer = document.createElement("div");
            textContainer.className = "proposal-ai-text";
            textContainer.style.marginTop = "10px";
            textContainer.style.whiteSpace = "pre-line";
            textContainer.style.fontSize = "0.9rem";
            textContainer.style.color = "#374151";
            textContainer.innerHTML = text;

            aiSection.innerHTML = "";
            aiSection.appendChild(document.createElement("h4")).textContent = "Propuesta Comercial";
            aiSection.lastChild.style.marginBottom = "8px";
            aiSection.appendChild(textContainer);
        } catch (e) {
            console.error(e);
            aiBtn.disabled = false;
            aiBtn.textContent = originalText;
            showInlineError(aiSection, "❌ Error al generar: " + e.message);
        }
    };

    function showInlineError(container, msg) {
        let p = container.querySelector(".ai-error-msg");
        if (!p) {
            p = document.createElement("p");
            p.className = "ai-error-msg";
            p.style.color = "#dc2626";
            p.style.fontSize = "0.85rem";
            p.style.marginTop = "8px";
            container.appendChild(p);
        }
        p.textContent = msg;
    }
    aiSection.appendChild(aiBtn);
    sheet.appendChild(aiSection);

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
