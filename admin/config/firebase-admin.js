import admin from "firebase-admin"
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const serviceAccountPath = path.join(__dirname, "../client_service_account.json")

const getServiceAccountFromEnv = () => {
  const jsonString =
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ??
    process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT ??
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON

  if (!jsonString) return null

  try {
    return JSON.parse(jsonString)
  } catch {
    return null
  }
}

const getServiceAccountFromFile = () => {
  if (!existsSync(serviceAccountPath)) return null
  return JSON.parse(readFileSync(serviceAccountPath, "utf8"))
}

const getServiceAccountFromParts = () => {
  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (!projectId || !clientEmail || !privateKey) return null

  return { project_id: projectId, client_email: clientEmail, private_key: privateKey }
}

const resolveCredential = () => {
  const serviceAccount =
    getServiceAccountFromEnv() ?? getServiceAccountFromFile() ?? getServiceAccountFromParts()

  if (serviceAccount) {
    return admin.credential.cert(serviceAccount)
  }

  return admin.credential.applicationDefault()
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: resolveCredential(),
  })
}

export default admin
