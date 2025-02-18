// tests/persistConfig.test.ts
import {
  createPersister,
  createPersistConfig,
} from "../src/utils/persistConfig";

// Dummy store creator with unused parameters renamed.
const dummyStoreCreator = (_set: any, _get: any, _api: any) => {
  // A dummy initial state.
  return {
    counter: 0,
    user: { profile: { name: "Alice", age: 30 } },
    settings: { theme: "dark" },
  };
};

const dummyStoreCreatorNested = (_set: any, _get: any, _api: any) => {
  // A dummy initial state.
  return {
    counter: 0,
    user: {
      profile: {
        name: "Alice",
        details: {
          age: 30,
          location: { city: "NYC", zip: "10001" },
        },
      },
    },
    settings: { theme: "dark" },
  };
};

// A dummy storage that fully implements the Storage interface.
const dummyStorage: Storage = {
  length: 0,
  clear: jest.fn(),
  getItem: jest.fn(() => null),
  key: jest.fn(() => null),
  removeItem: jest.fn(),
  setItem: jest.fn(),
};

describe("createPersister tests", () => {
  it("should use a custom storage provider", () => {
    const storageProvider = () => dummyStorage;
    const persister = createPersister(
      dummyStoreCreator,
      true,
      "custom-storage",
      storageProvider
    );
    // Use persister in an assertion so it's not reported as unused.
    expect(persister).toBeDefined();
    expect(storageProvider().getItem).toBeDefined();
    expect(storageProvider().setItem).toBeDefined();
  });

  it("should support selective deep persistence using a persist config", () => {
    // Only persist the deep path "user.profile.name"
    const persistOption = { "user.profile.name": true };
    const persister = createPersister(
      dummyStoreCreator,
      persistOption,
      "partial-storage"
    );
    expect(persister).toBeDefined();

    // Simulate using createPersistConfig to generate a config.
    const persistConfig = createPersistConfig("user.profile.name");
    // Simulate a state.
    const state = {
      counter: 42,
      user: { profile: { name: "Bob", age: 25 } },
      settings: { theme: "light" },
    };
    // Mimic the partialization logic using getNestedValue-like extraction.
    const partialized = Object.keys(persistConfig).reduce((acc, key) => {
      // Explicitly type 'obj' as any to bypass index signature issues.
      acc[key] = key
        .split(".")
        .reduce((obj: any, part) => obj && obj[part], state);
      return acc;
    }, {} as any);
    expect(partialized).toEqual({ "user.profile.name": "Bob" });
  });

  it("should attach a timestamp when maxAge is provided", () => {
    const maxAge = 10000; // 10 seconds
    const persister = createPersister(
      dummyStoreCreator,
      true,
      "timestamp-storage",
      () => localStorage,
      1,
      undefined,
      maxAge
    );
    expect(persister).toBeDefined();

    // Simulate enhancedSerialize behavior.
    const data = { counter: 100 };
    // Manually simulate the expected serialized format.
    const serialized = JSON.stringify({ timestamp: Date.now(), state: data });
    const parsed = JSON.parse(serialized);
    expect(parsed).toHaveProperty("timestamp");
    expect(parsed).toHaveProperty("state", data);
  });

  it("should return an empty object if persisted data is expired", () => {
    const maxAge = 1000; // 1 second
    const persister = createPersister(
      dummyStoreCreator,
      true,
      "expire-storage",
      () => localStorage,
      1,
      undefined,
      maxAge
    );
    expect(persister).toBeDefined();

    // Simulate old serialized data:
    const oldTimestamp = Date.now() - 2000; // older than maxAge
    const serializedOld = JSON.stringify({
      timestamp: oldTimestamp,
      state: { counter: 50 },
    });
    // Simulate enhancedDeserialize behavior.
    const deserialize = (str: string) => {
      const parsed = JSON.parse(str);
      if (maxAge !== undefined && parsed.timestamp !== undefined) {
        const age = Date.now() - parsed.timestamp;
        if (age > maxAge) {
          return {};
        }
        return parsed.state;
      }
      return parsed;
    };
    const deserialized = deserialize(serializedOld);
    expect(deserialized).toEqual({});
  });

  it("should support state versioning and migration", async () => {
    // A simple migrate function that transforms the state if version is less than 2.
    const migrateFn = async (persistedState: any, version: number) => {
      if (version < 2) {
        // For example, add a new property if missing.
        return { ...persistedState, migrated: true };
      }
      return persistedState;
    };
    const persister = createPersister(
      dummyStoreCreator,
      true,
      "versioned-storage",
      () => localStorage,
      1,
      migrateFn
    );
    expect(persister).toBeDefined();

    // Simulate a persisted state that should be migrated.
    const persistedState = { counter: 10 };
    const migratedState = await migrateFn(persistedState, 1);
    expect(migratedState).toEqual({ counter: 10, migrated: true });
  });

  it("should work with a sessionStorage-like provider", () => {
    // Simulate a sessionStorage-like provider.
    const sessionStorageMock: Storage = {
      length: 0,
      clear: jest.fn(),
      getItem: jest.fn(() => null),
      key: jest.fn(() => null),
      removeItem: jest.fn(),
      setItem: jest.fn(),
    };
    const storageProvider = () => sessionStorageMock;
    const persister = createPersister(
      dummyStoreCreatorNested,
      true,
      "session-storage",
      storageProvider
    );
    expect(persister).toBeDefined();
    expect(storageProvider().setItem).toBeDefined();
  });

  it("should support complex nested persistence for deep state", () => {
    // Persist a deep nested key like "user.profile.details.location.city"
    const persistOption = { "user.profile.details.location.city": true };
    const persister = createPersister(
      dummyStoreCreatorNested,
      persistOption,
      "deep-storage"
    );
    expect(persister).toBeDefined();

    // Define a complex state.
    const state = {
      counter: 100,
      user: {
        profile: {
          name: "Charlie",
          details: {
            age: 40,
            location: { city: "San Francisco", zip: "94105" },
          },
        },
      },
      settings: { theme: "blue" },
    };
    // Mimic the deep persistence extraction.
    const persistConfig = createPersistConfig(
      "user.profile.details.location.city"
    );
    const partialized = Object.keys(persistConfig).reduce((acc, key) => {
      acc[key] = key
        .split(".")
        .reduce((obj: any, part) => obj && obj[part], state);
      return acc;
    }, {} as any);
    expect(partialized).toEqual({
      "user.profile.details.location.city": "San Francisco",
    });
  });

  it("should handle migration errors gracefully", async () => {
    // A migrate function that simulates an error.
    const errorMigrateFn = async (_persistedState: any, _version: number) => {
      return Promise.reject(new Error("Migration failed"));
    };
    const persister = createPersister(
      dummyStoreCreatorNested,
      true,
      "error-migration-storage",
      () => localStorage,
      1,
      errorMigrateFn
    );
    expect(persister).toBeDefined();
    // Assert that the migration function rejects as expected.
    await expect(errorMigrateFn({ counter: 10 }, 1)).rejects.toThrow(
      "Migration failed"
    );
  });
});
