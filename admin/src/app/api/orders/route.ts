import admin from "../../../../config/firebase-admin"
import { Order, orderSchema } from "./schema"
import { buildAuthErrorResponse, requireAdmin } from "../_utils/auth"
import { requireCsrf } from "../_utils/csrf"

type OrderListItem = Order & {
  customerName?: string
  driverName?: string
  totalPrice: number | null
  itemCount: number
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const parsePositiveInt = (value: string | null, fallback: number) => {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.floor(parsed)
}

const parseOptionalNumber = (value: string | null) => {
  if (value === null || value.trim() === "") return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : null
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

    const { searchParams } = new URL(request.url)
    const statusFilter = searchParams.get("status")?.trim().toUpperCase() ?? ""
    const search = searchParams.get("search")?.trim().toLowerCase() ?? ""
    const minTotal = parseOptionalNumber(searchParams.get("minTotal"))
    const maxTotal = parseOptionalNumber(searchParams.get("maxTotal"))
    const page = parsePositiveInt(searchParams.get("page"), 1)
    const pageSize = clamp(parsePositiveInt(searchParams.get("pageSize"), 10), 1, 100)
    const sorts = parseSorts(searchParams.get("sort"), [
      "id",
      "status",
      "customerName",
      "driverName",
      "itemCount",
      "totalPrice",
    ])

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

    const orders: OrderListItem[] = parsedOrders.map((order) => {
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
        itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
      }
    })

    const filteredOrders = orders.filter((order) => {
      if (statusFilter && order.status !== statusFilter) return false
      if (typeof minTotal === "number" && typeof order.totalPrice === "number" && order.totalPrice < minTotal) {
        return false
      }
      if (typeof maxTotal === "number" && typeof order.totalPrice === "number" && order.totalPrice > maxTotal) {
        return false
      }
      if (search) {
        const haystack = [
          order.id,
          order.customerName,
          order.customerId,
          order.driverName,
          order.driverId,
          order.dropoff.address,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
        if (!haystack.includes(search)) return false
      }
      return true
    })

    const sortedOrders = [...filteredOrders]
    sortedOrders.sort((a, b) => {
      for (const sort of sorts) {
        const comparison = compareValues(
          a[sort.field as keyof OrderListItem],
          b[sort.field as keyof OrderListItem]
        )
        if (comparison !== 0) {
          return sort.direction === "asc" ? comparison : -comparison
        }
      }
      return a.id.localeCompare(b.id)
    })

    const total = sortedOrders.length
    const totalPages = Math.max(1, Math.ceil(total / pageSize))
    const safePage = clamp(page, 1, totalPages)
    const start = (safePage - 1) * pageSize
    const pagedOrders = sortedOrders.slice(start, start + pageSize)

    return new Response(
      JSON.stringify({
        success: true,
        orders: pagedOrders,
        pagination: {
          page: safePage,
          pageSize,
          total,
          totalPages,
        },
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
    const csrfError = requireCsrf(request)
    if (csrfError) return csrfError

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
