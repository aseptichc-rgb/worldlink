import { NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';
import membersData from '../../../../../data/members.json';

const MEMBERS_KEY = 'linkflow:members';

// Upstash Redis 클라이언트 초기화
const getRedis = () => {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
};

// 초기 데이터를 Redis에 저장하는 API
export async function POST() {
  try {
    const redis = getRedis();

    if (!redis) {
      return NextResponse.json({ error: 'Redis가 설정되지 않았습니다.' }, { status: 500 });
    }

    // 로컬 JSON 데이터를 Redis에 저장
    await redis.set(MEMBERS_KEY, membersData);

    return NextResponse.json({
      success: true,
      message: '데이터가 성공적으로 초기화되었습니다.',
      count: membersData.length
    });
  } catch (error) {
    console.error('데이터 초기화 오류:', error);
    return NextResponse.json({ error: '데이터 초기화에 실패했습니다.' }, { status: 500 });
  }
}

// 현재 Redis 상태 확인
export async function GET() {
  try {
    const redis = getRedis();

    if (!redis) {
      return NextResponse.json({
        error: 'Redis가 설정되지 않았습니다.',
        hasEnv: false
      }, { status: 500 });
    }

    const members = await redis.get(MEMBERS_KEY);

    return NextResponse.json({
      hasData: !!members,
      count: Array.isArray(members) ? members.length : 0,
      localCount: membersData.length
    });
  } catch (error) {
    console.error('Redis 상태 확인 오류:', error);
    return NextResponse.json({ error: 'Redis 연결에 실패했습니다.' }, { status: 500 });
  }
}
