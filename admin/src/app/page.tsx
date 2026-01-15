"use client"
import { FormEvent, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import styles from "./page.module.css"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../../config/firebase"
import { useAuth } from "../context/AuthContext"

export default function Home() {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { isAdmin, loading, user, logout } = useAuth()

  useEffect(() => {
    if (!loading && isAdmin) {
      router.push("/dashboard")
    }
  }, [isAdmin, loading, router])


  useEffect(() => {
    if (!loading && user && !isAdmin) {
      console.log('Utilisateur non-admin détecté, déconnexion...')
      setError("Accès refusé. Seuls les administrateurs peuvent accéder à cette interface.")
    }
  }, [user, isAdmin, loading])

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)

    const email = (event.currentTarget.elements.namedItem("email") as HTMLInputElement).value
    const password = (event.currentTarget.elements.namedItem("password") as HTMLInputElement).value
    
    try {
      console.log('Tentative de connexion avec:', email)
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log('Connexion réussie, utilisateur:', userCredential.user.email)
    } catch (err: any) {
      console.log('Erreur de connexion:', err.message)
      setError("Login failed: " + err.message)
    }
  }

  if (loading) {
    return <div>Chargement...</div>
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
    </div>
  )
}