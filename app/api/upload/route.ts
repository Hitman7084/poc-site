import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { apiSuccess, apiError } from '@/lib/api-utils'
import { generateUploadUrl, getPublicUrl } from '@/lib/storage-utils'

// POST /api/upload - Generate signed URL for file upload to Supabase Storage
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const { filename, bucket = 'work-updates', contentType } = await request.json()

    if (!filename) {
      return apiError('Filename is required', 400)
    }

    // Generate upload URL with signed URL (expires in 1 hour)
    const uploadData = await generateUploadUrl(bucket, filename)

    // Get public URL for the file (will be accessible after upload)
    const publicUrl = getPublicUrl(bucket, uploadData.path)

    return apiSuccess({
      uploadUrl: uploadData.signedUrl,
      filePath: uploadData.path,
      token: uploadData.token,
      publicUrl,
      expiresIn: 3600, // 1 hour in seconds
    })
  } catch (error) {
    console.error('POST /api/upload error:', error)
    return apiError('Failed to generate upload URL', 500)
  }
}

// DELETE /api/upload - Delete file from Supabase Storage
// Usage: DELETE /api/upload?bucket=work-updates&path=photos/123.jpg
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return apiError('Unauthorized', 401)
    }

    const { searchParams } = new URL(request.url)
    const bucket = searchParams.get('bucket')
    const filePath = searchParams.get('path')

    if (!bucket || !filePath) {
      return apiError('Bucket and file path are required', 400)
    }

    const { deleteFile } = await import('@/lib/storage-utils')
    const success = await deleteFile(bucket, filePath)

    if (!success) {
      return apiError('Failed to delete file', 500)
    }

    return apiSuccess({ message: 'File deleted successfully' })
  } catch (error) {
    console.error('DELETE /api/upload error:', error)
    return apiError('Failed to delete file', 500)
  }
}
