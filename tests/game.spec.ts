import { test, expect, type Page } from "@playwright/test";
import { newCampaign } from "../src/game/campaign";
import { SAVE_KEY } from "../src/game/save";
import { HISTORICAL_DILEMMAS } from "../src/game/rules";
async function begin(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Begin new chapter" }).click();
  await page
    .getByRole("button", { name: "Enter the trail / Skip intro" })
    .click();
  await expect.poll(async () => parseInt(await page.getByTestId("distance").innerText())).toBeGreaterThan(0);
}

test("desktop tutorial, pause, decisions and checkpoint continuation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await begin(page);
  await page.getByRole("button", { name: "← Left", exact: true }).click();
  await expect(page.getByText("Learn the trail · 2/4")).toBeVisible();
  await page.getByRole("button", { name: "↑ Jump", exact: true }).click();
  await expect(page.getByText("Learn the trail · 3/4")).toBeVisible();
  await page.getByRole("button", { name: "↓ Slide", exact: true }).click();
  await expect(page.getByText("Learn the trail · 4/4")).toBeVisible();
  await page.getByRole("button", { name: "Skip tutorial" }).click();
  await page
    .locator("canvas")
    .evaluate((el) => ((el as any).sessionMarker = "original"));
  await page.getByRole("button", { name: "Council", exact: true }).click();
  const choice = page.locator(".decision-grid button").first();
  await choice.click();
  expect(
    await page.locator("canvas").evaluate((el) => (el as any).sessionMarker),
  ).toBe("original");
  await page.getByRole("button", { name: "Pause game" }).click();
  const distance = await page.getByTestId("distance").innerText();
  await page.waitForTimeout(500);
  await expect(page.getByTestId("distance")).toHaveText(distance);
  await page.getByRole("button", { name: "Save and return to title" }).click();
  await page.reload();
  await page.getByRole("button", { name: "Continue checkpoint" }).click();
  await expect(page.getByRole("button", { name: "Pause game" })).toBeVisible();
  await page.getByRole("button", { name: "Pause game" }).click();
  await page
    .getByRole("button", { name: "Restart chapter", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Restart chapter", exact: true })
    .click();
  await expect(page.getByTestId("score")).toHaveText("0");
  expect(errors).toEqual([]);
});
test("mobile portrait and landscape retain accessible controls and dialogs", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await begin(page);
  await expect(
    page.getByRole("button", { name: "↑ Jump", exact: true }),
  ).toBeInViewport();
  await expect(
    page.getByRole("button", { name: "Pause game" }),
  ).toBeInViewport();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: "test-results/mobile-portrait.png" });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.getByRole("button", { name: "Pause game" }).click();
  await expect(
    page.getByRole("button", { name: "Resume", exact: true }),
  ).toBeInViewport();
  await page.screenshot({ path: "test-results/mobile-landscape.png" });
});
test("corrupt saves recover and AI guide works without credentials", async ({
  page,
}) => {
  await page.addInitScript(
    (key) => localStorage.setItem(key, "{bad"),
    SAVE_KEY,
  );
  await page.goto("/");
  await expect(page.getByText(/saved checkpoint is invalid/)).toBeVisible();
  await page.getByRole("button", { name: "Begin new chapter" }).click();
  await page
    .getByRole("button", { name: "Enter the trail / Skip intro" })
    .click();
  await page.getByRole("button", { name: "AI studio", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Your question" })
    .fill("What changed with agriculture?");
  await page.getByRole("button", { name: "Ask guide" }).click();
  await expect(page.getByText(/Offline chapter guide:/)).toBeVisible();
});
test("completed objectives produce victory and allow next-era progression", async ({
  page,
}) => {
  const campaign = newCampaign();
  campaign.elapsed = 299.9;
  campaign.tutorialStep = 4;
  campaign.stats.pickupsCollected = 12;
  campaign.techIds.push("shared_fiction");
  campaign.decisionIds = HISTORICAL_DILEMMAS.filter(
    (d) => d.era === "cognitive",
  )
    .slice(0, 2)
    .map((d) => d.id);
  await page.addInitScript(
    ({ key, value }) => localStorage.setItem(key, value),
    {
      key: SAVE_KEY,
      value: JSON.stringify({
        version: 1,
        savedAt: new Date().toISOString(),
        campaign,
      }),
    },
  );
  await page.goto("/");
  await page.getByRole("button", { name: "Continue checkpoint" }).click();
  await expect(
    page.getByRole("dialog", { name: "Chapter complete" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue to next era" }).click();
  await expect(
    page.getByRole("dialog", { name: "Roots in the Earth" }),
  ).toBeVisible();
});
