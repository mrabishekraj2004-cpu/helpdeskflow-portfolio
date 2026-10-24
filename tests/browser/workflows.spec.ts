import { test, expect, type APIRequestContext } from "@playwright/test";
import { readFile } from "node:fs/promises";
const base = "http://127.0.0.1:3000";
type Account = { id: string; email: string; password: string };
let accounts: Record<string, Account>;
test.setTimeout(60000);
test.beforeAll(async () => {
  accounts = JSON.parse(await readFile(".local/demo-credentials.json", "utf8"));
});
test("login keeps credentials out of the URL before JavaScript loads", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.route("**/login", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "Submission checked",
      });
    } else await route.continue();
  });
  await page.goto(`${base}/login`);
  await page.getByLabel("Email address").fill("form-check@example.test");
  await page
    .getByLabel("Password", { exact: true })
    .fill("Fictional-form-check-only");
  const submission = page.waitForRequest(
    (request) => request.method() === "POST",
  );
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  const request = await submission;
  expect(new URL(request.url()).search).toBe("");
  expect(request.postData()).toContain("password=");
  await context.close();
});
async function signIn(request: APIRequestContext, account: Account) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await request.post("/api/auth/sign-in/email", {
      data: { email: account.email, password: account.password },
      headers: { Origin: base },
    });
    if (response.status() === 429) {
      await new Promise((resolve) => setTimeout(resolve, 11000));
      continue;
    }
    expect(response.status()).toBe(200);
    return;
  }
  throw new Error("Sign-in remained rate limited.");
}
test("direct HTTP permissions, input validation, session and sign-out", async ({
  playwright,
}) => {
  const anonymous = await playwright.request.newContext({ baseURL: base });
  expect((await anonymous.get("/api/tickets")).status()).toBe(401);
  const requester = await playwright.request.newContext({ baseURL: base }),
    other = await playwright.request.newContext({ baseURL: base }),
    agent = await playwright.request.newContext({ baseURL: base }),
    admin = await playwright.request.newContext({ baseURL: base });
  await signIn(requester, accounts.requester);
  await signIn(other, accounts.other);
  await signIn(agent, accounts.agent);
  await signIn(admin, accounts.admin);
  const boot = await (await requester.get("/api/bootstrap")).json();
  const post = async (
    ctx: APIRequestContext,
    path: string,
    data: unknown,
    method = "POST",
  ) => ctx.fetch(path, { method, data, headers: { Origin: base } });
  expect((await post(requester, "/api/tickets", { title: "x" })).status()).toBe(
    400,
  );
  const created = await post(requester, "/api/tickets", {
    title: "Browser permission check",
    description: "Fictional HTTP permission test ticket.",
    categoryId: boot.categories[0].id,
    priority: "MEDIUM",
  });
  expect(created.ok()).toBeTruthy();
  const ticket = await created.json(),
    path = `/api/tickets/${ticket.id}`;
  expect((await other.get(path)).status()).toBe(404);
  expect(
    (
      await post(
        other,
        path,
        { action: "reply", body: "Forbidden", internal: false },
        "PATCH",
      )
    ).status(),
  ).toBe(404);
  expect((await requester.get("/api/admin")).status()).toBe(403);
  expect(
    (
      await post(requester, "/api/admin", {
        action: "role",
        id: accounts.requester.id,
        role: "ADMIN",
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await post(
        agent,
        path,
        { action: "reply", body: "PRIVATE NOTE SENTINEL", internal: true },
        "PATCH",
      )
    ).ok(),
  ).toBeTruthy();
  const visible = await requester.get(path);
  expect(await visible.text()).not.toContain("PRIVATE NOTE SENTINEL");
  expect(
    (
      await post(
        requester,
        path,
        { action: "priority", priority: "URGENT" },
        "PATCH",
      )
    ).status(),
  ).toBe(403);
  expect(
    (
      await post(
        agent,
        path,
        { action: "assign", assigneeId: accounts.agent.id },
        "PATCH",
      )
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await post(
        admin,
        path,
        { action: "assign", assigneeId: accounts.agent.id },
        "PATCH",
      )
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await post(
        agent,
        path,
        {
          action: "status",
          status: "RESOLVED",
          reason: "The configuration was corrected and verified.",
        },
        "PATCH",
      )
    ).ok(),
  ).toBeTruthy();
  expect(
    (
      await post(
        requester,
        path,
        {
          action: "status",
          status: "OPEN",
          reason: "The same issue happened after restarting.",
        },
        "PATCH",
      )
    ).ok(),
  ).toBeTruthy();
  expect((await (await requester.get(path)).json()).status).toBe("OPEN");
  expect(
    (
      await requester.patch(path, {
        data: { action: "priority", priority: "LOW" },
        headers: { Origin: "https://untrusted.example" },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await post(anonymous, "/api/auth/sign-up/email", {
        email: "intruder@example.test",
        name: "Intruder",
        password: "Test-only-password-long",
      })
    ).ok(),
  ).toBeFalsy();
  expect((await post(requester, "/api/auth/sign-out", {})).ok()).toBeTruthy();
  expect((await requester.get("/api/tickets")).status()).toBe(401);
  await Promise.all(
    [anonymous, requester, other, agent, admin].map((c) => c.dispose()),
  );
});
test("requester browser submission and sign-out", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(accounts.requester.email);
  await page
    .getByLabel("Password", { exact: true })
    .fill(accounts.requester.password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "How can we help?" }),
  ).toBeVisible();
  await page
    .getByRole("link", { name: "New ticket", exact: true })
    .first()
    .click();
  await page
    .getByLabel("Title", { exact: true })
    .fill("A browser submitted training issue");
  await page
    .getByLabel("Description", { exact: true })
    .fill(
      "The fictional training application cannot open the sample document.",
    );
  await page.getByLabel("Category", { exact: true }).selectOption({ index: 1 });
  await page
    .getByRole("button", { name: "Submit ticket", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "A browser submitted training issue" }),
  ).toBeVisible();
  await page
    .getByLabel("Reply to support")
    .fill("Here is some additional information for support.");
  await page.getByRole("button", { name: "Send message" }).click();
  await expect(
    page.getByText("Here is some additional information for support.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sign out", exact: true }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto("/desk");
  await expect(page).toHaveURL(/\/login/);
});
test("desktop and mobile working application evidence", async ({ page }) => {
  await signIn(page.request, accounts.agent);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/desk");
  await expect(
    page.getByRole("heading", { name: "A clearer view of your queue." }),
  ).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
  await page.screenshot({
    path: "public/screenshots/agent-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("link", {
      name: "Monitor flickers when using the docking station",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Issue description" }),
  ).toBeVisible();
  await page.screenshot({
    path: "public/screenshots/ticket-detail.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/desk");
  await expect(page.getByRole("table")).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.screenshot({
    path: "public/screenshots/agent-mobile.png",
    fullPage: true,
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Support issues/ }),
  ).toBeVisible();
  await page.screenshot({
    path: "public/screenshots/portfolio-mobile.png",
    fullPage: true,
  });
});
