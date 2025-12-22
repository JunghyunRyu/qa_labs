import { test, expect } from "@playwright/test";

/**
 * PR-0: Problem Detail Core Loop Smoke Test
 *
 * Goal: Establish a "baseline" so the core loop doesn't break even when layout changes.
 * Scope:
 * - /problems/:id entry
 * - Code writing → bottom tabs check
 * - Logs tab switch verification
 * - Local test (if available) or submit button visibility
 *
 * Note: Local test button only appears if the problem has golden_code.
 * The smoke test is designed to be resilient to this.
 */

test.describe("Problem Detail Core Loop", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to problems list first
    await page.goto("/problems");

    // Wait for problems list to load
    await expect(page.getByRole("heading", { name: /문제/ })).toBeVisible({
      timeout: 30000,
    });

    // Click on the first problem card to navigate to detail page
    // Look for a link that starts with /problems/
    const problemLink = page.locator('a[href^="/problems/"]').first();
    await expect(problemLink).toBeVisible({ timeout: 10000 });
    await problemLink.click();

    // Wait for problem detail page to load (editor should be visible)
    await expect(page.getByTestId("code-editor-area")).toBeVisible({
      timeout: 30000,
    });
  });

  test("should display core UI elements", async ({ page }) => {
    // Verify submit button is always visible
    await expect(page.getByTestId("btn-submit")).toBeVisible();

    // Verify bottom tabs are visible
    await expect(page.getByTestId("tab-local")).toBeVisible();
    await expect(page.getByTestId("tab-result")).toBeVisible();
    await expect(page.getByTestId("tab-logs")).toBeVisible();
    await expect(page.getByTestId("tab-history")).toBeVisible();

    // Local test button may or may not be visible depending on golden_code availability
    // This is expected behavior, so we just log whether it's present
    const localTestBtn = page.getByTestId("btn-local-test");
    const hasLocalTest = await localTestBtn.isVisible().catch(() => false);
    console.log(`Local test button available: ${hasLocalTest}`);
  });

  test("should switch between tabs", async ({ page }) => {
    // Click logs tab
    await page.getByTestId("tab-logs").click();
    // Verify logs tab is now active (has active styling)
    await expect(page.getByTestId("tab-logs")).toHaveClass(/text-sky-600|border-sky-500/);

    // Click result tab
    await page.getByTestId("tab-result").click();
    await expect(page.getByTestId("tab-result")).toHaveClass(/text-sky-600|border-sky-500/);

    // Click history tab
    await page.getByTestId("tab-history").click();
    await expect(page.getByTestId("tab-history")).toHaveClass(/text-sky-600|border-sky-500/);

    // Click local tab (back to default)
    await page.getByTestId("tab-local").click();
    await expect(page.getByTestId("tab-local")).toHaveClass(/text-sky-600|border-sky-500/);
  });

  test("should enable submit button when code is modified", async ({ page }) => {
    // The submit button should become enabled when there's code
    const submitBtn = page.getByTestId("btn-submit");

    // Find Monaco editor and click to focus
    const editorArea = page.getByTestId("code-editor-area");
    await editorArea.click();

    // Use Ctrl+A to select all, then type new code
    await page.keyboard.press("Control+a");
    await page.keyboard.type("def test_example():\n    assert True");

    // Wait a bit for React state to update
    await page.waitForTimeout(500);

    // Button should be enabled (since there's code)
    await expect(submitBtn).toBeEnabled();
  });

  test("should handle local test when available", async ({ page }) => {
    const localTestBtn = page.getByTestId("btn-local-test");
    const hasLocalTest = await localTestBtn.isVisible().catch(() => false);

    if (!hasLocalTest) {
      // Skip this test if local test is not available
      console.log("Skipping: Local test button not available for this problem");
      test.skip();
      return;
    }

    // Enter some test code
    const editorArea = page.getByTestId("code-editor-area");
    await editorArea.click();
    await page.keyboard.press("Control+a");
    await page.keyboard.type("def test_example():\n    assert True");
    await page.waitForTimeout(500);

    // Click local test button
    await localTestBtn.click();

    // Tab should auto-switch to local test tab
    await expect(page.getByTestId("tab-local")).toHaveClass(/text-sky-600|border-sky-500/);

    // Wait for test to complete (Pyodide can take time to initialize)
    await expect(async () => {
      const isLoading = await page.getByText("테스트 중...").isVisible().catch(() => false);
      const hasResult = await page.getByText(/테스트 통과|테스트 실패|오류/).isVisible().catch(() => false);

      if (!isLoading || hasResult) {
        return;
      }
      throw new Error("Still loading");
    }).toPass({ timeout: 60000 });
  });
});
