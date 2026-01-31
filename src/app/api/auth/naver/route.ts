import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { code, redirectUri, state } = await request.json();

    if (!code || !redirectUri) {
      return NextResponse.json({ error: 'code와 redirectUri가 필요합니다' }, { status: 400 });
    }

    // 1. 인가코드로 access_token 교환
    const tokenRes = await fetch('https://nid.naver.com/oauth2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NEXT_PUBLIC_NAVER_CLIENT_ID!,
        client_secret: process.env.NAVER_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        code,
        state: state || '',
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json();
      console.error('Naver token error:', err);
      return NextResponse.json({ error: '네이버 토큰 발급 실패' }, { status: 401 });
    }

    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      console.error('Naver token error:', tokenData);
      return NextResponse.json({ error: '네이버 토큰 발급 실패' }, { status: 401 });
    }

    // 2. access_token으로 사용자 정보 조회
    const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileRes.ok) {
      return NextResponse.json({ error: '네이버 프로필 조회 실패' }, { status: 401 });
    }

    const profileData = await profileRes.json();
    const naverProfile = profileData.response || {};

    const naverId = naverProfile.id;
    const uid = `naver_${naverId}`;
    const name = naverProfile.name || naverProfile.nickname || '';
    const email = naverProfile.email || '';
    const profileImage = naverProfile.profile_image || '';

    // 3. Firebase Custom Token 발급
    const customToken = await getAdminAuth().createCustomToken(uid);

    // 4. Firebase Auth에 사용자가 존재하는지 확인
    let isNewUser = false;
    try {
      await getAdminAuth().getUser(uid);
    } catch {
      isNewUser = true;
    }

    return NextResponse.json({
      customToken,
      user: { name, email, profileImage },
      isNewUser,
      uid,
    });
  } catch (error) {
    console.error('Naver auth error:', error);
    return NextResponse.json({ error: '네이버 로그인 처리 중 오류 발생' }, { status: 500 });
  }
}
