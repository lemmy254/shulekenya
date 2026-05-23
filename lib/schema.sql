-- ============================================
-- SHULEKENYA DATABASE SCHEMA
-- Run this in Supabase SQL Editor (one time)
-- ============================================

-- 1. SCHOOLS TABLE (the core listing)
CREATE TABLE schools (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Owner (links to Supabase Auth user)
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- P1: Required fields (parents bounce without these)
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  county TEXT NOT NULL,
  sub_county TEXT,
  area TEXT,
  school_type TEXT NOT NULL CHECK (school_type IN ('Public', 'Private', 'International', 'Religious')),
  curriculum TEXT[] NOT NULL DEFAULT '{}',
  levels TEXT[] NOT NULL DEFAULT '{}',
  boarding TEXT NOT NULL DEFAULT 'Day' CHECK (boarding IN ('Day', 'Boarding', 'Day & Boarding')),
  gender TEXT NOT NULL DEFAULT 'Mixed' CHECK (gender IN ('Mixed', 'Boys', 'Girls')),
  phone TEXT,
  email TEXT,
  whatsapp TEXT,
  website TEXT,

  -- P2: High impact (what parents compare on)
  about TEXT,
  year_established INT,
  total_students INT,
  class_size_avg INT,
  teacher_student_ratio TEXT,
  has_transport BOOLEAN DEFAULT FALSE,
  transport_areas TEXT,
  transport_cost_per_term INT,
  cbc_pathways TEXT[] DEFAULT '{}',
  academic_results TEXT,
  admission_status TEXT DEFAULT 'Open' CHECK (admission_status IN ('Open', 'Closed', 'Waitlist')),
  admission_open_date DATE,
  admission_close_date DATE,
  admission_requirements TEXT,
  application_fee INT,
  entrance_exam_date DATE,

  -- P3: Trust builders
  facilities TEXT[] DEFAULT '{}',
  extracurriculars TEXT[] DEFAULT '{}',
  meal_program TEXT CHECK (meal_program IN ('Included', 'Extra Cost', 'Pack Own', 'None')),
  meal_cost_per_term INT,
  language_of_instruction TEXT[] DEFAULT '{English}',
  religious_affiliation TEXT,
  special_needs_support BOOLEAN DEFAULT FALSE,
  special_needs_details TEXT,
  teacher_qualifications TEXT,
  knec_center_number TEXT,
  kicd_registration TEXT,
  security_features TEXT[] DEFAULT '{}',

  -- P4: Differentiators
  university_placement TEXT,
  scholarship_info TEXT,
  payment_plans TEXT,
  after_school_program BOOLEAN DEFAULT FALSE,
  after_school_details TEXT,
  boarding_details TEXT,
  technology_features TEXT[] DEFAULT '{}',
  parent_communication TEXT[] DEFAULT '{}',

  -- Photos (stored as Supabase Storage paths)
  cover_photo TEXT,
  photos TEXT[] DEFAULT '{}',

  -- Location
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,

  -- Status
  is_verified BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  is_published BOOLEAN DEFAULT FALSE,
  profile_completeness INT DEFAULT 0
);

-- 2. FEE STRUCTURE (one row per level per school)
CREATE TABLE school_fees (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  level TEXT NOT NULL,
  tuition_per_term INT,
  boarding_per_term INT,
  lunch_per_term INT,
  transport_per_term INT,
  other_fees INT,
  other_fees_description TEXT,
  sort_order INT DEFAULT 0
);

-- 3. REVIEWS (from parents)
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT FALSE,
  is_parent BOOLEAN DEFAULT TRUE
);

-- 4. ENQUIRIES (parents contacting schools)
CREATE TABLE enquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
  parent_name TEXT NOT NULL,
  parent_email TEXT,
  parent_phone TEXT NOT NULL,
  child_age INT,
  child_current_grade TEXT,
  message TEXT,
  is_read BOOLEAN DEFAULT FALSE
);

-- ============================================
-- INDEXES for fast search
-- ============================================
CREATE INDEX idx_schools_county ON schools(county);
CREATE INDEX idx_schools_type ON schools(school_type);
CREATE INDEX idx_schools_boarding ON schools(boarding);
CREATE INDEX idx_schools_published ON schools(is_published);
CREATE INDEX idx_schools_slug ON schools(slug);
CREATE INDEX idx_schools_owner ON schools(owner_id);
CREATE INDEX idx_reviews_school ON reviews(school_id);
CREATE INDEX idx_fees_school ON school_fees(school_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- Controls who can read/write what
-- ============================================

-- Enable RLS on all tables
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;

-- Schools: anyone can read published schools, owners can edit their own
CREATE POLICY "Public can view published schools"
  ON schools FOR SELECT
  USING (is_published = true);

CREATE POLICY "Owners can view their own schools"
  ON schools FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can insert their schools"
  ON schools FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their schools"
  ON schools FOR UPDATE
  USING (auth.uid() = owner_id);

-- Fees: anyone can read, school owners can edit
CREATE POLICY "Public can view fees"
  ON school_fees FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM schools WHERE schools.id = school_fees.school_id AND schools.is_published = true
  ));

CREATE POLICY "Owners can manage fees"
  ON school_fees FOR ALL
  USING (EXISTS (
    SELECT 1 FROM schools WHERE schools.id = school_fees.school_id AND schools.owner_id = auth.uid()
  ));

-- Reviews: anyone can read approved reviews, anyone can submit
CREATE POLICY "Public can view approved reviews"
  ON reviews FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Anyone can submit reviews"
  ON reviews FOR INSERT
  WITH CHECK (true);

-- Enquiries: school owners can read their enquiries, anyone can submit
CREATE POLICY "Owners can view enquiries"
  ON enquiries FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM schools WHERE schools.id = enquiries.school_id AND schools.owner_id = auth.uid()
  ));

CREATE POLICY "Anyone can submit enquiries"
  ON enquiries FOR INSERT
  WITH CHECK (true);

-- ============================================
-- STORAGE BUCKET for school photos
-- ============================================
-- Run this separately in SQL Editor:
INSERT INTO storage.buckets (id, name, public) VALUES ('school-photos', 'school-photos', true);

CREATE POLICY "Anyone can view school photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'school-photos');

CREATE POLICY "Authenticated users can upload photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'school-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own photos"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'school-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'school-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================
-- HELPER: Auto-generate slug from name
-- ============================================
CREATE OR REPLACE FUNCTION generate_school_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug = LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    -- Handle duplicates by appending a random suffix
    IF EXISTS (SELECT 1 FROM schools WHERE slug = NEW.slug AND id != NEW.id) THEN
      NEW.slug = NEW.slug || '-' || SUBSTR(MD5(RANDOM()::TEXT), 1, 4);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_school_slug
  BEFORE INSERT OR UPDATE ON schools
  FOR EACH ROW
  EXECUTE FUNCTION generate_school_slug();

-- ============================================
-- HELPER: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON schools
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- VIEW: Schools with average rating and review count
-- ============================================
CREATE OR REPLACE VIEW schools_with_ratings AS
SELECT
  s.*,
  COALESCE(r.avg_rating, 0) as avg_rating,
  COALESCE(r.review_count, 0) as review_count
FROM schools s
LEFT JOIN (
  SELECT
    school_id,
    ROUND(AVG(rating)::numeric, 1) as avg_rating,
    COUNT(*) as review_count
  FROM reviews
  WHERE is_approved = true
  GROUP BY school_id
) r ON s.id = r.school_id;
