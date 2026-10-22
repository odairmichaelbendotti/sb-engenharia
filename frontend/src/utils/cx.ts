// Junta classes CSS ignorando valores falsos (false, null, undefined, "")
export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
