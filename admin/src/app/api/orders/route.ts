import admin from "../../../../config/firebase-admin"
import { Order, orderSchema } from "./schema"
import { buildAuthErrorResponse, requireAdmin } from "../_utils/auth"

const buildUserLabel = (data: admin.firestore.DocumentData | undefined, fallback: string) => {
  const firstName = typeof data?.firstName === "string" ? data.firstName.trim() : ""
  const lastName = typeof data?.lastName === "string" ? data.lastName.trim() : ""
  const fullName = `${firstName} ${lastName}`.trim()
  if (fullName) return fullName
  if (typeof data?.email === "string" && data.email.trim()) return data.email.trim()
  return fallback
}

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return buildAuthErrorResponse(auth)
    }

    const snapshot = await admin.firestore().collection("orders").get()

    const parsedOrders = snapshot.docs
      .map((doc) => {
        const validation = orderSchema.safeParse(doc.data())
        if (!validation.success) return null
        return { id: doc.id, ...validation.data } as Order
      })
      .filter(Boolean) as Order[]

    const customerIds = new Set<string>()
    const driverIds = new Set<string>()
    const potionIds = new Set<string>()

    for (const order of parsedOrders) {
      customerIds.add(order.customerId)
      if (order.driverId) driverIds.add(order.driverId)
      for (const item of order.items) {
        potionIds.add(item.potionId)
      }
    }

    const userRefs = [...customerIds, ...driverIds].map((id) =>
      admin.firestore().collection("users").doc(id)
    )
    const productRefs = [...potionIds].map((id) =>
      admin.firestore().collection("products").doc(id)
    )

    const userSnaps =
      userRefs.length > 0 ? await admin.firestore().getAll(...userRefs) : []
    const productSnaps =
      productRefs.length > 0 ? await admin.firestore().getAll(...productRefs) : []

    const userMap = new Map<string, admin.firestore.DocumentData>()
    for (const snap of userSnaps) {
      if (snap.exists) userMap.set(snap.id, snap.data() || {})
    }

    const productMap = new Map<string, admin.firestore.DocumentData>()
    for (const snap of productSnaps) {
      if (snap.exists) productMap.set(snap.id, snap.data() || {})
    }

    const orders: Order[] = parsedOrders.map((order) => {
      const items = order.items.map((item) => {
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

      return {
        ...order,
        customerName: buildUserLabel(userMap.get(order.customerId), order.customerId),
        driverName: order.driverId
          ? buildUserLabel(userMap.get(order.driverId), order.driverId)
          : undefined,
        items,
        totalPrice: hasPrice ? totalPrice : null,
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        orders,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("[GET /api/orders] Error:", error)
    return new Response(
      JSON.stringify({
        error: "Impossible d'afficher les commandes",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (!auth.ok) {
      return buildAuthErrorResponse(auth)
    }

    const body = await request.json()
    const validation = orderSchema.safeParse(body)
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Données commande invalides",
          details: validation.error.flatten().fieldErrors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      )
    }

    const docRef = await admin.firestore().collection("orders").add({
      ...validation.data,
    })

    const order: Order = {
      id: docRef.id,
      ...validation.data,
    }

    return new Response(JSON.stringify({ success: true, order }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("[POST /api/orders] Error:", error)
    return new Response(
      JSON.stringify({ error: "Impossible de créer la commande" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
}
