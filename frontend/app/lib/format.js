export function formatMoney(amount, currency = "PHP") {
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency
  }).format(Number(amount || 0));
}