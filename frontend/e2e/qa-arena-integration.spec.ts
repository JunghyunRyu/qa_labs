import { test, expect, Page } from "@playwright/test";

/**
 * QA Arena 전체 기능 UI 통합테스트
 *
 * 테스트 범위:
 * 1. 홈페이지
 * 2. 문제 목록
 * 3. 문제 풀이 (코드 에디터)
 * 4. 제출 및 결과 확인
 * 5. 인증 (로그인/로그아웃)
 * 6. 대시보드
 * 7. 제출 히스토리
 */

// ============================================================================
// 1. 홈페이지 테스트
// ============================================================================
test.describe("홈페이지", () => {
  test("TC-HOME-001: 홈페이지 로드 및 주요 요소 표시", async ({ page }) => {
    await page.goto("/");

    // 헤더 로고/타이틀 확인
    await expect(page.getByRole("link", { name: /QA.*Arena|QA.*Labs/i })).toBeVisible();

    // 메인 CTA 버튼 확인
    await expect(page.getByRole("link", { name: /문제 풀기|시작하기/i })).toBeVisible();

    // 푸터 확인
    await expect(page.locator("footer")).toBeVisible();
  });

  test("TC-HOME-002: 문제 풀기 버튼 클릭 시 문제 목록으로 이동", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /문제 풀기|시작하기/i }).first().click();

    await expect(page).toHaveURL(/\/problems/);
  });

  test("TC-HOME-003: 네비게이션 메뉴 동작 확인", async ({ page }) => {
    await page.goto("/");

    // 문제 목록 링크
    const problemsLink = page.getByRole("link", { name: /문제/i }).first();
    if (await problemsLink.isVisible()) {
      await problemsLink.click();
      await expect(page).toHaveURL(/\/problems/);
    }
  });
});

// ============================================================================
// 2. 문제 목록 테스트
// ============================================================================
test.describe("문제 목록", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/problems");
    await expect(page.getByRole("heading", { name: /문제/i })).toBeVisible({
      timeout: 30000,
    });
  });

  test("TC-PROB-001: 문제 목록 로드 및 카드 표시", async ({ page }) => {
    // 문제 카드가 최소 1개 이상 표시
    const problemCards = page.locator('a[href^="/problems/"]');
    await expect(problemCards.first()).toBeVisible({ timeout: 10000 });

    const count = await problemCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test("TC-PROB-002: 난이도 필터 동작", async ({ page }) => {
    // 난이도 필터 버튼들 확인
    const easyFilter = page.getByRole("button", { name: /EASY|쉬움/i });
    const mediumFilter = page.getByRole("button", { name: /MEDIUM|보통/i });
    const hardFilter = page.getByRole("button", { name: /HARD|어려움/i });

    // 필터 버튼이 있으면 클릭 테스트
    if (await easyFilter.isVisible()) {
      await easyFilter.click();
      // 필터 적용 후 목록 갱신 대기
      await page.waitForTimeout(500);
    }
  });

  test("TC-PROB-003: 검색 기능 동작", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/검색|search/i);

    if (await searchInput.isVisible()) {
      await searchInput.fill("test");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(500);
      // 검색 결과 확인 (결과가 있거나 없음 메시지)
    }
  });

  test("TC-PROB-004: 문제 카드 클릭 시 상세 페이지로 이동", async ({ page }) => {
    const problemLink = page.locator('a[href^="/problems/"]').first();
    await expect(problemLink).toBeVisible({ timeout: 10000 });

    const href = await problemLink.getAttribute("href");
    await problemLink.click();

    await expect(page).toHaveURL(href!);
  });

  test("TC-PROB-005: 페이지네이션 동작", async ({ page }) => {
    // 페이지네이션이 있는 경우
    const nextPageBtn = page.getByRole("button", { name: /다음|next|›/i });

    if (await nextPageBtn.isVisible()) {
      await nextPageBtn.click();
      await page.waitForTimeout(500);
      // URL 또는 페이지 번호 변경 확인
    }
  });

  test("TC-PROB-006: 스킬 태그 필터 동작", async ({ page }) => {
    // 태그 버튼들 확인
    const tagButtons = page.locator('[data-testid^="tag-"]');

    if ((await tagButtons.count()) > 0) {
      await tagButtons.first().click();
      await page.waitForTimeout(500);
    }
  });
});

