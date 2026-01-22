export function formatBRLFromCents(cents: number) {
  const value = (cents || 0) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}
