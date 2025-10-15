"use client"

import { useEffect, useState } from "react"
import styles from "./page.module.css"

export default function Home() {
  const [message, setMessage] = useState("Chargement...")

  useEffect(() => {
    fetch(`/api/health`)
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch(() => {
        setMessage("Erreur de connexion à l’API")
      })
  }, [])

  return (
    <div className={styles.page}>
      <h1>{"Statut de l'API :"}</h1>
      <p>{message}</p>
    </div>
  )
}