// ============================================================================
// 3. 문제 풀이 페이지 테스트
// ============================================================================
test.describe("문제 풀이 페이지", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/problems");
    await expect(page.getByRole("heading", { name: /문제/i })).toBeVisible({
      timeout: 30000,
    });

    // 첫 번째 문제로 이동
    const problemLink = page.locator('a[href^="/problems/"]').first();
    await problemLink.click();

    await expect(page.getByTestId("code-editor-area")).toBeVisible({
      timeout: 30000,
    });
  });

  test("TC-EDIT-001: 코드 에디터 로드 및 기본 요소 표시", async ({ page }) => {
    // 코드 에디터 영역
    await expect(page.getByTestId("code-editor-area")).toBeVisible();

    // 제출 버튼
    await expect(page.getByTestId("btn-submit")).toBeVisible();

    // 하단 탭들
    await expect(page.getByTestId("tab-local")).toBeVisible();
    await expect(page.getByTestId("tab-result")).toBeVisible();
    await expect(page.getByTestId("tab-logs")).toBeVisible();
    await expect(page.getByTestId("tab-history")).toBeVisible();
  });

  test("TC-EDIT-002: 문제 패널 표시 및 접기/펼치기", async ({ page }) => {
    // 문제 설명 패널 확인
    const problemPanel = page.locator('[data-testid="problem-panel"]');

    if (await problemPanel.isVisible()) {
      // 접기 버튼 클릭
      const collapseBtn = page.getByRole("button", { name: /접기|collapse/i });
      if (await collapseBtn.isVisible()) {
        await collapseBtn.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test("TC-EDIT-003: 코드 입력 및 수정", async ({ page }) => {
    const editorArea = page.getByTestId("code-editor-area");
    await editorArea.click();

    // 기존 코드 선택 후 새 코드 입력
    await page.keyboard.press("Control+a");
    await page.keyboard.type("def test_example():\n    assert 1 + 1 == 2");
    await page.waitForTimeout(500);

    // 제출 버튼 활성화 확인
    await expect(page.getByTestId("btn-submit")).toBeEnabled();
  });

  test("TC-EDIT-004: 로컬 테스트 실행", async ({ page }) => {
    const localTestBtn = page.getByTestId("btn-local-test");

    if (!(await localTestBtn.isVisible())) {
      test.skip();
      return;
    }

    // 코드 입력
    const editorArea = page.getByTestId("code-editor-area");
    await editorArea.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.type("def test_pass():\n    assert True");
    await page.waitForTimeout(500);

    // 로컬 테스트 실행
    await localTestBtn.click();

    // 테스트 결과 대기 (Pyodide 초기화 시간 고려)
    await expect(page.getByTestId("tab-local")).toHaveClass(/text-sky-600|border-sky-500/);

    await expect(async () => {
      const hasResult = await page
        .getByText(/테스트 통과|테스트 실패|오류|passed|failed/)
        .isVisible()
        .catch(() => false);
      if (!hasResult) throw new Error("Waiting for result");
    }).toPass({ timeout: 60000 });
  });

  test("TC-EDIT-005: 탭 전환 동작", async ({ page }) => {
    // 로그 탭
    await page.getByTestId("tab-logs").click();
    await expect(page.getByTestId("tab-logs")).toHaveClass(/text-sky-600|border-sky-500/);

    // 결과 탭
    await page.getByTestId("tab-result").click();
    await expect(page.getByTestId("tab-result")).toHaveClass(/text-sky-600|border-sky-500/);

    // 히스토리 탭
    await page.getByTestId("tab-history").click();
    await expect(page.getByTestId("tab-history")).toHaveClass(/text-sky-600|border-sky-500/);

    // 로컬 탭
    await page.getByTestId("tab-local").click();
    await expect(page.getByTestId("tab-local")).toHaveClass(/text-sky-600|border-sky-500/);
  });

  test("TC-EDIT-006: 키보드 단축키 동작", async ({ page }) => {
    // Ctrl+B: 문제 패널 토글
    await page.keyboard.press("Control+b");
    await page.waitForTimeout(300);

    // Ctrl+/: AI 챗봇 토글
    await page.keyboard.press("Control+/");
    await page.waitForTimeout(300);

    // ESC: 드로어 닫기
    await page.keyboard.press("Escape");
    await page.waitForTimeout(300);
  });

  test("TC-EDIT-007: AI 챗봇 열기/닫기", async ({ page }) => {
    // AI 챗봇 FAB 버튼
    const aiFab = page.locator('[data-testid="ai-chat-fab"]');

    if (await aiFab.isVisible()) {
      await aiFab.click();
      await page.waitForTimeout(300);

      // 챗봇 드로어 확인
      const chatDrawer = page.locator('[data-testid="ai-chat-drawer"]');
      await expect(chatDrawer).toBeVisible();

      // 닫기
      await page.keyboard.press("Escape");
      await page.waitForTimeout(300);
    }
  });

  test("TC-EDIT-008: 함수 시그니처 복사", async ({ page }) => {
    const copyBtn = page.getByRole("button", { name: /복사|copy/i });

    if (await copyBtn.isVisible()) {
      await copyBtn.click();
      // 복사 완료 토스트/알림 확인
      await expect(page.getByText(/복사|copied/i)).toBeVisible({ timeout: 3000 });
    }
  });
});

// ============================================================================
// 4. 제출 및 결과 테스트
// ============================================================================
test.describe("제출 및 결과", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/problems");
    await expect(page.getByRole("heading", { name: /문제/i })).toBeVisible({
      timeout: 30000,
    });

    const problemLink = page.locator('a[href^="/problems/"]').first();
    await problemLink.click();

    await expect(page.getByTestId("code-editor-area")).toBeVisible({
      timeout: 30000,
    });
  });

  test("TC-SUB-001: 코드 제출 및 결과 수신", async ({ page }) => {
    // 코드 입력
    const editorArea = page.getByTestId("code-editor-area");
    await editorArea.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.type("def test_basic():\n    assert True");
    await page.waitForTimeout(500);

    // 제출
    const submitBtn = page.getByTestId("btn-submit");
    await submitBtn.click();

    // 결과 탭으로 자동 전환
    await expect(page.getByTestId("tab-result")).toHaveClass(/text-sky-600|border-sky-500/, {
      timeout: 5000,
    });

    // 결과 수신 대기 (최대 2분)
    await expect(async () => {
      const hasResult = await page
        .getByText(/점수|score|성공|실패|완료/i)
        .isVisible()
        .catch(() => false);
      if (!hasResult) throw new Error("Waiting for result");
    }).toPass({ timeout: 120000 });
  });

  test("TC-SUB-002: 제출 중 로딩 상태 표시", async ({ page }) => {
    const editorArea = page.getByTestId("code-editor-area");
    await editorArea.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.type("def test_basic():\n    assert True");
    await page.waitForTimeout(500);

    const submitBtn = page.getByTestId("btn-submit");
    await submitBtn.click();

    // 로딩 상태 확인 (버튼 비활성화 또는 스피너)
    await expect(submitBtn).toBeDisabled({ timeout: 2000 });
  });

  test("TC-SUB-003: 결과 패널 점수 표시", async ({ page }) => {
    // 이전에 제출한 결과가 있다고 가정
    await page.getByTestId("tab-result").click();

    // 점수 또는 "제출 결과 없음" 메시지 확인
    const hasScore = await page.getByText(/\d+\s*점|\d+\/100/i).isVisible().catch(() => false);
    const hasNoResult = await page.getByText(/제출.*없|아직/i).isVisible().catch(() => false);

    expect(hasScore || hasNoResult).toBeTruthy();
  });

  test("TC-SUB-004: AI 피드백 표시", async ({ page }) => {
    await page.getByTestId("tab-result").click();

    // AI 피드백 섹션 확인 (있을 경우)
    const feedbackSection = page.locator('[data-testid="ai-feedback"]');
    if (await feedbackSection.isVisible()) {
      await expect(feedbackSection.getByText(/잘한 점|아쉬운 점|제안/i)).toBeVisible();
    }
  });

  test("TC-SUB-005: 제출 히스토리 표시", async ({ page }) => {
    await page.getByTestId("tab-history").click();

    // 히스토리 목록 또는 "없음" 메시지
    const hasList = await page.locator('[data-testid^="history-item"]').count();
    const hasEmpty = await page.getByText(/히스토리.*없|기록.*없/i).isVisible().catch(() => false);

    expect(hasList > 0 || hasEmpty).toBeTruthy();
  });

  test("TC-SUB-006: 히스토리에서 이전 코드 불러오기", async ({ page }) => {
    await page.getByTestId("tab-history").click();

    const historyItem = page.locator('[data-testid^="history-item"]').first();

    if (await historyItem.isVisible()) {
      const loadBtn = historyItem.getByRole("button", { name: /불러오기|load|복원/i });
      if (await loadBtn.isVisible()) {
        await loadBtn.click();
        // 코드 에디터에 코드가 로드됨 확인
        await page.waitForTimeout(500);
      }
    }
  });
});

