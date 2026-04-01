import { z } from 'zod';

// Define the base object separately for clean inference
const ProductBaseSchema = z.object({
  name: z.string().min(2, "Le nom doit avoir au moins 2 caractères").max(100),
  sku: z.string().max(50).optional().nullable(),
  purchasePrice: z.coerce.number().min(0, "Le prix d'achat ne peut pas être négatif"),
  sellingPrice: z.coerce.number().min(0, "Le prix de vente ne peut pas être négatif"),
  stockLevel: z.coerce.number().int().min(0, "Le stock ne peut pas être négatif").default(0),
  lowStockAlert: z.coerce.number().int().min(0, "L'alerte de stock ne peut pas être négative").default(5),
  categoryId: z.string().min(1, "Veuillez sélectionner une catégorie").optional().or(z.literal('')),
  isFollowed: z.boolean().default(false),
  status: z.string().optional().default('ACTIVE'),
});

// Explicitly define the form data type from the base object to ensure non-optional fields like 'status' and 'isFollowed' are correctly inferred as required
export type ProductFormData = z.infer<typeof ProductBaseSchema>;

// The refined schema for validation
export const ProductSchema = ProductBaseSchema.refine(data => {
  // Only check if both are numbers (they should be due to coercion)
  return data.sellingPrice > data.purchasePrice;
}, {
  message: "Le prix de vente doit être supérieur au prix d'achat pour garantir une marge.",
  path: ["sellingPrice"]
});
