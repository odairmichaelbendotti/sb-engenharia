import { createBrowserRouter } from "react-router";
import AppLayout from "./components/Layouts/AppLayout";
import RequireAuth from "./components/Auth/RequireAuth";
import Dashboard from "./pages/Dashboard/page";
import Empresas from "./pages/Company/page";
import Invoices from "./pages/Invoice/page";
import Empenhos from "./pages/Empenho/page";
import Medicoes from "./pages/Medicoes/page";
import Obras from "./pages/Obra/page";
import Aprovacoes from "./pages/Approval/page";
import Usuarios from "./pages/Users/page";
import Organizacoes from "./pages/Tenant/page";
import SignIn from "./pages/auth/SignIn/page";
import SignUp from "./pages/auth/SignUp/page";

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
      {
        path: "/usuarios",
        element: <Usuarios />,
      },
      {
        path: "/organizacoes",
        element: <Organizacoes />,
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
