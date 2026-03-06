import { createBrowserRouter } from "react-router";
import DashboardLayout from "./components/Layouts/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import Empresas from "./pages/Empresas";
import NotasFiscais from "./pages/NotasFiscais";
import Empenhos from "./pages/Empenhos";
import Medicoes from "./pages/Medicoes";
import Obras from "./pages/Obras";

export const router = createBrowserRouter([
  {
    element: <DashboardLayout />,
    children: [
      {
        path: "/",
        element: <Dashboard />,
      },
      {
        path: "/empresas",
        element: <Empresas />,
      },
      {
        path: "/notasfiscais",
        element: <NotasFiscais />,
      },
      {
        path: "/empenhos",
        element: <Empenhos />,
      },
      {
        path: "/medicoes",
        element: <Medicoes />,
      },
      {
        path: "/obras",
        element: <Obras />,
      },
    ],
  },
]);
