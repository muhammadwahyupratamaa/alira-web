import { z } from 'zod';

export const preferencesSchema = z.object({
  currency: z.literal('IDR'),
  timezone: z
    .string()
    .trim()
    .min(1, 'Timezone wajib diisi.')
    .max(64, 'Timezone maksimal 64 karakter.')
    .refine((value) => {
      try {
        new Intl.DateTimeFormat('id-ID', { timeZone: value }).format();
        return true;
      } catch {
        return false;
      }
    }, 'Timezone tidak dikenali.'),
});
export const passwordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Password saat ini wajib diisi.')
      .max(72, 'Password maksimal 72 karakter.'),
    newPassword: z
      .string()
      .min(8, 'Password baru minimal 8 karakter.')
      .max(72, 'Password maksimal 72 karakter.')
      .regex(/[A-Za-z]/, 'Password baru harus mengandung huruf.')
      .regex(/\d/, 'Password baru harus mengandung angka.'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi.'),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Konfirmasi password tidak sama.',
  });
export type PreferencesValues = z.infer<typeof preferencesSchema>;
export type PasswordValues = z.infer<typeof passwordSchema>;
