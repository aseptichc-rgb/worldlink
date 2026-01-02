import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE_PATH = path.join(process.cwd(), 'data', 'members.json');

export async function GET() {
  try {
    const data = fs.readFileSync(DATA_FILE_PATH, 'utf-8');
    const members = JSON.parse(data);
    return NextResponse.json(members);
  } catch (error) {
    console.error('데이터 읽기 오류:', error);
    return NextResponse.json({ error: '데이터를 읽을 수 없습니다.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const members = await request.json();

    // 데이터 유효성 검사
    if (!Array.isArray(members)) {
      return NextResponse.json({ error: '잘못된 데이터 형식입니다.' }, { status: 400 });
    }

    // 파일에 저장
    fs.writeFileSync(DATA_FILE_PATH, JSON.stringify(members, null, 2), 'utf-8');

    return NextResponse.json({ success: true, count: members.length });
  } catch (error) {
    console.error('데이터 저장 오류:', error);
    return NextResponse.json({ error: '데이터를 저장할 수 없습니다.' }, { status: 500 });
  }
}
