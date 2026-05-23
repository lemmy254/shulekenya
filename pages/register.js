import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { supabase } from '../lib/supabase'
import { counties, schoolTypes, curricula, boardingOptions, genderOptions } from '../lib/counties'

export default function Register() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1: account, 2: basic school info
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [account, setAccount] = useState({ email: '', password: '', confirm: '' })
  const [school, setSchool] = useState({
    name: '', county: '', sub_county: '', area: '',
    school_type: '', curriculum: [], levels: [],
    boarding: 'Day', gender: 'Mixed',
    phone: '', email: '', whatsapp: '',
  })

  async function handleCreateAccount(e) {
    e.preventDefault()
    setError('')
    if (account.password !== account.confirm) {
      setError('Passwords do not match')
      return
    }
    if (account.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setStep(2)
  }

  async function handleCreateSchool(e) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // 1. Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: account.email,
      password: account.password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // 2. Create school record
    const { error: schoolError } = await supabase.from('schools').insert({
      owner_id: authData.user.id,
      name: school.name,
      county: school.county,
      sub_county: school.sub_county,
      area: school.area,
      school_type: school.school_type,
      curriculum: school.curriculum,
      boarding: school.boarding,
      gender: school.gender,
      phone: school.phone,
      email: school.email || account.email,
      whatsapp: school.whatsapp,
      is_published: false, // Draft until they complete profile
    })

    if (schoolError) {
      setError(schoolError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard?welcome=1')
  }

  function toggleArrayItem(arr, item) {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item]
  }

  return (
    <>
      <Head><title>Register Your School | ShuleKenya</title></Head>

      <div className="hero hero-sm">
        <h1>List Your School on ShuleKenya</h1>
        <p>Create a free account and reach thousands of parents</p>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px' }}>
        {/* Progress indicator */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--primary)' }} />
          <div style={{ flex: 1, height: 4, borderRadius: 2, background: step >= 2 ? 'var(--primary)' : 'var(--border)' }} />
        </div>

        {error && (
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: 16, marginBottom: 20, color: '#DC2626' }}>
            {error}
          </div>
        )}

        {step === 1 && (
          <div className="detail-section">
            <h3>Step 1: Create Your Account</h3>
            <form onSubmit={handleCreateAccount}>
              <div className="form-group">
                <label>Email Address *</label>
                <input type="email" required placeholder="admin@yourschool.ac.ke"
                  value={account.email} onChange={e => setAccount({...account, email: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input type="password" required placeholder="At least 6 characters"
                  value={account.password} onChange={e => setAccount({...account, password: e.target.value})} />
              </div>
              <div className="form-group">
                <label>Confirm Password *</label>
                <input type="password" required placeholder="Confirm your password"
                  value={account.confirm} onChange={e => setAccount({...account, confirm: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary btn-full btn-lg">Continue</button>
            </form>
            <p style={{ textAlign: 'center', marginTop: 16, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Already have an account? <Link href="/login">Log in here</Link>
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="detail-section">
            <h3>Step 2: School Information</h3>
            <form onSubmit={handleCreateSchool}>
              <div className="form-group">
                <label>School Name *</label>
                <input required placeholder="e.g. Greenfield Academy"
                  value={school.name} onChange={e => setSchool({...school, name: e.target.value})} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>County *</label>
                  <select required value={school.county} onChange={e => setSchool({...school, county: e.target.value})}>
                    <option value="">Select county</option>
                    {counties.sort((a,b) => a.name.localeCompare(b.name)).map(c => (
                      <option key={c.slug} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Area / Town *</label>
                  <input required placeholder="e.g. Westlands"
                    value={school.area} onChange={e => setSchool({...school, area: e.target.value})} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>School Type *</label>
                  <select required value={school.school_type} onChange={e => setSchool({...school, school_type: e.target.value})}>
                    <option value="">Select</option>
                    {schoolTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>Boarding</label>
                  <select value={school.boarding} onChange={e => setSchool({...school, boarding: e.target.value})}>
                    {boardingOptions.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Curriculum (select all that apply) *</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {curricula.map(c => (
                    <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer', background: school.curriculum.includes(c) ? 'var(--primary-light)' : '#fff', fontSize: '0.9rem' }}>
                      <input type="checkbox" checked={school.curriculum.includes(c)}
                        onChange={() => setSchool({...school, curriculum: toggleArrayItem(school.curriculum, c)})}
                        style={{ display: 'none' }} />
                      {c}
                    </label>
                  ))}
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Phone *</label>
                  <input required placeholder="+254 7XX XXX XXX"
                    value={school.phone} onChange={e => setSchool({...school, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label>WhatsApp</label>
                  <input placeholder="+254 7XX XXX XXX"
                    value={school.whatsapp} onChange={e => setSchool({...school, whatsapp: e.target.value})} />
                </div>
              </div>
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? 'Creating...' : 'Create School & Go to Dashboard'}
              </button>
              <button type="button" onClick={() => setStep(1)} style={{ width: '100%', marginTop: 8, padding: 12, background: 'none', border: 'none', color: 'var(--text-secondary)' }}>
                &larr; Back
              </button>
            </form>
          </div>
        )}
      </div>
    </>
  )
}
