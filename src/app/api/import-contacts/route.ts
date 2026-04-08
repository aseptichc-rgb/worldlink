import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Firebase Admin 초기화
function getAdminApp(): App {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// CSV 파싱 함수
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// 전화번호 정규화
function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

// 전화번호를 비밀번호로 사용
function phoneToPassword(phone: string): string {
  const normalized = normalizePhone(phone);
  return normalized || 'defaultPassword123';
}

export async function POST(request: Request) {
  try {
    const app = getAdminApp();
    const adminAuth = getAuth(app);
    const adminDb = getFirestore(app);

    // kjykjj04@naver.com 사용자 찾기
    let targetUid: string;
    try {
      const targetUser = await adminAuth.getUserByEmail('kjykjj04@naver.com');
      targetUid = targetUser.uid;
    } catch {
      return NextResponse.json({ error: 'kjykjj04@naver.com 사용자를 찾을 수 없습니다' }, { status: 404 });
    }

    // CSV 파일 읽기
    const csvPath = path.join(process.cwd(), '202601191412_remember.csv');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n').filter(line => line.trim());

    // 헤더 파싱
    const headers = parseCSVLine(lines[0]);
    // "이름","휴대폰","회사","부서","직함","전자 메일 주소","근무처 전화","근무처 팩스","근무지 주소 번지","명함 등록일","그룹","메모"

    const results: { name: string; status: string; uid?: string; error?: string }[] = [];
    const createdUids: string[] = [];

    // 각 연락처 처리 (헤더 제외)
    for (let i = 1; i < lines.length; i++) {
      const fields = parseCSVLine(lines[i]);
      if (fields.length < 2) continue;

      const name = fields[0]?.trim();
      const phone = fields[1]?.trim();
      const company = fields[2]?.trim() || '';
      const department = fields[3]?.trim() || '';
      const position = fields[4]?.trim() || '';
      const email = fields[5]?.trim() || '';
      const workPhone = fields[6]?.trim() || '';
      const address = fields[8]?.trim() || '';
      const memo = fields[11]?.trim() || '';

      if (!name || !phone) {
        results.push({ name: name || `Row ${i}`, status: 'skipped', error: '이름 또는 전화번호 없음' });
        continue;
      }

      try {
        let uid: string;
        const normalizedPhone = normalizePhone(phone);

        // 이메일이 있으면 이메일로 사용자 찾기/생성
        if (email) {
          try {
            const existingUser = await adminAuth.getUserByEmail(email);
            uid = existingUser.uid;
          } catch {
            // 사용자 생성
            const userRecord = await adminAuth.createUser({
              email: email,
              password: phoneToPassword(phone),
              displayName: name,
            });
            uid = userRecord.uid;
          }
        } else {
          // 이메일 없으면 전화번호 기반 임시 이메일로 생성
          const tempEmail = `${normalizedPhone}@worldlink.temp`;
          try {
            const existingUser = await adminAuth.getUserByEmail(tempEmail);
            uid = existingUser.uid;
          } catch {
            const userRecord = await adminAuth.createUser({
              email: tempEmail,
              password: phoneToPassword(phone),
              displayName: name,
            });
            uid = userRecord.uid;
          }
        }

        // Firestore에 사용자 정보 저장/업데이트
        const userDoc = await adminDb.doc(`users/${uid}`).get();
        const existingData = userDoc.exists ? userDoc.data() : {};

        await adminDb.doc(`users/${uid}`).set({
          id: uid,
          name: name,
          email: email || existingData?.email || '',
          phone: phone,
          institution: company,
          position: [department, position].filter(Boolean).join(' ') || existingData?.position || '',
          bio: memo || existingData?.bio || '',
          researchInterests: existingData?.researchInterests || [],
          researchKeywords: existingData?.researchKeywords || [],
          profileImage: existingData?.profileImage || '',
          inviteCode: existingData?.inviteCode || `INV-${normalizedPhone.slice(-4)}`,
          invitesRemaining: existingData?.invitesRemaining ?? 999,
          meetingStatus: existingData?.meetingStatus || 'available',
          privacySettings: existingData?.privacySettings || {
            allowProfileDiscovery: true,
            displaySettings: {
              nameDisplay: 'full',
              institutionDisplay: 'full',
              positionDisplay: 'full',
            },
          },
          createdAt: existingData?.createdAt || new Date(),
          updatedAt: new Date(),
        }, { merge: true });

        createdUids.push(uid);
        results.push({ name, status: 'success', uid });
      } catch (err: any) {
        results.push({ name, status: 'error', error: err.message });
      }
    }

    // kjykjj04@naver.com과 모든 연락처 간 connection 생성
    let connectionCount = 0;
    let batch = adminDb.batch();
    let batchSize = 0;

    for (const contactUid of createdUids) {
      if (contactUid === targetUid) continue;

      // 기존 연결 확인 (양방향)
      const [conn1, conn2] = await Promise.all([
        adminDb.collection('connections')
          .where('fromUserId', '==', targetUid)
          .where('toUserId', '==', contactUid)
          .limit(1)
          .get(),
        adminDb.collection('connections')
          .where('fromUserId', '==', contactUid)
          .where('toUserId', '==', targetUid)
          .limit(1)
          .get()
      ]);

      if (!conn1.empty || !conn2.empty) continue;

      const connRef = adminDb.collection('connections').doc();
      batch.set(connRef, {
        id: connRef.id,
        fromUserId: targetUid,
        toUserId: contactUid,
        status: 'accepted',
        method: 'import',
        createdAt: new Date(),
        acceptedAt: new Date(),
      });

      connectionCount++;
      batchSize++;

      if (batchSize >= 499) {
        await batch.commit();
        batch = adminDb.batch();
        batchSize = 0;
      }
    }

    if (batchSize > 0) {
      await batch.commit();
    }

    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;

    return NextResponse.json({
      success: true,
      message: `${successCount}명 처리 완료, ${connectionCount}개 인맥 연결 생성`,
      summary: {
        total: lines.length - 1,
        success: successCount,
        error: errorCount,
        skipped: skippedCount,
        connections: connectionCount,
      },
      results: results.slice(0, 50), // 처음 50개만 반환
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
