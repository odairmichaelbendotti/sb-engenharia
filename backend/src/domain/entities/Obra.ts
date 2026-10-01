import { DomainError } from "../errors/DomainError.js";

export type ObraStatusValue = "EM_ANDAMENTO" | "CONCLUIDA" | "PARALISADA" | "CANCELADA";
export type ObraTipoValue = "CONSTRUCAO" | "REFORMA" | "AMPLIACAO" | "PAVIMENTACAO" | "SANEAMENTO" | "MANUTENCAO_PREDIAL" | "OUTRO";

export type ObraType = {
  nome: string;
  identificacaoPatrimonial: string;
  tipo: ObraTipoValue;
  descricao: string;
  latitude?: number | undefined;
  longitude?: number | undefined;
  responsavelTecnico: string;
  anotacoes?: string | undefined;
  tenant_id: string;
};

export type PersistedObra = {
  id: string;
  nome: string;
  identificacaoPatrimonial: string;
  tipo: ObraTipoValue;
  status: ObraStatusValue;
  descricao: string;
  latitude: number | null;
  longitude: number | null;
  valorExecutado: number;
  dataConclusao?: Date | null;
  responsavelTecnico: string;
  anotacoes: string | null;
  tenant_id: string;
  createdAt: Date;
  updatedAt: Date;
};

export class ObraEntity {
  public readonly nome: string;
  public readonly identificacaoPatrimonial: string;
  public readonly tipo: ObraTipoValue;
  public readonly descricao: string;
  public readonly latitude?: number | undefined;
  public readonly longitude?: number | undefined;
  public readonly responsavelTecnico: string;
  public readonly anotacoes?: string | undefined;
  public readonly tenant_id: string;

  constructor(props: ObraType) {
    if ((props.latitude === undefined) !== (props.longitude === undefined)) {
      throw new DomainError("Obra latitude and longitude must be provided together");
    }
    if (!props.identificacaoPatrimonial.trim()) {
      throw new DomainError("Obra identificacaoPatrimonial is required");
    }

    this.nome = props.nome;
    this.identificacaoPatrimonial = props.identificacaoPatrimonial;
    this.tipo = props.tipo;
    this.descricao = props.descricao;
    this.latitude = props.latitude;
    this.longitude = props.longitude;
    this.responsavelTecnico = props.responsavelTecnico;
    this.anotacoes = props.anotacoes;
    this.tenant_id = props.tenant_id;
  }
}
