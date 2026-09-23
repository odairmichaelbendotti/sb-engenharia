import { createBrowserRouter } from "react-router";
import AppLayout from "./components/Layouts/AppLayout";
import RequireAuth from "./components/Auth/RequireAuth";
import RequireRole from "./components/Auth/RequireRole";
import Dashboard from "./pages/Dashboard/page";
import Empresas from "./pages/Company/page";
import Invoices from "./pages/Invoice/page";
import Empenhos from "./pages/Empenho/page";
import Contratos from "./pages/Contrato/page";
import OrdensServico from "./pages/OrdemServico/page";
import Medicoes from "./pages/Medicoes/page";
import Obras from "./pages/Obra/page";
import MapaObras from "./pages/MapaObras/page";
import Aprovacoes from "./pages/Approval/page";
import Usuarios from "./pages/Users/page";
import Organizacoes from "./pages/Tenant/page";
import TenantSummaryDetail from "./pages/Tenant/TenantSummaryDetail";
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
        path: "/contratos",
        element: (
          <RequireRole allow={(p) => p.canViewAdministrativo}>
            <Contratos />
          </RequireRole>
        ),
      },
      {
        path: "/ordens-servico",
        element: (
          <RequireRole allow={(p) => p.canViewAdministrativo}>
            <OrdensServico />
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
        path: "/mapa-obras",
        element: <MapaObras />,
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
      {
        path: "/organizacoes/:tenantId",
        element: (
          <RequireRole allow={(p) => p.canManageOrganization}>
            <TenantSummaryDetail />
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
