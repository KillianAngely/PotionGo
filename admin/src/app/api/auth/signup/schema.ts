import { z } from "zod"

export const userRolesEnum = z.enum(["DRIVER", "CUSTOMER"])

export const schema = z.object({
  email: z.string().min(5).max(100),
  password: z.string().min(6),
  role: userRolesEnum,
})
