import "./styles/main.scss";
import { createStore, defaultState } from "./state/store.js";
import { cacheRefs, hydrateForm, render } from "./modules/ui.js"; // Wait, I didn't export render from ui.js?
// I exported renderImplementationInfo, etc. but not a main render function.
// The main render function orchestrates everything.
// I should probably keep the main render function in main.js or move it to ui.js as 'renderAll'.
// Let's check ui.js again. I didn't export a 'render' function that calls all others.
// I should add it to ui.js or define it here.
// Defining it here is fine, but it needs to import all the specific render functions.
// Or I can add a 'renderAll' to ui.js.
// Let's add 'renderAll' (named 'render') to ui.js.
import { bindEvents } from "./modules/events.js";

const store = createStore(defaultState);

document.addEventListener("DOMContentLoaded", () => {
  cacheRefs();
  hydrateForm(store);
  bindEvents(store);
  store.subscribe((state) => render(state)); // I need to implement render in ui.js
});
