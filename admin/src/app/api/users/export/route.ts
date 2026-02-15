import { firestore } from "../../../../../config/firebase"
import { collection, getDocs } from "firebase/firestore"
import { User } from "../../../00_INFRA/types/User"
import { userSchema } from "../schema"
import { buildAuthErrorResponse, requireAdmin } from "../../_utils/auth"

const escapeCsvValue = (value: string) => `"${value.replace(/"/g, '""')}"`

export async function GET(request: Request) {
  const auth = await requireAdmin(request)
  if (!auth.ok) {
    return buildAuthErrorResponse(auth)
  }

  try {
    const usersRef = collection(firestore, "users")
    const snapshot = await getDocs(usersRef)

    const users: User[] = snapshot.docs
      .map((doc) => ({
        uid: doc.id,
        email: doc.data().email,
        firstName: doc.data().firstName,
        lastName: doc.data().lastName,
        role: String(doc.data().role ?? "").toUpperCase() as User["role"],
      }))
      .filter((user) => userSchema.omit({ password: true }).safeParse(user).success) as User[]

    const header = ["uid", "email", "firstName", "lastName", "role"].join(",")
    const rows = users.map((user) =>
      [
        escapeCsvValue(user.uid),
        escapeCsvValue(user.email),
        escapeCsvValue(user.firstName),
        escapeCsvValue(user.lastName),
        escapeCsvValue(user.role),
      ].join(","),
    )
    const csv = [header, ...rows].join("\n")
    const filename = `users-export-${new Date().toISOString().slice(0, 10)}.csv`

    const headers = new Headers({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    })
    return new Response(csv, { status: 200, headers })
  } catch (error) {
    console.error("[GET /api/users/export] Error:", error)
    return new Response(JSON.stringify({ error: "Erreur lors de l'export des utilisateurs" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
