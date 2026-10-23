import "dotenv/config";
import { test, after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/lib/db";
import {
  AppError,
  createTicket,
  getTicket,
  listTickets,
  changeTicket,
  dashboard,
  administer,
  adminData,
} from "../src/lib/service";
const ids = ["REQUESTER", "REQUESTER", "AGENT", "AGENT", "ADMIN"].map(() =>
  randomUUID(),
);
const [r1, r2, agent, agent2, admin] = ids;
let categoryId: string, ticketId: string;
const denied = (fn: () => Promise<unknown>, status: number) =>
  assert.rejects(
    fn,
    (e: unknown) => e instanceof AppError && e.status === status,
  );
test("persistent role-protected ticket lifecycle", async (t) => {
  for (const [i, role] of [
    "REQUESTER",
    "REQUESTER",
    "AGENT",
    "AGENT",
    "ADMIN",
  ].entries())
    await db.user.create({
      data: {
        id: ids[i],
        name: `Integration ${i}`,
        email: `${ids[i]}@example.test`,
        role: role as "REQUESTER" | "AGENT" | "ADMIN",
      },
    });
  categoryId = (
    await db.category.create({ data: { name: `Test ${randomUUID()}` } })
  ).id;
  await t.test("reject unauthenticated create and invalid fields", async () => {
    await denied(() => createTicket(undefined, {}), 401);
    await assert.rejects(() =>
      createTicket(r1, {
        title: "x",
        description: "short",
        categoryId,
        priority: "MEDIUM",
      }),
    );
    await assert.rejects(() =>
      createTicket(r1, {
        title: "Valid ticket",
        description: "Enough description here",
        categoryId,
        priority: "MEDIUM",
        requesterId: r2,
      }),
    );
  });
  await t.test("create and read persistent ticket", async () => {
    const ticket = await createTicket(r1, {
      title: "A persistent test ticket",
      description: "This is a meaningful issue description.",
      categoryId,
      priority: "HIGH",
    });
    ticketId = ticket.id;
    assert.equal(
      (await db.ticket.findUniqueOrThrow({ where: { id: ticket.id } }))
        .requesterId,
      r1,
    );
    assert.equal((await getTicket(r1, ticketId)).title, ticket.title);
  });
  await t.test(
    "isolate requester reads, searches, writes, and private notes",
    async () => {
      await denied(() => getTicket(r2, ticketId), 404);
      await denied(
        () =>
          changeTicket(r2, ticketId, {
            action: "reply",
            body: "Not my ticket",
            internal: false,
          }),
        404,
      );
      assert.equal(
        (await listTickets(r2, new URLSearchParams({ q: "persistent test" })))
          .total,
        0,
      );
      await denied(
        () =>
          changeTicket(r1, ticketId, {
            action: "reply",
            body: "Secret",
            internal: true,
          }),
        403,
      );
      await changeTicket(agent, ticketId, {
        action: "reply",
        body: "Private diagnostic note",
        internal: true,
      });
      assert.equal((await getTicket(r1, ticketId)).messages.length, 0);
      assert.equal(
        (await getTicket(agent, ticketId)).messages[0].body,
        "Private diagnostic note",
      );
      assert.equal(
        (await getTicket(r1, ticketId)).activities.some((a) =>
          a.detail.includes("Private"),
        ),
        false,
      );
      await changeTicket(r1, ticketId, {
        action: "reply",
        body: "A public follow-up",
        internal: false,
      });
      assert.equal((await getTicket(r1, ticketId)).messages.length, 1);
    },
  );
  await t.test("enforce assignment and staff updates", async () => {
    await denied(
      () => changeTicket(r1, ticketId, { action: "assign", assigneeId: r1 }),
      403,
    );
    await denied(
      () =>
        changeTicket(agent, ticketId, { action: "assign", assigneeId: agent2 }),
      403,
    );
    await changeTicket(agent, ticketId, {
      action: "assign",
      assigneeId: agent,
    });
    assert.equal((await getTicket(r1, ticketId)).assigneeId, agent);
    await changeTicket(admin, ticketId, {
      action: "assign",
      assigneeId: agent2,
    });
    assert.equal((await getTicket(r1, ticketId)).assigneeId, agent2);
    await denied(
      () =>
        changeTicket(r1, ticketId, { action: "priority", priority: "URGENT" }),
      403,
    );
    await changeTicket(agent, ticketId, {
      action: "priority",
      priority: "URGENT",
    });
    assert.equal((await getTicket(r1, ticketId)).priority, "URGENT");
  });
  await t.test(
    "require resolution and reopening reasons and audit both",
    async () => {
      await denied(
        () =>
          changeTicket(r1, ticketId, {
            action: "status",
            status: "RESOLVED",
            reason: "A long enough reason",
          }),
        403,
      );
      await denied(
        () =>
          changeTicket(agent, ticketId, {
            action: "status",
            status: "RESOLVED",
            reason: "short",
          }),
        400,
      );
      await changeTicket(agent, ticketId, {
        action: "status",
        status: "IN_PROGRESS",
      });
      await changeTicket(agent, ticketId, {
        action: "status",
        status: "WAITING_FOR_REQUESTER",
      });
      await changeTicket(agent, ticketId, {
        action: "status",
        status: "RESOLVED",
        reason: "Verified the corrected configuration.",
      });
      assert.equal(
        (await getTicket(r1, ticketId)).resolution,
        "Verified the corrected configuration.",
      );
      await denied(
        () =>
          changeTicket(r1, ticketId, {
            action: "status",
            status: "OPEN",
            reason: "short",
          }),
        400,
      );
      await changeTicket(r1, ticketId, {
        action: "status",
        status: "OPEN",
        reason: "The issue returned after restarting.",
      });
      const ticket = await getTicket(r1, ticketId);
      assert.equal(ticket.status, "OPEN");
      assert.equal(ticket.resolution, null);
      assert.ok(ticket.activities.some((a) => a.detail.includes("Reopened")));
    },
  );
  await t.test(
    "dashboard counts match database, requester scope and pagination",
    async () => {
      const d = await dashboard(r1);
      assert.equal(d.total, 1);
      assert.equal(d.counts.OPEN, 1);
      assert.equal((await dashboard(admin)).total, await db.ticket.count());
      assert.equal(
        (await listTickets(r1, new URLSearchParams())).tickets.length,
        1,
      );
      await assert.rejects(() =>
        listTickets(r1, new URLSearchParams({ page: "-1" })),
      );
    },
  );
  await t.test("block administrator access and role escalation", async () => {
    await denied(() => adminData(r1), 403);
    await denied(
      () => administer(agent, { action: "role", id: agent, role: "ADMIN" }),
      403,
    );
    await denied(
      () => administer(r1, { action: "role", id: r1, role: "ADMIN" }),
      403,
    );
    await denied(
      () => administer(admin, { action: "role", id: admin, role: "REQUESTER" }),
      403,
    );
    await db.session.create({
      data: {
        id: randomUUID(),
        token: randomUUID(),
        userId: r2,
        expiresAt: new Date(Date.now() + 60000),
      },
    });
    await administer(admin, { action: "role", id: r2, role: "AGENT" });
    assert.equal(
      (await db.user.findUniqueOrThrow({ where: { id: r2 } })).role,
      "AGENT",
    );
    assert.equal(await db.session.count({ where: { userId: r2 } }), 0);
    process.env.DEMO_MODE = "true";
    try {
      await denied(
        () =>
          administer(admin, { action: "category", name: "Blocked category" }),
        403,
      );
    } finally {
      process.env.DEMO_MODE = "false";
    }
  });
  await t.test(
    "archive categories prevents new tickets and preserves existing ones",
    async () => {
      await administer(admin, {
        action: "categoryState",
        id: categoryId,
        active: false,
      });
      await denied(
        () =>
          createTicket(r1, {
            title: "Another valid ticket",
            description: "Another description with enough detail.",
            categoryId,
            priority: "LOW",
          }),
        400,
      );
      assert.equal((await getTicket(r1, ticketId)).category.active, false);
    },
  );
  await t.test(
    "paginate a matching queue without losing or duplicating tickets",
    async () => {
      await db.ticket.createMany({
        data: Array.from({ length: 11 }, (_, i) => ({
          title: `Pagination ${r1} ${i}`,
          description: "Fictional pagination fixture.",
          categoryId,
          requesterId: r1,
          priority: "LOW" as const,
        })),
      });
      const params = { q: `Pagination ${r1}`, priority: "LOW", status: "OPEN" };
      const first = await listTickets(
          r1,
          new URLSearchParams({ ...params, page: "1" }),
        ),
        second = await listTickets(
          r1,
          new URLSearchParams({ ...params, page: "2" }),
        );
      assert.equal(first.total, 11);
      assert.equal(first.tickets.length, 10);
      assert.equal(second.tickets.length, 1);
      assert.equal(
        new Set([...first.tickets, ...second.tickets].map((t) => t.id)).size,
        11,
      );
    },
  );
});
after(async () => {
  await db.ticket.deleteMany({ where: { requesterId: { in: ids } } });
  await db.activity.deleteMany({ where: { actorId: { in: ids } } });
  await db.user.deleteMany({ where: { id: { in: ids } } });
  if (categoryId) await db.category.deleteMany({ where: { id: categoryId } });
  await db.$disconnect();
});
