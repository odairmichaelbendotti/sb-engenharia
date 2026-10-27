// OS que a empresa enxerga: as dos próprios contratos (pelo empenho principal) e já emitidas.
// A OS aguardando emissão ainda é trabalho interno da fiscalização
export function osDaEmpresa(company_id: string) {
  return { empenho: { contrato: { company_id } }, aguardandoEmissao: false };
}
