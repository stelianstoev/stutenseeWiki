import { supabase } from './supabase'

export async function hashBlob(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function extractImagePaths(html: string): string[] {
  const paths: string[] = []
  const regex = /<img[^>]+src="([^"]+)"/g
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    const url = match[1]
    const parts = url.split('/article-photos/')
    if (parts.length === 2) {
      paths.push(parts[1])
    }
  }
  return [...new Set(paths)]
}

export async function deleteUnusedImages(articleId: string) {
  const { data: images } = await supabase
    .from('article_images')
    .select('storage_path, hash')
    .eq('article_id', articleId)

  if (!images || images.length === 0) return

  for (const img of images) {
    const { data: refs } = await supabase
      .from('article_images')
      .select('id')
      .eq('hash', img.hash)
      .neq('article_id', articleId)
      .limit(1)

    if (!refs || refs.length === 0) {
      await supabase.storage.from('article-photos').remove([img.storage_path])
    }
  }
}
