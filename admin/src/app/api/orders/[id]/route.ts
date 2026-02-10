import admin from "../../../../../config/firebase-admin"
import { Order, orderSchema } from "../schema"
import { requireAdmin } from "../../_utils/auth"

const buildUserLabel = (data: admin.firestore.DocumentData | undefined, fallback: string) => {
  const firstName = typeof data?.firstName === "string" ? data.firstName.trim() : ""
  const lastName = typeof data?.lastName === "string" ? data.lastName.trim() : ""
  const fullName = `${firstName} ${lastName}`.trim()
  if (fullName) return fullName
  if (typeof data?.email === "string" && data.email.trim()) return data.email.trim()
  return fallback
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { id } = await params

    const orderDoc = await admin.firestore().collection("orders").doc(id).get()

    if (!orderDoc.exists) {
      return new Response(
        JSON.stringify({
          error: "Commande non trouvée",
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )
    }

    const validation = orderSchema.safeParse(orderDoc.data())
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Données commande invalides",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const customerRef = admin.firestore().collection("users").doc(validation.data.customerId)
    const driverRef = validation.data.driverId
      ? admin.firestore().collection("users").doc(validation.data.driverId)
      : null
    const productRefs = validation.data.items.map((item) =>
      admin.firestore().collection("products").doc(item.potionId)
    )

    const [customerSnap, driverSnap, ...productSnaps] = await admin
      .firestore()
      .getAll(customerRef, ...(driverRef ? [driverRef] : []), ...productRefs)

    const productMap = new Map<string, admin.firestore.DocumentData>()
    for (const snap of productSnaps) {
      if (snap.exists) productMap.set(snap.id, snap.data() || {})
    }

    const items = validation.data.items.map((item) => {
      const product = productMap.get(item.potionId)
      const potionName =
        typeof product?.name === "string" ? product.name : item.potionId
      const potionImageUrl =
        typeof product?.imageUrl === "string" ? product.imageUrl : undefined
      const unitPrice = typeof product?.price === "number" ? product.price : null
      const lineTotal = typeof unitPrice === "number" ? unitPrice * item.quantity : null

      return {
        ...item,
        potionName,
        potionImageUrl,
        unitPrice,
        lineTotal,
      }
    })

    const totalPrice = items.reduce(
      (sum, item) => (typeof item.lineTotal === "number" ? sum + item.lineTotal : sum),
      0
    )
    const hasPrice = items.some((item) => typeof item.lineTotal === "number")

    const order: Order = {
      id: orderDoc.id,
      ...validation.data,
      customerName: buildUserLabel(customerSnap?.data(), validation.data.customerId),
      driverName: driverRef
        ? buildUserLabel(driverSnap?.data(), validation.data.driverId || "")
        : undefined,
      items,
      totalPrice: hasPrice ? totalPrice : null,
    } as Order

    return new Response(
      JSON.stringify({
        success: true,
        order,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("[GET /api/orders/[id]] Error:", error)
    return new Response(
      JSON.stringify({
        error: "Impossible de récupérer la commande",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return new Response(JSON.stringify({ error: auth.error }), {
        status: auth.status,
        headers: { "Content-Type": "application/json" },
      })
    }

    const { id } = await params

    if (!id) {
      return new Response(JSON.stringify({ error: "ID commande requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    await admin.firestore().collection("orders").doc(id).delete()

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("[DELETE /api/orders/[id]] Error:", error)
    return new Response(
      JSON.stringify({ error: "Impossible de supprimer la commande" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
