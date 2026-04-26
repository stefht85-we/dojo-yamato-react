import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

function AreaUtente() {
  const [user, setUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nome, setNome] = useState('')
  const [cognome, setCognome] = useState('')
  const [message, setMessage] = useState('')

  async function saveProfile(currentUser: User) {
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
        await saveProfile(currentUser)
      }
    }

    getUser()

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null
      setUser(currentUser)

      if (currentUser) {
        saveProfile(currentUser)
      }
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setMessage('Registrazione in corso...')

    const { error } = await supabase.auth.signUp({ email, password })

    if (error) setMessage(`Errore registrazione: ${error.message}`)
    else setMessage('Registrazione completata.')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setMessage('Login in corso...')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) setMessage(`Errore login: ${error.message}`)
    else setMessage('Login effettuato.')
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setEmail('')
    setPassword('')
    setNome('')
    setCognome('')
    setMessage('')
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()

    if (!user) return

    setMessage('Salvataggio profilo...')

    const { error } = await supabase
      .from('profiles')
      .update({
        nome,
        cognome,
      })
      .eq('id', user.id)

    if (error) {
      setMessage(`Errore salvataggio: ${error.message}`)
    } else {
      setMessage('Profilo salvato correttamente.')
    }
  }

  if (user) {
    return (
      <div style={{ maxWidth: '500px', margin: '60px auto', fontFamily: 'Arial' }}>
        <h1>Area utente</h1>
        <p>Sei loggato come:</p>
        <strong>{user.email}</strong>

        <form
          onSubmit={handleSaveProfile}
          style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '30px' }}
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

          <button type="submit">Salva profilo</button>
        </form>

        <br />

        <button onClick={handleLogout}>
          Logout
        </button>

        {message && <p>{message}</p>}
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '420px', margin: '60px auto', fontFamily: 'Arial' }}>
      <h1>Accesso Dojo Yamato</h1>

      <form style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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

        <button onClick={handleLogin}>Login</button>
        <button onClick={handleSignup}>Registrati</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  )
}

export default AreaUtente