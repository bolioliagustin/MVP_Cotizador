import { calculateTotals } from "./src/lib/calculator.js";
import { defaultState } from "./src/state/store.js";

console.log("Running debug test...");
try {
    const totals = calculateTotals(defaultState);
    console.log("Totals:", JSON.stringify(totals, null, 2));
} catch (e) {
    console.error("Error:", e);
}
