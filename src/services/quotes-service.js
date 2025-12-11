import { supabase } from './supabase.js';

/**
 * Service for managing quotes in Supabase
 */
class QuotesService {
    /**
     * Save a new quote to the database
     * @param {string} clientName - Name of the client
     * @param {object} quoteData - Complete quote state from the quoter
     * @param {object} totals - Calculated totals
     * @param {string[]} tags - Optional tags for filtering
     * @returns {Promise<object>} Saved quote with id
     */
    async saveQuote(clientName, quoteData, totals, tags = []) {
        try {
            const { data, error } = await supabase
                .from('quotes')
                .insert([
                    {
                        client_name: clientName,
                        quote_data: quoteData,
                        totals: totals,
                        tags: tags,
                        created_by: 'user' // TODO: Replace with actual user email when auth is implemented
                    }
                ])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error saving quote:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update an existing quote
     * @param {string} id - Quote ID
     * @param {string} clientName - Name of the client
     * @param {object} quoteData - Complete quote state
     * @param {object} totals - Calculated totals
     * @param {string[]} tags - Optional tags
     * @returns {Promise<object>} Updated quote
     */
    async updateQuote(id, clientName, quoteData, totals, tags = []) {
        try {
            const { data, error } = await supabase
                .from('quotes')
                .update({
                    client_name: clientName,
                    quote_data: quoteData,
                    totals: totals,
                    tags: tags,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating quote:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all quotes, optionally filtered
     * @param {object} filters - Optional filters { clientName, tags, limit }
     * @returns {Promise<object>} Array of quotes
     */
    async getQuotes(filters = {}) {
        try {
            let query = supabase
                .from('quotes')
                .select('*')
                .order('created_at', { ascending: false });

            // Apply filters
            if (filters.clientName) {
                query = query.ilike('client_name', `%${filters.clientName}%`);
            }

            if (filters.tags && filters.tags.length > 0) {
                query = query.contains('tags', filters.tags);
            }

            if (filters.limit) {
                query = query.limit(filters.limit);
            }

            const { data, error } = await query;

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching quotes:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get a single quote by ID
     * @param {string} id - Quote ID
     * @returns {Promise<object>} Quote object
     */
    async getQuoteById(id) {
        try {
            const { data, error } = await supabase
                .from('quotes')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching quote:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete a quote
     * @param {string} id - Quote ID
     * @returns {Promise<object>} Deletion result
     */
    async deleteQuote(id) {
        try {
            const { error } = await supabase
                .from('quotes')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting quote:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Duplicate a quote (create a copy)
     * @param {string} id - Quote ID to duplicate
     * @returns {Promise<object>} New quote copy
     */
    async duplicateQuote(id) {
        try {
            // Get original quote
            const { success, data: original, error } = await this.getQuoteById(id);
            if (!success) throw new Error(error);

            // Create copy with modified name
            const copyName = `${original.client_name} (Copia)`;
            return await this.saveQuote(
                copyName,
                original.quote_data,
                original.totals,
                [...original.tags, 'copia']
            );
        } catch (error) {
            console.error('Error duplicating quote:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get quote statistics
     * @returns {Promise<object>} Statistics about quotes
     */
    async getStatistics() {
        try {
            const { data, error } = await supabase
                .from('quotes')
                .select('totals');

            if (error) throw error;

            const stats = {
                totalQuotes: data.length,
                totalSetupValue: data.reduce((sum, q) => sum + (q.totals?.setupMargin || 0), 0),
                totalMonthlyValue: data.reduce((sum, q) => sum + (q.totals?.monthlyMargin || 0), 0),
                averageSetup: 0,
                averageMonthly: 0
            };

            if (stats.totalQuotes > 0) {
                stats.averageSetup = stats.totalSetupValue / stats.totalQuotes;
                stats.averageMonthly = stats.totalMonthlyValue / stats.totalQuotes;
            }

            return { success: true, data: stats };
        } catch (error) {
            console.error('Error fetching statistics:', error);
            return { success: false, error: error.message };
        }
    }
}

export const quotesService = new QuotesService();
