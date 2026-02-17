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

const RTDB_URL =
  process.env.FIREBASE_DATABASE_URL ||
  "https://potiongo-f85b7-default-rtdb.europe-west1.firebasedatabase.app"

if (!admin.apps.length) {
  const serviceAccount = getServiceAccountFromEnv()

  if (serviceAccount) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: RTDB_URL,
    })
  } else {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: RTDB_URL,
    })
  }
}

export default admin
