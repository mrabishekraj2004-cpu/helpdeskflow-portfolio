import { z } from "zod";
import { db } from "./db";
import type { Prisma } from "../generated/prisma/client";

export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export const statuses = [
  "OPEN",
  "IN_PROGRESS",
  "WAITING_FOR_REQUESTER",
  "RESOLVED",
] as const;
export const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
export const label = (value: string) =>
  value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
export async function actor(userId: string | undefined) {
  if (!userId) throw new AppError(401, "Please sign in.");
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) throw new AppError(401, "Please sign in again.");
  return user;
}
async function permitted(userId: string | undefined, id: string) {
  const user = await actor(userId);
  const ticket = await db.ticket.findFirst({
    where: {
      id,
      ...(user.role === "REQUESTER" ? { requesterId: user.id } : {}),
    },
  });
  if (!ticket) throw new AppError(404, "Ticket not found.");
  return { user, ticket };
}
const creation = z
  .object({
    title: z.string().trim().min(5).max(160),
    description: z.string().trim().min(10).max(10000),
    categoryId: z.string().min(1),
    priority: z.enum(priorities),
  })
  .strict();
const update = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("reply"),
      body: z.string().trim().min(1).max(10000),
      internal: z.boolean().default(false),
    })
    .strict(),
  z
    .object({ action: z.literal("assign"), assigneeId: z.string().min(1) })
    .strict(),
  z
    .object({ action: z.literal("priority"), priority: z.enum(priorities) })
    .strict(),
  z
    .object({
      action: z.literal("status"),
      status: z.enum(statuses),
      reason: z.string().trim().max(10000).default(""),
    })
    .strict(),
]);
export async function createTicket(userId: string | undefined, input: unknown) {
  const user = await actor(userId),
    data = creation.parse(input);
  if (
    !(await db.category.findFirst({
      where: { id: data.categoryId, active: true },
    }))
  )
    throw new AppError(400, "Choose an active category.");
  return db.ticket.create({
    data: {
      ...data,
      requesterId: user.id,
      activities: { create: { actorId: user.id, detail: "Ticket opened" } },
    },
  });
}
export async function listTickets(
  userId: string | undefined,
  params: URLSearchParams,
) {
  const user = await actor(userId);
  const page = z.coerce
    .number()
    .int()
    .min(1)
    .max(100000)
    .parse(params.get("page") ?? 1);
  const status = z
    .enum(statuses)
    .optional()
    .parse(params.get("status") || undefined);
  const priority = z
    .enum(priorities)
    .optional()
    .parse(params.get("priority") || undefined);
  const q = (params.get("q") ?? "").slice(0, 160);
  const where: Prisma.TicketWhereInput = {
    ...(user.role === "REQUESTER" ? { requesterId: user.id } : {}),
    status,
    priority,
    ...(params.get("mine") === "true" && user.role !== "REQUESTER"
      ? { assigneeId: user.id }
      : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [tickets, total] = await db.$transaction([
    db.ticket.findMany({
      where,
      include: {
        category: true,
        requester: { select: { name: true } },
        assignee: { select: { name: true } },
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (page - 1) * 10,
      take: 10,
    }),
    db.ticket.count({ where }),
  ]);
  return { tickets, total, page, pages: Math.max(1, Math.ceil(total / 10)) };
}
export async function getTicket(userId: string | undefined, id: string) {
  const { user } = await permitted(userId, id);
  return db.ticket.findUniqueOrThrow({
    where: { id },
    include: {
      category: true,
      requester: { select: { name: true } },
      assignee: { select: { name: true } },
      messages: {
        where: user.role === "REQUESTER" ? { internal: false } : {},
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
      activities: {
        include: { actor: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
}
export async function changeTicket(
  userId: string | undefined,
  id: string,
  input: unknown,
) {
  const data = update.parse(input);
  return db.$transaction(async (tx) => {
    // Serialize competing updates so audit entries reflect the state actually changed.
    await tx.$queryRaw`SELECT id FROM "Ticket" WHERE id = ${id} FOR UPDATE`;
    const user = await tx.user.findUnique({ where: { id: userId ?? "" } });
    if (!user) throw new AppError(401, "Please sign in.");
    const ticket = await tx.ticket.findFirst({
      where: {
        id,
        ...(user.role === "REQUESTER" ? { requesterId: user.id } : {}),
      },
    });
    if (!ticket) throw new AppError(404, "Ticket not found.");
    const staff = user.role !== "REQUESTER";
    let detail: string;
    let changes: Prisma.TicketUncheckedUpdateInput = {};
    if (data.action === "reply") {
      if (data.internal && !staff)
        throw new AppError(403, "Internal notes are for support staff.");
      await tx.message.create({
        data: {
          ticketId: id,
          authorId: user.id,
          body: data.body,
          internal: data.internal,
        },
      });
      // Internal note existence is private as well as its content.
      if (data.internal) return { ok: true };
      detail = "Public reply added";
    } else if (data.action === "assign") {
      if (!staff || (user.role !== "ADMIN" && data.assigneeId !== user.id))
        throw new AppError(403, "You can only assign a ticket to yourself.");
      const assignee = await tx.user.findFirst({
        where: { id: data.assigneeId, role: { in: ["AGENT", "ADMIN"] } },
      });
      if (!assignee) throw new AppError(400, "Choose a support agent.");
      changes = { assigneeId: assignee.id };
      detail = `Assigned to ${assignee.name}`;
    } else if (data.action === "priority") {
      if (!staff)
        throw new AppError(403, "Only support staff can change priority.");
      changes = { priority: data.priority };
      detail = `Priority: ${label(ticket.priority)} → ${label(data.priority)}`;
    } else {
      const reopening = ticket.status === "RESOLVED" && data.status === "OPEN";
      if (!staff && !reopening)
        throw new AppError(403, "Only support staff can change status.");
      if (ticket.status === "RESOLVED" && !reopening)
        throw new AppError(
          400,
          "Reopen the ticket before changing its status.",
        );
      if ((data.status === "RESOLVED" || reopening) && data.reason.length < 10)
        throw new AppError(
          400,
          "Give an explanation of at least 10 characters.",
        );
      changes = {
        status: data.status,
        ...(data.status === "RESOLVED"
          ? { resolution: data.reason }
          : reopening
            ? { resolution: null }
            : {}),
      };
      detail = `${reopening ? "Reopened" : `Status: ${label(ticket.status)} → ${label(data.status)}`}${data.reason ? ` — ${data.reason}` : ""}`;
    }
    await tx.ticket.update({
      where: { id },
      data: {
        ...changes,
        updatedAt: new Date(),
        activities: { create: { actorId: user.id, detail } },
      },
    });
    return { ok: true };
  });
}
export async function dashboard(userId: string | undefined) {
  const user = await actor(userId);
  const groups = await db.ticket.groupBy({
    by: ["status"],
    where: user.role === "REQUESTER" ? { requesterId: user.id } : {},
    _count: true,
  });
  const counts = Object.fromEntries(
    statuses.map((s) => [s, groups.find((g) => g.status === s)?._count ?? 0]),
  );
  return { counts, total: Object.values(counts).reduce((a, b) => a + b, 0) };
}
export async function adminData(userId: string | undefined) {
  const user = await actor(userId);
  if (user.role !== "ADMIN")
    throw new AppError(403, "Administrator access required.");
  return {
    users: await db.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    }),
    categories: await db.category.findMany({ orderBy: { name: "asc" } }),
    demoMode: process.env.DEMO_MODE === "true",
  };
}
export async function administer(userId: string | undefined, input: unknown) {
  const user = await actor(userId);
  if (user.role !== "ADMIN")
    throw new AppError(403, "Administrator access required.");
  if (process.env.DEMO_MODE === "true")
    throw new AppError(403, "Management is disabled on the shared demo.");
  const data = z
    .discriminatedUnion("action", [
      z
        .object({
          action: z.literal("category"),
          name: z.string().trim().min(2).max(60),
        })
        .strict(),
      z
        .object({
          action: z.literal("categoryState"),
          id: z.string(),
          active: z.boolean(),
        })
        .strict(),
      z
        .object({
          action: z.literal("role"),
          id: z.string(),
          role: z.enum(["REQUESTER", "AGENT", "ADMIN"]),
        })
        .strict(),
    ])
    .parse(input);
  if (data.action === "role" && data.id === user.id)
    throw new AppError(403, "You cannot change your own role.");
  return db.$transaction(async (tx) => {
    if (data.action === "category")
      await tx.category.create({ data: { name: data.name } });
    else if (data.action === "categoryState")
      await tx.category.update({
        where: { id: data.id },
        data: { active: data.active },
      });
    else {
      if (
        data.role === "REQUESTER" &&
        (await tx.ticket.count({ where: { assigneeId: data.id } }))
      )
        throw new AppError(
          400,
          "Reassign this agent’s tickets before changing their role.",
        );
      await tx.user.update({
        where: { id: data.id },
        data: { role: data.role },
      });
      await tx.session.deleteMany({ where: { userId: data.id } });
    }
    await tx.activity.create({
      data: {
        actorId: user.id,
        detail: `Administration: ${JSON.stringify(data)}`,
      },
    });
    return { ok: true };
  });
}
