import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { sql } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const rows = await sql`
      SELECT s.id FROM sessions s
      WHERE s.session_token = ${token} AND s.expires > NOW()
      LIMIT 1
    `

    if (!rows.length) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, GIF, or WebP' }, { status: 400 })
    }

    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ext = file.name.split('.').pop() || 'jpg'
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`
    const fileName = `${uniqueId}.${ext}`

    const uploadsDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadsDir, { recursive: true })
    await writeFile(path.join(uploadsDir, fileName), buffer)

    return NextResponse.json({ url: `/uploads/${fileName}`, success: true })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 })
  }
}
