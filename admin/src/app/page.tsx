"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import styles from "./page.module.css"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../../config/firebase"
import { useAuth } from "../context/AuthContext"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

const loginSchema = z.object({
  email: z.string().email("Format d'email invalide"),
  password: z.string().min(6, "Le mdp doit contenir au moins 6 caractères"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function Home() {
  const [serverError, setServerError] = useState<string | null>(null)
  const router = useRouter()
  const { isAdmin, loading, user } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  useEffect(() => {
    if (!loading && isAdmin) {
      router.push("/dashboard")
    }
  }, [isAdmin, loading, router])

  useEffect(() => {
    if (!loading && user && !isAdmin) {
      setServerError("Accès refusé. Seuls les administrateurs peuvent accéder.")
    }
  }, [user, isAdmin, loading])

  const onSubmit = async (data: LoginForm) => {
    setServerError(null)
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password)
    } catch (err: any) {
      setServerError("Erreur d'authentification : " + err.message)
    }
  }

  if (loading) return <div>Chargement...</div>

  return (
    <div className={styles.page}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <h3>Login Admin Only</h3>
        <div>
          <input 
            {...register("email")} 
            type="email" 
            placeholder="Email" 
          />
          {errors.email && <p className={styles.errorText}>{errors.email.message}</p>}
        </div>

        <div>
          <input 
            {...register("password")} 
            type="password" 
            placeholder="Password" 
          />
          {errors.password && <p className={styles.errorText}>{errors.password.message}</p>}
        </div>

        {serverError && <p style={{ color: "red" }}>{serverError}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Connexion..." : "Login"}
        </button>
      </form>
    </div>
  )
}