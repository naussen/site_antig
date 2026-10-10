const brazilDateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

/** Mantém a mesma data no SSR e no navegador, independentemente do fuso do host. */
export function formatBrazilDateTime(value: string | Date) {
  return brazilDateTimeFormatter.format(typeof value === "string" ? new Date(value) : value);
}