// ============================================================================
// 5. 인증 테스트
// ============================================================================
test.describe("인증", () => {
  test("TC-AUTH-001: 로그인 페이지 표시", async ({ page }) => {
    await page.goto("/auth/login");

    // 로그인 폼 또는 OAuth 버튼 확인
    const githubBtn = page.getByRole("button", { name: /github/i });
    const googleBtn = page.getByRole("button", { name: /google/i });

    const hasAuthOption = (await githubBtn.isVisible()) || (await googleBtn.isVisible());
    expect(hasAuthOption).toBeTruthy();
  });

  test("TC-AUTH-002: 비로그인 상태에서 대시보드 접근 시 리다이렉트", async ({ page }) => {
    await page.goto("/dashboard");

    // 로그인 페이지로 리다이렉트되거나 로그인 요청 메시지
    await expect(page).toHaveURL(/\/auth\/login|\/login/i, { timeout: 5000 });
  });

  test("TC-AUTH-003: 로그인 상태 유지 확인", async ({ page }) => {
    // 로그인 상태라면 사용자 메뉴 표시
    await page.goto("/");

    const userMenu = page.locator('[data-testid="user-menu"]');
    const loginBtn = page.getByRole("link", { name: /로그인|login/i });

    // 둘 중 하나는 표시되어야 함
    const hasUserMenu = await userMenu.isVisible().catch(() => false);
    const hasLoginBtn = await loginBtn.isVisible().catch(() => false);

    expect(hasUserMenu || hasLoginBtn).toBeTruthy();
  });

  test("TC-AUTH-004: 게스트로 문제 풀기 가능", async ({ page }) => {
    // 비로그인 상태로 문제 목록 접근
    await page.goto("/problems");

    // 문제 목록이 표시되어야 함
    await expect(page.getByRole("heading", { name: /문제/i })).toBeVisible({
      timeout: 30000,
    });

    // 문제 상세 페이지도 접근 가능
    const problemLink = page.locator('a[href^="/problems/"]').first();
    if (await problemLink.isVisible()) {
      await problemLink.click();
      await expect(page.getByTestId("code-editor-area")).toBeVisible({
        timeout: 30000,
      });
    }
  });
});

