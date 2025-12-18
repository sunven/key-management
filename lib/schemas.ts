import { z } from 'zod';

// Tag schema - alphanumeric, Chinese, hyphens, underscores only
export const tagSchema = z
  .string()
  .min(1, 'Tag cannot be empty')
  .max(50, 'Tag must be 50 characters or less')
  .regex(
    /^[\w\u4e00-\u9fa5-]+$/,
    'Tag can only contain letters, numbers, Chinese characters, hyphens, and underscores',
  );

// Group schemas
export const groupSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less'),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
});

export const groupUpdateSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name must be 100 characters or less')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be 500 characters or less')
    .optional(),
});

export type GroupFormData = z.infer<typeof groupSchema>;

// Group Item schemas
export const groupItemSchema = z.object({
  key: z
    .string()
    .min(1, 'Key is required')
    .max(100, 'Key must be 100 characters or less'),
  value: z
    .string()
    .min(1, 'Value is required')
    .max(5000, 'Value must be 5000 characters or less'),
  tags: z.array(tagSchema).max(20, 'Maximum 20 tags allowed').optional(),
});

export const groupItemUpdateSchema = z.object({
  key: z
    .string()
    .min(1, 'Key is required')
    .max(100, 'Key must be 100 characters or less')
    .optional(),
  value: z
    .string()
    .min(1, 'Value is required')
    .max(5000, 'Value must be 5000 characters or less')
    .optional(),
  tags: z.array(tagSchema).max(20, 'Maximum 20 tags allowed').optional(),
});

export type GroupItemFormData = z.infer<typeof groupItemSchema>;

// Share schemas
export const shareTypeSchema = z.enum(['PUBLIC', 'PRIVATE']);

export const shareSchema = z
  .object({
    groupId: z.number().int().positive('Group ID is required'),
    type: shareTypeSchema,
    emails: z.array(z.string().email('Invalid email address')).optional(),
  })
  .refine(
    (data) => {
      // PRIVATE shares must have at least one email
      if (data.type === 'PRIVATE') {
        return data.emails && data.emails.length > 0;
      }
      return true;
    },
    {
      message: 'At least one email is required for private shares',
      path: ['emails'],
    },
  );

export type ShareFormData = z.infer<typeof shareSchema>;
export type ShareType = z.infer<typeof shareTypeSchema>;

// Share invitation schemas
export const invitationStatusSchema = z.enum([
  'PENDING',
  'ACCEPTED',
  'REJECTED',
]);
export type InvitationStatus = z.infer<typeof invitationStatusSchema>;
