import { useState } from 'react'
import './App.css'
import { supabase } from './lib/supabaseClient'

function App() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setMessage('Registrazione in corso...')

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setMessage(`Errore: ${error.message}`)
    } else {
      setMessage('Registrazione inviata. Controlla la tua email.')
    }
  }

  return (
    <div style={{ maxWidth: '420px', margin: '60px auto', fontFamily: 'Arial' }}>
      <h1>Test registrazione Supabase</h1>

      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <input
          type="email"
          placeholder="Inserisci email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '12px', fontSize: '16px' }}
        />

        <input
          type="password"
          placeholder="Inserisci password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '12px', fontSize: '16px' }}
        />

        <button type="submit" style={{ padding: '12px', fontSize: '16px', cursor: 'pointer' }}>
          Registrati
        </button>
      </form>

      {message && <p style={{ marginTop: '20px' }}>{message}</p>}
    </div>
  )
}

export default App