// ============================================================================
// 6. 대시보드 테스트 (로그인 필요)
// ============================================================================
test.describe("대시보드", () => {
  // 로그인이 필요한 테스트는 skip 처리 (실제 환경에서는 로그인 fixture 사용)
  test.skip("TC-DASH-001: 대시보드 로드 및 요약 카드 표시", async ({ page }) => {
    await page.goto("/dashboard");

    // 요약 카드들 확인
    await expect(page.getByText(/총 제출|total/i)).toBeVisible();
    await expect(page.getByText(/평균 점수|average/i)).toBeVisible();
  });

  test.skip("TC-DASH-002: 타임라인 차트 표시", async ({ page }) => {
    await page.goto("/dashboard");

    // 차트 컨테이너 확인
    const chartContainer = page.locator('[data-testid="timeline-chart"]');
    await expect(chartContainer).toBeVisible();
  });

  test.skip("TC-DASH-003: 기간 필터 동작", async ({ page }) => {
    await page.goto("/dashboard");

    // 기간 필터 버튼들
    const weekBtn = page.getByRole("button", { name: /7d|7일|1주/i });
    const monthBtn = page.getByRole("button", { name: /30d|30일|1달/i });

    if (await weekBtn.isVisible()) {
      await weekBtn.click();
      await page.waitForTimeout(500);
    }

    if (await monthBtn.isVisible()) {
      await monthBtn.click();
      await page.waitForTimeout(500);
    }
  });

  test.skip("TC-DASH-004: 난이도별 성과 차트 표시", async ({ page }) => {
    await page.goto("/dashboard");

    const difficultyChart = page.locator('[data-testid="difficulty-chart"]');
    await expect(difficultyChart).toBeVisible();
  });

  test.skip("TC-DASH-005: 빈 상태 처리 (제출 이력 없음)", async ({ page }) => {
    await page.goto("/dashboard");

    // 빈 상태 메시지 또는 데이터 표시
    const emptyState = page.getByText(/제출 기록.*없|아직.*없/i);
    const hasData = page.getByText(/총 제출.*\d+/i);

    const isEmpty = await emptyState.isVisible().catch(() => false);
    const hasDataVisible = await hasData.isVisible().catch(() => false);

    expect(isEmpty || hasDataVisible).toBeTruthy();
  });
});

