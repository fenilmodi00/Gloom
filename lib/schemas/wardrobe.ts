import { z } from 'zod';

export const AddItemSchema = z.object({
  imageUrl: z.string().url('Invalid image URL'),
  category: z.enum(['upper', 'lower', 'dress', 'shoes', 'bag', 'accessory']),
  subCategory: z.string().optional(),
  colors: z.array(z.string()).optional(),
  styleTags: z.array(z.string()).optional(),
  occasionTags: z.array(z.string()).optional(),
});

export const EditItemSchema = AddItemSchema.partial();

export type AddItemFormData = z.infer<typeof AddItemSchema>;
export type EditItemFormData = z.infer<typeof EditItemSchema>;
