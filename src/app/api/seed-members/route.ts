import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!;

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

interface Member {
  id: string;
  name: string;
  company: string;
  role: string;
  phone: string;
  email: string;
  description: string;
  category: string;
  tags: string[];
  photoUrl: string;
  specialRole: string | null;
}

// Firebase Auth REST API로 유저 생성
async function createAuthUser(email: string, password: string): Promise<{ uid: string; idToken: string }> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    }
  );
  const data = await res.json();
  if (data.error) {
    if (data.error.message === 'EMAIL_EXISTS') {
      // 이미 존재하면 로그인해서 uid 가져오기
      const loginRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, returnSecureToken: true }),
        }
      );
      const loginData = await loginRes.json();
      if (loginData.error) throw new Error(`Login failed: ${loginData.error.message}`);
      return { uid: loginData.localId, idToken: loginData.idToken };
    }
    throw new Error(data.error.message);
  }
  return { uid: data.localId, idToken: data.idToken };
}

// Firebase Auth display name 업데이트
async function updateDisplayName(idToken: string, displayName: string) {
  await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:update?key=${API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, displayName, returnSecureToken: false }),
    }
  );
}

// Firebase Storage에 사진 업로드
async function uploadPhoto(uid: string, filePath: string, idToken: string): Promise<string> {
  const fileBuffer = fs.readFileSync(filePath);
  const storagePath = `profiles/${uid}/profile.jpg`;

  const res = await fetch(
    `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(storagePath)}?uploadType=media`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg',
        'Authorization': `Bearer ${idToken}`,
      },
      body: fileBuffer,
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Storage upload failed: ${errText}`);
  }

  const data = await res.json();
  return `https://firebasestorage.googleapis.com/v0/b/${STORAGE_BUCKET}/o/${encodeURIComponent(storagePath)}?alt=media&token=${data.downloadTokens}`;
}

// Firestore 문서 쓰기
async function writeFirestoreDoc(collection: string, docId: string, fields: Record<string, any>, idToken: string) {
  const firestoreFields: Record<string, any> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string') {
      firestoreFields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      firestoreFields[key] = { integerValue: String(value) };
    } else if (typeof value === 'boolean') {
      firestoreFields[key] = { booleanValue: value };
    } else if (Array.isArray(value)) {
      firestoreFields[key] = {
        arrayValue: {
          values: value.map((v: string) => ({ stringValue: v })),
        },
      };
    } else if (typeof value === 'object' && value._serverTimestamp) {
      firestoreFields[key] = { timestampValue: new Date().toISOString() };
    } else if (typeof value === 'object') {
      // nested map
      const mapFields: Record<string, any> = {};
      for (const [mk, mv] of Object.entries(value)) {
        if (typeof mv === 'string') mapFields[mk] = { stringValue: mv };
        else if (typeof mv === 'boolean') mapFields[mk] = { booleanValue: mv };
        else if (typeof mv === 'object' && mv !== null) {
          const innerMap: Record<string, any> = {};
          for (const [ik, iv] of Object.entries(mv)) {
            if (typeof iv === 'string') innerMap[ik] = { stringValue: iv };
            else if (typeof iv === 'boolean') innerMap[ik] = { booleanValue: iv };
          }
          mapFields[mk] = { mapValue: { fields: innerMap } };
        }
      }
      firestoreFields[key] = { mapValue: { fields: mapFields } };
    }
  }

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}/${docId}`;
  const res = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ fields: firestoreFields }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Firestore write failed: ${errText}`);
  }
}

// Firestore 문서 생성 (자동 ID)
async function createFirestoreDoc(collection: string, fields: Record<string, any>, idToken: string): Promise<string> {
  const firestoreFields: Record<string, any> = {};

  for (const [key, value] of Object.entries(fields)) {
    if (value === null || value === undefined) continue;
    if (typeof value === 'string') {
      firestoreFields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      firestoreFields[key] = { integerValue: String(value) };
    } else if (typeof value === 'boolean') {
      firestoreFields[key] = { booleanValue: value };
    }
  }

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collection}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`,
    },
    body: JSON.stringify({ fields: firestoreFields }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Firestore create failed: ${errText}`);
  }

  const data = await res.json();
  // name is like: projects/.../documents/connections/DOC_ID
  const docId = data.name.split('/').pop();
  return docId;
}

