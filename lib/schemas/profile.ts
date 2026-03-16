import { z } from 'zod';

export const ProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
  skinTone: z.string().optional(),
  styleTags: z.array(z.string()).optional(),
});

export type ProfileFormData = z.infer<typeof ProfileSchema>;
