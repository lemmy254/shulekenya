import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { supabase, getPhotoUrl } from '../lib/supabase'
import { counties, schoolTypes, curricula, boardingOptions, genderOptions, facilityOptions, extracurriculars as extraOptions } from '../lib/counties'

export default function Dashboard() {
  const router = useRouter()
  const fileInputRef = useRef(null)
  const coverInputRef = useRef(null)
  const [user, setUser] = useState(null)
  const [school, setSchool] = useState(null)
  const [fees, setFees] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [reviews, setReviews] = useState([])
  const [activeTab, setActiveTab] = useState('profile')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [uploading, setUploading] = useState(false)
  const [noSchool, setNoSchool] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newSchool, setNewSchool] = useState({
    name: '', county: '', area: '', school_type: '', curriculum: [], boarding: 'Day', gender: 'Mixed', phone: ''
  })

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    setUser(user)

    // Load school
    const { data: schools } = await supabase
      .from('schools')
      .select('*')
      .eq('owner_id', user.id)
      .limit(1)

    if (schools?.length > 0) {
      setSchool(schools[0])
      loadSchoolData(schools[0].id)
    } else {
      // Check if school info was saved during registration (before email confirm)
      try {
        const pending = localStorage.getItem('pendingSchool')
        if (pending) {
          const schoolData = JSON.parse(pending)
          const { data, error } = await supabase.from('schools').insert({
            owner_id: user.id,
            ...schoolData,
            is_published: false,
          }).select().single()
          if (!error && data) {
            localStorage.removeItem('pendingSchool')
            setSchool(data)
            loadSchoolData(data.id)
            return
          }
        }
      } catch (e) { /* ignore parse errors */ }
      setNoSchool(true)
    }
  }

  async function createSchoolNow(e) {
    e.preventDefault()
    setCreating(true)
    const { data, error } = await supabase.from('schools').insert({
      owner_id: user.id,
      ...newSchool,
      email: user.email,
      is_published: false,
    }).select().single()
    if (!error && data) {
      setSchool(data)
      setNoSchool(false)
      loadSchoolData(data.id)
    }
    setCreating(false)
  }

  async function loadSchoolData(schoolId) {
    const [feesRes, enquiriesRes, reviewsRes] = await Promise.all([
      supabase.from('school_fees').select('*').eq('school_id', schoolId).order('sort_order'),
      supabase.from('enquiries').select('*').eq('school_id', schoolId).order('created_at', { ascending: false }).limit(20),
      supabase.from('reviews').select('*').eq('school_id', schoolId).order('created_at', { ascending: false }),
    ])
    setFees(feesRes.data || [])
    setEnquiries(enquiriesRes.data || [])
    setReviews(reviewsRes.data || [])
  }

  async function saveProfile() {
    setSaving(true)
    const { error } = await supabase
      .from('schools')
      .update(school)
      .eq('id', school.id)
    setSaving(false)
    setMsg(error ? error.message : 'Saved successfully!')
    setTimeout(() => setMsg(''), 3000)
  }

  async function saveFees() {
    setSaving(true)
    // Delete existing and re-insert
    await supabase.from('school_fees').delete().eq('school_id', school.id)
    if (fees.length > 0) {
      await supabase.from('school_fees').insert(
        fees.map((f, i) => ({ ...f, school_id: school.id, sort_order: i, id: undefined }))
      )
    }
    setSaving(false)
    setMsg('Fees saved!')
    setTimeout(() => setMsg(''), 3000)
  }

  async function submitForReview() {
    const { error } = await supabase
      .from('schools')
      .update({ review_status: 'pending_review' })
      .eq('id', school.id)
    if (!error) {
      setSchool({ ...school, review_status: 'pending_review' })
      setMsg('Your school has been submitted for review! The admin will review it shortly and you will be notified once approved.')
    }
    setTimeout(() => setMsg(''), 6000)
  }

  // PHOTO UPLOADS
  async function uploadCoverPhoto(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const path = `${user.id}/cover-${Date.now()}.${file.name.split('.').pop()}`
    const { error } = await supabase.storage.from('school-photos').upload(path, file)
    if (!error) {
      setSchool({ ...school, cover_photo: path })
      await supabase.from('schools').update({ cover_photo: path }).eq('id', school.id)
    }
    setUploading(false)
  }

  async function uploadPhotos(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    const newPaths = [...(school.photos || [])]
    for (const file of files) {
      const path = `${user.id}/photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${file.name.split('.').pop()}`
      const { error } = await supabase.storage.from('school-photos').upload(path, file)
      if (!error) newPaths.push(path)
    }
    setSchool({ ...school, photos: newPaths })
    await supabase.from('schools').update({ photos: newPaths }).eq('id', school.id)
    setUploading(false)
  }

  async function deletePhoto(path) {
    await supabase.storage.from('school-photos').remove([path])
    const updated = (school.photos || []).filter(p => p !== path)
    setSchool({ ...school, photos: updated })
    await supabase.from('schools').update({ photos: updated }).eq('id', school.id)
  }

  function updateField(field, value) {
    setSchool({ ...school, [field]: value })
  }

  function toggleArray(field, item) {
    const arr = school[field] || []
    updateField(field, arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item])
  }

  function addFeeRow() {
    setFees([...fees, { level: '', tuition_per_term: '', boarding_per_term: '', lunch_per_term: '', transport_per_term: '' }])
  }

  function updateFee(index, field, value) {
    const updated = [...fees]
    updated[index] = { ...updated[index], [field]: field === 'level' ? value : (parseInt(value) || null) }
    setFees(updated)
  }

  function removeFee(index) {
    setFees(fees.filter((_, i) => i !== index))
  }

  if (!school && !noSchool) return <div className="loading" style={{ minHeight: '50vh' }}>Loading dashboard...</div>

  if (noSchool) return (
    <>
      <Head><title>Complete Registration | ShuleKenya</title></Head>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px' }}>
        <div className="detail-section">
          <h3>Complete Your School Registration</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            Your account is verified. Now add your school details to get started.
          </p>
          <form onSubmit={createSchoolNow}>
            <div className="form-group"><label>School Name *</label>
              <input required value={newSchool.name} onChange={e => setNewSchool({...newSchool, name: e.target.value})} placeholder="e.g. Greenfield Academy" />
            </div>
            <div className="form-row">
              <div className="form-group"><label>County *</label>
                <select required value={newSchool.county} onChange={e => setNewSchool({...newSchool, county: e.target.value})}>
                  <option value="">Select county</option>
                  {counties.sort((a,b)=>a.name.localeCompare(b.name)).map(c => <option key={c.slug} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Area / Town *</label>
                <input required value={newSchool.area} onChange={e => setNewSchool({...newSchool, area: e.target.value})} placeholder="e.g. Westlands" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>School Type *</label>
                <select required value={newSchool.school_type} onChange={e => setNewSchool({...newSchool, school_type: e.target.value})}>
                  <option value="">Select</option>
                  {schoolTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Phone *</label>
                <input required value={newSchool.phone} onChange={e => setNewSchool({...newSchool, phone: e.target.value})} placeholder="+254 7XX XXX XXX" />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-full" disabled={creating}>
              {creating ? 'Creating...' : 'Create School & Continue'}
            </button>
          </form>
        </div>
      </div>
    </>
  )

  const unreadEnquiries = enquiries.filter(e => !e.is_read).length

  return (
    <>
      <Head><title>Dashboard - {school.name} | ShuleKenya</title></Head>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 700 }}>School Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)' }}>{school.name} â {school.county}</p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {school.review_status === 'approved' && school.is_published && (
              <span style={{ background: '#dcfce7', color: '#166534', padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600 }}>Live</span>
            )}
            {school.review_status === 'pending_review' && (
              <span style={{ background: '#fef3c7', color: '#92400e', padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600 }}>Under Review</span>
            )}
            {school.review_status === 'rejected' && (
              <span style={{ background: '#fee2e2', color: '#991b1b', padding: '6px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 600 }}>Changes Requested</span>
            )}
            {(!school.review_status || school.review_status === 'draft' || school.review_status === 'rejected') && (
              <button className="btn btn-primary" onClick={submitForReview}>
                {school.review_status === 'rejected' ? 'Resubmit for Review' : 'Submit for Review'}
              </button>
            )}
            {school.is_published && school.slug && (
              <a href={`/school/${school.slug}`} target="_blank" rel="noreferrer" className="btn btn-outline">
                View Public Profile
              </a>
            )}
          </div>
        </div>

        {/* Status banner */}
        {(!school.review_status || school.review_status === 'draft') && (
          <div style={{ background: 'var(--accent-light)', border: '1px solid #FFCC80', borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <strong>Your school is not published yet.</strong> Complete your profile and click &quot;Submit for Review&quot; to request admin approval.
          </div>
        )}
        {school.review_status === 'pending_review' && (
          <div style={{ background: '#EFF6FF', border: '1px solid #93C5FD', borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <strong>Your school is under review.</strong> The ShuleKenya admin will review your listing and approve it shortly. You can still edit your profile while waiting.
          </div>
        )}
        {school.review_status === 'rejected' && (
          <div style={{ background: '#fee2e2', border: '1px solid #FCA5A5', borderRadius: 8, padding: 16, marginBottom: 24 }}>
            <strong>Changes requested by admin:</strong> {school.review_notes || 'Please review your listing and resubmit.'}
            <br /><span style={{ fontSize: '0.85rem', marginTop: 4, display: 'inline-block' }}>Make the requested changes and click &quot;Resubmit for Review&quot;.</span>
          </div>
        )}

        {msg && (
          <div style={{ background: 'var(--primary-light)', border: '1px solid var(--primary)', borderRadius: 8, padding: 16, marginBottom: 24, color: 'var(--primary)', fontWeight: 600 }}>
            {msg}
          </div>
        )}

        {/* Stats */}
        <div className="dash-stats">
          <div className="dash-stat"><div className="number">{enquiries.length}</div><div className="label">Enquiries</div></div>
          <div className="dash-stat"><div className="number">{unreadEnquiries}</div><div className="label">Unread</div></div>
          <div className="dash-stat"><div className="number">{school.avg_rating || 'â'}</div><div className="label">Avg Rating</div></div>
          <div className="dash-stat"><div className="number">{reviews.length}</div><div className="label">Reviews</div></div>
        </div>

        {/* Tabs */}
        <div className="tab-bar">
          {['profile', 'fees', 'facilities', 'admissions', 'photos', 'enquiries'].map(tab => (
            <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === 'enquiries' && unreadEnquiries > 0 && (
                <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: 10, padding: '2px 8px', fontSize: '0.75rem', marginLeft: 6 }}>{unreadEnquiries}</span>
              )}
            </button>
          ))}
        </div>

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="detail-section">
            <h3>Basic Information</h3>
            <div className="form-group"><label>School Name</label><input value={school.name || ''} onChange={e => updateField('name', e.target.value)} /></div>
            <div className="form-group"><label>About / Description</label><textarea value={school.about || ''} onChange={e => updateField('about', e.target.value)} placeholder="Describe your school, its mission, what makes it special..." /></div>
            <div className="form-row">
              <div className="form-group"><label>School Type</label>
                <select value={school.school_type} onChange={e => updateField('school_type', e.target.value)}>
                  {schoolTypes.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Gender</label>
                <select value={school.gender} onChange={e => updateField('gender', e.target.value)}>
                  {genderOptions.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Curriculum</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {curricula.map(c => (
                  <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer', background: (school.curriculum || []).includes(c) ? 'var(--primary-light)' : '#fff', fontSize: '0.9rem' }}>
                    <input type="checkbox" checked={(school.curriculum || []).includes(c)} onChange={() => toggleArray('curriculum', c)} style={{ display: 'none' }} />
                    {c}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>County</label>
                <select value={school.county} onChange={e => updateField('county', e.target.value)}>
                  {counties.sort((a,b)=>a.name.localeCompare(b.name)).map(c => <option key={c.slug} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Area / Town</label><input value={school.area || ''} onChange={e => updateField('area', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Year Established</label><input type="number" value={school.year_established || ''} onChange={e => updateField('year_established', parseInt(e.target.value) || null)} /></div>
              <div className="form-group"><label>Total Students</label><input type="number" value={school.total_students || ''} onChange={e => updateField('total_students', parseInt(e.target.value) || null)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Avg Class Size</label><input type="number" value={school.class_size_avg || ''} onChange={e => updateField('class_size_avg', parseInt(e.target.value) || null)} /></div>
              <div className="form-group"><label>Teacher:Student Ratio</label><input value={school.teacher_student_ratio || ''} onChange={e => updateField('teacher_student_ratio', e.target.value)} placeholder="e.g. 1:25" /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Phone</label><input value={school.phone || ''} onChange={e => updateField('phone', e.target.value)} /></div>
              <div className="form-group"><label>WhatsApp</label><input value={school.whatsapp || ''} onChange={e => updateField('whatsapp', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Email</label><input value={school.email || ''} onChange={e => updateField('email', e.target.value)} /></div>
              <div className="form-group"><label>Website</label><input value={school.website || ''} onChange={e => updateField('website', e.target.value)} /></div>
            </div>
            <div className="form-group">
              <label>Transport</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input type="checkbox" checked={school.has_transport || false} onChange={e => updateField('has_transport', e.target.checked)} /> School bus available
                </label>
              </div>
              {school.has_transport && (
                <div className="form-row" style={{ marginTop: 12 }}>
                  <div className="form-group"><label>Transport Cost (KES/term)</label><input type="number" value={school.transport_cost_per_term || ''} onChange={e => updateField('transport_cost_per_term', parseInt(e.target.value) || null)} /></div>
                  <div className="form-group"><label>Areas Served</label><input value={school.transport_areas || ''} onChange={e => updateField('transport_areas', e.target.value)} placeholder="e.g. Westlands, Kilimani, Karen" /></div>
                </div>
              )}
            </div>
            <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        )}

        {/* FEES TAB */}
        {activeTab === 'fees' && (
          <div className="detail-section">
            <h3>Fee Structure</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Add fees for each level. This is the #1 thing parents search for.</p>
            {fees.map((f, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 12, marginBottom: 12, alignItems: 'end' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  {i === 0 && <label>Level</label>}
                  <input value={f.level || ''} onChange={e => updateFee(i, 'level', e.target.value)} placeholder="e.g. Lower Primary" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  {i === 0 && <label>Tuition/Term</label>}
                  <input type="number" value={f.tuition_per_term || ''} onChange={e => updateFee(i, 'tuition_per_term', e.target.value)} placeholder="KES" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  {i === 0 && <label>Boarding/Term</label>}
                  <input type="number" value={f.boarding_per_term || ''} onChange={e => updateFee(i, 'boarding_per_term', e.target.value)} placeholder="KES" />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  {i === 0 && <label>Lunch/Term</label>}
                  <input type="number" value={f.lunch_per_term || ''} onChange={e => updateFee(i, 'lunch_per_term', e.target.value)} placeholder="KES" />
                </div>
                <button onClick={() => removeFee(i)} style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '1.2rem', padding: 8 }}>&#x2716;</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button className="btn btn-outline" onClick={addFeeRow}>+ Add Level</button>
              <button className="btn btn-primary" onClick={saveFees} disabled={saving}>{saving ? 'Saving...' : 'Save Fees'}</button>
            </div>
          </div>
        )}

        {/* FACILITIES TAB */}
        {activeTab === 'facilities' && (
          <div className="detail-section">
            <h3>Facilities & Extracurriculars</h3>
            <h4 style={{ marginBottom: 12, marginTop: 8 }}>Facilities</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 24 }}>
              {facilityOptions.map(f => (
                <label key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: (school.facilities || []).includes(f) ? 'var(--primary-light)' : '#fff' }}>
                  <input type="checkbox" checked={(school.facilities || []).includes(f)} onChange={() => toggleArray('facilities', f)} style={{ accentColor: 'var(--primary)' }} /> {f}
                </label>
              ))}
            </div>
            <h4 style={{ marginBottom: 12 }}>Extracurricular Activities</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 24 }}>
              {extraOptions.map(e => (
                <label key={e} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 12, border: '1px solid var(--border)', borderRadius: 8, cursor: 'pointer', background: (school.extracurriculars || []).includes(e) ? '#EDE7F6' : '#fff' }}>
                  <input type="checkbox" checked={(school.extracurriculars || []).includes(e)} onChange={() => toggleArray('extracurriculars', e)} style={{ accentColor: '#5E35B1' }} /> {e}
                </label>
              ))}
            </div>
            <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        )}

        {/* ADMISSIONS TAB */}
        {activeTab === 'admissions' && (
          <div className="detail-section">
            <h3>Admission Settings</h3>
            <div className="form-group"><label>Admission Status</label>
              <select value={school.admission_status || 'Open'} onChange={e => updateField('admission_status', e.target.value)}>
                <option value="Open">Open for applications</option>
                <option value="Closed">Closed</option>
                <option value="Waitlist">Waitlist only</option>
              </select>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Applications Open</label><input type="date" value={school.admission_open_date || ''} onChange={e => updateField('admission_open_date', e.target.value)} /></div>
              <div className="form-group"><label>Applications Close</label><input type="date" value={school.admission_close_date || ''} onChange={e => updateField('admission_close_date', e.target.value)} /></div>
            </div>
            <div className="form-group"><label>Application Fee (KES)</label><input type="number" value={school.application_fee || ''} onChange={e => updateField('application_fee', parseInt(e.target.value) || null)} /></div>
            <div className="form-group"><label>Entrance Exam Date</label><input type="date" value={school.entrance_exam_date || ''} onChange={e => updateField('entrance_exam_date', e.target.value)} /></div>
            <div className="form-group"><label>Admission Requirements</label>
              <textarea value={school.admission_requirements || ''} onChange={e => updateField('admission_requirements', e.target.value)}
                placeholder="List required documents, assessment process, etc." />
            </div>
            <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>{saving ? 'Saving...' : 'Save Admission Info'}</button>
          </div>
        )}

        {/* PHOTOS TAB */}
        {activeTab === 'photos' && (
          <div className="detail-section">
            <h3>School Photos</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 20 }}>Good photos help parents decide. Upload images of your campus, classrooms, and facilities.</p>

            {/* Cover Photo */}
            <h4 style={{ marginBottom: 12 }}>Cover Photo</h4>
            <div style={{ marginBottom: 24 }}>
              {school.cover_photo ? (
                <div style={{ width: '100%', height: 200, borderRadius: 8, backgroundImage: `url(${getPhotoUrl(school.cover_photo)})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                  <button onClick={() => { updateField('cover_photo', null); supabase.from('schools').update({ cover_photo: null }).eq('id', school.id) }}
                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer' }}>&#x2716;</button>
                </div>
              ) : (
                <div className="upload-zone" onClick={() => coverInputRef.current?.click()}>
                  <p>Click to upload a cover photo</p>
                  <p style={{ fontSize: '0.8rem', marginTop: 4 }}>Recommended: 1200x600px</p>
                </div>
              )}
              <input ref={coverInputRef} type="file" accept="image/*" onChange={uploadCoverPhoto} style={{ display: 'none' }} />
            </div>

            {/* Gallery */}
            <h4 style={{ marginBottom: 12 }}>Photo Gallery</h4>
            <div className="photo-grid">
              {(school.photos || []).map((p, i) => (
                <div key={i} className="photo-item" style={{ backgroundImage: `url(${getPhotoUrl(p)})`, backgroundColor: 'var(--primary-light)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
                  <button className="delete-btn" onClick={() => deletePhoto(p)}>&#x2716;</button>
                </div>
              ))}
            </div>
            <div className="upload-zone" onClick={() => fileInputRef.current?.click()} style={{ marginTop: 16 }}>
              {uploading ? <p>Uploading...</p> : (
                <>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>&#x1F4F7;</div>
                  <p>Click to upload photos</p>
                  <p style={{ fontSize: '0.8rem', marginTop: 4 }}>JPG, PNG up to 5MB each</p>
                </>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={uploadPhotos} style={{ display: 'none' }} />
          </div>
        )}

        {/* ENQUIRIES TAB */}
        {activeTab === 'enquiries' && (
          <div className="detail-section">
            <h3>Parent Enquiries ({enquiries.length})</h3>
            {enquiries.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No enquiries yet. Once parents find your listing, enquiries will appear here.</p>
            ) : (
              enquiries.map(e => (
                <div key={e.id} style={{ border: '1px solid var(--border)', borderRadius: 8, padding: 16, marginBottom: 12, background: e.is_read ? '#fff' : 'var(--primary-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <strong>{e.parent_name}</strong>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {new Date(e.created_at).toLocaleDateString('en-KE')}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 8 }}>{e.message || 'No message'}</p>
                  <div style={{ fontSize: '0.85rem' }}>
                    &#x1F4DE; <a href={`tel:${e.parent_phone}`}>{e.parent_phone}</a>
                    {e.parent_email && <span style={{ marginLeft: 16 }}>&#x2709;&#xFE0F; <a href={`mailto:${e.parent_email}`}>{e.parent_email}</a></span>}
                  </div>
                  {!e.is_read && (
                    <button style={{ marginTop: 8, background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 600 }}
                      onClick={async () => {
                        await supabase.from('enquiries').update({ is_read: true }).eq('id', e.id)
                        setEnquiries(enquiries.map(en => en.id === e.id ? { ...en, is_read: true } : en))
                      }}>
                      Mark as read
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </>
  )
}
