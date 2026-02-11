import { z } from "zod"

const noHtmlTags = (value: string) => !/[<>]/.test(value)

export const productSchema = z.object({
    name: z
        .string()
        .min(1)
        .max(100)
        .refine(noHtmlTags, "Le nom contient des caractères non autorisés"),
    price: z.number().positive(),
    mood: z
        .string()
        .min(1)
        .refine(noHtmlTags, "Le mood contient des caractères non autorisés"),
    description: z
        .string()
        .max(500)
        .refine(noHtmlTags, "La description contient des caractères non autorisés")
        .optional(),
    imageUrl: z.string().min(1).optional(),
})

// Type data envoyées
export type ProductInput = z.infer<typeof productSchema>

// Type data renvoyées par l'API
export type Product = ProductInput & {
    id: string
}
