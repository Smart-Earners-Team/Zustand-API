import { createPersistConfig, createStore } from "../src";

type Todo = { id: number; text: string; completed: boolean };

const initialState = {
  counter: 0,
  user: { name: "John Doe" as string, age: 30 },
  theme: "light" as "dark" | "light",
  todos: [] as Todo[],
  deepNested: { level1: { level2: { value: "Deep" as string } } },
};

// Create a persist config that persists only specific parts of the state.
// Here we persist the user name, counter, and the theme property of settings.
const persistOptions = createPersistConfig<typeof initialState>(
  "user.name",
  "theme",
  "counter"
);

// Initialize the store with optional persistence parameters.
const store = createStore(initialState, {
  persist: persistOptions, // You can also pass `true` to persist the entire state.
  storageProvider: () => sessionStorage, // Optional: use a custom storage (e.g., sessionStorage). Default is localStorage
  version: 1, // Optional: version number for persisted state.
  migrate: async (persistedState, version) => {
    // Example migration: if an older version is detected, update the state.
    if (version < 1) {
      return {
        ...persistedState,
        user: { ...persistedState.user, migrated: true },
      };
    }
    return persistedState;
  },
  maxAge: 3600000, // Optional: expire persisted data after 1 hour (in milliseconds).
  serialize: JSON.stringify, // Optional: custom serialization.
  deserialize: JSON.parse, // Optional: custom deserialization.
});

// You can now use the returned store API:
// For example:
// console.log(store.getState());
// store.setDeep("counter", (prev: number) => prev + 1);
// store.undo();
// store.redo();

// You can export as is, or destructure and export
export const {
  getState,
  subscribe,
  useSelectors,
  useStore,
  setDeep,
  redo,
  undo,
} = store;
