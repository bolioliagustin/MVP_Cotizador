import { quotesService } from '../services/quotes-service.js';

/**
 * Renders the quotes history list
 * @param {Array} quotes - Array of quote objects
 * @param {HTMLElement} container - Container element to render into  
 * @param {Function} onLoad - Callback when load button is clicked
 * @param {Function} onDuplicate - Callback when duplicate button is clicked
 */
export function renderQuotesList(quotes, container, onLoad, onDuplicate) {
    if (!quotes || quotes.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--muted);">
                <p>No hay cotizaciones guardadas</p>
                <small>Usa el botón "💾 Exportar" para guardar cotizaciones</small>
            </div>
        `;
        return;
    }

    container.innerHTML = quotes.map(quote => {
        const date = new Date(quote.created_at);
        const formattedDate = date.toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        const setup = quote.totals?.setupMargin || 0;
        const monthly = quote.totals?.monthlyMargin || 0;

        const tags = quote.tags && quote.tags.length > 0
            ? `<div style="display: flex; gap: 4px; flex-wrap: wrap; margin-top: 6px;">
                ${quote.tags.map(tag =>
                `<span style="
                        font-size: 0.7rem;
                        padding: 2px 6px;
                        background: rgba(255,255,255,0.1);
                        border-radius: 4px;
                        color: var(--muted);
                    ">${tag}</span>`
            ).join('')}
               </div>`
            : '';

        return `
            <div class="quote-item" data-quote-id="${quote.id}" style="
                padding: 12px;
                background: rgba(255,255,255,0.03);
                border: 1px solid var(--border);
                border-radius: var(--radius);
                cursor: pointer;
                transition: all 0.2s;
            " onmouseover="this.style.background='rgba(255,255,255,0.06)'" 
               onmouseout="this.style.background='rgba(255,255,255,0.03)'">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 600; font-size: 0.95rem; margin-bottom: 4px;">
                            ${quote.client_name}
                        </div>
                        <div style="font-size: 0.75rem; color: var(--muted);">
                            ${formattedDate}
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-size: 0.85rem; font-weight: 500;">
                            $${setup.toLocaleString()}
                        </div>
                        <div style="font-size: 0.75rem; color: var(--muted);">
                            $${monthly.toLocaleString()}/mes
                        </div>
                    </div>
                </div>
                ${tags}
                <div style="display: flex; gap: 6px; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(255,255,255,0.08);">
                    <button class="btn-load-quote btn ghost" data-quote-id="${quote.id}" style="
                        flex: 1; 
                        padding: 6px 10px; 
                        font-size: 0.8rem;
                        border-radius: 6px;
                    ">📂 Cargar</button>
                    <button class="btn-duplicate-quote btn ghost" data-quote-id="${quote.id}" style="
                        flex: 1; 
                        padding: 6px 10px; 
                        font-size: 0.8rem;
                        border-radius: 6px;
                    ">📋 Duplicar</button>
                </div>
            </div>
        `;
    }).join('');

    // Add event listeners
    container.querySelectorAll('.btn-load-quote').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const quoteId = btn.getAttribute('data-quote-id');
            onLoad(quoteId);
        });
    });

    container.querySelectorAll('.btn-duplicate-quote').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const quoteId = btn.getAttribute('data-quote-id');
            onDuplicate(quoteId);
        });
    });
}

/**
 * Loads quotes from Supabase and displays them
 * @param {object} refs - UI references
 * @param {Function} onLoad - Callback when load is clicked
 * @param {Function} onDuplicate - Callback when duplicate is clicked
 * @param {string} searchTerm - Optional search term
 */
export async function loadAndDisplayQuotes(refs, onLoad, onDuplicate, searchTerm = '') {
    if (!refs.quotesList) return;

    try {
        // Show loading
        refs.quotesList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--muted);">
                <p>⏳ Cargando...</p>
            </div>
        `;

        const filters = { limit: 20 };
        if (searchTerm) {
            filters.clientName = searchTerm;
        }

        const result = await quotesService.getQuotes(filters);

        if (result.success) {
            renderQuotesList(result.data, refs.quotesList, onLoad, onDuplicate);
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        console.error('Error loading quotes:', error);
        refs.quotesList.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--muted);">
                <p>❌ Error al cargar cotizaciones</p>
                <small>${error.message}</small>
            </div>
        `;
    }
}