export async function POST() {
  // Block seed endpoint in production
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    // future2members.json 읽기
    const jsonPath = path.join(process.cwd(), 'future2members.json');
    const rawData = fs.readFileSync(jsonPath, 'utf8');
    const cleanData = rawData.replace(/[\x00-\x08\x0e-\x1f]/g, '');
    const members: Member[] = JSON.parse(cleanData);

    const results: { name: string; email: string; uid: string; status: string }[] = [];
    const userIds: string[] = [];
    let activeToken = ''; // 마지막 유효한 토큰 (connection 생성용)

    // 1단계: 각 멤버를 Auth 유저 + Firestore 문서로 생성
    for (const member of members) {
      try {
        const password = member.phone.replace(/-/g, '');
        const { uid, idToken } = await createAuthUser(member.email, password);
        activeToken = idToken;

        // Display name 설정
        await updateDisplayName(idToken, member.name);

        // 프로필 사진 업로드
        let profileImageUrl = '';
        const facePath = path.join(process.cwd(), 'extracted_faces', `${member.name}.jpg`);
        if (fs.existsSync(facePath)) {
          try {
            profileImageUrl = await uploadPhoto(uid, facePath, idToken);
          } catch (photoErr: any) {
            console.log(`Photo upload failed for ${member.name}: ${photoErr.message}`);
          }
        }

        // Firestore 유저 문서 생성
        const inviteCode = generateInviteCode();
        await writeFirestoreDoc('users', uid, {
          id: uid,
          name: member.name,
          email: member.email,
          phone: member.phone,
          profileImage: profileImageUrl,
          institution: member.company,
          position: member.role,
          bio: member.description,
          researchInterests: member.tags || [],
          researchKeywords: member.tags || [],
          inviteCode,
          invitesRemaining: 10,
          meetingStatus: 'available',
          privacySettings: {
            allowProfileDiscovery: true,
            displaySettings: {
              nameDisplay: 'full',
              institutionDisplay: 'full',
              positionDisplay: 'full',
            },
          },
          subscription: { plan: 'free' },
        }, idToken);

        // inviteCode 문서
        await writeFirestoreDoc('inviteCodes', inviteCode, {
          code: inviteCode,
          createdBy: uid,
          isValid: true,
        }, idToken);

        userIds.push(uid);
        results.push({ name: member.name, email: member.email, uid, status: 'created' });
        console.log(`✓ ${member.name} (${member.email}) 생성 완료`);
      } catch (error: any) {
        results.push({ name: member.name, email: member.email, uid: '', status: `error: ${error.message}` });
        console.log(`✗ ${member.name}: ${error.message}`);
      }
    }

    // 2단계: 모든 멤버를 서로 인맥으로 연결
    let connectionCount = 0;
    const now = new Date().toISOString();

    if (activeToken && userIds.length > 1) {
      for (let i = 0; i < userIds.length; i++) {
        for (let j = i + 1; j < userIds.length; j++) {
          try {
            await createFirestoreDoc('connections', {
              fromUserId: userIds[i],
              toUserId: userIds[j],
              status: 'accepted',
              method: 'invite',
            }, activeToken);
            connectionCount++;

            if (connectionCount % 100 === 0) {
              console.log(`  connections: ${connectionCount}...`);
            }
          } catch (connErr: any) {
            console.log(`Connection error (${i}-${j}): ${connErr.message}`);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `${results.filter(r => r.status === 'created').length}명 회원 생성, ${connectionCount}개 인맥 연결 완료`,
      totalMembers: members.length,
      createdCount: results.filter(r => r.status === 'created').length,
      errorCount: results.filter(r => r.status.startsWith('error')).length,
      connectionCount,
      results,
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
