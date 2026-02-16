import admin from "firebase-admin"

const getServiceAccountFromEnv = () => {
  const jsonString = process.env.CLIENT_SERVICE_ACCOUNT_JSON

  if (!jsonString) {
    return null
  }

  try {
    return JSON.parse(jsonString)
  } catch (error) {
    return null
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(getServiceAccountFromEnv()),
  })
}

export default admin
