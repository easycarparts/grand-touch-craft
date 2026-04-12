import { createRoot } from "react-dom/client";
import App from "./App";
import { AdminAuthProvider } from "@/components/admin/AdminAuthProvider";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AdminAuthProvider>
    <App />
  </AdminAuthProvider>,
);
