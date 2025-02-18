import * as React from "react";
import { useSelectors, setDeep } from "../store";

export const Counter: React.FC = () => {
  const { counter } = useSelectors("counter");

  return (
    <div className="component">
      <h2>Counter: {counter}</h2>
      <button onClick={() => setDeep("counter", (prev) => prev + 1)}>
        Increment
      </button>
      <button onClick={() => setDeep("counter", (prev) => prev - 1)}>
        Decrement
      </button>
      <button onClick={() => setDeep("counter", 0)}>Reset</button>
    </div>
  );
};
