import { z } from 'zod';

export const transactionSchema = z.object({
  type: z.enum(['INCOME', 'EXPENSE']),
  accountId: z.uuid('Pilih account yang valid.'),
  categoryId: z.uuid('Pilih kategori yang valid.'),
  amount: z
    .string()
    .trim()
    .regex(
      /^(?!0+(?:\.0{1,2})?$)\d+(?:\.\d{1,2})?$/,
      'Nominal harus lebih dari nol dengan maksimal dua desimal.',
    ),
  transactionDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Pilih tanggal transaksi.'),
  note: z.string().trim().max(500, 'Catatan maksimal 500 karakter.'),
});
export type TransactionFormValues = z.infer<typeof transactionSchema>;
