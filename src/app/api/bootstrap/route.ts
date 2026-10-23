import { actor, dashboard } from "@/lib/service";
import { identity, respond } from "@/lib/http";
import { db } from "@/lib/db";
export const GET = (r: Request) =>
  respond(async () => {
    const user = await actor(await identity(r));
    return {
      user: { id: user.id, name: user.name, role: user.role },
      dashboard: await dashboard(user.id),
      categories: await db.category.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
      }),
      agents:
        user.role === "ADMIN"
          ? await db.user.findMany({
              where: { role: { in: ["AGENT", "ADMIN"] } },
              select: { id: true, name: true },
            })
          : [],
    };
  });
