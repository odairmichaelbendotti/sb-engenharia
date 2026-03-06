import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { router } from "./routes";
import { RouterProvider } from "react-router";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
