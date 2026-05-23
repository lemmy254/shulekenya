import Link from 'next/link'
import { getPhotoUrl } from '../lib/supabase'

export default function SchoolCard({ school, onCompareToggle, isComparing }) {
  const coverUrl = school.cover_photo ? getPhotoUrl(school.cover_photo) : null
  const fee = school.min_fee || school.tuition_per_term || 0

  return (
    <div className="card" style={{ cursor: 'pointer' }}>
      <Link href={`/school/${school.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <div
          className="school-card-img"
          style={coverUrl ? { backgroundImage: `url(${coverUrl})` } : {}}
        >
          {!coverUrl && <span className="placeholder">&#x1F3EB;</span>}
          {school.is_verified && <span className="school-badge">Verified</span>}
        </div>
        <div className="card-body">
          <div className="school-name">{school.name}</div>
          <div className="school-location">
            &#x1F4CD; {school.area ? `${school.area}, ` : ''}{school.county}
          </div>
          <div className="school-tags">
            {school.curriculum?.map(c => (
              <span key={c} className="tag tag-green">{c}</span>
            ))}
            <span className="tag tag-purple">{school.school_type}</span>
            {school.boarding !== 'Day' && (
              <span className="tag tag-yellow">Boarding</span>
            )}
          </div>
          <div className="school-meta">
            <span className="school-fee">
              {fee > 0 ? `KES ${fee.toLocaleString()}/term` : 'Contact for fees'}
            </span>
            <span className="school-rating">
              &#9733; {school.avg_rating || '—'} ({school.review_count || 0})
            </span>
          </div>
        </div>
      </Link>
      {onCompareToggle && (
        <div style={{ padding: '0 20px 16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <input
              type="checkbox"
              checked={isComparing}
              onChange={(e) => onCompareToggle(school.id, e.target.checked)}
              style={{ accentColor: 'var(--primary)' }}
            />
            Add to compare
          </label>
        </div>
      )}
    </div>
  )
}
