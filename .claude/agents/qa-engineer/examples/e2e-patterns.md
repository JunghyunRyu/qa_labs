# E2E 테스트 패턴 예시 (Playwright)

> QA Labs 프로젝트의 브라우저 자동화 테스트 패턴

---

## 1. 기본 페이지 테스트

```typescript
// frontend/e2e/home.spec.ts
import { test, expect } from '@playwright/test';

test.describe('홈페이지', () => {
  test('페이지 로드 및 기본 요소 확인', async ({ page }) => {
    await page.goto('/');

    // 제목 확인
    await expect(page).toHaveTitle(/QA Arena/);

    // 핵심 요소 존재 확인
    await expect(page.locator('header')).toBeVisible();
    await expect(page.getByRole('link', { name: '문제 풀기' })).toBeVisible();
    await expect(page.getByRole('link', { name: '로그인' })).toBeVisible();
  });

  test('네비게이션 링크 동작', async ({ page }) => {
    await page.goto('/');

    // 문제 목록으로 이동
    await page.click('text=문제 풀기');
    await expect(page).toHaveURL('/problems');
  });
});
```

---

## 2. 인증 플로우 테스트

```typescript
// frontend/e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('인증', () => {
  test('GitHub 로그인 버튼 클릭', async ({ page }) => {
    await page.goto('/auth/login');

    // GitHub 로그인 버튼 확인
    const githubButton = page.getByRole('button', { name: /GitHub/i });
    await expect(githubButton).toBeVisible();

    // 클릭 시 OAuth 페이지로 이동 확인
    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      githubButton.click()
    ]);

    await expect(popup).toHaveURL(/github\.com\/login\/oauth/);
  });

  test('로그인 상태 유지', async ({ page, context }) => {
    // 인증 상태 설정 (storageState 활용)
    await context.addCookies([
      {
        name: 'access_token',
        value: 'test_token',
        domain: 'localhost',
        path: '/'
      }
    ]);

    await page.goto('/');

    // 로그인 상태 UI 확인
    await expect(page.getByText('내 프로필')).toBeVisible();
    await expect(page.getByRole('link', { name: '로그인' })).not.toBeVisible();
  });
});
```

---

## 3. 문제 풀이 플로우 테스트

```typescript
// frontend/e2e/problem-solve.spec.ts
import { test, expect } from '@playwright/test';

test.describe('문제 풀이', () => {
  test.beforeEach(async ({ page }) => {
    // 인증 상태 설정 (필요시)
    await page.goto('/problems');
  });

  test('문제 목록에서 문제 선택', async ({ page }) => {
    // 첫 번째 문제 클릭
    await page.click('[data-testid="problem-card"]:first-child');

    // 문제 상세 페이지 확인
    await expect(page.locator('[data-testid="problem-description"]')).toBeVisible();
    await expect(page.locator('[data-testid="code-editor"]')).toBeVisible();
  });

  test('코드 에디터에 코드 입력', async ({ page }) => {
    await page.goto('/problems/1');

    // Monaco 에디터에 코드 입력
    const editor = page.locator('.monaco-editor textarea');
    await editor.fill(`
def test_example():
    assert 1 + 1 == 2
    `);

    // 입력 확인
    await expect(page.locator('.monaco-editor')).toContainText('test_example');
  });

  test('코드 제출 및 결과 확인', async ({ page }) => {
    await page.goto('/problems/1');

    // 코드 입력
    const editor = page.locator('.monaco-editor textarea');
    await editor.fill('def test(): assert True');

    // 제출 버튼 클릭
    await page.click('[data-testid="submit-button"]');

    // 로딩 상태 확인
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();

    // 결과 대기 (최대 30초)
    await expect(page.locator('[data-testid="result-panel"]')).toBeVisible({
      timeout: 30000
    });

    // 결과 내용 확인
    await expect(page.locator('[data-testid="score"]')).toBeVisible();
  });
});
```

---

## 4. 반응형 테스트

```typescript
// frontend/e2e/responsive.spec.ts
import { test, expect, devices } from '@playwright/test';

test.describe('반응형 디자인', () => {
  test('모바일 뷰포트에서 메뉴 토글', async ({ page }) => {
    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    // 햄버거 메뉴 확인
    const menuButton = page.locator('[data-testid="mobile-menu-button"]');
    await expect(menuButton).toBeVisible();

    // 메뉴 열기
    await menuButton.click();
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
  });

  test('태블릿 뷰포트', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/problems');

    // 그리드 레이아웃 확인
    const grid = page.locator('[data-testid="problem-grid"]');
    await expect(grid).toHaveCSS('grid-template-columns', /repeat\(2/);
  });

  test('데스크톱 뷰포트', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/problems');

    // 사이드바 표시 확인
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
  });
});

// 다양한 디바이스 테스트
for (const deviceName of ['iPhone 13', 'iPad Pro', 'Desktop Chrome']) {
  test(`${deviceName}에서 기본 동작`, async ({ playwright, browser }) => {
    const device = devices[deviceName] || { viewport: { width: 1920, height: 1080 } };
    const context = await browser.newContext({ ...device });
    const page = await context.newPage();

    await page.goto('/');
    await expect(page).toHaveTitle(/QA Arena/);

    await context.close();
  });
}
```

---

## 5. API 모킹

```typescript
// frontend/e2e/api-mock.spec.ts
import { test, expect } from '@playwright/test';

test.describe('API 모킹', () => {
  test('문제 목록 API 모킹', async ({ page }) => {
    // API 응답 모킹
    await page.route('**/api/v1/problems', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            { id: 1, title: '테스트 문제', difficulty: 'easy' },
            { id: 2, title: '어려운 문제', difficulty: 'hard' }
          ],
          total: 2
        })
      });
    });

    await page.goto('/problems');

    // 모킹된 데이터 표시 확인
    await expect(page.getByText('테스트 문제')).toBeVisible();
    await expect(page.getByText('어려운 문제')).toBeVisible();
  });

  test('API 에러 처리', async ({ page }) => {
    // 500 에러 응답 모킹
    await page.route('**/api/v1/problems', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });

    await page.goto('/problems');

    // 에러 메시지 표시 확인
    await expect(page.getByText(/문제가 발생했습니다/)).toBeVisible();
  });

  test('느린 네트워크 시뮬레이션', async ({ page }) => {
    // 느린 응답 시뮬레이션
    await page.route('**/api/v1/submissions/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 3000));
      route.fulfill({
        status: 200,
        body: JSON.stringify({ status: 'success' })
      });
    });

    await page.goto('/problems/1');
    await page.click('[data-testid="submit-button"]');

    // 로딩 UI 확인
    await expect(page.locator('[data-testid="loading-spinner"]')).toBeVisible();
  });
});
```

---

## 6. 스크린샷 및 비주얼 테스트

```typescript
// frontend/e2e/visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('비주얼 테스트', () => {
  test('홈페이지 스크린샷', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveScreenshot('homepage.png');
  });

  test('문제 상세 페이지 스크린샷', async ({ page }) => {
    await page.goto('/problems/1');

    // 특정 요소만 스크린샷
    const description = page.locator('[data-testid="problem-description"]');
    await expect(description).toHaveScreenshot('problem-description.png');
  });

  test('다크모드 스크린샷', async ({ page }) => {
    await page.goto('/');

    // 다크모드 토글
    await page.click('[data-testid="theme-toggle"]');

    await expect(page).toHaveScreenshot('homepage-dark.png');
  });
});
```

---

## 7. playwright.config.ts 예시

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

*E2E 테스트 패턴 v1.0 - Playwright 기반*
