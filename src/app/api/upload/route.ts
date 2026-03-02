import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.log('Upload: No authorization header');
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      console.log('Upload: No token in header');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }
    
    // Verify token exists in session
    const session = await db.session.findUnique({
      where: { sessionToken: token },
      include: { user: true }
    });

    if (!session) {
      console.log('Upload: Session not found for token');
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    if (session.expires < new Date()) {
      console.log('Upload: Session expired');
      return NextResponse.json({ error: 'Session expired' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      console.log('Upload: No file in form data');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      console.log('Upload: Invalid file type:', file.type);
      return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, GIF, or WebP' }, { status: 400 });
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      console.log('Upload: File too large:', file.size);
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 });
    }

    // Generate unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substring(7)}`;
    const fileName = `${uniqueId}.${fileExtension}`;

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });

    // Write file
    const filePath = path.join(uploadsDir, fileName);
    await writeFile(filePath, buffer);

    // Return public URL
    const url = `/uploads/${fileName}`;

    console.log('Upload: Success, url:', url);
    return NextResponse.json({ 
      url,
      success: true 
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed: ' + (error instanceof Error ? error.message : 'Unknown error') }, { status: 500 });
  }
}
