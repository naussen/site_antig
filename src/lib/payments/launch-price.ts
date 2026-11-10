export const LAUNCH_MONTHLY_PRICE_BRL = 19.90;
export const LAUNCH_MONTHLY_PRICE_LABEL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
}).format(LAUNCH_MONTHLY_PRICE_BRL);
