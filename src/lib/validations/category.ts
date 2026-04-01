import { z } from 'zod';

export const CategorySchema = z.object({
  name: z.string().min(2, { message: "Le nom de la catégorie doit avoir au moins 2 caractères" }).max(50),
});

export type CategoryFormData = z.infer<typeof CategorySchema>;
