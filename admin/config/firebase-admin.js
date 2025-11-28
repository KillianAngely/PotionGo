import admin from "firebase-admin";

const serviceAccount = require("../client_service_account.json");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://potiongo-default-rtdb.europe-west1.firebasedatabase.app"
  });
}

export default admin;
