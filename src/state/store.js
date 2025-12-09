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
  disabledComponents: [],
  moduleOverrides: {},
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
    disabledComponents: new Set(initialState.disabledComponents ?? []),
    moduleOverrides: { ...(initialState.moduleOverrides ?? {}) },
  };

  const getState = () => state;

  const setState = (patch) => {
    state = { ...state, ...patch };
    if (!(state.addons instanceof Set)) state.addons = new Set(state.addons);
    if (!(state.implementationExtras instanceof Set))
      state.implementationExtras = new Set(state.implementationExtras);
    if (!(state.disabledComponents instanceof Set)) state.disabledComponents = new Set(state.disabledComponents);
    listeners.forEach((listener) => listener(state));
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    listener(state);
    return () => listeners.delete(listener);
  };

  return { getState, setState, subscribe };
}
