import { z } from "zod"
import { UserAdminRole, UserClientRole } from "../../00_INFRA/types/User"

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

export const userSchema = z.object({
    email: z.string().email("Email invalide"),
    firstName: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
    lastName: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
    password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
    role: roleSchema,
})
