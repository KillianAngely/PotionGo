import { z } from "zod"


export const schema = z.object({
    name: z.string().min(1).max(100),
    price: z.number().positive(),
    mood: z.string(),
    description: z.string().max(500).optional(),
})