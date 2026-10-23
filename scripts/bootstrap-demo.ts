import "dotenv/config";
import { db as prisma } from "../src/lib/db";
import { hashPassword } from "better-auth/crypto";
import { randomBytes } from "node:crypto";
if (process.env.DEMO_MODE !== "true")
  throw new Error("Bootstrap requires DEMO_MODE=true.");
const databaseUrl = new URL(process.env.DATABASE_URL ?? "");
if (!databaseUrl.hostname.endsWith(".neon.tech"))
  throw new Error("Bootstrap requires the authorized Neon database.");
const passwords = JSON.parse(process.env.HELPDESK_DEMO_PASSWORDS ?? "{}");
for (const key of ["requester", "other", "agent", "admin"]) {
  if (
    typeof passwords[key] !== "string" ||
    !/^[A-Za-z0-9_-]{26,}$/.test(passwords[key])
  )
    throw new Error("Missing private demo passwords.");
}
if ((await prisma.user.count()) > 0)
  throw new Error(
    "Database already has users. Refusing to overwrite accounts.",
  );
const accounts = [
  {
    key: "requester",
    name: "Maya Silva",
    email: "maya@example.test",
    role: "REQUESTER" as const,
  },
  {
    key: "other",
    name: "Nilan Perera",
    email: "nilan@example.test",
    role: "REQUESTER" as const,
  },
  {
    key: "agent",
    name: "Alex Morgan",
    email: "alex@example.test",
    role: "AGENT" as const,
  },
  {
    key: "admin",
    name: "Sam Taylor",
    email: "sam@example.test",
    role: "ADMIN" as const,
  },
];
await prisma.$transaction(
  async (db) => {
    const credentials: Record<
      string,
      { id: string; email: string; password: string }
    > = {};
    for (const a of accounts) {
      if (await db.user.findUnique({ where: { email: a.email } }))
        throw new Error(
          "Seed accounts already exist. Refusing to overwrite passwords.",
        );
      const id = randomBytes(16).toString("hex"),
        password = passwords[a.key] as string;
      await db.user.create({
        data: {
          id,
          name: a.name,
          email: a.email,
          emailVerified: true,
          role: a.role,
          accounts: {
            create: {
              id: randomBytes(16).toString("hex"),
              accountId: id,
              providerId: "credential",
              password: await hashPassword(password),
            },
          },
        },
      });
      credentials[a.key] = { id, email: a.email, password };
    }
    const categories = await Promise.all(
      [
        "Hardware",
        "Network & connectivity",
        "Software & access",
        "Accounts",
        "Other",
      ].map((name) =>
        db.category.upsert({ where: { name }, update: {}, create: { name } }),
      ),
    );
    const issues = [
      [
        "Unable to connect to the office Wi-Fi",
        "The laptop sees the office network but disconnects after entering the password. Restarting has not helped.",
        1,
        "HIGH",
        "OPEN",
      ],
      [
        "Monitor flickers when using the docking station",
        "The external monitor flickers every few minutes when connected through the USB-C docking station.",
        0,
        "MEDIUM",
        "IN_PROGRESS",
      ],
      [
        "Request access to the shared project folder",
        "The shared training folder shows an access denied message. Please check the folder permissions.",
        2,
        "MEDIUM",
        "WAITING_FOR_REQUESTER",
      ],
      [
        "Printer shows offline after restarting",
        "The training-room printer remains offline after restarting the printer and laptop.",
        0,
        "LOW",
        "OPEN",
      ],
      [
        "Password reset screen does not load",
        "The password reset page remains blank in the browser. The account is a fictional training account.",
        3,
        "HIGH",
        "RESOLVED",
      ],
      [
        "Spreadsheet application closes unexpectedly",
        "The spreadsheet application closes when opening the sample workbook. No real customer data is involved.",
        2,
        "HIGH",
        "IN_PROGRESS",
      ],
      [
        "VPN connection times out from home",
        "The VPN client displays a timeout message after thirty seconds. The internet connection works for other sites.",
        1,
        "URGENT",
        "OPEN",
      ],
      [
        "Keyboard keys repeat while typing",
        "Several keys repeat unexpectedly. A different USB port has been tried with the same result.",
        0,
        "LOW",
        "RESOLVED",
      ],
      [
        "Update the training workstation software",
        "The training workstation needs the approved software update before the next practice session.",
        2,
        "LOW",
        "OPEN",
      ],
      [
        "Account locked after sign-in attempts",
        "The fictional training account is locked after several failed sign-in attempts.",
        3,
        "MEDIUM",
        "WAITING_FOR_REQUESTER",
      ],
      [
        "Headset microphone is not detected",
        "The headset audio works but the microphone is not listed in the meeting application.",
        0,
        "MEDIUM",
        "OPEN",
      ],
      [
        "Browser cannot open the internal training page",
        "The sample internal page reports a connection error while public websites load normally.",
        1,
        "HIGH",
        "OPEN",
      ],
    ];
    for (const [index, row] of issues.entries()) {
      const [title, description, category, priority, status] = row as [
        string,
        string,
        number,
        "LOW" | "MEDIUM" | "HIGH" | "URGENT",
        "OPEN" | "IN_PROGRESS" | "WAITING_FOR_REQUESTER" | "RESOLVED",
      ];
      await db.ticket.create({
        data: {
          title,
          description,
          categoryId: categories[category].id,
          priority,
          status,
          requesterId:
            index % 3 === 0 ? credentials.other.id : credentials.requester.id,
          assigneeId: status === "OPEN" ? null : credentials.agent.id,
          resolution:
            status === "RESOLVED"
              ? "Checked the device configuration and confirmed the issue was fixed using fictional test data."
              : null,
          createdAt: new Date(Date.now() - index * 3600000 * 7),
          activities: {
            create: {
              actorId: credentials.admin.id,
              detail: "Fictional demonstration ticket seeded",
            },
          },
        },
      });
    }
    return credentials;
  },
  { timeout: 30000 },
);
console.log(
  "Initialized four fictional demonstration accounts and twelve tickets.",
);
await prisma.$disconnect();
