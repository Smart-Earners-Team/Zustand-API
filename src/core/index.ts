import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";
import {
  combineMiddlewares,
  deepMerge,
  getLastPart,
  getNestedValue,
  setNestedValue,
  stableHash,
} from "../utils/core";
import { devToolsPlugin, loggingMiddleware } from "../utils";
import type {
  StoreOptions,
  Store,
  StoreCreationResult,
  SelectorConfig,
  Path,
  PathValue,
  SetStateAction,
} from "../types";
import { createPersister } from "../utils/persistConfig";

/**
 * Creates a generic store with advanced features like nested state management,
 * middleware support, computed values, plugins, and state persistence.
 *
 * @param initialState - The initial state of the store.
 * @param options - Configuration options for the store.
 * @returns The created store and utility functions.
 */
export function createStore<T extends object>(
  initialState: T,
  options: StoreOptions<T> = {}
): StoreCreationResult<T> {
  const {
    persist: persistOption = false,
    logging = false,
    middleware = [],
    computedValues = {},
    plugins = [],
    prefix = "",
    // Enhanced persistence options
    storageProvider, // Optional custom storage provider (e.g., sessionStorage)
    version, // Optional version number (defaults to 1 in createPersister)
    migrate, // Optional migration function
    maxAge, // Optional expiration time (in ms)
    serialize, // Optional custom serialization function
    deserialize, // Optional custom deserialization function
  } = options;

  // Create a stable hash based on the structure and initial values of the state
  const stateHash = stableHash(initialState);
  // Use the options object's hash as an additional identifier
  const optionsHash = stableHash(options);
  // Combine hashes to create a unique but stable storage name
  const storageName = `store-${prefix}-${stateHash}-${optionsHash}`;

  const storeCreator = (set: any, get: any, api: any) => {
    // Maintain state history for undo/redo
    const history = { past: [] as T[], future: [] as T[] };
    const listeners: ((state: T, prevState: T) => void)[] = [];

    const finalMiddleware = combineMiddlewares(middleware);

    /**
     * Sets a nested state value.
     *
     * @param path - Path to the nested value.
     * @param action - The new value or a function to produce the new value.
     */
    const setDeep = <P extends Path<T>>(
      path: P,
      action: SetStateAction<PathValue<T, P>>
    ) => {
      set((state: T) => {
        const newState = { ...state };
        const value =
          typeof action === "function"
            ? (action as Function)(getNestedValue(state, path))
            : action;
        setNestedValue(newState, path, value);

        // Save state history for undo/redo functionality
        history.past.push(JSON.parse(JSON.stringify(state)));
        // When a new change is made, clear the redo stack
        history.future = [];

        const finalState = finalMiddleware((s) => s)(newState);

        // Notify listeners about the state change
        listeners.forEach((listener) => listener(finalState, state));
        return finalState;
      });
    };

    // Merge initial state with any persisted state
    const persistedState = api.getState();
    const mergedInitialState = deepMerge(initialState, persistedState);

    const store: Store<T> = {
      ...mergedInitialState,
      setDeep,
      dispatch: async (action) => {
        const state = get();
        await action(state, setDeep);
      },
      subscribe: (listener) => {
        listeners.push(listener);
        return () => {
          const index = listeners.indexOf(listener);
          if (index > -1) {
            listeners.splice(index, 1);
          }
        };
      },
      // Expose undo/redo capabilities
      undo: () => {
        if (history.past.length > 0) {
          // Save the current state into the redo stack
          const currentState = JSON.parse(JSON.stringify(get()));
          history.future.push(currentState);
          // Retrieve the previous state
          const previousState = history.past.pop();
          if (previousState) {
            // Set the state to the previous state
            set(previousState);
          }
        }
      },
      redo: () => {
        if (history.future.length > 0) {
          // Save the current state into the past stack
          const currentState = JSON.parse(JSON.stringify(get()));
          history.past.push(currentState);
          // Retrieve the next state
          const nextState = history.future.pop();
          if (nextState) {
            set(nextState);
          }
        }
      },
    };

    // Define computed values as properties on the store
    Object.entries(computedValues).forEach(([key, selector]) => {
      Object.defineProperty(store, key, {
        get: () => selector(get()),
        enumerable: true,
      });
    });

    // Initialize plugins and add their middlewares
    plugins.forEach((plugin) => {
      if (plugin.onInit) {
        plugin.onInit(store);
      }
      if (plugin.middleware) {
        middleware.push(plugin.middleware);
      }
    });

    return store;
  };

  let finalStoreCreator: any = storeCreator;

  // Add logging middleware if enabled
  if (logging) {
    finalStoreCreator = loggingMiddleware(finalStoreCreator);
  }

  // Add persistence middleware if enabled, passing along enhanced persistence options.
  if (persistOption) {
    finalStoreCreator = createPersister(
      finalStoreCreator,
      persistOption,
      storageName,
      storageProvider, // custom storage provider if provided
      version, // version (default is 1 if not provided)
      migrate, // optional migration function
      maxAge, // optional expiration (ms)
      serialize, // custom serialization if provided
      deserialize // custom deserialization if provided
    );
  }

  const useStore = create<Store<T>>(finalStoreCreator);

  /**
   * Custom hook to use selected parts of the state.
   *
   * @param selectors - List of selectors in the format "path:alias".
   * @returns The selected state values.
   */
  function useSelectors<S extends SelectorConfig<T>[]>(...selectors: S) {
    return useStore(
      useShallow((state) => {
        return selectors.reduce((acc, selector) => {
          const [path, alias] = (selector as string).split(":") as [
            string,
            string | undefined
          ];
          const key = alias || getLastPart(path);
          (acc as any)[key] = getNestedValue(state, path);
          return acc;
        }, {} as any);
      })
    );
  }

  // Initialize dev tools plugin
  devToolsPlugin(useStore, storageName, initialState);

  return {
    useSelectors,
    setDeep: useStore.getState().setDeep,
    subscribe: useStore.getState().subscribe,
    getState: useStore.getState,
    useStore,
    // Expose undo and redo at the top level
    undo: useStore.getState().undo,
    redo: useStore.getState().redo,
  };
}
