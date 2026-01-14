"use client"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import styles from "./page.module.css"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth"
import { auth } from "../../config/firebase"

export default function Home() {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // const createUser = async (event: FormEvent<HTMLFormElement>) => {
  //   event.preventDefault()
  //   setError(null)

  //   const email = (event.currentTarget.elements.namedItem("email2") as HTMLInputElement).value
  //   const password = (event.currentTarget.elements.namedItem("password2") as HTMLInputElement).value

  //   try {
  //     const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  //     console.log("User created:", userCredential.user)
  //   } catch (err: any) {
  //     setError(err.message)
  //   }
  // }

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const email = (event.currentTarget.elements.namedItem("email") as HTMLInputElement).value
    const password = (event.currentTarget.elements.namedItem("password") as HTMLInputElement).value
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const tokenResult = await userCredential.user.getIdTokenResult()

      if (tokenResult.claims.role === "admin") {
        router.push("/dashboard")
      } else {
        await signOut(auth)
        setError("Compte non admin")
      }
    } catch (err: any) {
      setError("Login failed: " + err.message)
    }
  }

  return (
    <div className={styles.page}>
      {error && <p style={{ color: "red" }}>{error}</p>}
      
      <form onSubmit={handleLogin}>
        <h3>Login Admin Only</h3>
        <input type="email" placeholder="Email" name="email" required />
        <input type="password" placeholder="Password" name="password" required />
        <button type="submit">Login</button>
      </form>
{/* 
      <hr />

      <form onSubmit={createUser}>
        <h3>SignUp</h3>
        <input type="email" placeholder="Email" name="email2" required />
        <input type="password" placeholder="Password" name="password2" required />
        <button type="submit">SignUp</button>
      </form> */}
    </div>
  )
}