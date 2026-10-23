import { useState, type ReactNode } from "react";
import { Activity, Building2, CheckCircle2, Edit2, Eye, FileSignature, Hash, Layers2, Pencil, Plus, Save, Search, Trash2, XCircle } from "lucide-react";
import { BalanceCell } from "../../components/BalanceCell";
import {
  ActionMenu,
  Button,
  CodeTag,
  ConfirmDialog,
  DateHint,
  RelationCard,
  RelationGrid,
  StatTile,
  StatTiles,
  StatusPill,
  Table,
  TableBody,
  TableHead,
  Td,
  Th,
  Tr,
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
  { value: "ATIVO", label: "Ativo", icon: Activity, tone: "info" },
  { value: "FINALIZADO", label: "Finalizado", icon: CheckCircle2, tone: "neutral" },
  { value: "CANCELADO", label: "Cancelado", icon: XCircle, tone: "neutral" },
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
  const [confirmOpen, setConfirmOpen] = useState(false);

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
            <p className="text-lg font-semibold tracking-tight">Título de página — 18 semibold</p>
            <p className="text-[15px] font-semibold">Título de modal — 15 semibold</p>
            <p className="text-[17px] font-bold tracking-tight tabular-nums">Valor de destaque — 17 bold · R$ 182.450,00</p>
            <p className="text-table font-semibold">Título de linha — 13 semibold</p>
            <p className="text-table text-text-secondary">Corpo de tabela — 13 regular</p>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">Cabeçalho de seção — 11 caixa alta</p>
            <p className="text-[11px] text-text-muted">Rótulo e dica — 11 regular</p>
            <CodeTag>OS 010/BAFL/2026-L1</CodeTag>
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

        <Block title="Selos de status (StatusPill)">
          <div className="flex flex-wrap gap-2">
            <StatusPill tone="info">Ativa</StatusPill>
            <StatusPill tone="warning">Aguardando ciência</StatusPill>
            <StatusPill tone="danger">Vencida</StatusPill>
            <StatusPill tone="success">Paga</StatusPill>
            <StatusPill tone="neutral">Cancelada</StatusPill>
            <StatusPill tone="info" size="sm">
              sm
            </StatusPill>
          </div>
          <p className="text-xs text-text-muted">
            Tons por entidade em <code>utils/status-display.ts</code>: azul = em curso, âmbar = vence/aguarda, vermelho =
            passou, verde = pago/concluído, cinza = encerrado.
          </p>
        </Block>

        <Block title="Tabela padrão: identidade · status · prazo · saldo · ⋯">
          <div className="border border-border rounded-xl">
            <Table>
              <TableHead>
                <Th>Obra</Th>
                <Th width="w-36" className="hidden lg:table-cell">
                  Status
                </Th>
                <Th width="w-36" className="hidden md:table-cell">
                  Prazo
                </Th>
                <Th width="w-48" className="hidden sm:table-cell">
                  Saldo
                </Th>
                <Th actions />
              </TableHead>
              <TableBody>
                <Tr onOpen={() => setModalOpen(true)}>
                  <Td accent="#1f5f7a">
                    <p className="font-semibold text-text-primary truncate">Reforma da cobertura do hangar 3</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-text-muted">
                      <CodeTag>BAFL-0412</CodeTag>
                      <CodeTag>OS 010/BAFL/2026-L1</CodeTag>
                      <span>2026NE000318</span>
                    </div>
                  </Td>
                  <Td className="hidden lg:table-cell">
                    <StatusPill tone="danger">Em andamento</StatusPill>
                  </Td>
                  <Td className="hidden md:table-cell">
                    <DateHint date="30/09/2026" hint={{ label: "atrasada há 23 dias", tone: "danger" }} />
                  </Td>
                  <Td className="hidden sm:table-cell">
                    <BalanceCell valor={230000} liquidado={133700} />
                  </Td>
                  <Td actions>
                    <ActionMenu
                      items={[
                        { label: "Visualizar", icon: Eye, onClick: () => setModalOpen(true) },
                        { label: "Editar", icon: Edit2, onClick: () => {} },
                        { label: "Excluir", icon: Trash2, onClick: () => setConfirmOpen(true), danger: true },
                      ]}
                    />
                  </Td>
                </Tr>
              </TableBody>
            </Table>
          </div>
          <p className="text-xs text-text-muted">
            Sem rolagem horizontal: colunas de dado com <code>width</code>, a primeira fica com a sobra; colunas
            secundárias somem por breakpoint.
          </p>
        </Block>

        <Block title="Peças do modal de visualização">
          <StatTiles>
            <StatTile label="Valor da nota" value="R$ 42.300,00" hint="18% do empenho" />
            <StatTile label="Vencimento" value="10/10/2026" hint="venceu há 13 dias" hintTone="danger" />
            <StatTile label="Lançada em" value="10/09/2026" />
            <StatTile label="Empenho a liquidar" value="R$ 96.300,00" hint="de R$ 230.000,00" />
          </StatTiles>
          <RelationGrid>
            <RelationCard icon={Building2} label="Empresa" title="Construtora Horizonte" hint="12.345.678/0001-90" onClick={() => {}} />
            <RelationCard icon={Layers2} label="Empenho" title="2026NE000318" color="#1f5f7a" hint="a liquidar R$ 96.300,00" onClick={() => {}} />
          </RelationGrid>
          <Button variant="danger" icon={Trash2} onClick={() => setConfirmOpen(true)}>
            Abrir diálogo de confirmação
          </Button>
        </Block>

        <Block title="Modal">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>
            Abrir modal
          </Button>
        </Block>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Excluir a obra BAFL-0412?"
        confirmLabel="Excluir obra"
        onConfirm={() => setConfirmOpen(false)}
        onCancel={() => setConfirmOpen(false)}
      >
        <p>As ordens de serviço da obra voltam a ficar sem obra. Esta ação não pode ser desfeita.</p>
      </ConfirmDialog>

      <Modal open={modalOpen} size="md" onClose={() => setModalOpen(false)}>
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
