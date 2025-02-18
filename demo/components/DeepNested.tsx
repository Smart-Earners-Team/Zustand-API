import * as React from "react";
import { useSelectors, setDeep } from "../store";

export const DeepNested: React.FC = () => {
  const { deepValue } = useSelectors(
    "deepNested.level1.level2.value:deepValue"
  );
  const [newValue, setNewValue] = React.useState(deepValue);

  const updateDeepValue = () => {
    setDeep("deepNested.level1.level2.value", newValue);
  };

  return (
    <div className="component">
      <h2>Deep Nested Value</h2>
      <p>
        Value: <strong>{deepValue}</strong>
      </p>
      <input
        value={newValue}
        onChange={(e) => setNewValue(e.target.value)}
        placeholder="Update value"
      />
      <button onClick={updateDeepValue}>Update Deep Value</button>
    </div>
  );
};
