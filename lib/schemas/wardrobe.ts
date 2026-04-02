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

export const ImageUploadSchema = z.object({
  uri: z.string().min(1, 'Image URI is required'),
  name: z.string().min(1, 'File name is required'),
  type: z.string().refine(
    (t) => ['image/jpeg', 'image/png', 'image/jpg'].includes(t),
    { message: 'Invalid file type. Only JPEG and PNG images are allowed.' }
  ),
  size: z.number().max(10 * 1024 * 1024, 'File too large. Maximum size is 10MB.'),
});

export type ImageUploadData = z.infer<typeof ImageUploadSchema>;
