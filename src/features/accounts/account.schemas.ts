import { z } from 'zod';

import { accountTypes } from './account.types';

const decimalString = /^\d+(?:\.\d{1,2})?$/;

export const accountSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama account wajib diisi.')
    .max(100, 'Nama account maksimal 100 karakter.'),
  type: z.enum(accountTypes, { error: 'Pilih tipe account.' }),
  initialBalance: z
    .string()
    .trim()
    .min(1, 'Saldo awal wajib diisi.')
    .regex(
      decimalString,
      'Gunakan angka non-negatif dengan maksimal dua angka desimal.',
    ),
});

export type AccountFormValues = z.infer<typeof accountSchema>;
