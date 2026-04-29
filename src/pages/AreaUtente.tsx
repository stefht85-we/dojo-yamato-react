import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { User } from '@supabase/supabase-js'
import './AreaUtente.css'

function AreaUtente() {
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [message, setMessage] = useState('')

  async function loadProfile(currentUser: User) {
    await supabase.from('profiles').upsert({
      id: currentUser.id,
      email: currentUser.email,
    })

    const { data } = await supabase
      .from('profiles')
      .select('nome, cognome')
      .eq('id', currentUser.id)
      .single()

    if (data) {
      setNome(data.nome ?? '')
      setCognome(data.cognome ?? '')
    }
  }

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser()
      const currentUser = data.user

      setUser(currentUser)

      if (currentUser) {
        loadProfile(currentUser)
      }
    }

    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        loadProfile(currentUser)
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setMessage('Registrazione...')

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) setMessage(error.message)
    else setMessage('Registrazione completata')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setMessage('Login...')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) setMessage(error.message)
    else setMessage('Login effettuato')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()

    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ nome, cognome })
      .eq('id', user.id)

    if (error) setMessage(error.message)
    else setMessage('Profilo salvato')
  }

  // 🔴 LOGIN VIEW
  if (!user) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <h1>Accesso Dojo Yamato</h1>

          <form style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button className="primary-auth-button" onClick={handleLogin}>
              Login
            </button>

            <button className="secondary-auth-button" onClick={handleSignup}>
              Registrati
            </button>
          </form>

          {message && <p style={{ marginTop: '16px' }}>{message}</p>}
        </div>
      </div>
    )
  }

  // 🟢 PROFILO VIEW
  return (
    <div className="profile-layout">
      <div className="profile-card">
        <h1>Area Utente</h1>

        <p>
          Loggato come: <strong>{user.email}</strong>
        </p>

        <form
          onSubmit={handleSaveProfile}
          style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '20px' }}
        >
          <input
            type="text"
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <input
            type="text"
            placeholder="Cognome"
            value={cognome}
            onChange={(e) => setCognome(e.target.value)}
          />

          <button className="primary-auth-button" type="submit">
            Salva profilo
          </button>
        </form>

        <button
          style={{ marginTop: '30px' }}
          className="secondary-auth-button"
          onClick={handleLogout}
        >
          Logout
        </button>

        {message && <p style={{ marginTop: '16px' }}>{message}</p>}
      </div>
    </div>
  )
}

export default AreaUtente