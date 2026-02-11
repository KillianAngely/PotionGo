import { z } from "zod"
import { UserAdminRole, UserClientRole } from "../../00_INFRA/types/User"

const noHtmlTags = (value: string) => !/[<>]/.test(value)

export const userRolesEnum = z.union([
    z.enum(UserAdminRole),
    z.enum(UserClientRole),
])

const roleSchema = z.preprocess((value) => {
    if (typeof value === "string") {
        return value.toUpperCase()
    }
    return value
}, userRolesEnum)

const clientRoleSchema = z.preprocess((value) => {
    if (typeof value === "string") {
        return value.toUpperCase()
    }
    return value
}, z.enum(UserClientRole))

export const userSchema = z.object({
    email: z.string().email("Email invalide"),
    firstName: z
        .string()
        .min(2, "Le prénom doit contenir au moins 2 caractères")
        .refine(noHtmlTags, "Le prénom contient des caractères non autorisés"),
    lastName: z
        .string()
        .min(2, "Le nom doit contenir au moins 2 caractères")
        .refine(noHtmlTags, "Le nom contient des caractères non autorisés"),
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    role: roleSchema,
})

export const userCreateSchema = z.object({
    email: z.string().email("Email invalide"),
    firstName: z
        .string()
        .min(2, "Le prénom doit contenir au moins 2 caractères")
        .refine(noHtmlTags, "Le prénom contient des caractères non autorisés"),
    lastName: z
        .string()
        .min(2, "Le nom doit contenir au moins 2 caractères")
        .refine(noHtmlTags, "Le nom contient des caractères non autorisés"),
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    role: clientRoleSchema,
})
