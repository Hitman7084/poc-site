import { supabaseServer } from './supabase/server'

/**
 * Generate a signed upload URL for Supabase Storage
 * @param bucket - Storage bucket name
 * @param path - File path within bucket
 * @returns Signed upload URL
 */
export async function generateUploadUrl(bucket: string, path: string) {
  try {
    const { data, error } = await supabaseServer.storage
      .from(bucket)
      .createSignedUploadUrl(path)

    if (error) {
      throw new Error(`Failed to generate upload URL: ${error.message}`)
    }

    return data
  } catch (error) {
    console.error('Upload URL generation error:', error)
    throw error
  }
}

/**
 * Get public URL for an uploaded file
 * @param bucket - Storage bucket name
 * @param path - File path within bucket
 * @returns Public file URL
 */
export function getPublicUrl(bucket: string, path: string): string {
  const { data } = supabaseServer.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

/**
 * Delete a file from Supabase Storage
 * @param bucket - Storage bucket name
 * @param path - File path within bucket
 */
export async function deleteFile(bucket: string, path: string) {
  try {
    const { error } = await supabaseServer.storage.from(bucket).remove([path])

    if (error) {
      throw new Error(`Failed to delete file: ${error.message}`)
    }

    return true
  } catch (error) {
    console.error('File deletion error:', error)
    return false
  }
}

/**
 * Extract file path from Supabase URL
 * @param url - Full Supabase storage URL
 * @param bucket - Bucket name
 * @returns File path
 */
export function extractFilePath(url: string, bucket: string): string | null {
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split(`/object/public/${bucket}/`)
    return pathParts[1] || null
  } catch {
    return null
  }
}
