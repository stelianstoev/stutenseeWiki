import { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

export function InviteGate() {
  const { signIn } = useAuth()
  const [step, setStep] = useState<'name' | 'code'>('name')
  const [displayName, setDisplayName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const correctCode = import.meta.env.VITE_INVITE_CODE

  async function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) {
      setError('Please enter your name.')
      return
    }
    setBusy(true)
    setError('')

    const trimmed = displayName.trim()

    const { data: existing } = await supabase
      .from('neighbors')
      .select('id')
      .eq('display_name', trimmed)
      .maybeSingle()

    if (existing) {
      const err = await signIn(trimmed)
      if (err) setError(err)
      return
    }

    setBusy(false)
    setStep('code')
  }

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (inviteCode !== correctCode) {
      setError('Wrong invite code. Try again.')
      return
    }
    setBusy(true)
    const err = await signIn(displayName)
    if (err) setError(err)
    setBusy(false)
  }

  return (
    <div className="invite-gate">
      <div className="invite-card">
        <h1>Stutensee Wiki</h1>
        <p className="subtitle">Knowledge base for our Reihenhaus</p>

        {error && <p className="error">{error}</p>}

        {step === 'name' ? (
          <form onSubmit={handleNameSubmit}>
            <label htmlFor="display-name">What's your name?</label>
            <input
              id="display-name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Stelian"
              autoFocus
            />
            <button type="submit" disabled={busy}>
              {busy ? 'Looking up...' : 'Continue'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCodeSubmit}>
            <label htmlFor="invite-code">
              New neighbor! Enter the invite code
            </label>
            <input
              id="invite-code"
              type="password"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Invite code"
              autoFocus
            />
            <button type="submit" disabled={busy}>
              {busy ? 'Joining...' : 'Join'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
