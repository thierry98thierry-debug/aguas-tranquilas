// Helpers de data no fuso local do usuário.

export function dstr(d) {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

export function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export function epochDay(d) {
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}

export function fmtShort(ds) {
  const d = new Date(ds + "T00:00:00");
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}
