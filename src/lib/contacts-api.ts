/**
 * 외부 주소록 연동 유틸리티
 * - 스마트폰 주소록 (Contact Picker API)
 * - 구글 주소록 (Google People API)
 * - 네이버 주소록 (수동 입력 + 네이버 연동)
 */

export interface FetchedContact {
  name: string;
  phone: string;
  company?: string;
}

// 한국 전화번호 포맷팅
function formatKoreanPhone(raw: string): string {
  let digits = raw.replace(/[^0-9]/g, "");
  // +82 국제번호 처리
  if (digits.startsWith("82") && digits.length > 10) {
    digits = "0" + digits.slice(2);
  }
  if (digits.length === 11 && digits.startsWith("010")) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return raw;
}

// Contact Picker API 지원 여부
export function isContactPickerSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    "contacts" in navigator &&
    "ContactsManager" in window
  );
}

// 1. 스마트폰 주소록 (Contact Picker API, multiple selection)
export async function pickPhoneContacts(): Promise<FetchedContact[]> {
  if (!isContactPickerSupported()) {
    throw new Error(
      "이 브라우저에서는 주소록 접근이 지원되지 않습니다.\nAndroid Chrome에서 사용 가능합니다."
    );
  }

  const contacts = await (navigator as any).contacts.select(
    ["name", "tel"],
    { multiple: true }
  );

  if (!contacts || contacts.length === 0) return [];

  return contacts
    .filter((c: any) => c.tel?.length > 0)
    .map((c: any) => ({
      name: c.name?.[0] || "이름 없음",
      phone: formatKoreanPhone(c.tel[0]),
    }));
}

// 스크립트 동적 로드
function loadScript(src: string, id: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(id)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.id = id;
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("스크립트 로드 실패"));
    document.head.appendChild(script);
  });
}

// 2. 구글 주소록 (Google People API via OAuth)
export async function fetchGoogleContacts(): Promise<FetchedContact[]> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "Google 주소록 연동을 위해 설정이 필요합니다.\nNEXT_PUBLIC_GOOGLE_CLIENT_ID 환경변수를 추가해주세요."
    );
  }

  await loadScript("https://accounts.google.com/gsi/client", "google-gsi-script");

  return new Promise((resolve, reject) => {
    try {
      const google = (window as any).google;
      if (!google?.accounts?.oauth2) {
        reject(new Error("Google 인증 서비스를 로드할 수 없습니다."));
        return;
      }

      const tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/contacts.readonly",
        callback: async (response: any) => {
          if (response.error) {
            reject(new Error("Google 인증이 취소되었습니다."));
            return;
          }

          try {
            const res = await fetch(
              "https://people.googleapis.com/v1/people/me/connections?personFields=names,phoneNumbers,organizations&pageSize=500&sortOrder=FIRST_NAME_ASCENDING",
              {
                headers: {
                  Authorization: `Bearer ${response.access_token}`,
                },
              }
            );

            if (!res.ok) throw new Error("API 요청 실패");

            const data = await res.json();
            const contacts: FetchedContact[] = (data.connections || [])
              .filter((p: any) => p.phoneNumbers?.length > 0)
              .map((p: any) => ({
                name: p.names?.[0]?.displayName || "이름 없음",
                phone: formatKoreanPhone(p.phoneNumbers[0].value),
                company: p.organizations?.[0]?.name,
              }));

            resolve(contacts);
          } catch {
            reject(new Error("연락처를 불러오는데 실패했습니다.\n다시 시도해주세요."));
          }
        },
      });

      tokenClient.requestAccessToken();
    } catch {
      reject(new Error("Google 인증을 시작할 수 없습니다."));
    }
  });
}

// 3. 텍스트에서 전화번호 파싱 (네이버 수동 입력용)
export function parsePhoneNumbers(text: string): FetchedContact[] {
  const lines = text
    .split(/[\n,;]+/)
    .map((l) => l.trim())
    .filter(Boolean);

  return lines
    .map((line) => {
      // "이름 전화번호" 형식
      const match = line.match(/^(.+?)\s+([\d\-+()]{9,})$/);
      if (match) {
        return {
          name: match[1].trim(),
          phone: formatKoreanPhone(match[2]),
        };
      }
      // 전화번호만 있는 경우
      const phoneMatch = line.match(/([\d\-+()]{9,})/);
      if (phoneMatch) {
        const remaining = line.replace(phoneMatch[0], "").trim();
        return {
          name: remaining || formatKoreanPhone(phoneMatch[1]),
          phone: formatKoreanPhone(phoneMatch[1]),
        };
      }
      return null;
    })
    .filter(Boolean) as FetchedContact[];
}
