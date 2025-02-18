import { persist, createJSONStorage } from "zustand/middleware";
import { getNestedValue } from "../utils/core";
import type { PersistConfig, Path } from "../types";

export interface CustomPersistOptions {
  storageProvider?: () => Storage;
  // You could also add version, migrate, maxAge, etc.
}

/**
 * Creates a persistence configuration object that specifies which paths in the state should be persisted.
 *
 * @param paths - The paths in the state to be persisted.
 * @returns The persistence configuration object.
 */
export function createPersistConfig<T>(...paths: Path<T>[]): PersistConfig<T> {
  return paths.reduce((config, path) => {
    config[path] = true;
    return config;
  }, {} as PersistConfig<T>);
}

/**
 * Creates a persister middleware for Zustand stores.
 *
 * @param storeCreator - The original store creator function.
 * @param persistOption - A boolean or an object specifying which parts of the state to persist.
 * @param storageName - The name to use for the storage key.
 * @returns The store creator function wrapped with persistence capabilities.
 */
// export function createPersister(
//   storeCreator: any,
//   persistOption: boolean | PersistConfig<any>,
//   storageName: string
// ) {
//   const persistConfig: any = {
//     name: storageName,
//     storage: createJSONStorage(() => localStorage),
//     partialize:
//       typeof persistOption === "object"
//         ? (state: any) => {
//             // Retain only the specified parts of the state for persistence
//             return Object.keys(persistOption).reduce((persisted, key) => {
//               if (persistOption[key]) {
//                 persisted[key] = state[key];
//               }
//               return persisted;
//             }, {} as any);
//           }
//         : (state: any) => state,
//   };

//   return persist(storeCreator, persistConfig);
// }

/**
 * Creates a persister middleware for Zustand stores with enhanced persistence options.
 *
 * Features include:
 * - **Multiple Storage Providers:** Allowing a custom storage provider (default: localStorage).
 * - **Custom Serialization/Deserialization:** Lets users supply custom functions.
 * - **State Versioning & Migration:** Supports a version number and migration function.
 * - **Expiring Persisted Data:** Optionally expires persisted data after a maxAge (in ms).
 * - **Selective Deep Persistence:** Uses dot-notation paths for nested state.
 *
 * @param storeCreator - The original store creator function.
 * @param persistOption - A boolean or an object specifying which parts of the state to persist.
 * @param storageName - The key name for the storage.
 * @param storageProvider - A function returning the storage object (default: localStorage).
 * @param version - Version number for persisted state (default: 1).
 * @param migrate - Optional migration function for state upgrades.
 * @param maxAge - Optional maximum age (in milliseconds) for persisted data.
 * @param serialize - Optional custom serialization function (default: JSON.stringify).
 * @param deserialize - Optional custom deserialization function (default: JSON.parse).
 * @returns The store creator function wrapped with persistence capabilities.
 */
export function createPersister(
  storeCreator: any,
  persistOption: boolean | PersistConfig<any>,
  storageName: string,
  storageProvider: () => Storage = () => localStorage,
  version: number = 1,
  migrate?: (persistedState: any, version: number) => Promise<any>,
  maxAge?: number,
  serialize: (data: any) => string = JSON.stringify,
  deserialize: (str: string) => any = JSON.parse
) {
  // Attach a timestamp if maxAge is provided to support expiring data.
  const enhancedSerialize = (data: any) => {
    if (maxAge !== undefined) {
      return serialize({ timestamp: Date.now(), state: data });
    }
    return serialize(data);
  };

  const enhancedDeserialize = (str: string) => {
    const parsed = deserialize(str);
    if (maxAge !== undefined && parsed.timestamp !== undefined) {
      const age = Date.now() - parsed.timestamp;
      if (age > maxAge) {
        // Data is expired; return an empty object (or we might return initial state)
        return {};
      }
      return parsed.state;
    }
    return parsed;
  };

  const persistConfig: any = {
    name: storageName,
    storage: createJSONStorage(storageProvider),
    version,
    // Versioning and migration support.
    migrate: migrate
      ? migrate
      : (persistedState: any) => Promise.resolve(persistedState),
    serialize: enhancedSerialize,
    deserialize: enhancedDeserialize,
    // Selective persistence for nested state using dot-notation.
    partialize:
      typeof persistOption === "object"
        ? (state: any) => {
            return Object.keys(persistOption).reduce((persisted, key) => {
              if (persistOption[key]) {
                // Use getNestedValue to support deep persistence (e.g., "user.profile.name")
                persisted[key] = getNestedValue(state, key);
              }
              return persisted;
            }, {} as any);
          }
        : (state: any) => state,
  };

  return persist(storeCreator, persistConfig);
}
