import { useState, type ReactNode } from "react";
import { Activity, CheckCircle2, FileSignature, Hash, Pencil, Plus, Save, Search, Trash2, XCircle } from "lucide-react";
import {
  Button,
  Field,
  FormSection,
  IconButton,
  Input,
  Modal,
  ModalBody,
  ModalFooter,
  ModalHeader,
  SegmentedControl,
  Select,
  Textarea,
  type SegmentOption,
} from "../../components/ui";

type Status = "ATIVO" | "FINALIZADO" | "CANCELADO";

const STATUS_OPTIONS: SegmentOption<Status>[] = [
  { value: "ATIVO", label: "Ativo", icon: Activity, tone: "warning" },
  { value: "FINALIZADO", label: "Finalizado", icon: CheckCircle2, tone: "success" },
  { value: "CANCELADO", label: "Cancelado", icon: XCircle, tone: "danger" },
];

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="bg-surface border border-border rounded-xl p-6 space-y-4">
      <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      {children}
    </section>
  );
}

// Vitrine dos componentes base (só em desenvolvimento, rota /design-system)
export default function DesignSystem() {
  const [status, setStatus] = useState<Status>("ATIVO");
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background p-6 md:p-10">
      <div className="max-w-4xl mx-auto space-y-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-text-primary">Design system</h1>
          <p className="text-sm text-text-secondary mt-1">
            Componentes base em <code className="text-xs">src/components/ui</code>. Mesma altura para input, select e
            botão no mesmo tamanho.
          </p>
        </header>

        <Block title="Tipografia">
          <div className="space-y-2">
            <p className="text-2xl font-semibold tracking-tight">Título de página — 24 semibold</p>
            <p className="text-lg font-semibold tracking-tight">Título de seção — 18 semibold</p>
            <p className="text-base font-semibold">Título de modal — 16 semibold</p>
            <p className="text-sm">Texto padrão — 14 regular. R$ 1.234.567,89</p>
            <p className="text-xs font-semibold text-text-secondary">Rótulo de campo — 12 semibold</p>
            <p className="text-xs text-text-muted">Texto de apoio — 12 regular</p>
          </div>
        </Block>

        <Block title="Botões">
          <div className="flex flex-wrap items-center gap-2">
            <Button icon={Plus}>Primário</Button>
            <Button variant="secondary" icon={Pencil}>
              Secundário
            </Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger" icon={Trash2}>
              Excluir
            </Button>
            <Button variant="success" icon={CheckCircle2}>
              Aprovar
            </Button>
            <Button loading>Salvando</Button>
            <Button disabled>Desabilitado</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" icon={Plus}>
              Pequeno
            </Button>
            <Button size="sm" variant="secondary">
              Secundário
            </Button>
            <Button size="sm" variant="ghost">
              Ghost
            </Button>
            <IconButton icon={Pencil} label="Editar" size="sm" />
            <IconButton icon={Trash2} label="Excluir" size="sm" variant="danger" />
            <IconButton icon={Pencil} label="Editar" variant="secondary" />
          </div>
        </Block>

        <Block title="Alinhamento (md = 40px)">
          <div className="flex flex-wrap items-center gap-2">
            <Input icon={Search} placeholder="Buscar..." className="w-56" />
            <Select className="w-44" defaultValue="">
              <option value="">Todas as empresas</option>
            </Select>
            <Button variant="secondary">Filtros</Button>
            <Button icon={Plus}>Novo</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input size="sm" icon={Search} placeholder="Buscar..." className="w-56" />
            <Select size="sm" className="w-44" defaultValue="">
              <option value="">Todas</option>
            </Select>
            <Button size="sm" variant="secondary">
              Filtros
            </Button>
            <Button size="sm">Novo</Button>
          </div>
        </Block>

        <Block title="Formulário">
          <FormSection title="Identificação" icon={Hash}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Número do empenho" required>
                <Input icon={Hash} placeholder="NE2028003" />
              </Field>
              <Field label="Valor" required hint="Valor global do empenho">
                <Input prefix="R$" placeholder="0,00" inputMode="numeric" />
              </Field>
              <Field label="Contrato">
                <Select icon={FileSignature} defaultValue="">
                  <option value="">Selecione um contrato</option>
                  <option value="1">CT 01/2026 — Reforma do hangar</option>
                </Select>
              </Field>
              <Field label="Prazo">
                <Input type="number" suffix="dias" placeholder="90" />
              </Field>
              <Field label="Data de início">
                <Input type="date" />
              </Field>
              <Field label="Com erro" error="Preencha este campo">
                <Input placeholder="Obrigatório" />
              </Field>
              <Field label="Desabilitado">
                <Input disabled value="Não editável" />
              </Field>
            </div>
            <Field label="Descrição">
              <Textarea placeholder="Descreva o objeto..." />
            </Field>
          </FormSection>
          <FormSection title="Situação" icon={Activity}>
            <SegmentedControl label="Status" options={STATUS_OPTIONS} value={status} onChange={setStatus} />
          </FormSection>
        </Block>

        <Block title="Modal">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Abrir modal
          </Button>
        </Block>
      </div>

      <Modal open={modalOpen} size="md" onBackdropClick={() => setModalOpen(false)}>
        <ModalHeader
          icon={FileSignature}
          title="Novo contrato"
          description="Preencha os dados para cadastrar o contrato"
          onClose={() => setModalOpen(false)}
        />
        <ModalBody className="space-y-4">
          <Field label="Identificador" required>
            <Input placeholder="CT 01/2026" />
          </Field>
          <Field label="Empresa">
            <Select defaultValue="">
              <option value="">Selecione</option>
            </Select>
          </Field>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={() => setModalOpen(false)}>
            Cancelar
          </Button>
          <Button icon={Save}>Salvar</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
