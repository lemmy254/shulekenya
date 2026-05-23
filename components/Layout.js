import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function Layout({ children }) {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data?.user || null))
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <>
      <nav className="nav">
        <div className="nav-inner">
          <Link href="/" className="logo">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect width="28" height="28" rx="6" fill="#0B6E4F"/>
              <path d="M7 20V10l7-4 7 4v10" stroke="#fff" strokeWidth="2" fill="none"/>
              <rect x="11" y="14" width="6" height="6" rx="1" stroke="#fff" strokeWidth="1.5" fill="none"/>
              <path d="M14 8v3" stroke="#E85D04" strokeWidth="2"/>
            </svg>
            Shule<span>Kenya</span>
          </Link>

          <button className="nav-mobile-toggle" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? '✕' : '☰'}
          </button>

          <div className="nav-links" style={menuOpen ? { display: 'flex', flexDirection: 'column', position: 'absolute', top: 64, left: 0, right: 0, background: '#fff', padding: 24, borderBottom: '1px solid var(--border)', zIndex: 99 } : {}}>
            <Link href="/browse">Browse Schools</Link>
            <Link href="/compare">Compare</Link>
            <Link href="/admissions">Admissions</Link>
            {user ? (
              <>
                <Link href="/dashboard" className="btn btn-outline" style={{ padding: '8px 16px' }}>Dashboard</Link>
                <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Log out</button>
              </>
            ) : (
              <>
                <Link href="/register" className="btn btn-outline" style={{ padding: '8px 16px' }}>List Your School</Link>
                <Link href="/login" className="btn btn-primary" style={{ padding: '8px 16px' }}>School Login</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main>{children}</main>

      <footer className="footer">
        <div className="footer-inner">
          <div>
            <Link href="/" className="logo" style={{ color: '#fff', marginBottom: 12, display: 'flex' }}>
              Shule<span>Kenya</span>
            </Link>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
              Helping Kenyan families find the right school since 2026. All 47 counties covered.
            </p>
          </div>
          <div>
            <h4>For Parents</h4>
            <ul className="footer-links">
              <li><Link href="/browse">Browse Schools</Link></li>
              <li><Link href="/compare">Compare Schools</Link></li>
              <li><Link href="/admissions">Admission Guide</Link></li>
            </ul>
          </div>
          <div>
            <h4>For Schools</h4>
            <ul className="footer-links">
              <li><Link href="/register">Register School</Link></li>
              <li><Link href="/dashboard">School Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul className="footer-links">
              <li><Link href="/about">About Us</Link></li>
              <li><Link href="/contact">Contact</Link></li>
              <li><Link href="/privacy">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          &copy; {new Date().getFullYear()} ShuleKenya. All rights reserved.
        </div>
      </footer>
    </>
  )
}
