import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
import connection from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    
    // Check if user is admin
    const [users] = await connection.execute(
      'SELECT user_type FROM users WHERE id = ?',
      [decoded.userId]
    );

    const userArray = users as any[];
    if (userArray.length === 0 || userArray[0].user_type !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const formData = await request.formData();
    const textbook = formData.get('textbook') as File;

    if (!textbook) {
      return NextResponse.json({ error: 'No textbook file provided' }, { status: 400 });
    }

    if (textbook.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are allowed' }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'textbooks');
    await mkdir(uploadsDir, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = textbook.name;
    const fileExtension = path.extname(originalName);
    const fileName = `textbook_${timestamp}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Convert file to buffer and save
    const arrayBuffer = await textbook.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    // Save to database
    const [result] = await connection.execute(
      `INSERT INTO textbooks (title, filename, file_path, file_size, uploaded_by) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        originalName.replace(fileExtension, ''), // title without extension
        originalName,
        filePath,
        textbook.size,
        decoded.userId
      ]
    );

    return NextResponse.json({ 
      message: 'Textbook uploaded successfully',
      textbook: {
        id: (result as any).insertId,
        title: originalName.replace(fileExtension, ''),
        filename: originalName,
        file_size: textbook.size
      }
    });

  } catch (error: any) {
    console.error('Upload textbook API error:', error);
    return NextResponse.json(
      { error: 'Failed to upload textbook' },
      { status: 500 }
    );
  }
}