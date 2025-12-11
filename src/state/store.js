import { catalog } from "../data/catalog.js";

export const defaultState = {
  implementation: "",
  implementationExtras: [],
  addons: [],
  integrations: catalog.integrations[0].id,
  integrationRate: "sinIa",
  sessionModel: "",
  sessionPackage: "",
  heyBiPlan: "",
  partner: catalog.partners[0].id,
  customIntegrations: [],
  moduleOverrides: {},
  customSummaryRate: null, // Tarifa personalizada para mostrar en el resumen exportado
  messageRegion: "", // Región seleccionada para costos de mensajes
};

export function createStore(initialState = defaultState) {
  const listeners = new Set();
  let state = {
    ...initialState,
    addons: new Set(initialState.addons ?? []),
    implementationExtras: new Set(initialState.implementationExtras ?? []),
    customIntegrations: Array.isArray(initialState.customIntegrations)
      ? initialState.customIntegrations.map((item) => ({ ...item }))
      : [],
    moduleOverrides: { ...(initialState.moduleOverrides ?? {}) },
  };

  const getState = () => state;

  const setState = (patch) => {
    // Support both object and function callback patterns
    const updates = typeof patch === 'function' ? patch(state) : patch;
    state = { ...state, ...updates };
    if (!(state.addons instanceof Set)) state.addons = new Set(state.addons);
    if (!(state.implementationExtras instanceof Set))
      state.implementationExtras = new Set(state.implementationExtras);
    listeners.forEach((listener) => listener(state));
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    listener(state);
    return () => listeners.delete(listener);
  };

  return { getState, setState, subscribe };
}
