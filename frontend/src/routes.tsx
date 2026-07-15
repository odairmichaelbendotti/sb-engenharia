import { createBrowserRouter } from "react-router";
import AppLayout from "./components/Layouts/AppLayout";
import RequireAuth from "./components/Auth/RequireAuth";
import RequireRole from "./components/Auth/RequireRole";
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
        element: (
          <RequireRole allow={(p) => p.canViewAdministrativo}>
            <Empresas />
          </RequireRole>
        ),
      },
      {
        path: "/notasfiscais",
        element: (
          <RequireRole allow={(p) => p.canViewAdministrativo}>
            <Invoices />
          </RequireRole>
        ),
      },
      {
        path: "/empenhos",
        element: (
          <RequireRole allow={(p) => p.canViewAdministrativo}>
            <Empenhos />
          </RequireRole>
        ),
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
        element: (
          <RequireRole allow={(p) => p.canApproveUsers}>
            <Aprovacoes />
          </RequireRole>
        ),
      },
      {
        path: "/usuarios",
        element: (
          <RequireRole allow={(p) => p.canApproveUsers}>
            <Usuarios />
          </RequireRole>
        ),
      },
      {
        path: "/organizacoes",
        element: (
          <RequireRole allow={(p) => p.canManageOrganization}>
            <Organizacoes />
          </RequireRole>
        ),
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
