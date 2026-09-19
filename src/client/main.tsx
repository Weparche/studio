import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/client/App";
import "@/client/index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element #root not found");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
