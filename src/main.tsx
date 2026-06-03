import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

function mountSitoraReceptionist() {
  let container = document.getElementById("sitora-receptionist-root");

  if (!container) {
    container = document.createElement("div");
    container.id = "sitora-receptionist-root";
    document.body.appendChild(container);
  }

  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountSitoraReceptionist);
} else {
  mountSitoraReceptionist();
}