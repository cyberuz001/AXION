import { devices, expect, test, type Locator } from "@playwright/test";

async function register(dialog: Locator, name: string, captain: string) {
  await dialog.getByRole("button", { name: "Jamoani ro‘yxatdan o‘tkazish" }).click();
  await dialog.getByLabel("Jamoa nomi", { exact: true }).fill(name);
  await dialog.getByLabel("Sardorning o‘yin nomi").fill(captain);
  await dialog.getByRole("button", { name: "Ro‘yxatdan o‘tish", exact: true }).click();
}

test("catalog filters work and registration accepts once, rejects duplicates, and preserves the form", async ({ page, request }) => {
  const response = await request.get("/api/tournaments");
  expect(await response.json()).toMatchObject({ mode: "demo" });
  await page.goto("/turnirlar");
  await page.getByRole("button", { name: "VALORANT", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Protocol Open" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "AXION Major" })).toHaveCount(0);
  await page.getByRole("combobox", { name: "Turnir holati" }).click();
  await page.getByRole("option", { name: "Qabul ochiq" }).click();
  await expect(page.getByRole("article")).toHaveCount(1);
  await page.getByRole("button", { name: "CS2", exact: true }).click();
  await page.getByRole("searchbox", { name: "Turnir qidirish" }).fill("Axion Major");
  await expect(page.getByRole("article")).toHaveCount(1);
  await expect(page.locator("article time")).toHaveText("12-dekabr, 2026 · 18:00 (UTC+5)");

  const details = page.getByRole("button", { name: "AXION Major tafsilotlari" });
  await details.click();
  const dialog = page.getByRole("dialog");
  await register(dialog, "Nova Five", "Private Captain");
  await expect(dialog.getByRole("status")).toHaveText("Jamoa ro‘yxatdan o‘tdi.");
  await expect(dialog.getByText("9/16")).toBeVisible();
  await expect(dialog.getByText("Private Captain", { exact: true })).toHaveCount(0);
  await register(dialog, "  ＮＯＶＡ   FIVE  ", "Other Captain");
  await expect(dialog.getByRole("alert")).toHaveText("Bu jamoa allaqachon ro‘yxatdan o‘tgan.");
  await expect(dialog.getByLabel("Jamoa nomi", { exact: true })).toHaveValue("  ＮＯＶＡ   FIVE  ");
  await expect(dialog.getByLabel("Sardorning o‘yin nomi")).toHaveValue("Other Captain");
  await dialog.getByRole("button", { name: "Orqaga" }).click();
  await expect(dialog.getByText("9/16")).toBeVisible();
  await page.reload();
  await details.click();
  await expect(dialog.getByText("Nova Five", { exact: true })).toHaveCount(1);
  await expect(dialog.getByText("Private Captain", { exact: true })).toHaveCount(0);
});

test("organizer can create, edit and finish a tournament, with tied scores rejected beside the match", async ({ page }) => {
  await page.goto("/boshqaruv");
  await page.getByRole("button", { name: "Turnir yaratish" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Turnir nomi").fill("Acceptance Cup");
  await dialog.getByLabel("Sana va vaqt (Toshkent)").fill("2026-12-12T20:45");
  await dialog.getByRole("button", { name: "Turnir yaratish" }).click();
  const card = page.getByRole("article").filter({ has: page.getByRole("heading", { name: "Acceptance Cup", exact: true }) });
  await expect(card.locator("time")).toHaveText("12-dekabr, 2026 · 20:45 (UTC+5)");
  await card.getByRole("button", { name: "Tahrirlash" }).click();
  await expect(dialog.getByLabel("Sana va vaqt (Toshkent)")).toHaveValue("2026-12-12T20:45");
  await dialog.getByLabel("Sana va vaqt (Toshkent)").fill("2026-12-13T00:15");
  await dialog.getByRole("button", { name: "Saqlash" }).click();
  await expect(card.locator("time")).toHaveText("13-dekabr, 2026 · 00:15 (UTC+5)");

  await card.getByRole("button", { name: "Acceptance Cup tafsilotlari" }).click();
  const start = dialog.getByRole("button", { name: "Turnirni boshlash" });
  await expect(start).toBeDisabled();
  await expect(dialog.getByText("Turnirni boshlash uchun kamida ikki jamoa kerak.")).toBeVisible();
  await register(dialog, "QA Alpha", "Captain Alpha");
  await register(dialog, "QA Bravo", "Captain Bravo");
  await start.click();
  const final = dialog.getByRole("form", { name: "QA Alpha / QA Bravo" });
  await final.getByLabel("QA Alpha hisobi").fill("13");
  await final.getByLabel("QA Bravo hisobi").fill("13");
  await final.getByRole("button", { name: "Saqlash" }).click();
  await expect(final.locator("..").getByRole("alert")).toHaveText("0–99 oralig‘ida turli hisoblar kiriting.");
  await expect(final.getByLabel("QA Alpha hisobi")).toHaveValue("13");
  await final.getByLabel("QA Bravo hisobi").fill("9");
  await final.getByRole("button", { name: "Saqlash" }).click();
  await expect(dialog.getByText("G‘olib · QA Alpha")).toBeVisible();
  await expect(dialog.getByText("Yakunlangan", { exact: true })).toBeVisible();

  await dialog.getByRole("button", { name: "Turnirni o‘chirish", exact: true }).click();
  await dialog.getByRole("button", { name: "Bekor qilish" }).click();
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "O‘chirish" }).click();
  await dialog.getByRole("button", { name: "O‘chirish" }).click();
  await expect(card).toHaveCount(0);
  await page.reload();
  await expect(card).toHaveCount(0);
});

test("organizer can edit and remove teams while the public roster hides management and captain names", async ({ page }) => {
  await page.goto("/boshqaruv");
  await page.getByRole("button", { name: "AXION Major tafsilotlari" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Jamoani tahrirlash (UzCore)" }).click();
  const name = dialog.getByLabel("Jamoa nomi", { exact: true });
  await expect(name).toHaveValue("UzCore");
  await name.fill(" REDLINE ");
  const captain = dialog.getByLabel("Sardorning o‘yin nomi (ixtiyoriy)");
  await captain.fill("Test Captain");
  await dialog.getByRole("button", { name: "Saqlash" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Bu nom boshqa jamoaga tegishli.");
  await expect(captain).toHaveValue("Test Captain");
  await name.fill("UzCore Prime");
  await dialog.getByRole("button", { name: "Saqlash" }).click();
  await expect(dialog.getByRole("status")).toHaveText("Jamoa yangilandi.");
  await expect(dialog.getByText("Sardor · Test Captain")).toBeVisible();

  const remove = dialog.getByRole("button", { name: "Jamoani o‘chirish (Redline)" });
  await remove.click();
  await expect(dialog.getByRole("button", { name: "Bekor qilish" })).toBeFocused();
  await dialog.getByRole("button", { name: "Bekor qilish" }).click();
  await expect(remove).toBeVisible();
  await remove.click();
  await dialog.getByRole("button", { name: "O‘chirish", exact: true }).click();
  await expect(dialog.getByRole("status")).toHaveText("Jamoa ro‘yxatdan o‘chirildi.");
  await expect(dialog.getByText("7/16")).toBeVisible();
  await expect(remove).toHaveCount(0);

  await page.goto("/turnirlar");
  await page.getByRole("button", { name: "AXION Major tafsilotlari" }).click();
  await expect(dialog.getByText("UzCore Prime", { exact: true })).toBeVisible();
  await expect(dialog.getByText("Redline", { exact: true })).toHaveCount(0);
  await expect(dialog.getByText("Test Captain", { exact: false })).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: /Jamoani (tahrirlash|o‘chirish)/ })).toHaveCount(0);

  await page.goto("/boshqaruv");
  await page.getByRole("button", { name: "Midnight Cup tafsilotlari" }).click();
  await expect(dialog.getByRole("button", { name: "Jamoani o‘chirish (Nexus)" })).toBeDisabled();
  await expect(dialog.getByRole("button", { name: "Jamoani tahrirlash (Nexus)" })).toBeEnabled();
  await expect(dialog.getByText("Turnir boshlangach jamoani o‘chirib bo‘lmaydi.")).toBeVisible();
});

test("phone keeps the schedule, local times and team names without loading video or organizer controls", async ({ browser, baseURL }) => {
  const context = await browser.newContext({ ...devices["Pixel 7"], baseURL });
  try {
    const page = await context.newPage();
    const media: string[] = [];
    page.on("request", (request) => { if (request.resourceType() === "media") media.push(request.url()); });
    await page.goto("/boshqaruv");
    await expect(page.getByRole("heading", { name: "Turnir jadvali" })).toBeVisible();
    await expect(page.getByText("Video va scroll sahnalari katta ekran uchun moslangan.", { exact: false })).toBeVisible();
    const event = page.locator(".compact-events li").filter({ has: page.getByRole("heading", { name: "AXION Major" }) });
    await expect(event.locator("time")).toHaveText("12-dekabr, 2026 · 18:00 (UTC+5)");
    await expect(event.getByText("UzCore", { exact: false })).toBeVisible();
    await expect(page.locator("video, .site-header, .score-form")).toHaveCount(0);
    expect(media).toEqual([]);
  } finally {
    await context.close();
  }
});
