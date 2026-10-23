import { createTicket, listTickets } from "@/lib/service";
import { identity, respond, sameOrigin } from "@/lib/http";
export const GET = (r: Request) =>
  respond(async () =>
    listTickets(await identity(r), new URL(r.url).searchParams),
  );
export const POST = (r: Request) =>
  respond(async () => {
    sameOrigin(r);
    return createTicket(await identity(r), await r.json());
  });
