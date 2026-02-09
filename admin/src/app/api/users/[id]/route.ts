import { firestore } from "../../../../../config/firebase"
import { doc, getDoc, deleteDoc } from "firebase/firestore"
import { User } from "../../../00_INFRA/types/User"
import { userSchema } from "../schema"
import { requireAdmin } from "../../_utils/auth"

interface Params {
    id: string
}

export async function GET(request: Request, { params }: { params: Params }) {
    try {
        const auth = await requireAdmin(request)
        if (!auth.ok) {
            return new Response(JSON.stringify({ error: auth.error }), {
                status: auth.status,
                headers: { "Content-Type": "application/json" },
            })
        }

        const { id } = params

        if (!id) {
            return new Response(JSON.stringify({ error: "ID utilisateur requis" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            })
        }

        const userRef = doc(firestore, "users", id)
        const snapshot = await getDoc(userRef)

        if (!snapshot.exists()) {
            return new Response(JSON.stringify({ error: "Utilisateur non trouvé" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            })
        }

        const user: User = {
            uid: snapshot.id,
            email: snapshot.data().email,
            firstName: snapshot.data().firstName,
            lastName: snapshot.data().lastName,
            role: snapshot.data().role,
        }

        const validation = userSchema.omit({ password: true }).safeParse(user)
        if (!validation.success) {
            return new Response(JSON.stringify({ error: "Données utilisateur invalides" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            })
        }

        return new Response(
            JSON.stringify({
                success: true,
                user,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
        )
    } catch (error) {
        console.error("[GET /api/users/[id]] Error:", error)
        return new Response(
            JSON.stringify({ error: "Erreur lors de la récupération de l'utilisateur" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        )
    }
}
