import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import FamilyFormPage from "./pages/FamilyFormPage.jsx";

// Suppress Chrome extension messaging errors
if (typeof chrome !== 'undefined' && chrome.runtime) {
  chrome.runtime.onMessage.addListener(() => {
    // This satisfies extensions that expect a response
    return false;
  });
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <FamilyFormPage />
  </React.StrictMode>
);