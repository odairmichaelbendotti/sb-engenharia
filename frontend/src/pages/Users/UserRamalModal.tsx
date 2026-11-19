import { useState, type FormEvent } from "react";
import { Phone } from "lucide-react";
import { toast } from "sonner";
import type { User } from "../../../types/user";
import { Button, Field, Input, Modal, ModalBody, ModalFooter, ModalHeader } from "../../components/ui";
import { fiscalizacaoRequest } from "../Fiscalizacao/api";

export function UserRamalModal({ user, onClose, onSaved }: { user: User; onClose: () => void; onSaved: () => void }) {
  const [ramal, setRamal] = useState(user.ramal ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function salvar(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      await fiscalizacaoRequest(`/usuarios/${user.id}/ramal`, { tenant_id: user.tenant_id, ramal }, "PUT");
      toast.success("Ramal atualizado. Os cadastros de fiscalização foram atualizados automaticamente.");
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível atualizar o ramal."); }
    finally { setBusy(false); }
  }
  return <Modal open onClose={() => { if (!busy) onClose(); }}>
    <ModalHeader title="Ramal do usuário" description={user.name} icon={Phone} onClose={busy ? undefined : onClose} />
    <form onSubmit={salvar} className="flex flex-col min-h-0">
      <ModalBody className="space-y-4">
        <p className="text-sm text-text-secondary">Este ramal será preenchido automaticamente quando o usuário for selecionado como fiscal da unidade.</p>
        <Field label="Ramal"><Input maxLength={40} value={ramal} onChange={(event) => setRamal(event.target.value)} placeholder="Opcional" /></Field>
        {error && <p role="alert" className="text-sm text-danger-text">{error}</p>}
      </ModalBody>
      <ModalFooter><Button variant="ghost" disabled={busy} onClick={onClose}>Cancelar</Button><Button loading={busy} type="submit">Salvar ramal</Button></ModalFooter>
    </form>
  </Modal>;
}
