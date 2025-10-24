import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connection from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    const formData = await request.formData();
    const profileImage = formData.get('profileImage') as File;

    if (!profileImage) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    if (!profileImage.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 });
    }

    if (profileImage.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image size must be less than 2MB' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'profiles');
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = path.extname(profileImage.name);
    const fileName = `profile_${decoded.userId}_${timestamp}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);
    const publicUrl = `/uploads/profiles/${fileName}`;

    // Convert image to buffer and save
    const arrayBuffer = await profileImage.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    // Update user profile image in database
    await connection.execute(
      'UPDATE users SET profile_image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [publicUrl, decoded.userId]
    );

    return NextResponse.json({ 
      message: 'Profile image updated successfully',
      imageUrl: publicUrl
    });

  } catch (error: any) {
    console.error('Upload profile image API error:', error);
    return NextResponse.json(
      { error: 'Failed to upload profile image' },
      { status: 500 }
    );
  }
}