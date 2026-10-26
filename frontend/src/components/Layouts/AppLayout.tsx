import { useEffect } from "react";
import { Link, Navigate, Outlet, useLocation } from "react-router";
import { ClipboardCheck } from "lucide-react";
import Sidebar from "../Sidebar/Sidebar";
import MobileSidebar from "../Sidebar/MobileSidebar";
import { useUser } from "../../store/user";
import { useTramitacao } from "../../store/tramitacao";
import { isEmpresaPath } from "../Sidebar/empresa-items";
import { CIENCIA_PENDENTE_EVENT } from "../../services/api";
import PendenciasCiencia from "../../pages/Pendencias/page";
import { describePrazoCiencia } from "../../pages/OrdemServico/ordem-servico-ciencia";
import { EntityViewer } from "../EntityViewer/EntityViewer";

const EMPRESA_HOME = "/mapa-obras";
// Recalcula as pendências da empresa: o prazo pode vencer com a tela aberta
const PENDENCIAS_POLL_MS = 60_000;

const AppLayout = () => {
  const { user } = useUser();
  const location = useLocation();
  const isEmpresa = user?.role === "EMPRESA";
  const { pendencias, fetchPendencias } = useTramitacao();

  useEffect(() => {
    if (!isEmpresa) return;
    const load = () => fetchPendencias().catch(() => {});
    load();
    const timer = window.setInterval(load, PENDENCIAS_POLL_MS);
    // O backend respondeu CIENCIA_PENDENTE em alguma tela: atualiza e mostra o bloqueio
    window.addEventListener(CIENCIA_PENDENTE_EVENT, load);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener(CIENCIA_PENDENTE_EVENT, load);
    };
  }, [isEmpresa, fetchPendencias]);

  // Empresa só acessa as telas do próprio menu (somente leitura); o resto volta ao mapa
  if (isEmpresa && !isEmpresaPath(location.pathname)) {
    return <Navigate to={EMPRESA_HOME} replace />;
  }

  const bloqueada = isEmpresa && pendencias?.bloqueada === true;
  const proxima = isEmpresa && !bloqueada ? pendencias?.pendencias[0] : undefined;

  return (
    <main className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar */}
      <MobileSidebar />

      {/* Main Content - with top padding on mobile for header */}
      <div className="flex-1 h-full overflow-auto md:pt-0 pt-16">
        {proxima && location.pathname !== "/pendencias" && (
          <div className="border-b border-warning-border bg-warning-bg px-4 py-2 text-xs text-warning-text flex flex-wrap items-center gap-x-2 gap-y-1">
            <ClipboardCheck size={14} className="shrink-0" />
            <span>
              {pendencias!.pendencias.length === 1
                ? "1 ordem de serviço aguarda a sua ciência"
                : `${pendencias!.pendencias.length} ordens de serviço aguardam a sua ciência`}{" "}
              · prazo mais próximo: {describePrazoCiencia(proxima.cienciaPrazoAte, new Date(pendencias!.serverNow))}
            </span>
            <Link to="/pendencias" className="font-semibold underline underline-offset-2 hover:no-underline">
              Ver pendências
            </Link>
          </div>
        )}
        {/* Prazo de ciência vencido: até dar ciência, a empresa só vê as pendências */}
        {bloqueada ? <PendenciasCiencia bloqueada /> : <Outlet />}
      </div>

      {/* Visualização de qualquer registro (NF, empenho, contrato, empresa, OS, obra) */}
      {!bloqueada && <EntityViewer />}
    </main>
  );
};

export default AppLayout;
