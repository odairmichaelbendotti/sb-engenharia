import { DomainError } from "../errors/DomainError.js";

export type ContratoStatusValue = "ATIVO" | "FINALIZADO" | "CANCELADO";

const DESCRICAO_CURTA_MAX_LENGTH = 20;

export type ContratoType = {
  identificador: string;
  descricaoCurta: string;
  valor: number;
  dataInicio: string;
  dataFim: string;
  company_id: string;
  tenant_id: string;
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

    this.identificador = props.identificador;
    this.descricaoCurta = props.descricaoCurta;
    this.valor = props.valor;
    this.dataInicio = props.dataInicio;
    this.dataFim = props.dataFim;
    this.company_id = props.company_id;
    this.tenant_id = props.tenant_id;
  }
}
