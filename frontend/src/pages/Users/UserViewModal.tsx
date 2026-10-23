import { Building2, Check, KeyRound, Mail, ShieldCheck, UserRound } from "lucide-react";
import type { User } from "../../../types/user";
import { getInitials } from "../../utils/get-initial";
import {
  Button,
  DetailGrid,
  DetailItem,
  FormSection,
  Modal,
  ModalBody,
  ModalEntityHeader,
  ModalFooter,
  StatusPill,
} from "../../components/ui";
import { ROLE_LABELS } from "./role-labels";
import { GUIDE_COLUMNS, ROLE_GUIDE_BY_ROLE } from "./role-guide";

// Visualização do usuário: dados da conta e o que o perfil dele permite
export function UserViewModal({ user, onClose }: { user: User; onClose: () => void }) {
  const guide = ROLE_GUIDE_BY_ROLE[user.role];

  return (
    <Modal open size="lg" onClose={onClose}>
      <ModalEntityHeader
        eyebrow={
          <>
            <span className="w-6 h-6 rounded-full bg-primary-500 text-white text-[10px] font-semibold flex items-center justify-center">
              {getInitials(user.name)}
            </span>
            <StatusPill tone={user.approved ? "success" : "warning"}>{user.approved ? "Aprovado" : "Pendente"}</StatusPill>
            <span>{ROLE_LABELS[user.role]}</span>
          </>
        }
        title={user.name}
        onClose={onClose}
      />
      <ModalBody className="space-y-6">
        <FormSection title="Conta" icon={UserRound}>
          <DetailGrid>
            <DetailItem icon={Mail} label="E-mail">
              {user.email}
            </DetailItem>
            <DetailItem icon={ShieldCheck} label="Perfil">
              {ROLE_LABELS[user.role]}
            </DetailItem>
            <DetailItem icon={user.company_id ? Building2 : KeyRound} label="Tipo de acesso">
              {user.company_id ? "Login de empresa contratada" : "Usuário da organização"}
            </DetailItem>
          </DetailGrid>
        </FormSection>

        {guide && (
          <FormSection title="O que este perfil pode fazer" icon={ShieldCheck}>
            <p className="-mt-2 text-sm text-text-secondary">{guide.title}</p>
            <ul className="space-y-1.5">
              {guide.abilities.map((ability) => (
                <li key={ability} className="flex items-start gap-2 text-sm text-text-primary">
                  <Check size={14} className="text-success-text mt-0.5 shrink-0" />
                  {ability}
                </li>
              ))}
            </ul>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {GUIDE_COLUMNS.map((column) => (
                <div key={column.key} className="rounded-lg border border-border bg-surface-muted px-3 py-2" title={column.hint}>
                  <p className="text-[11px] text-text-muted">{column.label}</p>
                  <p className="text-sm font-semibold text-text-primary">{guide.cells[column.key].text}</p>
                </div>
              ))}
            </div>
          </FormSection>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="ghost" onClick={onClose}>
          Fechar
        </Button>
      </ModalFooter>
    </Modal>
  );
}
