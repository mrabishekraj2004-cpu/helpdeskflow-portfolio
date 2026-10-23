import { changeTicket, getTicket } from "@/lib/service";
import { identity, respond, sameOrigin } from "@/lib/http";
type Context = { params: Promise<{ id: string }> };
export const GET = (r: Request, c: Context) =>
  respond(async () => getTicket(await identity(r), (await c.params).id));
export const PATCH = (r: Request, c: Context) =>
  respond(async () => {
    sameOrigin(r);
    return changeTicket(await identity(r), (await c.params).id, await r.json());
  });
