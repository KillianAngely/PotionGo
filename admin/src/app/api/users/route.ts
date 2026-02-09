import { firestore } from "../../../../config/firebase"
import admin from "../../../../config/firebase-admin"
import { collection, getDocs } from "firebase/firestore"
import { User, UserRole } from "../../00_INFRA/types/User"
import { userCreateSchema, userSchema } from "./schema"
import { requireAdmin } from "../_utils/auth"

export async function GET(request: Request) {
    try {
        const auth = await requireAdmin(request)
        if (!auth.ok) {
            return new Response(JSON.stringify({ error: auth.error }), {
                status: auth.status,
                headers: { "Content-Type": "application/json" },
            })
        }

        const { searchParams } = new URL(request.url)
        const roleFilterRaw = searchParams.get("role")
        const roleFilter = roleFilterRaw
            ? (roleFilterRaw.toUpperCase() as UserRole)
            : null

        const usersRef = collection(firestore, "users")
        const snapshot = await getDocs(usersRef)

        let users: User[] = snapshot.docs
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

export async function POST(request: Request) {
    try {
        const auth = await requireAdmin(request)
        if (!auth.ok) {
            return new Response(JSON.stringify({ error: auth.error }), {
                status: auth.status,
                headers: { "Content-Type": "application/json" },
            })
        }

        const body = await request.json()
        const validation = userCreateSchema.safeParse(body)
        if (!validation.success) {
            return new Response(
                JSON.stringify({
                    error: "Données utilisateur invalides",
                    details: validation.error.flatten().fieldErrors,
                }),
                { status: 400, headers: { "Content-Type": "application/json" } }
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
            { status: 201, headers: { "Content-Type": "application/json" } }
        )
    } catch (error) {
        console.error("[POST /api/users] Error:", error)
        return new Response(
            JSON.stringify({
                error: "Erreur lors de la création de l'utilisateur",
            }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        )
    }
}
