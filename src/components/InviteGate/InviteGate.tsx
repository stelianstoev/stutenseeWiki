import { useState } from 'react'

interface InviteGateProps {
  onVerified: () => void
}

export function InviteGate({ onVerified }: InviteGateProps) {
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')

  const correctCode = import.meta.env.VITE_INVITE_CODE

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (inviteCode === correctCode) {
      onVerified()
    } else {
      setError('Wrong invite code. Try again.')
    }
  }

  return (
    <div className="invite-gate">
      <div className="invite-card">
        <h1>Stutensee Wiki</h1>
        <p className="subtitle">Knowledge base for our Reihenhaus</p>

        {error && <p className="error">{error}</p>}

        <form onSubmit={handleSubmit}>
          <label htmlFor="invite-code">Enter invite code</label>
          <input
            id="invite-code"
            type="password"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Invite code"
            autoFocus
          />
          <button type="submit">Enter</button>
        </form>
      </div>
    </div>
  )
}
