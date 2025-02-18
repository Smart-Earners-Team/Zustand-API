import * as React from "react";
import { useSelectors, setDeep } from "../store";

export const Todos: React.FC = () => {
  const { todos } = useSelectors("todos");
  const [newTodo, setNewTodo] = React.useState("");

  const addTodo = () => {
    if (newTodo.trim()) {
      setDeep("todos", (prev) => [
        ...prev,
        { id: Date.now(), text: newTodo, completed: false },
      ]);
      setNewTodo("");
    }
  };

  const toggleTodo = (id: number) => {
    setDeep("todos", (prev) =>
      prev.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const deleteTodo = (id: number) => {
    setDeep("todos", (prev) => prev.filter((todo) => todo.id !== id));
  };

  return (
    <div className="component">
      <h2>Todos</h2>
      <div className="todo-input">
        <input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="New todo"
        />
        <button onClick={addTodo}>Add Todo</button>
      </div>
      {todos.length === 0 ? (
        <p>No todos yet!</p>
      ) : (
        <ul className="todo-list">
          {todos.map((todo) => (
            <li key={todo.id} className={todo.completed ? "completed" : ""}>
              <span onClick={() => toggleTodo(todo.id)}>{todo.text}</span>
              <button onClick={() => deleteTodo(todo.id)}>❌</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
