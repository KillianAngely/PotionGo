"use client"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "../../../config/firebase"

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const [authorized, setAuthorized] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const tokenResult = await user.getIdTokenResult(true)
        
        if (tokenResult.claims.role === "admin") {
          setAuthorized(true)
        } else {
          router.replace("/")
        }
      } else {
        router.replace("/")
      }
    })

    return () => unsubscribe()
  }, [router])

  if (!authorized) {
    return (
      <div>
        <h1>Vérif admin</h1>
      </div>
    )
  }

  return <>{children}</>
}