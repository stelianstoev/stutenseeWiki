export interface Neighbor {
  id: string
  display_name: string
  created_at: string
}

export interface ArticleCategoryJoin {
  category: Category
}

export interface Article {
  id: string
  title: string
  slug: string
  content: string
  created_by: string
  created_at: string
  updated_at: string
  categories?: ArticleCategoryJoin[]
  author?: Neighbor
}

export interface ArticleVersion {
  id: string
  article_id: string
  title: string
  content: string
  created_by: string
  created_at: string
  author?: Neighbor
}

export interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
  children?: Category[]
}
