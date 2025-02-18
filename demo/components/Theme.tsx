import * as React from "react";
import { useSelectors, setDeep } from "../store";

export const Theme: React.FC = () => {
  const { theme } = useSelectors("theme");

  React.useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  return (
    <div className="component">
      <h2>Theme: {theme === "light" ? "🌞 Light" : "🌜 Dark"}</h2>
      <button
        onClick={() =>
          setDeep("theme", (prev) => (prev === "light" ? "dark" : "light"))
        }
      >
        Toggle Theme
      </button>
    </div>
  );
};
