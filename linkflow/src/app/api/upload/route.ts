import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const memberName = formData.get('memberName') as string;

    if (!file) {
      return NextResponse.json(
        { error: '파일이 없습니다.' },
        { status: 400 }
      );
    }

    // 파일 확장자 확인
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: '지원하지 않는 이미지 형식입니다. (JPG, PNG, GIF, WEBP만 가능)' },
        { status: 400 }
      );
    }

    // 파일 크기 확인 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기가 5MB를 초과합니다.' },
        { status: 400 }
      );
    }

    // 파일명 생성 (한글 이름 + 타임스탬프)
    const ext = file.name.split('.').pop() || 'jpg';
    const safeName = memberName
      ? encodeURIComponent(memberName).replace(/%/g, '')
      : 'photo';
    const fileName = `${safeName}_${Date.now()}.${ext}`;

    // faces 디렉토리 경로
    const facesDir = path.join(process.cwd(), 'public', 'faces');

    // 디렉토리가 없으면 생성
    try {
      await mkdir(facesDir, { recursive: true });
    } catch {
      // 이미 존재하면 무시
    }

    // 파일 저장
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(facesDir, fileName);

    await writeFile(filePath, buffer);

    // 저장된 이미지 URL 반환
    const imageUrl = `/faces/${fileName}`;

    return NextResponse.json({
      success: true,
      url: imageUrl,
      fileName
    });
  } catch (error) {
    console.error('업로드 오류:', error);
    return NextResponse.json(
      { error: '파일 업로드에 실패했습니다.' },
      { status: 500 }
    );
  }
}