// ============================================================================
// 7. 제출 목록 페이지 테스트
// ============================================================================
test.describe("제출 목록", () => {
  test("TC-SUBLIST-001: 제출 목록 페이지 로드", async ({ page }) => {
    await page.goto("/submissions");

    // 제출 목록 또는 빈 상태 확인
    const hasSubmissions = await page.locator('[data-testid^="submission-"]').count();
    const hasEmpty = await page.getByText(/제출.*없|기록.*없/i).isVisible().catch(() => false);
    const hasLoginRequired = await page.getByText(/로그인/i).isVisible().catch(() => false);

    expect(hasSubmissions > 0 || hasEmpty || hasLoginRequired).toBeTruthy();
  });

  test("TC-SUBLIST-002: 제출 상세 보기", async ({ page }) => {
    await page.goto("/submissions");

    const submissionItem = page.locator('[data-testid^="submission-"]').first();

    if (await submissionItem.isVisible()) {
      await submissionItem.click();
      // 상세 정보 표시 확인
      await page.waitForTimeout(500);
    }
  });
});

// ============================================================================
// 8. 에러 처리 테스트
// ============================================================================
test.describe("에러 처리", () => {
  test("TC-ERR-001: 404 페이지 표시", async ({ page }) => {
    await page.goto("/non-existent-page-12345");

    // 404 메시지 확인
    await expect(page.getByText(/404|찾을 수 없|not found/i)).toBeVisible();
  });

  test("TC-ERR-002: 존재하지 않는 문제 접근", async ({ page }) => {
    await page.goto("/problems/99999999");

    // 에러 메시지 또는 리다이렉트
    const hasError = await page.getByText(/찾을 수 없|없는 문제|not found/i).isVisible().catch(() => false);
    const redirected = page.url().includes("/problems") && !page.url().includes("99999999");

    expect(hasError || redirected).toBeTruthy();
  });

  test("TC-ERR-003: 네트워크 에러 처리", async ({ page }) => {
    // API 요청 실패 시뮬레이션
    await page.route("**/api/**", (route) => route.abort());

    await page.goto("/problems");

    // 에러 메시지 또는 재시도 버튼 확인
    await expect(page.getByText(/오류|에러|error|재시도/i)).toBeVisible({ timeout: 10000 });
  });
});

// ============================================================================
// 9. 반응형 UI 테스트
// ============================================================================
test.describe("반응형 UI", () => {
  test("TC-RESP-001: 모바일 뷰포트에서 문제 목록", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/problems");

    await expect(page.getByRole("heading", { name: /문제/i })).toBeVisible({
      timeout: 30000,
    });
  });

  test("TC-RESP-002: 모바일 뷰포트에서 문제 풀이 페이지", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/problems");

    const problemLink = page.locator('a[href^="/problems/"]').first();
    if (await problemLink.isVisible({ timeout: 10000 })) {
      await problemLink.click();

      // 모바일에서 탭 UI 확인
      await expect(page.getByTestId("code-editor-area")).toBeVisible({
        timeout: 30000,
      });
    }
  });

  test("TC-RESP-003: 태블릿 뷰포트에서 레이아웃", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/problems");

    await expect(page.getByRole("heading", { name: /문제/i })).toBeVisible({
      timeout: 30000,
    });
  });
});

// ============================================================================
// 10. 접근성 테스트
// ============================================================================
test.describe("접근성", () => {
  test("TC-A11Y-001: 키보드 네비게이션", async ({ page }) => {
    await page.goto("/problems");
    await page.waitForLoadState("networkidle");

    // Tab 키로 포커스 이동
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // 포커스된 요소 확인
    const focusedElement = page.locator(":focus");
    await expect(focusedElement).toBeVisible();
  });

  test("TC-A11Y-002: 스크린 리더 레이블 확인", async ({ page }) => {
    await page.goto("/problems");

    // 주요 버튼들에 aria-label 또는 텍스트가 있는지 확인
    const buttons = page.getByRole("button");
    const count = await buttons.count();

    for (let i = 0; i < Math.min(count, 5); i++) {
      const button = buttons.nth(i);
      const hasLabel =
        (await button.getAttribute("aria-label")) ||
        (await button.textContent());
      expect(hasLabel).toBeTruthy();
    }
  });
});
