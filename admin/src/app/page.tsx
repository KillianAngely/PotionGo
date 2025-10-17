"use client"
import { FormEvent } from "react"
import styles from "./page.module.css"

export default function Home() {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    fetch(`/api/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: (event.currentTarget.elements.namedItem("email") as HTMLInputElement).value,
        password: (event.currentTarget.elements.namedItem("password") as HTMLInputElement).value,
      }),
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json()
          return new Error(errorData.message || "Failed to sign up")
        }
        return response.json()
      })
      .then((data) => {
        console.log("User signed up successfully:", data)
      })
      .catch((error) => {
        console.error("Error during sign up:", error)
      })
  }

  return (
    <div className={styles.page}>
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" name="email" />
        <input type="password" placeholder="Password" name="password" />
        <button type="submit">Login</button>
      </form>
    </div>
  )
}
