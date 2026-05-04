import { expect, test, type Page } from "@playwright/test";

const GAME_PATH = "/game";
const SAVE_KEY = "echo-doesnt-know-save";

function collectConsoleErrors(page: Page) {
  const errors: string[] = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => errors.push(error.message));

  return errors;
}

async function resetBrowserState(page: Page) {
  await page.goto(GAME_PATH, { waitUntil: "domcontentloaded" });
  await page.evaluate((key) => {
    localStorage.removeItem(key);
    localStorage.removeItem("debugMode");
  }, SAVE_KEY);
  await page.reload({ waitUntil: "domcontentloaded" });
}

async function expectNoBrokenImages(page: Page) {
  await expect
    .poll(async () =>
      page.evaluate(() =>
        Array.from(document.images)
          .filter((image) => !image.complete || image.naturalWidth === 0)
          .map((image) => image.src)
      )
    )
    .toEqual([]);
}

test("home screen renders title visual without debug controls", async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await page.goto(GAME_PATH, { waitUntil: "domcontentloaded" });
  await page.evaluate((key) => {
    localStorage.removeItem(key);
    localStorage.setItem("debugMode", "true");
  }, SAVE_KEY);
  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(page.getByAltText("Who Remembers Echo main visual")).toBeVisible();
  await expect(page.getByTestId("start-new-game")).toBeVisible();
  await expect(page.getByTestId("continue-game")).toBeDisabled();
  await expect(page.getByTestId("clear-save")).toBeVisible();
  await expect(page.getByTestId("debug-toggle")).toHaveCount(0);
  await expectNoBrokenImages(page);
  expect(consoleErrors).toEqual([]);
});

test("start button enters Chapter 1", async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await resetBrowserState(page);
  await page.getByTestId("start-new-game").click();

  await expect(page.getByText(/CHAPTER 1/i).first()).toBeVisible();
  await expect(page.getByTestId("debug-toggle")).toHaveCount(0);
  await expectNoBrokenImages(page);
  expect(consoleErrors).toEqual([]);
});

test("continue uses only this browser localStorage save", async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await page.goto(GAME_PATH, { waitUntil: "domcontentloaded" });
  await page.evaluate((key) => {
    localStorage.setItem(
      key,
      JSON.stringify({
        currentScreen: "game",
        chapter: 2,
        chapterCleared: false,
        progressFlags: { chapter1Cleared: true, chapter2Started: true },
      })
    );
  }, SAVE_KEY);
  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(page.getByTestId("continue-game")).toBeEnabled();
  await page.getByTestId("continue-game").click();
  await expect(page.getByText(/CHAPTER 2/i).first()).toBeVisible();
  await expect(page.getByTestId("debug-toggle")).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});

test("save reset clears local progress and keeps debug hidden", async ({ page }) => {
  const consoleErrors = collectConsoleErrors(page);

  await page.goto(GAME_PATH, { waitUntil: "domcontentloaded" });
  await page.evaluate((key) => {
    localStorage.setItem("debugMode", "true");
    localStorage.setItem(key, JSON.stringify({ chapter: 4, currentScreen: "game" }));
  }, SAVE_KEY);
  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(page.getByTestId("clear-save")).toBeVisible();
  await page.getByTestId("clear-save").click();
  await page.reload({ waitUntil: "domcontentloaded" });

  await expect(page.getByAltText("Who Remembers Echo main visual")).toBeVisible();
  await expect(page.getByTestId("continue-game")).toBeDisabled();
  await expect(page.getByTestId("debug-toggle")).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});
