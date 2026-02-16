import { initializeApp } from "firebase-admin/app"

initializeApp()

export { createUser } from "./createUser"
export { createOrder } from "./createOrder"
export { acceptOrder } from "./acceptOrder"
export { validateOrder } from "./validateOrder"
