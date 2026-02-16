import admin from "firebase-admin"

const getServiceAccountFromEnv = () => {
  const jsonString = process.env.CLIENT_SERVICE_ACCOUNT_JSON

  if (!jsonString) {
    throw new Error("CLIENT_SERVICE_ACCOUNT_JSON environment variable is required")
  }

  try {
    return JSON.parse(jsonString)
  } catch (error) {
    throw new Error("Invalid JSON in CLIENT_SERVICE_ACCOUNT_JSON")
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(getServiceAccountFromEnv()),
  })
}

export default admin
