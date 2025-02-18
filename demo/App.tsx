import * as React from "react";
import { Counter } from "./components/Counter";
import { User } from "./components/User";
import { Theme } from "./components/Theme";
import { Todos } from "./components/Todos";
import { DeepNested } from "./components/DeepNested";

export default function App() {
  return (
    <div className="App">
      <h1>Zust-API State Management Demo</h1>
      <Theme />
      <Counter />
      <User />
      <Todos />
      <DeepNested />
      <footer
        style={{
          marginTop: "2rem",
          textAlign: "center",
          color: "#fff", // White text for dark backgrounds
          backgroundColor: "rgba(0, 0, 0, 0.7)", // Optional: add a semi-transparent background
          padding: "1rem",
        }}
      >
        <p>
          Source code available on{" "}
          <a
            href="https://github.com/Smart-Earners-Team/Zustand-API"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#90caf9" }}
          >
            GitHub
          </a>
          .
        </p>
      </footer>
    </div>
  );
}
