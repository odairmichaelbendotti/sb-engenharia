import { useMemo, useState } from "react";
import { Building2, Edit2, Eye, KeyRound, Loader2, Mail, Phone, Plus, Trash2 } from "lucide-react";
import type { Empresa } from "../../../types/empresa";
import { usePermission } from "../../hooks/usePermission";
import { useContratos } from "../../store/contratos";
import { maskCnpj, maskPhone } from "../../utils/masks";
import { matchesCompanySearch } from "./company-search";
import { BalanceCell } from "../../components/BalanceCell";
import {
  ActionMenu,
  Button,
  CodeTag,
  Pagination,
  StatusPill,
  Table,
  TableBody,
  TableHead,
  Td,
  Th,
  Tr,
} from "../../components/ui";

const ITEMS_PER_PAGE = 10;

type TableCompaniesProps = {
  empresas: Empresa[];
  isLoading?: boolean;
  onView: (empresa: Empresa) => void;
  handleOpen: (empresa: Empresa) => void;
  handleOpenDelete: (empresa: Empresa) => void;
  handleOpenAccess: (empresa: Empresa) => void;
  onAdd?: () => void;
  searchTerm: string;
};

type Totais = { empenhado: number; liquidado: number };

const TableCompanies = ({
  empresas,
  isLoading = false,
  onView,
  handleOpen,
  handleOpenDelete,
  handleOpenAccess,
  onAdd,
  searchTerm,
}: TableCompaniesProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const { canEditAdministrativo, canCreateCompanyAccess } = usePermission();
  // Empenhado e liquidado por empresa, dos contratos (o liquidado vem das notas fiscais);
  // contratos cancelados ficam de fora
  const contratos = useContratos((s) => s.data?.contratos);
  const totaisPorEmpresa = useMemo(() => {
    const map = new Map<string, Totais>();
    for (const c of contratos ?? []) {
      if (c.status === "CANCELADO") continue;
      const t = map.get(c.company.id) ?? { empenhado: 0, liquidado: 0 };
      t.empenhado += c.valorEmpenhado;
      t.liquidado += c.valorLiquidado;
      map.set(c.company.id, t);
    }
    return map;
  }, [contratos]);

  const filteredEmpresas = useMemo(
    () => empresas.filter((empresa) => matchesCompanySearch(empresa, searchTerm)),
    [empresas, searchTerm],
  );

  const totalPages = Math.max(1, Math.ceil(filteredEmpresas.length / ITEMS_PER_PAGE));
  const page = Math.min(currentPage, totalPages);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const paginatedEmpresas = filteredEmpresas.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div>
      <Table>
        <TableHead>
          <Th>Empresa</Th>
          <Th width="w-40" className="hidden lg:table-cell">
            Contratos
          </Th>
          <Th width="w-64" className="hidden xl:table-cell">
            Contato
          </Th>
          <Th width="w-48" className="hidden sm:table-cell">
            Em execução
          </Th>
          <Th actions />
        </TableHead>
        <TableBody>
          {paginatedEmpresas.map((empresa) => {
            const contratos = empresa.contratos ?? [];
            const ativos = contratos.filter((c) => c.status === "ATIVO").length;
            const totais = totaisPorEmpresa.get(empresa.id) ?? { empenhado: 0, liquidado: 0 };
            return (
              <Tr key={empresa.id} onOpen={() => onView(empresa)}>
                <Td>
                  <p className="font-semibold text-text-primary truncate" title={empresa.name}>
                    {empresa.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-1 text-[11px] text-text-muted min-w-0">
                    <CodeTag>{maskCnpj(empresa.cnpj)}</CodeTag>
                    <span className="truncate">
                      {empresa.city}/{empresa.state}
                    </span>
                  </div>
                </Td>
                <Td className="hidden lg:table-cell">
                  <StatusPill tone={ativos > 0 ? "info" : "neutral"}>
                    {ativos > 0 ? `${ativos} ${ativos === 1 ? "ativo" : "ativos"}` : "Nenhum ativo"}
                  </StatusPill>
                  {contratos.length > ativos && (
                    <p className="text-[11px] text-text-muted mt-0.5">{contratos.length} no total</p>
                  )}
                </Td>
                <Td className="hidden xl:table-cell">
                  <p className="flex items-center justify-center gap-1 text-text-primary truncate" title={empresa.email}>
                    <Mail size={12} className="text-text-muted shrink-0" />
                    <span className="truncate">{empresa.email || "—"}</span>
                  </p>
                  <p className="flex items-center justify-center gap-1 text-[11px] text-text-muted">
                    <Phone size={11} className="shrink-0" />
                    {empresa.phone ? maskPhone(empresa.phone) : "—"}
                  </p>
                </Td>
                <Td className="hidden sm:table-cell">
                  {totais.empenhado > 0 ? (
                    <BalanceCell valor={totais.empenhado} liquidado={totais.liquidado} paidLabel="Tudo liquidado" />
                  ) : (
                    <span className="text-xs text-text-muted">Sem empenhos</span>
                  )}
                </Td>
                <Td actions>
                  <ActionMenu
                    label={`Ações da empresa ${empresa.name}`}
                    items={[
                      { label: "Visualizar", icon: Eye, onClick: () => onView(empresa) },
                      { label: "Editar", icon: Edit2, onClick: () => handleOpen(empresa), hidden: !canEditAdministrativo },
                      {
                        label: "Criar acesso",
                        icon: KeyRound,
                        onClick: () => handleOpenAccess(empresa),
                        hidden: !canCreateCompanyAccess,
                      },
                      {
                        label: "Excluir",
                        icon: Trash2,
                        onClick: () => handleOpenDelete(empresa),
                        danger: true,
                        hidden: !canEditAdministrativo,
                      },
                    ]}
                  />
                </Td>
              </Tr>
            );
          })}
        </TableBody>
      </Table>

      {paginatedEmpresas.length === 0 &&
        (isLoading ? (
          <div className="py-10 text-center">
            <Loader2 size={28} className="mx-auto text-text-muted animate-spin mb-2" />
            <p className="text-text-secondary text-sm">Carregando empresas...</p>
          </div>
        ) : (
          <div className="py-10 text-center">
            <Building2 size={28} className="mx-auto text-text-muted mb-2" />
            <p className="text-sm text-text-secondary font-medium">Nenhuma empresa encontrada</p>
            <p className="text-text-muted text-xs mt-1">Tente ajustar a busca ou cadastre uma nova empresa</p>
            {onAdd && canEditAdministrativo && (
              <Button icon={Plus} onClick={onAdd} className="mt-4">
                Cadastrar empresa
              </Button>
            )}
          </div>
        ))}

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        startIndex={startIndex}
        totalItems={filteredEmpresas.length}
        itemsPerPage={ITEMS_PER_PAGE}
        itemLabel="empresas"
        onPageChange={setCurrentPage}
      />
    </div>
  );
};

export default TableCompanies;
