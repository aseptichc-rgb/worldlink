// 개인정보 비식별화 유틸리티
import { User, PrivacySettings } from '@/types';

// 회사 규모 한글 변환
const companySizeLabels: Record<string, string> = {
  startup: '스타트업',
  sme: '중소기업',
  enterprise: '대기업',
  freelance: '프리랜서',
};

// 직급 수준 한글 변환
const positionLevelLabels: Record<string, string> = {
  entry: '사원급',
  staff: '실무자급',
  manager: '관리자급',
  executive: '임원급',
};

/**
 * 이름을 비식별화하여 반환
 * @param name 전체 이름
 * @param displayMode 표시 모드 ('full' | 'partial')
 * @returns 비식별화된 이름
 */
export function anonymizeName(
  name: string,
  displayMode: 'full' | 'partial' = 'partial'
): string {
  if (!name) return '익명';

  if (displayMode === 'full') {
    return name;
  }

  // 성씨만 표시 (예: 김*님)
  const firstName = name.charAt(0);
  return `${firstName}*님`;
}

/**
 * 회사 정보를 비식별화하여 반환
 * @param user 사용자 정보
 * @param displayMode 표시 모드
 * @returns 비식별화된 회사 정보
 */
export function anonymizeCompany(
  user: Pick<User, 'company' | 'companySize' | 'industry'>,
  displayMode: 'full' | 'industry' | 'size' | 'hidden' = 'industry'
): string | null {
  if (displayMode === 'hidden') {
    return null;
  }

  if (displayMode === 'full') {
    return user.company || null;
  }

  if (displayMode === 'industry') {
    return user.industry || 'IT/소프트웨어';
  }

  if (displayMode === 'size') {
    return companySizeLabels[user.companySize || ''] || '기업';
  }

  return null;
}

/**
 * 직책 정보를 비식별화하여 반환
 * @param user 사용자 정보
 * @param displayMode 표시 모드
 * @returns 비식별화된 직책 정보
 */
export function anonymizePosition(
  user: Pick<User, 'position' | 'positionLevel'>,
  displayMode: 'full' | 'level' | 'hidden' = 'level'
): string | null {
  if (displayMode === 'hidden') {
    return null;
  }

  if (displayMode === 'full') {
    return user.position || null;
  }

  if (displayMode === 'level') {
    return positionLevelLabels[user.positionLevel || ''] || '실무자급';
  }

  return null;
}

/**
 * 사용자의 개인정보 설정에 따라 표시용 정보를 반환
 * @param user 사용자 정보
 * @param viewerIsConnected 보는 사람이 1촌인지 여부
 * @returns 비식별화된 표시용 정보
 */
export function getDisplayInfo(
  user: User,
  viewerIsConnected: boolean = false
): {
  name: string;
  company: string | null;
  position: string | null;
  isPublic: boolean;
} {
  const settings = user.privacySettings;

  // 개인정보 공개 동의가 없는 경우 (비공개 사용자)
  if (!settings?.allowProfileDiscovery) {
    return {
      name: anonymizeName(user.name, 'partial'),
      company: null,
      position: null,
      isPublic: false,
    };
  }

  // 1촌 연결인 경우 전체 정보 표시
  if (viewerIsConnected) {
    return {
      name: user.name,
      company: user.company || null,
      position: user.position || null,
      isPublic: true,
    };
  }

  // 설정에 따른 비식별화된 정보
  const displaySettings = settings.displaySettings;

  return {
    name: anonymizeName(user.name, displaySettings.nameDisplay),
    company: anonymizeCompany(user, displaySettings.companyDisplay),
    position: anonymizePosition(user, displaySettings.positionDisplay),
    isPublic: true,
  };
}

/**
 * 통계적 표현으로 변환 (예: "OO전자 소속 가입자 5명")
 * @param company 회사명
 * @param count 가입자 수
 * @returns 통계적 표현 문자열
 */
export function getStatisticalDisplay(company: string, count: number): string {
  // 회사명 마스킹 (예: 삼성전자 -> OO전자)
  const maskedCompany = company.length > 2
    ? `OO${company.slice(2)}`
    : 'OO기업';

  return `${maskedCompany} 소속 가입자 ${count}명`;
}

/**
 * 프로필 공개 여부 확인
 */
export function isProfileDiscoverable(user: User): boolean {
  return user.privacySettings?.allowProfileDiscovery ?? false;
}

/**
 * 기본 개인정보 설정 반환
 */
export function getDefaultPrivacySettings(): PrivacySettings {
  return {
    allowProfileDiscovery: false,
    displaySettings: {
      nameDisplay: 'partial',
      companyDisplay: 'industry',
      positionDisplay: 'level',
    },
    consentedAt: undefined,
    updatedAt: undefined,
  };
}
