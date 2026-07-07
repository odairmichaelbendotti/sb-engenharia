import { createBrowserRouter } from "react-router";
import AppLayout from "./components/Layouts/AppLayout";
import RequireAuth from "./components/Auth/RequireAuth";
import Dashboard from "./pages/Dashboard";
import Empresas from "./pages/Empresas";
import Invoices from "./pages/Invoices";
import Empenhos from "./pages/Empenhos";
import Medicoes from "./pages/Medicoes";
import Obras from "./pages/Obras";
import Aprovacoes from "./pages/Aprovacoes";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";

export const router = createBrowserRouter([
  {
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
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
        element: <Invoices />,
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
      {
        path: "/aprovacoes",
        element: <Aprovacoes />,
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
