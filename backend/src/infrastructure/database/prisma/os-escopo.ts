// OS que a empresa enxerga: as dos próprios contratos (pelo empenho principal) e já emitidas.
// A OS aguardando emissão ainda é trabalho interno da fiscalização
export function osDaEmpresa(company_id: string) {
  return { empenho: { contrato: { company_id } }, aguardandoEmissao: false };
}

// OS emitida: só ela entra no emitido (totais, comprometido e saldo livre do empenho, valor da obra).
// A planejada (ainda não emitida) tem só um valor estimado. Usar junto do status não cancelado
export const osEmitida = { aguardandoEmissao: false } as const;
