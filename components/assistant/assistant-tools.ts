import { z } from "zod";

export const MonthKeySchema = z
  .string()
  .regex(/^\d{4}-\d{2}$/)
  .describe("Formato YYYY-MM");

const AmountSchema = z
  .object({
    amountCents: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Valor em centavos (BRL)"),
    amountBRL: z
      .number()
      .positive()
      .optional()
      .describe("Valor em reais (BRL)"),
  })
  .refine((v) => v.amountCents != null || v.amountBRL != null, {
    message: "Informe amountCents ou amountBRL",
  });

export const assistantTools = {
  addCardExpense: {
    description:
      "Adiciona um gasto no cartão de crédito do mês. Use quando o usuário disser que gastou no cartão.",
    inputSchema: z
      .object({
        monthKey: MonthKeySchema.optional(),
        category: z
          .string()
          .min(1)
          .describe("Ex: Mercado, Gasolina, Farmácia..."),
      })
      .and(AmountSchema),
  },

  addFixedBill: {
    description: "Adiciona uma conta fixa do mês.",
    inputSchema: z
      .object({
        monthKey: MonthKeySchema.optional(),
        description: z.string().min(1),
      })
      .and(AmountSchema),
  },

  addMiscExpense: {
    description: "Adiciona uma despesa avulsa (misc) do mês.",
    inputSchema: z
      .object({
        monthKey: MonthKeySchema.optional(),
        description: z.string().min(1),
      })
      .and(AmountSchema),
  },

  addIncome: {
    description: "Adiciona uma receita do mês.",
    inputSchema: z
      .object({
        monthKey: MonthKeySchema.optional(),
        label: z.string().min(1),
      })
      .and(AmountSchema),
  },

  getLargestExpense: {
    description:
      "Retorna o maior gasto do mês (considera fixedBills, cardExpenses, miscExpenses).",
    inputSchema: z.object({
      monthKey: MonthKeySchema.optional(),
    }),
  },

  getMonthOverview: {
    description:
      "Retorna totais do mês: receitas, despesas (por tipo) e valor investido/guardado do mês.",
    inputSchema: z.object({
      monthKey: MonthKeySchema.optional(),
    }),
  },

  sumSavedMonths: {
    description:
      "Soma o valor 'invested' (guardado) de vários meses (ex.: janeiro+fevereiro).",
    inputSchema: z.object({
      monthKeys: z.array(MonthKeySchema).min(1),
    }),
  },

  navigate: {
    description:
      "Navega para uma tela do app. Use apenas quando o usuário pedir explicitamente para abrir/trocar de tela.",
    inputSchema: z.object({
      path: z.string().min(1).describe("Ex: /budget, /investments, etc."),
    }),
  },
} as const;

export type AssistantToolName = keyof typeof assistantTools;
