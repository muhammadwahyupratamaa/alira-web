import { z } from 'zod';

export const categorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nama kategori wajib diisi.')
    .max(100, 'Nama kategori maksimal 100 karakter.'),
  type: z.enum(['INCOME', 'EXPENSE']),
  icon: z.string().trim().max(50, 'Ikon maksimal 50 karakter.'),
  color: z.union([
    z.literal(''),
    z
      .string()
      .regex(
        /^#[0-9A-Fa-f]{6}$/,
        'Gunakan format warna hex, misalnya #22C55E.',
      ),
  ]),
});
export type CategoryFormValues = z.infer<typeof categorySchema>;
