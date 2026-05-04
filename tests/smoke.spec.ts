import { expect, test, type Page } from "@playwright/test";

const SAVE_KEY = "echo-doesnt-know-save";

async function startGame(page: Page) {
  await page.addInitScript(() => {
    localStorage.clear();
    localStorage.setItem("debugMode", "true");
  });
  await page.goto("/game");
  await expect(page.getByText("ECHO DOESN'T KNOW")).toBeVisible();
  await page.getByTestId("start-new-game").click();
  await expect(page.getByTestId("debug-toggle")).toBeVisible();
}

async function openDebug(page: Page) {
  const panel = page.getByTestId("debug-panel");
  if (!(await panel.isVisible().catch(() => false))) {
    await page.getByTestId("debug-toggle").click();
  }
  await expect(panel).toBeVisible();
}

async function savedState(page: Page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), SAVE_KEY);
}

async function waitForSavedChapter(page: Page, chapter: number) {
  await expect
    .poll(async () => {
      const saved = await savedState(page);
      return saved.chapter;
    })
    .toBe(chapter);
}

async function expectNoBrokenImages(page: Page, expectedSrcPart?: string) {
  await expect
    .poll(async () => {
      const images = await page.locator("img").evaluateAll((nodes) =>
        nodes.map((node) => {
          const image = node as HTMLImageElement;
          return {
            src: image.src,
            complete: image.complete,
            naturalWidth: image.naturalWidth,
          };
        })
      );
      const valid = images.every((image) => image.src !== "" && image.complete && image.naturalWidth > 0);
      const hasExpected = expectedSrcPart ? images.some((image) => image.src.includes(expectedSrcPart)) : true;
      return valid && hasExpected;
    })
    .toBe(true);
}

test("app loads without critical console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(message.text());
    }
  });
  page.on("pageerror", (error) => errors.push(error.message));

  await startGame(page);
  await waitForSavedChapter(page, 1);
  await expectNoBrokenImages(page);

  expect(errors).toEqual([]);
});

test("DebugPanel opens and exposes navigation, presets, and ending shortcuts", async ({ page }) => {
  await startGame(page);
  await openDebug(page);

  for (const chapter of [1, 2, 3, 4]) {
    await expect(page.getByTestId(`debug-chapter-${chapter}`)).toBeVisible();
  }

  for (const preset of ["basic", "serin", "hidden", "doctor"]) {
    await expect(page.getByTestId(`debug-preset-${preset}`)).toBeVisible();
  }

  for (const endingId of ["doctor_completion", "escape_alone", "coexistence", "hidden_seoha_name", "serin_betrayal"]) {
    await expect(page.getByTestId(`debug-ending-${endingId}`)).toBeVisible();
  }
});

test("DebugPanel can jump to Chapter 1 through Chapter 4", async ({ page }) => {
  await startGame(page);
  await openDebug(page);

  for (const chapter of [1, 2, 3, 4]) {
    await page.getByTestId(`debug-chapter-${chapter}`).click();
    await waitForSavedChapter(page, chapter);
  }

  await expect(page.getByTestId("investigation-targets")).toBeVisible();
});

test("ending shortcuts show all five ending screens and images", async ({ page }) => {
  await startGame(page);
  await openDebug(page);

  const endings = [
    { id: "doctor_completion", image: "ending_doctor_completion.png" },
    { id: "escape_alone", image: "ending_escape_alone.png" },
    { id: "coexistence", image: "ending_coexistence.png" },
    { id: "hidden_seoha_name", image: "ending_hidden_seoha_name.png" },
    { id: "serin_betrayal", image: "ending_betrayal_archive.png" },
  ];

  for (const ending of endings) {
    await page.getByTestId(`debug-ending-${ending.id}`).click();
    await expect
      .poll(async () => {
        const saved = await savedState(page);
        return saved.endingId;
      })
      .toBe(ending.id);
    await expect(page.getByTestId("chapter-clear-overlay")).toBeVisible();
    await expectNoBrokenImages(page, ending.image);
  }
});

test("debug presets update localStorage flags", async ({ page }) => {
  await startGame(page);
  await openDebug(page);

  await page.getByTestId("debug-preset-basic").click();
  await expect.poll(async () => (await savedState(page)).progressFlags?.chapter4RestoredFinalSentence).toBe(true);
  await expect.poll(async () => (await savedState(page)).hiddenEndingFlags?.confirmedIanName).toBe(false);

  await page.getByTestId("debug-preset-serin").click();
  await expect.poll(async () => (await savedState(page)).serinRouteFlags?.chapter3UnderstoodSerinMotive).toBe(true);

  await page.getByTestId("debug-preset-hidden").click();
  await expect.poll(async () => (await savedState(page)).hiddenEndingFlags?.confirmedIanName).toBe(true);
  await expect.poll(async () => (await savedState(page)).hiddenEndingFlags?.connectedSeohaToPhoto).toBe(true);
  await expect.poll(async () => (await savedState(page)).loreFlags?.chapter3SawSeohaName).toBe(true);

  await page.getByTestId("debug-preset-doctor").click();
  await expect.poll(async () => (await savedState(page)).serinRouteFlags?.chapter3UnderstoodSerinMotive).toBe(false);
});

test("DebugPanel clears localStorage and reloads safely", async ({ page }) => {
  await startGame(page);
  await openDebug(page);
  await page.getByTestId("debug-clear-save").click();

  await expect.poll(async () => page.evaluate((key) => localStorage.getItem(key), SAVE_KEY)).toBeNull();

  await page.reload();
  await expect(page.getByText("ECHO DOESN'T KNOW")).toBeVisible();
});
