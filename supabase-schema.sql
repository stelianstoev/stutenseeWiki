-- Stutensee Wiki: Supabase Schema

-- 1. Profiles (extends auth.users)
CREATE TABLE neighbors (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Articles
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  created_by UUID NOT NULL REFERENCES neighbors(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_articles_slug ON articles(slug);
CREATE INDEX idx_articles_created_at ON articles(created_at DESC);

-- 3. Article versions (snapshots on every update)
CREATE TABLE article_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES neighbors(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_article_versions_article ON article_versions(article_id, created_at DESC);

-- 4. Categories (hierarchical via parent_id)
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES neighbors(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);

-- 5. Article-Category junction
CREATE TABLE article_categories (
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, category_id)
);

CREATE INDEX idx_article_categories_category ON article_categories(category_id);

-- Storage bucket for photos
-- Run: supabase storage create article-photos

-- Enable RLS
ALTER TABLE neighbors ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;

-- RLS: authenticated users can read everything
CREATE POLICY "read_all" ON neighbors FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "read_all" ON articles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "read_all" ON article_versions FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "read_all" ON categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "read_all" ON article_categories FOR SELECT USING (auth.role() = 'authenticated');

-- RLS: authenticated users can insert/update their own
CREATE POLICY "insert_own" ON neighbors FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "insert_own" ON articles FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "insert_own" ON article_versions FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "insert_own" ON categories FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "insert_own" ON article_categories FOR INSERT WITH CHECK (auth.uid() IN (
  SELECT created_by FROM articles WHERE id = article_id
));

CREATE POLICY "update_own" ON articles FOR UPDATE USING (auth.uid() = created_by);

-- Storage bucket RLS
CREATE POLICY "read_photos" ON storage.objects FOR SELECT USING (bucket_id = 'article-photos');
CREATE POLICY "insert_photos" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'article-photos' AND auth.role() = 'authenticated'
);

-- Version trigger: snapshots on article update
CREATE OR REPLACE FUNCTION save_article_version()
RETURNS trigger AS $$
BEGIN
  INSERT INTO article_versions (article_id, title, content, created_by)
  VALUES (OLD.id, OLD.title, OLD.content, OLD.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_save_version
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION save_article_version();
