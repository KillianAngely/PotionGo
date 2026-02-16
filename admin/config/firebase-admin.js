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
  const serviceAccount = getServiceAccountFromEnv()

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    })
  }
}

export default admin
