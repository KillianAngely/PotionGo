"use client"
import { FormEvent, useState } from "react"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth } from "../../config/firebase"
import styles from "./page.module.css"

export default function Home() {
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null);

    const email = (event.currentTarget.elements.namedItem("email") as HTMLInputElement).value;
    const password = (event.currentTarget.elements.namedItem("password") as HTMLInputElement).value;

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
            await userCredential.user.getIdToken(true);
            const idTokenResult = await userCredential.user.getIdTokenResult();
            if (!idTokenResult.claims.admin) {
        setError("permissions nécessaires");
        await auth.signOut();
        return;
      }
      console.log('Connexion réussie en tant qu\'admin');
      
    } catch (error: any) {
      console.error('Error during sign in:', error);
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        setError('Email ou mot de passe incorrect');
      } else if (error.code === 'auth/invalid-email') {
        setError('Format d\'email invalide');
      } else if (error.code === 'auth/too-many-requests') {
        setError('Trop de tentatives de connexion. Veuillez réessayer plus tard');
      } else {
        setError(error.message || 'Une erreur est survenue lors de la connexion');
      }
    }
  }

  return (
    <div className={styles.page}>
      TEST BBBBBBBBBBBBBB
      <form onSubmit={handleSubmit}>
        <input type="email" placeholder="Email" name="email" />
        <input type="password" placeholder="Password" name="password" />
        <button type="submit">Login</button>
        {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}
      </form>
    </div>
  )
}
