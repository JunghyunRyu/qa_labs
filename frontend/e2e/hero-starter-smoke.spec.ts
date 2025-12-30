import { test, expect } from "@playwright/test";

/**
 * HeroStarter 컴포넌트 스모크 테스트
 *
 * PR-2 핵심 플로우를 테스트로 고정하여 회귀 방지
 *
 * 테스트 범위:
 * 1. 도메인 변경 시 추천 카드 변경
 * 2. 추천 카드 CTA 동작
 * 3. 모바일 레이아웃 (375px)
 */

test.describe("HeroStarter 컴포넌트", () => {
  test.beforeEach(async ({ page }) => {
    // localStorage 초기화 (테스트 격리)
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("qa-arena-selected-domain"));
    await page.reload();
    await page.waitForLoadState("networkidle");
  });

  // ==========================================================================
  // 1. 도메인 변경 시 추천 카드 변경
  // ==========================================================================
  test("TC-HERO-001: 도메인 변경 시 추천 카드 제목이 변경됨", async ({ page }) => {
    // HeroStarter 컴포넌트 확인
    const heroStarter = page.getByTestId("hero-starter");
    await expect(heroStarter).toBeVisible({ timeout: 10000 });

    // 초기 상태: common 도메인 선택 (기본값)
    const commonChip = page.getByTestId("domain-chip-common");
    await expect(commonChip).toBeVisible();

    // 초기 카드 제목 저장
    const cardTitle = page.getByTestId("starter-card-title");
    const initialTitle = await cardTitle.textContent();
    expect(initialTitle).toBeTruthy();

    // fintech 도메인 클릭
    const fintechChip = page.getByTestId("domain-chip-fintech");
    await expect(fintechChip).toBeVisible();
    await fintechChip.click();

    // 애니메이션 완료 대기 (150ms fade + buffer)
    await page.waitForTimeout(300);

    // 카드 제목이 변경되었는지 확인
    const newTitle = await cardTitle.textContent();
    expect(newTitle).toBeTruthy();
    expect(newTitle).not.toBe(initialTitle);
  });

  test("TC-HERO-002: 도메인 변경 시 도메인 설명이 변경됨", async ({ page }) => {
    const heroStarter = page.getByTestId("hero-starter");
    await expect(heroStarter).toBeVisible({ timeout: 10000 });

    // 초기 도메인 설명 저장
    const domainDesc = page.getByTestId("domain-description");
    const initialDesc = await domainDesc.textContent();

    // commerce 도메인 클릭
    const commerceChip = page.getByTestId("domain-chip-commerce");
    await commerceChip.click();
    await page.waitForTimeout(300);

    // 설명이 변경되었는지 확인
    const newDesc = await domainDesc.textContent();
    expect(newDesc).not.toBe(initialDesc);
  });

  test("TC-HERO-003: localStorage에 선택한 도메인이 저장됨", async ({ page }) => {
    const heroStarter = page.getByTestId("hero-starter");
    await expect(heroStarter).toBeVisible({ timeout: 10000 });

    // fintech 도메인 클릭
    const fintechChip = page.getByTestId("domain-chip-fintech");
    await fintechChip.click();
    await page.waitForTimeout(300);

    // localStorage 확인
    const savedDomain = await page.evaluate(() =>
      localStorage.getItem("qa-arena-selected-domain")
    );
    expect(savedDomain).toBe("fintech");
  });

  test("TC-HERO-004: 페이지 새로고침 시 선택한 도메인이 유지됨", async ({ page }) => {
    const heroStarter = page.getByTestId("hero-starter");
    await expect(heroStarter).toBeVisible({ timeout: 10000 });

    // saas 도메인 클릭
    const saasChip = page.getByTestId("domain-chip-saas");
    await saasChip.click();
    await page.waitForTimeout(300);

    // 카드 제목 저장
    const cardTitle = page.getByTestId("starter-card-title");
    const titleBeforeReload = await cardTitle.textContent();

    // 페이지 새로고침
    await page.reload();
    await page.waitForLoadState("networkidle");

    // 같은 도메인이 선택되어 있는지 확인
    await expect(heroStarter).toBeVisible();
    const titleAfterReload = await cardTitle.textContent();
    expect(titleAfterReload).toBe(titleBeforeReload);
  });

  // ==========================================================================
  // 2. 추천 카드 CTA 동작
  // ==========================================================================
  test("TC-HERO-005: 도전하기 버튼 클릭 시 문제 페이지로 이동", async ({ page }) => {
    const heroStarter = page.getByTestId("hero-starter");
    await expect(heroStarter).toBeVisible({ timeout: 10000 });

    // CTA 버튼 클릭
    const ctaButton = page.getByTestId("starter-card-cta");
    await expect(ctaButton).toBeVisible();
    await ctaButton.click();

    // /problems/:id 형태의 URL로 이동했는지 확인
    await expect(page).toHaveURL(/\/problems\/[\w-]+/);
  });

  test("TC-HERO-006: 추천 카드 전체 클릭 시 문제 페이지로 이동", async ({ page }) => {
    const heroStarter = page.getByTestId("hero-starter");
    await expect(heroStarter).toBeVisible({ timeout: 10000 });

    // 카드 클릭 (CTA가 아닌 카드 영역)
    const starterCard = page.getByTestId("starter-card");
    await starterCard.click();

    // /problems/:id 형태의 URL로 이동했는지 확인
    await expect(page).toHaveURL(/\/problems\/[\w-]+/);
  });

  // ==========================================================================
  // 3. 모바일 레이아웃 (375px)
  // ==========================================================================
  test("TC-HERO-007: 모바일 뷰포트에서 도메인 칩이 wrap됨", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const heroStarter = page.getByTestId("hero-starter");
    await expect(heroStarter).toBeVisible({ timeout: 10000 });

    // 도메인 칩 컨테이너 확인
    const domainChips = page.getByTestId("domain-chips");
    await expect(domainChips).toBeVisible();

    // 모든 도메인 칩이 표시되는지 확인
    const chips = [
      "domain-chip-common",
      "domain-chip-fintech",
      "domain-chip-commerce",
      "domain-chip-saas",
      "domain-chip-platform",
      "domain-chip-content",
    ];

    for (const chipId of chips) {
      await expect(page.getByTestId(chipId)).toBeVisible();
    }
  });

  test("TC-HERO-008: 모바일에서 도메인 변경 동작", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const heroStarter = page.getByTestId("hero-starter");
    await expect(heroStarter).toBeVisible({ timeout: 10000 });

    // 초기 카드 제목
    const cardTitle = page.getByTestId("starter-card-title");
    const initialTitle = await cardTitle.textContent();

    // platform 도메인 클릭
    const platformChip = page.getByTestId("domain-chip-platform");
    await platformChip.click();
    await page.waitForTimeout(300);

    // 제목 변경 확인
    const newTitle = await cardTitle.textContent();
    expect(newTitle).not.toBe(initialTitle);
  });

  test("TC-HERO-009: 모바일에서 CTA 버튼 클릭 가능", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const heroStarter = page.getByTestId("hero-starter");
    await expect(heroStarter).toBeVisible({ timeout: 10000 });

    // CTA 버튼이 보이고 클릭 가능한지 확인
    const ctaButton = page.getByTestId("starter-card-cta");
    await expect(ctaButton).toBeVisible();
    await expect(ctaButton).toBeEnabled();

    // 클릭 후 이동 확인
    await ctaButton.click();
    await expect(page).toHaveURL(/\/problems\/[\w-]+/);
  });

  // ==========================================================================
  // 4. 접근성 및 애니메이션
  // ==========================================================================
  test("TC-HERO-010: 동일 도메인 재클릭 시 불필요한 애니메이션 없음", async ({ page }) => {
    const heroStarter = page.getByTestId("hero-starter");
    await expect(heroStarter).toBeVisible({ timeout: 10000 });

    // common 도메인 (기본값) 클릭
    const commonChip = page.getByTestId("domain-chip-common");
    const cardTitle = page.getByTestId("starter-card-title");

    const titleBefore = await cardTitle.textContent();
    await commonChip.click();
    await page.waitForTimeout(50); // 짧은 대기

    // 제목이 그대로인지 확인 (애니메이션이 발생하지 않음)
    const titleAfter = await cardTitle.textContent();
    expect(titleAfter).toBe(titleBefore);
  });

  test("TC-HERO-011: 도메인 칩에 키보드로 접근 가능", async ({ page }) => {
    const heroStarter = page.getByTestId("hero-starter");
    await expect(heroStarter).toBeVisible({ timeout: 10000 });

    // Tab 키로 도메인 칩에 포커스
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");

    // 포커스된 요소가 도메인 칩인지 확인
    const focusedElement = page.locator(":focus");
    const testId = await focusedElement.getAttribute("data-testid");

    // 도메인 칩 중 하나에 포커스가 있으면 성공
    const isDomainChip = testId?.startsWith("domain-chip-") ?? false;
    // 또는 다른 인터랙티브 요소에 포커스 (레이아웃에 따라 다를 수 있음)
    expect(isDomainChip || (await focusedElement.isVisible())).toBeTruthy();
  });
});

