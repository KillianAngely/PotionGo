// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getDatabase } from "firebase/database"
import { getStorage } from "firebase/storage"

// TODO: Add SDKs for Firebase products that you want to use

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBWQpckcBrYCPbWgbVo1A7V34AkaREFNdA",
  authDomain: "potiongo-f85b7.firebaseapp.com",
  projectId: "potiongo-f85b7",
  storageBucket: "potiongo-f85b7.firebasestorage.app",
  messagingSenderId: "925160551434",
  appId: "1:925160551434:web:1de4f8607354e1ed8fdbf3",
}
// Initialize Firebase
export const app = initializeApp(firebaseConfig)
export const firestore = getFirestore(app)
export const realtime = getDatabase(app)
export const auth = getAuth(app)
export const storage = getStorage(app)
