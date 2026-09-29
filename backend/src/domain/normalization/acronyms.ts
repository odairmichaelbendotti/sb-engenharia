// Siglas preservadas em maiúsculas quando um texto livre digitado todo em
// maiúsculas é convertido para frase normal. Termos com dígito (ex.: 2026NE000606,
// A1) já são preservados automaticamente — não precisam entrar aqui.
// Para incluir uma sigla nova, basta adicioná-la à lista (sempre em maiúsculas).
export const KNOWN_ACRONYMS = new Set([
  // Organização
  "FAB", "COMAER", "OM", "BAFL", "BAAN", "SEREP", "GAP", "PNR", "SCOAM",
  // Estados
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
  // Administrativo e contratos
  "NE", "OS", "NF", "NFE", "CNPJ", "CPF", "CEP", "LTDA", "ME", "EPP", "EIRELI", "SA",
  "TR", "ETP", "BDI", "SINAPI", "SICRO", "PAG", "TCU", "AGU",
  // Engenharia
  "ART", "RRT", "CREA", "CAU", "ABNT", "NBR", "NR", "PPCI", "SPDA", "HVAC", "CFTV",
  "QGBT", "TI", "EPI", "EPC", "PCMAT", "PGR",
]);
