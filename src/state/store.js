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
  manualHours: null,
  hourType: "sinIa",
  customRate: null,
  autoSetup: true,
  manualEnabled: false,
  setupOverride: null,
  monthlyOverride: null,
  customIntegrations: [],
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
  };

  const getState = () => state;

  const setState = (patch) => {
    state = { ...state, ...patch };
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
