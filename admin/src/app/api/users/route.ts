import { firestore } from "../../../../config/firebase"
import { collection, getDocs } from "firebase/firestore"
import { User, UserRole } from "../../00_INFRA/types/User"
import { userSchema } from "./schema"

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const roleFilter = searchParams.get("role") as UserRole | null

        const usersRef = collection(firestore, "users")
        const snapshot = await getDocs(usersRef)

        let users: User[] = snapshot.docs
            .map((doc) => ({
                uid: doc.id,
                email: doc.data().email,
                firstName: doc.data().firstName,
                lastName: doc.data().lastName,
                role: doc.data().role,
            }))
            .filter((user) => {
                const validation = userSchema.omit({ password: true }).safeParse(user)
                return validation.success
            }) as User[]

        if (roleFilter) {
            users = users.filter((user) => user.role === roleFilter)
        }

        return new Response(
            JSON.stringify({
                success: true,
                users,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        )
    } catch (error) {
        console.error("[GET /api/users] Error:", error)
        return new Response(
            JSON.stringify({
                error: "Erreur lors de la récupération des utilisateurs",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        )
    }
}