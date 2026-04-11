export function formatDate(date: string) {
  // transformar data no formato "dd/mm/yyyy" para "yyyy-mm-dd"
  const [day, month, year] = date.split("/");
  return `${year}-${month}-${day}`;
}
