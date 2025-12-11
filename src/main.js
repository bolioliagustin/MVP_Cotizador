import "./styles/main.scss";
import { createStore, defaultState } from "./state/store.js";
import { cacheRefs, hydrateForm, render, refs } from "./modules/ui.js";
import { bindEvents } from "./modules/events.js";
import { loadAndDisplayQuotes } from "./modules/quotes-history.js";

const store = createStore(defaultState);

document.addEventListener("DOMContentLoaded", () => {
  cacheRefs();
  hydrateForm(store);
  bindEvents(store);
  store.subscribe((state) => render(state));

  // Initialize quotes history after a small delay to ensure refs are cached
  setTimeout(() => {
    if (refs && refs.quotesList) {
      // Define callbacks as named functions so they can be reused
      const loadCallback = async (quoteId) => {
        try {
          const { quotesService } = await import('./services/quotes-service.js');
          const result = await quotesService.getQuoteById(quoteId);

          if (result.success && result.data) {
            const quote = result.data;
            // Restore state from quote
            store.setState({
              ...quote.quote_data,
              addons: new Set(quote.quote_data.addons || []),
              implementationExtras: new Set(quote.quote_data.implementationExtras || [])
            });

            alert(`✅ Cotización cargada: ${quote.client_name}`);
          }
        } catch (error) {
          console.error('Error loading quote:', error);
          alert(`❌ Error al cargar: ${error.message}`);
        }
      };

      const duplicateCallback = async (quoteId) => {
        try {
          const { quotesService } = await import('./services/quotes-service.js');
          const result = await quotesService.duplicateQuote(quoteId);

          if (result.success) {
            alert(`✅ Cotización duplicada: ${result.data.client_name}`);
            // Reload list with same callbacks
            loadAndDisplayQuotes(refs, loadCallback, duplicateCallback);
          }
        } catch (error) {
          console.error('Error duplicating quote:', error);
          alert(`❌ Error al duplicar: ${error.message}`);
        }
      };

      // Load quotes on start
      loadAndDisplayQuotes(refs, loadCallback, duplicateCallback);

      // Search functionality
      if (refs.quotesSearch) {
        let searchTimeout;
        refs.quotesSearch.addEventListener('input', (e) => {
          clearTimeout(searchTimeout);
          const searchTerm = e.target.value;
          searchTimeout = setTimeout(() => {
            // Use the same callbacks for search
            loadAndDisplayQuotes(refs, loadCallback, duplicateCallback, searchTerm);
          }, 300); // Debounce 300ms
        });
      }
    }
  }, 100); // Small delay to ensure refs are cached
});
