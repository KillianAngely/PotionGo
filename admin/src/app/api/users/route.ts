import { firestore } from "../../../../config/firebase"
import admin from "../../../../config/firebase-admin"
import { collection, getDocs } from "firebase/firestore"
import { User, UserRole } from "../../00_INFRA/types/User"
import { userCreateSchema, userSchema } from "./schema"
import { buildAuthErrorResponse, requireAdmin } from "../_utils/auth"
import { requireCsrf } from "../_utils/csrf"

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const parsePositiveInt = (value: string | null, fallback: number) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.floor(parsed)
}

const parseSorts = (sortRaw: string | null, allowedFields: readonly string[]) => {
  if (!sortRaw) return [] as Array<{ field: string; direction: "asc" | "desc" }>

  return sortRaw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const [fieldRaw, directionRaw] = part.split(":")
      const field = (fieldRaw || "").trim()
      const direction = directionRaw === "desc" ? "desc" : "asc"
      if (!allowedFields.includes(field)) return null
      return { field, direction } as const
    })
    .filter(Boolean) as Array<{ field: string; direction: "asc" | "desc" }>
}

const compareValues = (a: unknown, b: unknown) => {
  if (typeof a === "number" && typeof b === "number") return a - b
  return String(a ?? "").localeCompare(String(b ?? ""), "fr", { sensitivity: "base" })
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return buildAuthErrorResponse(auth)
    }

    const { searchParams } = new URL(request.url)
    const roleFilterRaw = searchParams.get("role")?.toUpperCase() ?? null
    const roleFilter = roleFilterRaw ? (roleFilterRaw.toUpperCase() as UserRole) : null
    const search = searchParams.get("search")?.trim().toLowerCase() ?? ""
    const page = parsePositiveInt(searchParams.get("page"), 1)
    const pageSize = clamp(parsePositiveInt(searchParams.get("pageSize"), 10), 1, 100)
    const sorts = parseSorts(searchParams.get("sort"), ["email", "firstName", "lastName", "role"])

    const usersRef = collection(firestore, "users")
    const snapshot = await getDocs(usersRef)

    const users: User[] = snapshot.docs
      .map((doc) => ({
        uid: doc.id,
        email: doc.data().email,
        firstName: doc.data().firstName,
        lastName: doc.data().lastName,
        role: String(doc.data().role ?? "").toUpperCase() as UserRole,
      }))
      .filter((user) => {
        const validation = userSchema.omit({ password: true }).safeParse(user)
        return validation.success
      }) as User[]

    const filteredUsers = users.filter((user) => {
      if (roleFilter && user.role !== roleFilter) return false
      if (!search) return true
      return (
        user.email.toLowerCase().includes(search) ||
        user.firstName.toLowerCase().includes(search) ||
        user.lastName.toLowerCase().includes(search)
      )
    })

    const sortedUsers = [...filteredUsers]
    sortedUsers.sort((a, b) => {
      for (const sort of sorts) {
        const comparison = compareValues(a[sort.field as keyof User], b[sort.field as keyof User])
        if (comparison !== 0) {
          return sort.direction === "asc" ? comparison : -comparison
        }
      }
      return a.uid.localeCompare(b.uid)
    })

    const total = sortedUsers.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = clamp(page, 1, totalPages)
    const start = (safePage - 1) * pageSize
    const pagedUsers = sortedUsers.slice(start, start + pageSize)

    return new Response(
      JSON.stringify({
        success: true,
        users: pagedUsers,
        pagination: {
          page: safePage,
          pageSize,
          total,
          totalPages,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("[GET /api/users] Error:", error)
    return new Response(
      JSON.stringify({
        error: "Erreur lors de la récupération des utilisateurs",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return buildAuthErrorResponse(auth)
    }
    const csrfError = requireCsrf(request)
    if (csrfError) return csrfError

    const body = await request.json()
    const validation = userCreateSchema.safeParse(body)
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Données utilisateur invalides",
          details: validation.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      )
    }

    const { email, firstName, lastName, password, role } = validation.data

    const createdUser = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`.trim(),
    })

    await admin.firestore().collection("users").doc(createdUser.uid).set({
      email,
      firstName,
      lastName,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    const user: User = {
      uid: createdUser.uid,
      email,
      firstName,
      lastName,
      role,
    }

    return new Response(
      JSON.stringify({
        success: true,
        user,
      }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    )
  } catch (error) {
    console.error("[POST /api/users] Error:", error)
    return new Response(
      JSON.stringify({
        error: "Erreur lors de la création de l'utilisateur",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    )
  }
}
