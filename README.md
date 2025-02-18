# Zust-API

**zust-api** is a lightweight, highly configurable state management solution built on top of [Zustand](https://github.com/pmndrs/zustand). It offers advanced features such as:

- **Deep State Updates:** Easily update nested state properties using `setDeep`.
- **Middleware & Plugins:** Enhance your store with middleware functions and plugins.
- **Persistence:** Persist your state with advanced options:
  - **Selective Persistence:** Persist only specific keys (using dot-notation, e.g. `user.profile.name`).
  - **Custom Storage Providers:** Use `localStorage`, `sessionStorage`, or a custom storage adapter.
  - **Versioning & Migration:** Manage state schema changes with version numbers and migration functions.
  - **Expiration:** Set a maximum age (`maxAge`) for persisted data.
  - **Custom Serialization:** Override default JSON serialization/deserialization.
- **Undo/Redo:** Built-in undo/redo functionality to revert or reapply state changes.
- **React Integration:** Access your store via React hooks (`useStore` and `useSelectors`) for seamless UI updates.

This package is designed to be easily integrated into any React project and is reusable across multiple projects.

---

## Features

- **Deep State Updates:**  
  Update nested properties easily using the `setDeep` method.
- **Async Actions:**  
  Handle asynchronous operations with the `dispatch` method.
- **Middleware & Plugins:**  
  Extend your store with middleware and plugin support.
- **Advanced Persistence:**
  - **Selective Persistence:** Persist only the parts of the state you need.
  - **Custom Storage Providers:** Choose between `localStorage`, `sessionStorage`, or custom storage.
  - **Versioning & Migration:** Easily manage changes in your state structure.
  - **Expiration:** Automatically clear stale persisted data.
  - **Custom Serialization:** Override the default JSON behavior.
- **Undo/Redo:**  
  Easily revert or reapply state changes with built-in undo/redo functions.
- **React Integration:**  
  Use the `useStore` and `useSelectors` hooks to integrate state management into your React components.

---

## Installation

Install `zust-api` using npm, bun, or Yarn:

```

npm install zust-api

```

or

```

yarn add zust-api

```

or

```

bun install zust-api

```

## Usage

Here is a basic example of how to use Zust:

```typescript
import { createStore, createPersistConfig } from "zust-api";

type MyTasks = { id: number; text: string; completed: boolean };

// Define the initial state
const initialState = {
  counter: 0,
  user: { name: "John Doe" as string, age: 30 },
  theme: "light" as "dark" | "light",
  todos: [] as MyTasks[],
  deepNested: { level1: { level2: { value: "Deep" as string } } },
};

// Create the store
const { useSelectors, setDeep } = createStore(initialState);

// Create the store with persistence
const { useSelectors, setDeep } = createStore(initialState, {
  persist: createPersistConfig("counter", "theme", "user.name"), // You can also pass `true` to persist the entire state.
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
console.log(store.getState());
store.setDeep("counter", (prev: number) => prev + 1);
store.undo();
store.redo();

// A modular setup would ideally export { useSelectors, useStore, setDeep } here.

export const ExampleComponent(): React.FC = () => {
  // Select state values
  const { name, age, theme } = useSelectors("user.name", "user.age", "theme");

  const [newName, setNewName] = React.useState("");
  const [newAge, setNewAge] = React.useState(age);

  // Update state values
  const updateUser = () => {
    if (newName.trim()) {
      setDeep("user.name", newName);
    }
    setDeep("user.age", newAge);
  };

  const toggleTheme = () =>
    setDeep("theme", (prev) => (prev === "light" ? "dark" : "light"));


  return (
    <div>
      <p>User Name: {name}</p>
      <p>Theme: {theme}</p>
      <button onClick={updateName}>Update User Name</button>
      <button onClick={toggleTheme}>Toggle Theme</button>
    </div>
  );
}
```

# Accessing the Store in React

Using `useStore`

```typescript
import React from 'react';
import { useStore } from from "../store"; // path to store logic

export function Counter() {
  // Access state, update functions, and undo/redo capabilities.
  const { counter, setDeep, undo, redo } = useStore();

  return (
    <div>
      <h2>Counter: {counter}</h2>
      <button onClick={() => setDeep('counter', (prev: number) => prev + 1)}>Increase</button>
      <button onClick={() => setDeep('counter', (prev: number) => prev - 1)}>Decrease</button>
      <button onClick={undo}>Undo</button>
      <button onClick={redo}>Redo</button>
    </div>
  );
}
```

Using `useSelectors`

Select only specific parts of the state:

```ts
import React from "react";
import { useSelectors } from "../store"; // path to store logic

export function UserInfo() {
  // Select the user's name from the state.
  const { name } = useSelectors("user.name");
  return <div>User Name: {name}</div>;
}
```

# Undo/Redo Functionality

Each time `setDeep` updates the state, the previous state is saved in a history stack. Use `undo()` and `redo()` to navigate the state history:

```ts
<button onClick={undo}>Undo</button>
<button onClick={redo}>Redo</button>
```

---

# Advanced Persistence Options

## Selective Persistence

Persist only parts of the state using `createPersistConfig`:

```ts
// Persist only the "user" object and "settings.theme"
const persistOptions = createPersistConfig<typeof initialState>(
  "user",
  "settings.theme"
);
```

## Custom Storage Provider

Use any Storage-compliant provider, such as sessionStorage:

```ts
const store = createStore(initialState, {
  persist: persistOptions,
  storageProvider: () => sessionStorage,
});
```

## State Versioning & Migration

Version your state and provide a migration function:

```ts
const store = createStore(initialState, {
  persist: persistOptions,
  version: 1,
  migrate: async (persistedState, version) => {
    if (version < 1) {
      return {
        ...persistedState,
        user: { ...persistedState.user, migrated: true },
      };
    }
    return persistedState;
  },
});
```

## Expiring Persisted Data

Set a maximum age for persisted data:

```ts
const store = createStore(initialState, {
  persist: persistOptions,
  maxAge: 3600000, // 1 hour in milliseconds
});
```

## Custom Serialization/Deserialization

Override default JSON methods if needed:

```ts
const store = createStore(initialState, {
  persist: persistOptions,
  serialize: (data) => /* custom serialization logic */,
  deserialize: (str) => /* custom deserialization logic */,
});
```

---

# Demo Application

A demo React application is included in the `demo/` folder. It is built using Vite with the SWC-powered React plugin for fast builds.

## Running the Demo

1.  **Install dependencies:**

    ```ts
    yarn install
    ```

2.  **Start the demo server:**

    ```ts
    yarn dev:demo
    ```

3.  **Testing**

    Run tests to verify that state management, persistence, middleware, and undo/redo functionalities work as expected:

    ```
    yarn test

    ```

---

# Contributing

Contributions are welcome! If you have ideas for improvements, additional features, or bug fixes, please open an issue or submit a pull request.

---

# License

This project is licensed under the MIT License.

Enjoy building with **zust-api**!
