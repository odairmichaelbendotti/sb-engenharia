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
import { MedicaoPage, OrcamentoPage } from "./pages/Medicoes";
import Obras from "./pages/Obra/page";
import MapaObras from "./pages/MapaObras/page";
import PendenciasCiencia from "./pages/Pendencias/page";
import Aprovacoes from "./pages/Approval/page";
import Usuarios from "./pages/Users/page";
import Organizacoes from "./pages/Tenant/page";
import TenantSummaryDetail from "./pages/Tenant/TenantSummaryDetail";
import SignIn from "./pages/auth/SignIn/page";
import SignUp from "./pages/auth/SignUp/page";
import DesignSystem from "./pages/DesignSystem/page";

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
          // Empresa consulta só as próprias OS (o backend filtra), sem acesso ao resto do administrativo
          <RequireRole allow={(p) => p.canViewAdministrativo || p.isEmpresaRestricted}>
            <OrdensServico />
          </RequireRole>
        ),
      },
      {
        path: "/pendencias",
        element: (
          // OS aguardando ciência da empresa (com o prazo vencido, o AppLayout mostra só esta tela)
          <RequireRole allow={(p) => p.canDarCienciaOrdemServico}>
            <PendenciasCiencia />
          </RequireRole>
        ),
      },
      {
        // Orçamento e medições em tela cheia: trabalho da fiscalização, a empresa vê só pelo modal da OS
        path: "/medicoes",
        element: (
          <RequireRole allow={(p) => p.canViewEngenharia && !p.isEmpresaRestricted}>
            <Medicoes />
          </RequireRole>
        ),
      },
      {
        path: "/medicoes/:osId/orcamento",
        element: (
          <RequireRole allow={(p) => p.canViewEngenharia && !p.isEmpresaRestricted}>
            <OrcamentoPage />
          </RequireRole>
        ),
      },
      {
        path: "/medicoes/:osId/medicoes/:medicaoId?",
        element: (
          <RequireRole allow={(p) => p.canViewEngenharia && !p.isEmpresaRestricted}>
            <MedicaoPage />
          </RequireRole>
        ),
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
  // Vitrine dos componentes base, só no ambiente de desenvolvimento
  ...(import.meta.env.DEV ? [{ path: "/design-system", element: <DesignSystem /> }] : []),
]);
