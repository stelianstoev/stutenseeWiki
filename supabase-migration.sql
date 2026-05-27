-- Migration: drop token-based auth, use id-based persistence instead

-- 1. Drop the token column (no longer needed)
ALTER TABLE neighbors DROP CONSTRAINT IF EXISTS neighbors_token_key;
DROP INDEX IF EXISTS idx_neighbors_token;
ALTER TABLE neighbors DROP COLUMN IF EXISTS token;

-- 2. Ensure id auto-generates for new sign-ups
ALTER TABLE neighbors ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 3. Disable RLS on all tables (invite code is the sole gate)
ALTER TABLE neighbors DISABLE ROW LEVEL SECURITY;
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE article_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE article_categories DISABLE ROW LEVEL SECURITY;

-- 4. Drop all RLS policies from the old schema
DROP POLICY IF EXISTS "read_all" ON neighbors;
DROP POLICY IF EXISTS "insert_own" ON neighbors;
DROP POLICY IF EXISTS "read_all" ON articles;
DROP POLICY IF EXISTS "insert_own" ON articles;
DROP POLICY IF EXISTS "update_own" ON articles;
DROP POLICY IF EXISTS "read_all" ON article_versions;
DROP POLICY IF EXISTS "insert_own" ON article_versions;
DROP POLICY IF EXISTS "read_all" ON categories;
DROP POLICY IF EXISTS "insert_own" ON categories;
DROP POLICY IF EXISTS "read_all" ON article_categories;
DROP POLICY IF EXISTS "insert_own" ON article_categories;
DROP POLICY IF EXISTS "read_photos" ON storage.objects;
DROP POLICY IF EXISTS "insert_photos" ON storage.objects;

-- 5. Article-Image tracking table
CREATE TABLE IF NOT EXISTS article_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_article_images_article ON article_images(article_id);
CREATE INDEX IF NOT EXISTS idx_article_images_hash ON article_images(hash);

ALTER TABLE article_images DISABLE ROW LEVEL SECURITY;

-- 6. Make the article-photos bucket public (so getPublicUrl works)
UPDATE storage.buckets SET public = true WHERE name = 'article-photos';

-- 7. Allow public access to article-photos bucket (no auth)
DROP POLICY IF EXISTS "public_read_photos" ON storage.objects;
CREATE POLICY "public_read_photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'article-photos');

DROP POLICY IF EXISTS "public_insert_photos" ON storage.objects;
CREATE POLICY "public_insert_photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'article-photos');
