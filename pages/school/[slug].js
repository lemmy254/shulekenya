import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'
import { supabase, getPhotoUrl } from '../../lib/supabase'

export default function SchoolDetail() {
  const router = useRouter()
  const { slug } = router.query
  const [school, setSchool] = useState(null)
  const [fees, setFees] = useState([])
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [reviewForm, setReviewForm] = useState({ author_name: '', rating: 5, body: '' })
  const [enquiryForm, setEnquiryForm] = useState({ parent_name: '', parent_phone: '', parent_email: '', message: '' })
  const [submitMsg, setSubmitMsg] = useState('')

  useEffect(() => {
    if (slug) loadSchool()
  }, [slug])

  async function loadSchool() {
    setLoading(true)
    const { data: s } = await supabase
      .from('schools_with_ratings')
      .select('*')
      .eq('slug', slug)
      .single()

    if (!s) { setLoading(false); return }
    setSchool(s)

    const { data: f } = await supabase
      .from('school_fees')
      .select('*')
      .eq('school_id', s.id)
      .order('sort_order')
    setFees(f || [])

    const { data: r } = await supabase
      .from('reviews')
      .select('*')
      .eq('school_id', s.id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
    setReviews(r || [])

    setLoading(false)
  }

  async function submitReview(e) {
    e.preventDefault()
    const { error } = await supabase.from('reviews').insert({
      school_id: school.id,
      ...reviewForm,
    })
    if (!error) {
      setSubmitMsg('Thank you! Your review has been submitted for moderation.')
      setReviewForm({ author_name: '', rating: 5, body: '' })
    }
  }

  async function submitEnquiry(e) {
    e.preventDefault()
    const { error } = await supabase.from('enquiries').insert({
      school_id: school.id,
      ...enquiryForm,
    })
    if (!error) {
      setSubmitMsg('Your enquiry has been sent! The school will contact you shortly.')
      setEnquiryForm({ parent_name: '', parent_phone: '', parent_email: '', message: '' })
    }
  }

  if (loading) return <div className="loading" style={{ minHeight: '50vh' }}>Loading school...</div>
  if (!school) return <div className="section" style={{ textAlign: 'center' }}><h2>School not found</h2></div>

  const coverUrl = school.cover_photo ? getPhotoUrl(school.cover_photo) : null

  return (
    <>
      <Head>
        <title>{school.name} - {school.county} | ShuleKenya</title>
        <meta name="description" content={`${school.name} in ${school.area || ''} ${school.county}. ${school.curriculum?.join(', ')} curriculum. ${school.school_type} school. Fees, reviews, admission info.`} />
      </Head>

      {/* Hero */}
      <div className="detail-hero" style={coverUrl ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.7)), url(${coverUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
        <div className="detail-hero-inner">
          <div className="breadcrumb">
            <Link href="/">Home</Link> &rarr; <Link href="/browse">Schools</Link> &rarr; <Link href={`/browse?county=${school.county}`}>{school.county}</Link> &rarr; {school.name}
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: 8 }}>{school.name}</h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9, marginBottom: 16 }}>
            {school.area ? `${school.area}, ` : ''}{school.county} County, Kenya
          </p>
          <div>
            {school.curriculum?.map(c => <span key={c} className="detail-badge">{c}</span>)}
            <span className="detail-badge">{school.school_type}</span>
            <span className="detail-badge">{school.boarding}</span>
            <span className="detail-badge">{school.gender}</span>
            {school.is_verified && <span className="detail-badge" style={{ background: 'rgba(255,255,255,0.4)' }}>&#x2713; Verified</span>}
          </div>
        </div>
      </div>

      <div className="detail-content">
        {/* Main Column */}
        <div>
          {/* About */}
          {school.about && (
            <div className="detail-section">
              <h3>About</h3>
              <p style={{ lineHeight: 1.8, color: 'var(--text-secondary)' }}>{school.about}</p>
            </div>
          )}

          {/* School Info */}
          <div className="detail-section">
            <h3>School Information</h3>
            <div className="info-grid">
              <div><div className="info-label">Curriculum</div><div className="info-value">{school.curriculum?.join(', ')}</div></div>
              <div><div className="info-label">School Type</div><div className="info-value">{school.school_type}</div></div>
              {school.year_established && <div><div className="info-label">Established</div><div className="info-value">{school.year_established}</div></div>}
              {school.total_students && <div><div className="info-label">Total Students</div><div className="info-value">{school.total_students.toLocaleString()}</div></div>}
              <div><div className="info-label">Boarding</div><div className="info-value">{school.boarding}</div></div>
              <div><div className="info-label">Gender</div><div className="info-value">{school.gender}</div></div>
              {school.class_size_avg && <div><div className="info-label">Avg Class Size</div><div className="info-value">{school.class_size_avg} students</div></div>}
              {school.teacher_student_ratio && <div><div className="info-label">Teacher:Student Ratio</div><div className="info-value">{school.teacher_student_ratio}</div></div>}
              <div><div className="info-label">Language</div><div className="info-value">{school.language_of_instruction?.join(', ') || 'English'}</div></div>
              {school.has_transport && <div><div className="info-label">Transport</div><div className="info-value">Available{school.transport_cost_per_term ? ` (KES ${school.transport_cost_per_term.toLocaleString()}/term)` : ''}</div></div>}
            </div>
          </div>

          {/* Fees */}
          {fees.length > 0 && (
            <div className="detail-section">
              <h3>Fee Structure</h3>
              <table className="fee-table">
                <thead>
                  <tr>
                    <th>Level</th>
                    <th>Tuition/Term</th>
                    <th>Boarding/Term</th>
                    <th>Lunch/Term</th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map(f => (
                    <tr key={f.id}>
                      <td>{f.level}</td>
                      <td>{f.tuition_per_term ? `KES ${f.tuition_per_term.toLocaleString()}` : '—'}</td>
                      <td>{f.boarding_per_term ? `KES ${f.boarding_per_term.toLocaleString()}` : 'N/A'}</td>
                      <td>{f.lunch_per_term ? `KES ${f.lunch_per_term.toLocaleString()}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {school.payment_plans && (
                <p style={{ marginTop: 16, fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  <strong>Payment Plans:</strong> {school.payment_plans}
                </p>
              )}
            </div>
          )}

          {/* Facilities */}
          {school.facilities?.length > 0 && (
            <div className="detail-section">
              <h3>Facilities</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {school.facilities.map(f => <span key={f} className="tag tag-green">{f}</span>)}
              </div>
            </div>
          )}

          {/* Extracurriculars */}
          {school.extracurriculars?.length > 0 && (
            <div className="detail-section">
              <h3>Extracurricular Activities</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {school.extracurriculars.map(e => <span key={e} className="tag tag-purple">{e}</span>)}
              </div>
            </div>
          )}

          {/* Admissions */}
          {school.admission_requirements && (
            <div className="detail-section">
              <h3>Admission Information</h3>
              <div className="info-grid" style={{ marginBottom: 16 }}>
                <div><div className="info-label">Status</div><div className="info-value" style={{ color: school.admission_status === 'Open' ? 'var(--primary)' : 'var(--accent)' }}>{school.admission_status}</div></div>
                {school.application_fee && <div><div className="info-label">Application Fee</div><div className="info-value">KES {school.application_fee.toLocaleString()}</div></div>}
              </div>
              <h4 style={{ fontWeight: 600, marginBottom: 8 }}>Requirements</h4>
              <p style={{ whiteSpace: 'pre-line', color: 'var(--text-secondary)', lineHeight: 1.8 }}>{school.admission_requirements}</p>
            </div>
          )}

          {/* Photos */}
          {school.photos?.length > 0 && (
            <div className="detail-section">
              <h3>Photos</h3>
              <div className="photo-grid">
                {school.photos.map((p, i) => (
                  <div key={i} className="photo-item" style={{ backgroundImage: `url(${getPhotoUrl(p)})`, background: 'var(--primary-light)' }} />
                ))}
              </div>
            </div>
          )}

          {/* Reviews */}
          <div className="detail-section">
            <h3>Parent Reviews ({reviews.length})</h3>
            {reviews.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No reviews yet. Be the first to review this school!</p>
            ) : (
              reviews.map(r => (
                <div key={r.id} className="review-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <strong>{r.author_name}</strong>
                      <span style={{ color: 'var(--gold)', marginLeft: 8 }}>{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span>
                    </div>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                      {new Date(r.created_at).toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>{r.body}</p>
                </div>
              ))
            )}

            {/* Review Form */}
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <h4 style={{ marginBottom: 16 }}>Write a Review</h4>
              {submitMsg && <p style={{ color: 'var(--primary)', marginBottom: 16, fontWeight: 600 }}>{submitMsg}</p>}
              <form onSubmit={submitReview}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Your Name</label>
                    <input required value={reviewForm.author_name} onChange={e => setReviewForm({...reviewForm, author_name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Rating</label>
                    <select value={reviewForm.rating} onChange={e => setReviewForm({...reviewForm, rating: parseInt(e.target.value)})}>
                      <option value={5}>★★★★★ Excellent</option>
                      <option value={4}>★★★★☆ Very Good</option>
                      <option value={3}>★★★☆☆ Good</option>
                      <option value={2}>★★☆☆☆ Fair</option>
                      <option value={1}>★☆☆☆☆ Poor</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Your Review</label>
                  <textarea required placeholder="Share your experience..." value={reviewForm.body} onChange={e => setReviewForm({...reviewForm, body: e.target.value})} />
                </div>
                <button type="submit" className="btn btn-primary">Submit Review</button>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div>
          {/* Contact */}
          <div className="sidebar-card">
            <h4>Contact</h4>
            {school.phone && <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>&#x1F4DE; <a href={`tel:${school.phone}`}>{school.phone}</a></div>}
            {school.whatsapp && <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>&#x1F4AC; <a href={`https://wa.me/${school.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noreferrer">WhatsApp</a></div>}
            {school.email && <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}>&#x2709;&#xFE0F; <a href={`mailto:${school.email}`}>{school.email}</a></div>}
            {school.website && <div style={{ padding: '10px 0', fontSize: '0.9rem' }}>&#x1F310; <a href={school.website.startsWith('http') ? school.website : `https://${school.website}`} target="_blank" rel="noreferrer">{school.website}</a></div>}
          </div>

          {/* Enquiry Form */}
          <div className="sidebar-card">
            <h4>Send Enquiry</h4>
            <form onSubmit={submitEnquiry}>
              <div className="form-group">
                <input required placeholder="Your name" value={enquiryForm.parent_name} onChange={e => setEnquiryForm({...enquiryForm, parent_name: e.target.value})} />
              </div>
              <div className="form-group">
                <input required placeholder="Phone number" value={enquiryForm.parent_phone} onChange={e => setEnquiryForm({...enquiryForm, parent_phone: e.target.value})} />
              </div>
              <div className="form-group">
                <input placeholder="Email (optional)" value={enquiryForm.parent_email} onChange={e => setEnquiryForm({...enquiryForm, parent_email: e.target.value})} />
              </div>
              <div className="form-group">
                <textarea placeholder="Your message..." rows={3} value={enquiryForm.message} onChange={e => setEnquiryForm({...enquiryForm, message: e.target.value})} style={{ minHeight: 80 }} />
              </div>
              <button type="submit" className="btn btn-primary btn-full">Send Enquiry</button>
            </form>
          </div>

          {/* Quick Facts */}
          <div className="sidebar-card">
            <h4>Quick Facts</h4>
            {school.year_established && <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}><strong>Est.</strong> {school.year_established}</div>}
            {school.total_students && <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}><strong>Students:</strong> {school.total_students.toLocaleString()}</div>}
            {school.meal_program && <div style={{ padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.9rem' }}><strong>Meals:</strong> {school.meal_program}</div>}
            {school.special_needs_support && <div style={{ padding: '8px 0', fontSize: '0.9rem' }}><strong>Special Needs:</strong> Supported</div>}
          </div>
        </div>
      </div>
    </>
  )
}
