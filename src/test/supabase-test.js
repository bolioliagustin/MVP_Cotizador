/**
 * Script de Prueba para Supabase Quotes Service
 * 
 * Abre la consola del navegador (F12) y ejecuta estas líneas para probar
 */

import { quotesService } from './src/services/quotes-service.js';
import { calculateTotals } from './src/lib/calculator.js';

// TEST 1: Guardar una cotización de prueba
async function testSaveQuote() {
    console.log('🧪 Test 1: Guardando cotización...');

    // Simula un state simple
    const testQuoteData = {
        implementation: 'from_scratch',
        integrations: 'none',
        addons: new Set(),
        implementationExtras: new Set(),
        partner: 'none'
    };

    const testTotals = {
        setupMargin: 5000,
        monthlyMargin: 1500,
        manualHours: 40
    };

    const result = await quotesService.saveQuote(
        'Cliente de Prueba',
        testQuoteData,
        testTotals,
        ['test', 'demo']
    );

    console.log('✅ Resultado:', result);
    return result.data?.id; // Devuelve el ID para otros tests
}

// TEST 2: Listar cotizaciones
async function testGetQuotes() {
    console.log('🧪 Test 2: Listando cotizaciones...');

    const result = await quotesService.getQuotes({ limit: 10 });
    console.log('✅ Cotizaciones encontradas:', result.data?.length);
    console.log('📋 Lista:', result.data);
    return result;
}

// TEST 3: Buscar por nombre de cliente
async function testSearchByClient() {
    console.log('🧪 Test 3: Buscando por cliente...');

    const result = await quotesService.getQuotes({ clientName: 'Prueba' });
    console.log('✅ Resultados:', result.data);
    return result;
}

// TEST 4: Obtener una cotización específica
async function testGetById(id) {
    console.log('🧪 Test 4: Obteniendo cotización por ID...');

    const result = await quotesService.getQuoteById(id);
    console.log('✅ Cotización:', result.data);
    return result;
}

// TEST 5: Duplicar cotización
async function testDuplicate(id) {
    console.log('🧪 Test 5: Duplicando cotización...');

    const result = await quotesService.duplicateQuote(id);
    console.log('✅ Copia creada:', result.data);
    return result;
}

// TEST 6: Actualizar cotización
async function testUpdate(id) {
    console.log('🧪 Test 6: Actualizando cotización...');

    const result = await quotesService.updateQuote(
        id,
        'Cliente Actualizado',
        { test: true },
        { setupMargin: 6000 },
        ['test', 'updated']
    );
    console.log('✅ Actualización:', result.data);
    return result;
}

// TEST 7: Estadísticas
async function testStatistics() {
    console.log('🧪 Test 7: Obteniendo estadísticas...');

    const result = await quotesService.getStatistics();
    console.log('✅ Estadísticas:', result.data);
    return result;
}

// TEST 8: Eliminar cotización
async function testDelete(id) {
    console.log('🧪 Test 8: Eliminando cotización...');

    const result = await quotesService.deleteQuote(id);
    console.log('✅ Eliminada:', result.success);
    return result;
}

// EJECUTAR TODOS LOS TESTS
async function runAllTests() {
    console.log('🚀 Iniciando pruebas de Supabase...\n');

    try {
        // 1. Guardar
        const quoteId = await testSaveQuote();
        console.log('\n');

        // 2. Listar
        await testGetQuotes();
        console.log('\n');

        // 3. Buscar
        await testSearchByClient();
        console.log('\n');

        // 4. Obtener por ID
        if (quoteId) {
            await testGetById(quoteId);
            console.log('\n');

            // 5. Duplicar
            const duplicate = await testDuplicate(quoteId);
            console.log('\n');

            // 6. Actualizar
            await testUpdate(quoteId);
            console.log('\n');

            // 7. Estadísticas
            await testStatistics();
            console.log('\n');

            // 8. Eliminar (opcional - descomentar si quieres limpiar)
            // await testDelete(quoteId);
            // if (duplicate.data?.id) {
            //     await testDelete(duplicate.data.id);
            // }
        }

        console.log('✅ Todas las pruebas completadas!');
    } catch (error) {
        console.error('❌ Error en las pruebas:', error);
    }
}

// Exportar para usar en consola
window.supabaseTests = {
    runAll: runAllTests,
    save: testSaveQuote,
    list: testGetQuotes,
    search: testSearchByClient,
    getById: testGetById,
    duplicate: testDuplicate,
    update: testUpdate,
    stats: testStatistics,
    delete: testDelete
};

console.log('📦 Tests disponibles en: window.supabaseTests');
console.log('💡 Ejecuta: window.supabaseTests.runAll()');
