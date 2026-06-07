import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { supabase } from '../lib/supabaseClient'

type ApprovalStatus = 'pending' | 'approved' | 'rejected'
type UserRole = 'reader' | 'admin'

type ManagedUser = {
  id: string
  email: string
  created_at: string | null
  last_sign_in_at: string | null
  nome: string | null
  cognome: string | null
  phone: string | null
  role: UserRole
  approved: boolean
  approval_status: ApprovalStatus
  approval_requested_at: string | null
  approved_at: string | null
  rejected_at: string | null
}

function AdminAccessiUtenti() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState<'all' | ApprovalStatus>('pending')

  const visibleUsers = useMemo(() => {
    if (filter === 'all') return users
    return users.filter((user) => user.approval_status === filter)
  }, [users, filter])

  useEffect(() => {
    loadUsers()
  }, [])

  async function getAccessToken() {
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? ''
  }

  async function api(path: string, body?: unknown) {
    const token = await getAccessToken()
    const response = await fetch(`/.netlify/functions/${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const result = await response.json().catch(() => null)

    if (!response.ok) {
      throw new Error(result?.error || `Errore funzione ${path}`)
    }

    return result
  }

  async function loadUsers() {
    setLoading(true)
    setMessage('Caricamento utenti...')

    try {
      const result = await api('admin-list-users')
      setUsers(result.users ?? [])
      setMessage('Utenti caricati')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Errore caricamento utenti')
    } finally {
      setLoading(false)
    }
  }

  async function updateUser(userId: string, changes: { role?: UserRole; approval_status?: ApprovalStatus }) {
    setLoading(true)
    setMessage('Aggiornamento utente...')

    try {
      await api('admin-update-user', { userId, ...changes })
      await loadUsers()
      setMessage('Utente aggiornato')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Errore aggiornamento utente')
      setLoading(false)
    }
  }

  async function deleteUser(user: ManagedUser) {
    const ok = window.confirm(`Vuoi eliminare definitivamente l’utente ${user.email}?\n\nL’utente sarà eliminato da Supabase Auth e dalla tabella profiles.`)
    if (!ok) return

    setLoading(true)
    setMessage('Eliminazione utente...')

    try {
      await api('admin-delete-user', { userId: user.id, email: user.email })
      await loadUsers()
      setMessage('Utente eliminato')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Errore eliminazione utente')
      setLoading(false)
    }
  }

  async function sendPasswordReset(user: ManagedUser) {
    const ok = window.confirm(`Inviare email di reset password a ${user.email}?`)
    if (!ok) return

    setLoading(true)
    setMessage('Invio reset password...')

    try {
      await api('admin-send-password-reset', { email: user.email })
      setMessage('Email reset password inviata')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Errore invio reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section style={wrapperStyle}>
      <div style={headerStyle}>
        <div>
          <p style={labelStyle}>Gestione accessi</p>
          <h3 style={{ margin: '4px 0 8px' }}>Utenti registrati e approvazioni</h3>
          <p style={mutedStyle}>
            Da qui puoi approvare o rifiutare gli accessi, assegnare il ruolo e inviare un reset password.
            Per sicurezza le password esistenti non sono visibili.
          </p>
        </div>
        <button type="button" className="secondary-auth-button" onClick={loadUsers} disabled={loading}>Aggiorna</button>
      </div>

      <div style={filtersStyle}>
        <button type="button" style={filterButton(filter === 'pending')} onClick={() => setFilter('pending')}>In attesa</button>
        <button type="button" style={filterButton(filter === 'approved')} onClick={() => setFilter('approved')}>Approvati</button>
        <button type="button" style={filterButton(filter === 'rejected')} onClick={() => setFilter('rejected')}>Rifiutati</button>
        <button type="button" style={filterButton(filter === 'all')} onClick={() => setFilter('all')}>Tutti</button>
      </div>

      {message && <div style={messageStyle}>{message}</div>}

      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <colgroup>
            <col style={{ width: '25%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '22%' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={thStyle}>Utente</th>
              <th style={thStyle}>Tel.</th>
              <th style={thStyle}>Stato</th>
              <th style={thStyle}>Ruolo</th>
              <th style={thStyle}>Accesso</th>
              <th style={thStyle}>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((user) => (
              <tr key={user.id}>
                <td style={tdStyle}>
                  <strong style={userNameStyle}>{user.nome || user.cognome ? `${user.nome ?? ''} ${user.cognome ?? ''}`.trim() : 'Senza nome'}</strong>
                  <span style={emailStyle}>{user.email}</span>
                </td>
                <td style={tdStyle}>{user.phone || '-'}</td>
                <td style={tdStyle}>
                  <select
                    value={user.approval_status}
                    onChange={(e) => updateUser(user.id, { approval_status: e.target.value as ApprovalStatus })}
                    disabled={loading}
                    style={selectStyle}
                  >
                    <option value="pending">In attesa</option>
                    <option value="approved">Approvato</option>
                    <option value="rejected">Rifiutato</option>
                  </select>
                </td>
                <td style={tdStyle}>
                  <select
                    value={user.role}
                    onChange={(e) => updateUser(user.id, { role: e.target.value as UserRole })}
                    disabled={loading}
                    style={selectStyle}
                  >
                    <option value="reader">Lettore</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td style={tdStyle}>{formatDate(user.last_sign_in_at)}</td>
                <td style={tdStyle}>
                  <div style={actionsStyle}>
                    <button type="button" style={smallButtonStyle} onClick={() => updateUser(user.id, { approval_status: 'approved' })} disabled={loading}>OK</button>
                    <button type="button" style={smallButtonStyle} onClick={() => updateUser(user.id, { approval_status: 'rejected' })} disabled={loading}>No</button>
                    <button type="button" style={smallButtonStyle} onClick={() => sendPasswordReset(user)} disabled={loading}>Reset</button>
                    <button type="button" style={dangerButtonStyle} onClick={() => deleteUser(user)} disabled={loading}>Elimina</button>
                  </div>
                </td>
              </tr>
            ))}

            {visibleUsers.length === 0 && (
              <tr>
                <td style={tdStyle} colSpan={6}>Nessun utente da mostrare.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function formatDate(value: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  return date.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const wrapperStyle: CSSProperties = {
  display: 'grid',
  gap: '18px',
}

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '18px',
  flexWrap: 'wrap',
}

const labelStyle: CSSProperties = {
  margin: 0,
  color: '#f3dede',
  fontWeight: 900,
  letterSpacing: '1.2px',
  textTransform: 'uppercase',
  fontSize: '12px',
}

const mutedStyle: CSSProperties = {
  color: '#a7b0c0',
  fontSize: '13px',
}

const userNameStyle: CSSProperties = {
  display: 'block',
  color: '#fff',
  fontSize: '13px',
  lineHeight: 1.2,
}

const emailStyle: CSSProperties = {
  display: 'block',
  marginTop: '4px',
  color: '#a7b0c0',
  fontSize: '11px',
  lineHeight: 1.2,
  wordBreak: 'break-all',
}


const filtersStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
}

const filterButton = (active: boolean): CSSProperties => ({
  border: active ? '1px solid rgba(185,68,79,0.8)' : '1px solid rgba(255,255,255,0.14)',
  background: active ? 'rgba(185,68,79,0.28)' : 'rgba(255,255,255,0.06)',
  color: '#fff',
  borderRadius: '999px',
  padding: '9px 14px',
  cursor: 'pointer',
  fontWeight: 800,
})

const messageStyle: CSSProperties = {
  padding: '12px 14px',
  borderRadius: '14px',
  background: 'rgba(185,68,79,0.18)',
  border: '1px solid rgba(185,68,79,0.28)',
  color: '#f3dede',
}

const tableWrapperStyle: CSSProperties = {
  width: '100%',
  overflowX: 'hidden',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: '16px',
}

const tableStyle: CSSProperties = {
  width: '100%',
  tableLayout: 'fixed',
  borderCollapse: 'collapse',
}

const thStyle: CSSProperties = {
  textAlign: 'left',
  padding: '10px 8px',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  fontSize: '12px',
  lineHeight: 1.2,
  whiteSpace: 'normal',
}

const tdStyle: CSSProperties = {
  padding: '10px 8px',
  borderTop: '1px solid rgba(255,255,255,0.08)',
  verticalAlign: 'top',
  fontSize: '12px',
  lineHeight: 1.25,
  whiteSpace: 'normal',
  wordBreak: 'break-word',
}

const selectStyle: CSSProperties = {
  width: '100%',
  minWidth: 0,
  borderRadius: '10px',
  padding: '7px 6px',
  border: '1px solid rgba(255,255,255,0.14)',
  background: '#0f172a',
  color: '#fff',
  fontSize: '12px',
}

const actionsStyle: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  gap: '6px',
}

const smallButtonStyle: CSSProperties = {
  border: '1px solid rgba(255,255,255,0.14)',
  background: 'rgba(255,255,255,0.08)',
  color: '#fff',
  borderRadius: '10px',
  padding: '7px 6px',
  cursor: 'pointer',
  fontWeight: 800,
  fontSize: '11px',
  lineHeight: 1.1,
  minWidth: 0,
}

const dangerButtonStyle: CSSProperties = {
  ...smallButtonStyle,
  border: '1px solid rgba(220,38,38,0.6)',
  background: 'rgba(220,38,38,0.22)',
}

export default AdminAccessiUtenti
