// src/main.tsx — نقطة الدخول | RTL + Bidi (قانون 29) + تسجيل Service Worker (قانون 25)
import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.js";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* الوضع offline يُختبر في المتصفح — فشل التسجيل لا يكسر التطبيق */
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
