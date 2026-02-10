import { z } from "zod"

export const productSchema = z.object({
    name: z.string().min(1).max(100),
    price: z.number().positive(),
    mood: z.string(),
    description: z.string().max(500).optional(),
    imageUrl: z.string().min(1).optional(),
})

// Type data envoyées
export type ProductInput = z.infer<typeof productSchema>

// Type data renvoyées par l'API
export type Product = ProductInput & {
    id: string
}
