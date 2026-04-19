import { createBrowserRouter } from "react-router";
import MobileDashboardLayout from "./components/Layouts/MobileDashboardLayout";
import Dashboard from "./pages/Dashboard";
import Empresas from "./pages/Empresas";
import NotasFiscais from "./pages/NotasFiscais";
import Empenhos from "./pages/Empenhos";
import Medicoes from "./pages/Medicoes";
import Obras from "./pages/Obras";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";

export const router = createBrowserRouter([
  {
    element: <MobileDashboardLayout />,
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
  {
    path: "/signin",
    element: <SignIn />,
  },
  {
    path: "/signup",
    element: <SignUp />,
  },
]);
