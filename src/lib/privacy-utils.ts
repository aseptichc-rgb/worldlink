// 개인정보 비식별화 유틸리티
import { User, PrivacySettings } from '@/types';

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
 * 기관 정보를 비식별화하여 반환
 * @param user 사용자 정보
 * @param displayMode 표시 모드
 * @returns 비식별화된 기관 정보
 */
export function anonymizeInstitution(
  user: Pick<User, 'institution' | 'department'>,
  displayMode: 'full' | 'department' | 'hidden' = 'department'
): string | null {
  if (displayMode === 'hidden') {
    return null;
  }

  if (displayMode === 'full') {
    return user.institution || null;
  }

  if (displayMode === 'department') {
    return user.department || user.institution || null;
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
  user: Pick<User, 'position'>,
  displayMode: 'full' | 'level' | 'hidden' = 'level'
): string | null {
  if (displayMode === 'hidden') {
    return null;
  }

  if (displayMode === 'full') {
    return user.position || null;
  }

  if (displayMode === 'level') {
    // position 자체를 수준별로 매핑하거나 그대로 반환
    return user.position || '실무자급';
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

  // 1촌 연결인 경우 전체 정보 표시 (프로필 공개 설정과 무관)
  if (viewerIsConnected) {
    return {
      name: user.name,
      company: user.institution || null,
      position: user.position || null,
      isPublic: true,
    };
  }

  // 개인정보 공개 동의가 없는 경우 (비공개 사용자)
  if (!settings?.allowProfileDiscovery) {
    return {
      name: anonymizeName(user.name, 'partial'),
      company: null,
      position: null,
      isPublic: false,
    };
  }

  // 설정에 따른 비식별화된 정보
  const displaySettings = settings.displaySettings;

  return {
    name: anonymizeName(user.name, displaySettings.nameDisplay),
    company: anonymizeInstitution(user, displaySettings.institutionDisplay),
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
      institutionDisplay: 'department',
      positionDisplay: 'level',
    },
    consentedAt: undefined,
    updatedAt: undefined,
  };
}
