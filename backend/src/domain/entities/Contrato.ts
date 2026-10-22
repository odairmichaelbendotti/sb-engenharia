import { DomainError } from "../errors/DomainError.js";

export type ContratoStatusValue = "ATIVO" | "FINALIZADO" | "CANCELADO";
export type FiscalContratoTipoValue = "TECNICO" | "ADMINISTRATIVO";

const DESCRICAO_CURTA_MAX_LENGTH = 20;

// Lote da licitação: desconto em porcentagem (ex.: 24.8). Com `id`, atualiza o lote existente
export type LoteInput = {
  id?: string | undefined;
  numero: number;
  nome: string;
  desconto: number;
};

// Fiscal do contrato. Com `id`, atualiza o fiscal existente
export type FiscalContratoInput = {
  id?: string | undefined;
  tipo: FiscalContratoTipoValue;
  nome: string;
  ramal: string;
  email: string;
};

export type LoteRecord = Required<Pick<LoteInput, "id">> & Omit<LoteInput, "id">;
export type FiscalContratoRecord = Required<Pick<FiscalContratoInput, "id">> & Omit<FiscalContratoInput, "id">;

export type ContratoType = {
  identificador: string;
  descricaoCurta: string;
  valor: number;
  dataInicio: string;
  dataFim: string;
  company_id: string;
  tenant_id: string;
  // Dados que saem na Ordem de Serviço
  ePag: string;
  etp: string;
  termoReferencia: string;
  dataBaseSinapi: string;
  endereco: string;
  // BDI em porcentagem (ex.: 21.19)
  bdi: number;
  lotes: LoteInput[];
  fiscais: FiscalContratoInput[];
};

export type PersistedContrato = {
  id: string;
  identificador: string;
  descricaoCurta: string;
  valor: number;
  dataInicio: Date;
  dataFim: Date;
  status: ContratoStatusValue;
  /** Atribuída automaticamente na criação (ver PrismaContratoRepository) — não é definida pelo usuário nem editável. */
  cor: string;
  ePag: string;
  etp: string;
  termoReferencia: string;
  dataBaseSinapi: string;
  endereco: string;
  bdi: number;
  company_id: string;
  tenant_id: string;
  createdAt: Date;
  updatedAt: Date;
};

export class ContratoEntity {
  public readonly identificador: string;
  public readonly descricaoCurta: string;
  public readonly valor: number;
  public readonly dataInicio: string;
  public readonly dataFim: string;
  public readonly company_id: string;
  public readonly tenant_id: string;
  public readonly ePag: string;
  public readonly etp: string;
  public readonly termoReferencia: string;
  public readonly dataBaseSinapi: string;
  public readonly endereco: string;
  public readonly bdi: number;
  public readonly lotes: LoteInput[];
  public readonly fiscais: FiscalContratoInput[];

  constructor(props: ContratoType) {
    if (!props.identificador.trim()) {
      throw new DomainError("Contrato identificador is required");
    }
    if (props.descricaoCurta.length > DESCRICAO_CURTA_MAX_LENGTH) {
      throw new DomainError(
        `Contrato descricaoCurta must have at most ${DESCRICAO_CURTA_MAX_LENGTH} characters`,
      );
    }
    if (props.valor <= 0) {
      throw new DomainError("Contrato valor must be greater than 0");
    }
    if (new Date(props.dataInicio) >= new Date(props.dataFim)) {
      throw new DomainError("Contrato dataInicio must be before dataFim");
    }

    validateContratoOrdemServicoData(props);

    this.identificador = props.identificador;
    this.descricaoCurta = props.descricaoCurta;
    this.valor = props.valor;
    this.dataInicio = props.dataInicio;
    this.dataFim = props.dataFim;
    this.company_id = props.company_id;
    this.tenant_id = props.tenant_id;
    this.ePag = props.ePag;
    this.etp = props.etp;
    this.termoReferencia = props.termoReferencia;
    this.dataBaseSinapi = props.dataBaseSinapi;
    this.endereco = props.endereco;
    this.bdi = props.bdi;
    this.lotes = props.lotes;
    this.fiscais = props.fiscais;
  }
}

/** Regras dos dados do contrato que alimentam a OS — usadas na criação e na edição. */
export function validateContratoOrdemServicoData(
  props: Pick<ContratoType, "ePag" | "etp" | "termoReferencia" | "dataBaseSinapi" | "endereco" | "bdi" | "lotes" | "fiscais">,
) {
  const requiredTexts: [string, string][] = [
    ["ePag", props.ePag],
    ["etp", props.etp],
    ["termoReferencia", props.termoReferencia],
    ["dataBaseSinapi", props.dataBaseSinapi],
    ["endereco", props.endereco],
  ];
  for (const [field, value] of requiredTexts) {
    if (!value?.trim()) throw new DomainError(`Contrato ${field} is required`);
  }

  if (!Number.isFinite(props.bdi) || props.bdi < 0 || props.bdi >= 100) {
    throw new DomainError("Contrato bdi must be between 0 and 100");
  }

  const numeros = new Set<number>();
  for (const lote of props.lotes) {
    if (!Number.isInteger(lote.numero) || lote.numero < 1) {
      throw new DomainError("Lote numero must be a positive integer");
    }
    if (numeros.has(lote.numero)) {
      throw new DomainError(`Lote ${lote.numero} is duplicated`);
    }
    numeros.add(lote.numero);
    if (!lote.nome.trim()) {
      throw new DomainError(`Lote ${lote.numero} nome is required`);
    }
    if (!Number.isFinite(lote.desconto) || lote.desconto < 0 || lote.desconto >= 100) {
      throw new DomainError(`Lote ${lote.numero} desconto must be between 0 and 100`);
    }
  }

  for (const fiscal of props.fiscais) {
    if (fiscal.tipo !== "TECNICO" && fiscal.tipo !== "ADMINISTRATIVO") {
      throw new DomainError("Fiscal tipo is invalid");
    }
    if (!fiscal.nome.trim() || !fiscal.ramal.trim() || !fiscal.email.trim()) {
      throw new DomainError("Fiscal nome, ramal and email are required");
    }
  }
}
