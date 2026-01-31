import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { code, redirectUri } = await request.json();

    if (!code || !redirectUri) {
      return NextResponse.json({ error: 'code와 redirectUri가 필요합니다' }, { status: 400 });
    }

    // 1. 인가코드로 access_token 교환
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID!,
        client_secret: process.env.KAKAO_CLIENT_SECRET || '',
        redirect_uri: redirectUri,
        code,
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json();
      console.error('Kakao token error:', err);
      return NextResponse.json({ error: '카카오 토큰 발급 실패' }, { status: 401 });
    }

    const tokenData = await tokenRes.json();

    // 2. access_token으로 사용자 정보 조회
    const profileRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!profileRes.ok) {
      return NextResponse.json({ error: '카카오 프로필 조회 실패' }, { status: 401 });
    }

    const profile = await profileRes.json();
    const kakaoId = String(profile.id);
    const kakaoAccount = profile.kakao_account || {};
    const kakaoProfile = kakaoAccount.profile || {};

    const uid = `kakao_${kakaoId}`;
    const name = kakaoProfile.nickname || '';
    const email = kakaoAccount.email || '';
    const profileImage = kakaoProfile.profile_image_url || '';

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
    console.error('Kakao auth error:', error);
    return NextResponse.json({ error: '카카오 로그인 처리 중 오류 발생' }, { status: 500 });
  }
}
