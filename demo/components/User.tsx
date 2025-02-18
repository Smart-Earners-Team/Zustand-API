import * as React from "react";
import { useSelectors, setDeep } from "../store";

export const User: React.FC = () => {
  const { name, age } = useSelectors("user.name", "user.age");
  const [newName, setNewName] = React.useState(name);
  const [newAge, setNewAge] = React.useState(age);

  const updateUser = () => {
    if (newName.trim()) {
      setDeep("user.name", newName);
    }
    setDeep("user.age", newAge);
  };

  return (
    <div className="component">
      <h2>User</h2>
      <p>
        Name: <strong>{name}</strong>
      </p>
      <p>
        Age: <strong>{age}</strong>
      </p>
      <input
        type="text"
        value={newName}
        onChange={(e) => setNewName(e.target.value)}
        placeholder="New name"
      />
      <input
        type="number"
        value={newAge}
        onChange={(e) => setNewAge(Number(e.target.value))}
        placeholder="New age"
      />
      <button onClick={updateUser}>Update User</button>
    </div>
  );
};
