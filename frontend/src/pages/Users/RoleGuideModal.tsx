import { useEffect } from "react";
import { BookOpen, Info } from "lucide-react";
import { Badge, Modal, ModalBody, ModalHeader, Table, TableBody, TableHead, Td, Th, Tr } from "../../components/ui";
import type { User } from "../../../types/user";
import { ROLE_LABELS } from "./role-labels";
import { GUIDE_COLUMNS, GUIDE_RULES, ROLE_GUIDE, type GuideLevel } from "./role-guide";

const LEVEL_STYLES: Record<GuideLevel, string> = {
  edit: "bg-success-bg text-success-text border-success-border",
  create: "bg-info-bg text-info-text border-info-border",
  partial: "bg-warning-bg text-warning-text border-warning-border",
  view: "bg-surface-muted text-text-secondary border-border",
  none: "text-text-muted border-transparent",
};

const LEGEND: { level: GuideLevel; label: string }[] = [
  { level: "edit", label: "Cadastra, edita e exclui" },
  { level: "create", label: "Só cadastra" },
  { level: "partial", label: "Com restrição" },
  { level: "view", label: "Só visualiza" },
];

interface RoleGuideModalProps {
  open: boolean;
  // Perfis que quem está vendo pode atribuir — os demais ganham um aviso
  assignableRoles: User["role"][];
  onClose: () => void;
}

export function RoleGuideModal({ open, assignableRoles, onClose }: RoleGuideModalProps) {
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <Modal open size="2xl" onClose={onClose}>
      <ModalHeader
        icon={BookOpen}
        title="O que cada perfil pode fazer"
        description="Consulte antes de mudar o perfil de alguém"
        onClose={onClose}
      />

      <ModalBody className="space-y-5">
        <section>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {LEGEND.map(({ level, label }) => (
              <span
                key={level}
                className={`inline-flex items-center px-1.5 py-0.5 rounded-md border text-[11px] font-medium ${LEVEL_STYLES[level]}`}
              >
                {label}
              </span>
            ))}
          </div>
          {/* Moldura com borda; sem rolagem horizontal: as células quebram linha */}
          <div className="border border-border rounded-lg overflow-hidden">
            <Table compact>
              <TableHead>
                <Th>Perfil</Th>
                {GUIDE_COLUMNS.map((column) => (
                  <Th key={column.key}>
                    {/* O Th não repassa title: a dica fica no texto do cabeçalho */}
                    <span title={column.hint} className="cursor-help">
                      {column.label}
                    </span>
                  </Th>
                ))}
              </TableHead>
              <TableBody>
                {ROLE_GUIDE.map((guide) => (
                  <Tr key={guide.role}>
                    <Td>
                      <span className="font-semibold text-text-primary">{ROLE_LABELS[guide.role]}</span>
                    </Td>
                    {GUIDE_COLUMNS.map((column) => {
                      const cell = guide.cells[column.key];
                      return (
                        <Td key={column.key}>
                          <span
                            className={`inline-flex px-1.5 py-0.5 rounded-md border text-[11px] font-medium ${LEVEL_STYLES[cell.level]}`}
                          >
                            {cell.text}
                          </span>
                        </Td>
                      );
                    })}
                  </Tr>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ROLE_GUIDE.map((guide) => {
            const assignable = assignableRoles.includes(guide.role);
            return (
              <article key={guide.role} className="border border-border rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-text-primary">{ROLE_LABELS[guide.role]}</h3>
                    <p className="text-xs text-text-muted">{guide.title}</p>
                  </div>
                  {!assignable && (
                    <Badge className="shrink-0">
                      {guide.role === "EMPRESA" ? "criado em Empresas" : "você não pode atribuir"}
                    </Badge>
                  )}
                </div>
                <ul className="mt-2 space-y-1 text-xs text-text-secondary list-disc pl-4">
                  {guide.abilities.map((ability) => (
                    <li key={ability}>{ability}</li>
                  ))}
                </ul>
              </article>
            );
          })}
        </section>

        <section className="flex gap-2 rounded-lg bg-info-bg border border-info-border px-3 py-2.5 text-xs text-info-text">
          <Info size={14} className="shrink-0 mt-0.5" />
          <ul className="space-y-0.5">
            {GUIDE_RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </section>
      </ModalBody>
    </Modal>
  );
}
