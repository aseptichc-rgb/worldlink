import { NextResponse } from 'next/server';
import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import {
  DEMO_MEMBERS,
  DEMO_ACCOUNT_INDEX,
  generateDemoConnections,
  DEMO_GROUPS,
  DEMO_COFFEE_SLOTS,
  DEMO_COFFEE_REQUESTS,
  getDemoProfileImage,
} from '@/lib/demo-seed-data';

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

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const app = getAdminApp();
    const adminAuth = getAuth(app);
    const adminDb = getFirestore(app);
    const now = Timestamp.now();

    const results: { name: string; email: string; status: string; uid?: string; error?: string }[] = [];
    const uidMap: Record<string, string> = {}; // demo_id -> firebase uid

    // =====================================================================
    // Phase 1: Create 100 Firebase Auth users + Firestore user docs
    // =====================================================================
    console.log('Phase 1: Creating 100 users...');

    for (const member of DEMO_MEMBERS) {
      try {
        const password = member.id === DEMO_MEMBERS[DEMO_ACCOUNT_INDEX].id ? 'demo1234' : `demo${member.id.split('_')[1]}pass`;

        let uid: string;
        try {
          const userRecord = await adminAuth.createUser({
            email: member.email,
            password: password,
            displayName: member.name,
          });
          uid = userRecord.uid;
        } catch (authErr: any) {
          if (authErr.code === 'auth/email-already-exists') {
            const existingUser = await adminAuth.getUserByEmail(member.email);
            uid = existingUser.uid;
          } else {
            throw authErr;
          }
        }

        uidMap[member.id] = uid;

        // Firestore user document
        await adminDb.doc(`users/${uid}`).set({
          id: uid,
          name: member.name,
          email: member.email,
          phone: member.phone,
          company: member.company,
          position: member.position,
          bio: member.bio,
          keywords: member.keywords,
          category: member.category,
          profileImage: getDemoProfileImage(member.id),
          inviteCode: `INV-${member.id.split('_')[1]?.padStart(3, '0') || '000'}`,
          invitesRemaining: 999,
          coffeeStatus: 'available',
          privacySettings: {
            allowProfileDiscovery: true,
            displaySettings: {
              nameDisplay: 'full',
              companyDisplay: 'full',
              positionDisplay: 'full',
            },
          },
          subscription: { plan: 'free' },
          createdAt: now,
          updatedAt: now,
        }, { merge: true });

        results.push({ name: member.name, email: member.email, status: 'success', uid });
        console.log(`  ✓ ${member.name} (${member.email})`);
      } catch (err: any) {
        results.push({ name: member.name, email: member.email, status: 'error', error: err.message });
        console.log(`  ✗ ${member.name}: ${err.message}`);
      }
    }

    const successCount = results.filter(r => r.status === 'success').length;
    console.log(`Phase 1 complete: ${successCount}/${DEMO_MEMBERS.length} users created`);

    // =====================================================================
    // Phase 2: Create connections (cluster-based)
    // =====================================================================
    console.log('Phase 2: Creating connections...');

    const connectionPairs = generateDemoConnections();
    let connectionCount = 0;
    let batch = adminDb.batch();
    let batchSize = 0;

    for (const [fromDemoId, toDemoId] of connectionPairs) {
      const fromUid = uidMap[fromDemoId];
      const toUid = uidMap[toDemoId];
      if (!fromUid || !toUid) continue;

      const connRef = adminDb.collection('connections').doc();
      batch.set(connRef, {
        id: connRef.id,
        fromUserId: fromUid,
        toUserId: toUid,
        status: 'accepted',
        method: 'invite',
        createdAt: now,
        acceptedAt: now,
      });

      connectionCount++;
      batchSize++;

      if (batchSize >= 499) {
        await batch.commit();
        batch = adminDb.batch();
        batchSize = 0;
        console.log(`  connections: ${connectionCount}...`);
      }
    }

    if (batchSize > 0) {
      await batch.commit();
    }
    console.log(`Phase 2 complete: ${connectionCount} connections created`);

    // =====================================================================
    // Phase 3: Create managed groups
    // =====================================================================
    console.log('Phase 3: Creating managed groups...');

    const groupResults: { name: string; status: string }[] = [];

    for (const groupDef of DEMO_GROUPS) {
      try {
        const ownerUid = uidMap[DEMO_MEMBERS[groupDef.ownerIndex].id];
        if (!ownerUid) {
          groupResults.push({ name: groupDef.name, status: 'error: owner not found' });
          continue;
        }

        const members = groupDef.memberIndices.map(idx => {
          const member = DEMO_MEMBERS[idx];
          const uid = uidMap[member.id];
          const roleInfo = groupDef.roles[idx];
          return {
            userId: uid,
            role: roleInfo?.role || 'member',
            ...(roleInfo?.title ? { title: roleInfo.title } : {}),
            joinedAt: now,
          };
        }).filter(m => m.userId);

        const memberUserIds = members.map(m => m.userId);

        const groupRef = adminDb.collection('managedGroups').doc();
        await groupRef.set({
          id: groupRef.id,
          name: groupDef.name,
          description: groupDef.description,
          color: groupDef.color,
          icon: groupDef.icon,
          ownerId: ownerUid,
          members,
          memberUserIds,
          settings: {
            autoConnect: true,
            allowMemberInvite: true,
          },
          createdAt: now,
          updatedAt: now,
        });

        groupResults.push({ name: groupDef.name, status: 'success' });
        console.log(`  ✓ Group: ${groupDef.name} (${members.length} members)`);
      } catch (err: any) {
        groupResults.push({ name: groupDef.name, status: `error: ${err.message}` });
        console.log(`  ✗ Group ${groupDef.name}: ${err.message}`);
      }
    }

    console.log(`Phase 3 complete: ${groupResults.filter(g => g.status === 'success').length}/${DEMO_GROUPS.length} groups created`);

    // =====================================================================
    // Phase 4: Create coffee chat data for demo account
    // =====================================================================
    console.log('Phase 4: Creating coffee chat data...');

    const demoUid = uidMap[DEMO_MEMBERS[DEMO_ACCOUNT_INDEX].id];

    if (demoUid) {
      // Time slots
      for (const slot of DEMO_COFFEE_SLOTS) {
        const slotRef = adminDb.collection('timeSlots').doc();
        await slotRef.set({
          id: slotRef.id,
          userId: demoUid,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          isRecurring: slot.isRecurring,
          isAvailable: true,
          createdAt: now,
        });
      }

      // Coffee chat requests
      for (const req of DEMO_COFFEE_REQUESTS) {
        const fromUid = uidMap[DEMO_MEMBERS[req.fromIndex].id];
        if (!fromUid) continue;

        const reqRef = adminDb.collection('coffeeChatRequests').doc();
        await reqRef.set({
          id: reqRef.id,
          fromUserId: fromUid,
          toUserId: demoUid,
          purpose: req.purpose,
          message: req.message,
          status: req.status,
          scheduledDate: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
          createdAt: now,
          ...(req.status !== 'pending' ? { respondedAt: now } : {}),
        });
      }

      console.log('Phase 4 complete: coffee chat data created');
    }

    // =====================================================================
    // Summary
    // =====================================================================
    const demoAccount = DEMO_MEMBERS[DEMO_ACCOUNT_INDEX];
    return NextResponse.json({
      success: true,
      summary: {
        usersCreated: successCount,
        usersTotal: DEMO_MEMBERS.length,
        connectionCount,
        groupsCreated: groupResults.filter(g => g.status === 'success').length,
        coffeeSlotsCreated: DEMO_COFFEE_SLOTS.length,
        coffeeRequestsCreated: DEMO_COFFEE_REQUESTS.length,
      },
      demoAccount: {
        email: demoAccount.email,
        password: 'demo1234',
        name: demoAccount.name,
        company: demoAccount.company,
      },
      results,
      groupResults,
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
