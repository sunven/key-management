import { z } from 'zod';

// Provider schemas
export const providerSchema = z.object({
  baseUrl: z.string().url(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  active: z.boolean(),
});

export const providerUpdateSchema = z.object({
  baseUrl: z.string().url().optional(),
  name: z.string().min(1, 'Name is required').optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
});

export type ProviderFormData = z.infer<typeof providerSchema>;

// Token schemas
export const tokenSchema = z.object({
  providerId: z.number().int().positive('Provider ID is required'),
  token: z.string().min(1, 'Token is required'),
  description: z.string().optional(),
});

export const tokenUpdateSchema = z.object({
  providerId: z.number().int().positive().optional(),
  token: z.string().min(1, 'Token is required').optional(),
  description: z.string().optional(),
});

// Form-specific schema (providerId as string for form handling)
export const tokenFormSchema = z.object({
  providerId: z.string().min(1, 'Provider is required'),
  token: z.string().min(1, 'Token is required'),
  description: z.string().optional(),
});

export type TokenFormData = z.infer<typeof tokenFormSchema>;
