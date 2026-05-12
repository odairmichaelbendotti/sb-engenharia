export function formatDate(date) {
    // transformar data no formato "dd/mm/yyyy" para "yyyy-mm-dd"
    const [day, month, year] = date.split("/");
    console.log(date);
    return `${year}-${month}-${day}`;
}
//# sourceMappingURL=formatDateToInsertDb.js.map