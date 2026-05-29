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

async function removeFromStorage(path: string) {
  const { error } = await supabase.storage.from('article-photos').remove([path])
  if (error) console.error('Failed to delete image from storage:', path, error.message)
}

export async function deleteUnusedImages(articleId: string, content: string) {
  const pathsInContent = extractImagePaths(content)
  const trackedPaths = new Set<string>()
  const deletedHashes = new Set<string>()

  const { data: images } = await supabase
    .from('article_images')
    .select('storage_path, hash')
    .eq('article_id', articleId)

  if (images) {
    for (const img of images) {
      if (deletedHashes.has(img.hash)) continue
      const { data: refs } = await supabase
        .from('article_images')
        .select('id')
        .eq('hash', img.hash)
        .neq('article_id', articleId)
        .limit(1)

      if (!refs || refs.length === 0) {
        await removeFromStorage(img.storage_path)
        deletedHashes.add(img.hash)
      }
      trackedPaths.add(img.storage_path)
    }
  }

  for (const path of pathsInContent) {
    if (!trackedPaths.has(path)) {
      await removeFromStorage(path)
    }
  }
}
