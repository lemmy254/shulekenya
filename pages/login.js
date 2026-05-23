import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../lib/supabase'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <>
      <Head><title>School Login | ShuleKenya</title></Head>

      <div className="hero hero-sm">
        <h1>School Login</h1>
        <p>Access your school dashboard to manage your listing</p>
      </div>

      <div style={{ maxWidth: 440, margin: '0 auto', padding: '40px 24px' }}>
        <div className="detail-section">
          <h3>Sign In</h3>
          {error && (
            <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: 16, marginBottom: 20, color: '#DC2626' }}>
              {error}
            </div>
          )}
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@yourschool.ac.ke" />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Don&apos;t have an account? <Link href="/register">Register your school</Link>
          </p>
        </div>
      </div>
    </>
  )
}
