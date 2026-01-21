const MONTHS_PT = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
] as const;

export type PiggyMonth = {
  index: number; // 1..24
  label: string; // Janeiro-26
  key: string; // 2026-01
  year: number;
  month: number; // 0..11
};

const START_YEAR = 2026;
const START_MONTH = 0; // Janeiro
const COUNT = 24;

export const PIGGY_MONTHS: PiggyMonth[] = Array.from({ length: COUNT }).map(
  (_, i) => {
    const d = new Date(START_YEAR, START_MONTH + i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    const year2 = String(year).slice(-2);
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    const label = `${MONTHS_PT[month]}-${year2}`;

    return { index: i + 1, label, key, year, month };
  },
);
