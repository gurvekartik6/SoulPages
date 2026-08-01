import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username or email is required'),
  password: z.string().min(1, 'Password is required')
});

export const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().optional()
});

export const bookSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  author: z.string().min(1, 'Author is required'),
  totalPages: z
    .union([z.string(), z.number()])
    .transform((v) => (v === '' || v === undefined ? undefined : Number(v)))
    .refine((v) => v === undefined || (Number.isInteger(v) && v > 0), {
      message: 'Total pages must be a positive whole number'
    })
    .optional(),
  genre: z.string().optional(),
  notes: z.string().optional(),
  annualGoal: z.boolean().optional(),
  tags: z
    .union([z.string(), z.array(z.string())])
    .optional()
    .transform((v) => {
      if (Array.isArray(v)) return v;
      if (!v) return [];
      return v.split(',').map((t) => t.trim()).filter(Boolean);
    }),
  rating: z
    .union([z.number(), z.null(), z.literal('')])
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v))
    .refine((v) => v === null || (Number.isInteger(v) && v >= 1 && v <= 5), {
      message: 'Rating must be between 1 and 5'
    }),
  verdict: z.string().max(280, 'Verdict must be 280 characters or fewer').optional()
});

export const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name cannot be empty'),
  readingGoal: z
    .union([z.string(), z.number()])
    .transform((v) => Number(v))
    .refine((v) => Number.isInteger(v) && v >= 1 && v <= 500, {
      message: 'Reading goal must be between 1 and 500'
    })
});

export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Confirm your new password')
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });
