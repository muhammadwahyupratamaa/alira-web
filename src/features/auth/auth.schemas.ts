import { z } from 'zod';

const email = z
  .email('Masukkan alamat email yang valid.')
  .max(320, 'Email maksimal 320 karakter.');

const password = z
  .string()
  .min(8, 'Kata sandi minimal 8 karakter.')
  .max(72, 'Kata sandi maksimal 72 karakter.')
  .regex(/[A-Za-z]/, 'Kata sandi harus mengandung huruf.')
  .regex(/\d/, 'Kata sandi harus mengandung angka.');

export const loginSchema = z.object({ email, password });

export const registerSchema = z
  .object({
    email,
    password,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Konfirmasi kata sandi tidak cocok.',
    path: ['confirmPassword'],
  });

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;