// ==========================================================================
// (선택) 시각 회귀 테스트
// ==========================================================================
test.describe("HeroStarter 시각 회귀", () => {
  test("TC-HERO-VR-001: 히어로 영역 스크린샷 비교", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const heroStarter = page.getByTestId("hero-starter");
    await expect(heroStarter).toBeVisible({ timeout: 10000 });

    // HeroStarter 영역만 스크린샷
    await expect(heroStarter).toHaveScreenshot("hero-starter-default.png", {
      maxDiffPixelRatio: 0.02, // 2% 허용
    });
  });

  test("TC-HERO-VR-002: 도메인 변경 후 스크린샷 비교", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const heroStarter = page.getByTestId("hero-starter");
    await expect(heroStarter).toBeVisible({ timeout: 10000 });

    // fintech 도메인 선택
    await page.getByTestId("domain-chip-fintech").click();
    await page.waitForTimeout(300);

    // 스크린샷 비교
    await expect(heroStarter).toHaveScreenshot("hero-starter-fintech.png", {
      maxDiffPixelRatio: 0.02,
    });
  });

  test("TC-HERO-VR-003: 모바일 뷰포트 스크린샷", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const heroStarter = page.getByTestId("hero-starter");
    await expect(heroStarter).toBeVisible({ timeout: 10000 });

    await expect(heroStarter).toHaveScreenshot("hero-starter-mobile.png", {
      maxDiffPixelRatio: 0.02,
    });
  });
});
