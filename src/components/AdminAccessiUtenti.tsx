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
  disabled: boolean
  deleted_at: string | null
}

function AdminAccessiUtenti() {
  const [users, setUsers] = useState<ManagedUser[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [filter, setFilter] = useState<'all' | ApprovalStatus | 'disabled'>('pending')

  const visibleUsers = useMemo(() => {
    if (filter === 'all') return users
    if (filter === 'disabled') return users.filter((user) => user.disabled || Boolean(user.deleted_at))
    return users.filter((user) => user.approval_status === filter && !user.disabled && !user.deleted_at)
  }, [users, filter])

  const visibleSelectedCount = visibleUsers.filter((user) => selectedIds.includes(user.id)).length
  const allVisibleSelected = visibleUsers.length > 0 && visibleSelectedCount === visibleUsers.length

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
      setSelectedIds([])
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

  async function approveUsers(targetIds: string[]) {
    if (targetIds.length === 0) return
    const label = targetIds.length === 1 ? 'questo utente' : `${targetIds.length} utenti selezionati`
    const ok = window.confirm(`Vuoi approvare ${label}?\n\nGli utenti selezionati potranno accedere ai contenuti riservati in base al loro ruolo.`)
    if (!ok) return

    setLoading(true)
    setMessage('Approvazione utenti...')

    try {
      await Promise.all(targetIds.map((userId) => api('admin-update-user', { userId, approval_status: 'approved' })))
      await loadUsers()
      setMessage(targetIds.length === 1 ? 'Utente approvato' : 'Utenti approvati')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Errore approvazione utenti')
      setLoading(false)
    }
  }

  async function softDeleteUsers(targetIds: string[]) {
    if (targetIds.length === 0) return
    const label = targetIds.length === 1 ? 'questo utente' : `${targetIds.length} utenti selezionati`
    const ok = window.confirm(`Vuoi disattivare ${label}?\n\nL’utente resterà nello storico, ma non sarà approvato e non potrà accedere ai contenuti riservati.`)
    if (!ok) return

    setLoading(true)
    setMessage('Disattivazione utenti...')

    try {
      await api('admin-soft-delete-users', { userIds: targetIds })
      await loadUsers()
      setMessage(targetIds.length === 1 ? 'Utente disattivato' : 'Utenti disattivati')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Errore disattivazione utenti')
      setLoading(false)
    }
  }

  async function hardDeleteUsers(targetIds: string[]) {
    if (targetIds.length === 0) return
    const label = targetIds.length === 1 ? 'questo utente' : `${targetIds.length} utenti selezionati`
    const ok = window.confirm(`ATTENZIONE: vuoi eliminare definitivamente ${label}?\n\nLa cancellazione rimuove il profilo e l’utente da Supabase Auth. Operazione non reversibile.`)
    if (!ok) return

    setLoading(true)
    setMessage('Eliminazione definitiva utenti...')

    try {
      await api('admin-delete-users', { userIds: targetIds })
      await loadUsers()
      setMessage(targetIds.length === 1 ? 'Utente eliminato definitivamente' : 'Utenti eliminati definitivamente')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Errore eliminazione definitiva')
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

  function toggleUser(userId: string) {
    setSelectedIds((current) => current.includes(userId)
      ? current.filter((id) => id !== userId)
      : [...current, userId])
  }

  function toggleVisibleUsers() {
    const visibleIds = visibleUsers.map((user) => user.id)
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !visibleIds.includes(id)))
      return
    }
    setSelectedIds((current) => Array.from(new Set([...current, ...visibleIds])))
  }

  return (
    <>
      <style>{adminAccessResponsiveCss}</style>
      <section className="admin-access-panel" style={wrapperStyle}>
      <div style={headerStyle}>
        <div>
          <p style={labelStyle}>Gestione accessi</p>
          <h3 style={{ margin: '2px 0 6px', fontSize: '18px' }}>Utenti registrati e approvazioni</h3>
          <p style={mutedStyle}>Approva, rifiuta, cambia ruolo, reset password, disattiva o elimina utenti.</p>
        </div>
        <button type="button" className="secondary-auth-button" onClick={loadUsers} disabled={loading} style={refreshButtonStyle}>Aggiorna</button>
      </div>

      <div style={filtersStyle}>
        <button type="button" style={filterButton(filter === 'pending')} onClick={() => setFilter('pending')}>In attesa</button>
        <button type="button" style={filterButton(filter === 'approved')} onClick={() => setFilter('approved')}>Approvati</button>
        <button type="button" style={filterButton(filter === 'rejected')} onClick={() => setFilter('rejected')}>Rifiutati</button>
        <button type="button" style={filterButton(filter === 'disabled')} onClick={() => setFilter('disabled')}>Disattivati</button>
        <button type="button" style={filterButton(filter === 'all')} onClick={() => setFilter('all')}>Tutti</button>
      </div>

      <div className="admin-access-bulk" style={bulkBarStyle}>
        <label style={checkLabelStyle}>
          <input type="checkbox" checked={allVisibleSelected} onChange={toggleVisibleUsers} disabled={visibleUsers.length === 0 || loading} />
          Seleziona visibili
        </label>
        <span style={bulkCountStyle}>{selectedIds.length} selezionati</span>
        <button type="button" style={bulkApproveStyle} onClick={() => approveUsers(selectedIds)} disabled={loading || selectedIds.length === 0}>Approva selezionati</button>
        <button type="button" style={bulkButtonStyle} onClick={() => softDeleteUsers(selectedIds)} disabled={loading || selectedIds.length === 0}>Disattiva selezionati</button>
        <button type="button" style={bulkDangerStyle} onClick={() => hardDeleteUsers(selectedIds)} disabled={loading || selectedIds.length === 0}>Elimina definitivamente</button>
      </div>

      {message && <div style={messageStyle}>{message}</div>}

      <div className="admin-access-table-wrap" style={tableWrapperStyle}>
        <table className="admin-access-table" style={tableStyle}>
          <colgroup>
            <col style={{ width: '7%' }} />
            <col style={{ width: '31%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '25%' }} />
            <col style={{ width: '21%' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={thStyle}>Sel.</th>
              <th style={thStyle}>Utente</th>
              <th style={thStyle}>Accesso</th>
              <th style={thStyle}>Stato / ruolo</th>
              <th style={thStyle}>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((user) => (
              <tr key={user.id} style={user.disabled || user.deleted_at ? disabledRowStyle : undefined}>
                <td style={tdStyle}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(user.id)}
                    onChange={() => toggleUser(user.id)}
                    disabled={loading}
                    aria-label={`Seleziona ${user.email}`}
                  />
                </td>
                <td style={tdStyle}>
                  <strong style={userNameStyle}>{user.nome || user.cognome ? `${user.nome ?? ''} ${user.cognome ?? ''}`.trim() : 'Senza nome'}</strong>
                  <span style={emailStyle}>{user.email}</span>
                  <span style={phoneStyle}>{user.phone || 'Tel. non indicato'}</span>
                  {(user.disabled || user.deleted_at) && <span style={disabledBadgeStyle}>Disattivato</span>}
                </td>
                <td style={tdStyle}>{formatDate(user.last_sign_in_at)}</td>
                <td style={tdStyle}>
                  <div style={selectStackStyle}>
                    <select
                      value={user.approval_status}
                      onChange={(e) => updateUser(user.id, { approval_status: e.target.value as ApprovalStatus })}
                      disabled={loading}
                      style={selectStyle}
                      aria-label="Stato approvazione"
                    >
                      <option value="pending">In attesa</option>
                      <option value="approved">Approvato</option>
                      <option value="rejected">Rifiutato</option>
                    </select>
                    <select
                      value={user.role}
                      onChange={(e) => updateUser(user.id, { role: e.target.value as UserRole })}
                      disabled={loading}
                      style={selectStyle}
                      aria-label="Ruolo utente"
                    >
                      <option value="reader">User / Lettore</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </td>
                <td style={tdStyle}>
                  <div style={actionsStyle}>
                    <button type="button" style={smallButtonStyle} onClick={() => updateUser(user.id, { approval_status: 'approved' })} disabled={loading}>OK</button>
                    <button type="button" style={smallButtonStyle} onClick={() => updateUser(user.id, { approval_status: 'rejected' })} disabled={loading}>No</button>
                    <button type="button" style={smallButtonStyle} onClick={() => sendPasswordReset(user)} disabled={loading}>Reset</button>
                    <button type="button" style={warningButtonStyle} onClick={() => softDeleteUsers([user.id])} disabled={loading}>Disatt.</button>
                    <button type="button" style={dangerButtonStyle} onClick={() => hardDeleteUsers([user.id])} disabled={loading}>Elimina</button>
                  </div>
                </td>
              </tr>
            ))}

            {visibleUsers.length === 0 && (
              <tr>
                <td style={tdStyle} colSpan={5}>Nessun utente da mostrare.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      </section>
    </>
  )
}

const adminAccessResponsiveCss = `
@media (max-width: 760px) {
  .admin-access-panel {
    gap: 14px !important;
  }

  .admin-access-bulk {
    align-items: stretch !important;
  }

  .admin-access-bulk button,
  .admin-access-bulk label {
    flex: 1 1 150px;
    justify-content: center;
  }

  .admin-access-table colgroup,
  .admin-access-table thead {
    display: none !important;
  }

  .admin-access-table,
  .admin-access-table tbody,
  .admin-access-table tr,
  .admin-access-table td {
    display: block !important;
    width: 100% !important;
  }

  .admin-access-table tr {
    margin: 10px 0 !important;
    padding: 10px !important;
    border-radius: 14px !important;
    background: rgba(255,255,255,0.045) !important;
    border: 1px solid rgba(255,255,255,0.10) !important;
  }

  .admin-access-table td {
    padding: 8px 4px !important;
    border-top: 0 !important;
  }

  .admin-access-table td:nth-child(2)::before,
  .admin-access-table td:nth-child(3)::before,
  .admin-access-table td:nth-child(4)::before,
  .admin-access-table td:nth-child(5)::before {
    display: block;
    margin-bottom: 5px;
    color: #a7b0c0;
    font-size: 10px;
    font-weight: 900;
    letter-spacing: .6px;
    text-transform: uppercase;
  }

  .admin-access-table td:nth-child(2)::before { content: "Utente"; }
  .admin-access-table td:nth-child(3)::before { content: "Ultimo accesso"; }
  .admin-access-table td:nth-child(4)::before { content: "Stato / ruolo"; }
  .admin-access-table td:nth-child(5)::before { content: "Azioni"; }
}

@media (max-width: 430px) {
  .admin-access-bulk button,
  .admin-access-bulk label {
    flex-basis: 100%;
  }
}
`

function formatDate(value: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  return date.toLocaleString('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).replace(', ', '\n')
}

const wrapperStyle: CSSProperties = { display: 'grid', gap: '11px' }

const headerStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: '10px',
  flexWrap: 'wrap',
}

const refreshButtonStyle: CSSProperties = { padding: '7px 12px', minHeight: '34px', fontSize: '12px' }

const labelStyle: CSSProperties = {
  margin: 0,
  color: '#f3dede',
  fontWeight: 900,
  letterSpacing: '1px',
  textTransform: 'uppercase',
  fontSize: '11px',
}

const mutedStyle: CSSProperties = { margin: 0, color: '#a7b0c0', fontSize: '12px', lineHeight: 1.35 }

const filtersStyle: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '6px' }

const filterButton = (active: boolean): CSSProperties => ({
  border: active ? '1px solid rgba(185,68,79,0.8)' : '1px solid rgba(255,255,255,0.14)',
  background: active ? 'rgba(185,68,79,0.28)' : 'rgba(255,255,255,0.06)',
  color: '#fff',
  borderRadius: '999px',
  padding: '7px 11px',
  cursor: 'pointer',
  fontWeight: 800,
  fontSize: '12px',
})

const bulkBarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: '7px',
  padding: '8px',
  borderRadius: '13px',
  background: 'rgba(255,255,255,0.045)',
  border: '1px solid rgba(255,255,255,0.08)',
}

const checkLabelStyle: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#fff', fontSize: '11px', fontWeight: 800 }
const bulkCountStyle: CSSProperties = { color: '#a7b0c0', fontSize: '11px', marginRight: 'auto' }
const bulkButtonStyle: CSSProperties = { border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: '9px', padding: '6px 8px', cursor: 'pointer', fontWeight: 850, fontSize: '10.5px' }
const bulkApproveStyle: CSSProperties = { ...bulkButtonStyle, border: '1px solid rgba(34,197,94,0.55)', background: 'rgba(34,197,94,0.18)' }
const bulkDangerStyle: CSSProperties = { ...bulkButtonStyle, border: '1px solid rgba(220,38,38,0.6)', background: 'rgba(220,38,38,0.22)' }

const messageStyle: CSSProperties = {
  padding: '9px 12px',
  borderRadius: '12px',
  background: 'rgba(185,68,79,0.18)',
  border: '1px solid rgba(185,68,79,0.28)',
  color: '#f3dede',
  fontSize: '12px',
}

const tableWrapperStyle: CSSProperties = { width: '100%', overflowX: 'hidden', border: '1px solid rgba(255,255,255,0.10)', borderRadius: '15px' }
const tableStyle: CSSProperties = { width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse' }
const thStyle: CSSProperties = { textAlign: 'left', padding: '8px 6px', background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: '10.5px', lineHeight: 1.15, whiteSpace: 'normal' }
const tdStyle: CSSProperties = { padding: '8px 6px', borderTop: '1px solid rgba(255,255,255,0.08)', verticalAlign: 'top', fontSize: '10.5px', lineHeight: 1.2, whiteSpace: 'pre-line', wordBreak: 'break-word' }
const disabledRowStyle: CSSProperties = { opacity: 0.62, background: 'rgba(255,255,255,0.025)' }

const userNameStyle: CSSProperties = { display: 'block', color: '#fff', fontSize: '11.5px', lineHeight: 1.15 }
const emailStyle: CSSProperties = { display: 'block', marginTop: '3px', color: '#a7b0c0', fontSize: '9px', lineHeight: 1.15, wordBreak: 'break-word' }
const phoneStyle: CSSProperties = { display: 'block', marginTop: '4px', color: '#e5e7eb', fontSize: '10px', lineHeight: 1.15 }
const disabledBadgeStyle: CSSProperties = { display: 'inline-flex', marginTop: '5px', padding: '3px 6px', borderRadius: '999px', color: '#fecaca', border: '1px solid rgba(220,38,38,0.35)', background: 'rgba(220,38,38,0.12)', fontSize: '9px', fontWeight: 900 }

const selectStackStyle: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr', gap: '5px' }
const selectStyle: CSSProperties = { width: '100%', minWidth: 0, borderRadius: '9px', padding: '6px 4px', border: '1px solid rgba(255,255,255,0.14)', background: '#0f172a', color: '#fff', fontSize: '10px', fontWeight: 800 }
const actionsStyle: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '4px' }
const smallButtonStyle: CSSProperties = { border: '1px solid rgba(255,255,255,0.14)', background: 'rgba(255,255,255,0.08)', color: '#fff', borderRadius: '8px', padding: '5px 3px', cursor: 'pointer', fontWeight: 850, fontSize: '9.5px', lineHeight: 1, minWidth: 0 }
const warningButtonStyle: CSSProperties = { ...smallButtonStyle, border: '1px solid rgba(245,158,11,0.55)', background: 'rgba(245,158,11,0.16)' }
const dangerButtonStyle: CSSProperties = { ...smallButtonStyle, border: '1px solid rgba(220,38,38,0.6)', background: 'rgba(220,38,38,0.22)' }

export default AdminAccessiUtenti
