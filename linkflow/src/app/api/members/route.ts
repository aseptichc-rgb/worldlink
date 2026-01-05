import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import membersData from '../../../../data/members.json';

const MEMBERS_KEY = 'linkflow:members';

// Upstash Redis 클라이언트 초기화
const getRedis = () => {
  // Vercel의 Upstash 통합은 KV_REST_API_* 형식 사용
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }
  return new Redis({ url, token });
};

export async function GET() {
  try {
    const redis = getRedis();

    // Redis 연결이 없으면 로컬 데이터 반환
    if (!redis) {
      return NextResponse.json(membersData);
    }

    // Redis에서 데이터 가져오기
    const members = await redis.get(MEMBERS_KEY);

    // Redis에 데이터가 없으면 로컬 JSON 파일에서 로드
    if (!members) {
      return NextResponse.json(membersData);
    }

    return NextResponse.json(members);
  } catch (error) {
    console.error('데이터 읽기 오류:', error);
    // Redis 연결 실패 시 로컬 데이터 반환
    return NextResponse.json(membersData);
  }
}

export async function POST(request: NextRequest) {
  try {
    const redis = getRedis();

    if (!redis) {
      return NextResponse.json({ error: 'Redis가 설정되지 않았습니다.' }, { status: 500 });
    }

    const members = await request.json();

    // 데이터 유효성 검사
    if (!Array.isArray(members)) {
      return NextResponse.json({ error: '잘못된 데이터 형식입니다.' }, { status: 400 });
    }

    // Upstash Redis에 저장
    await redis.set(MEMBERS_KEY, members);

    return NextResponse.json({ success: true, count: members.length });
  } catch (error) {
    console.error('데이터 저장 오류:', error);
    return NextResponse.json({ error: '데이터를 저장할 수 없습니다.' }, { status: 500 });
  }
}
