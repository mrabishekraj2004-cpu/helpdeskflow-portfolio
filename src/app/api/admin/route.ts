import { adminData, administer } from "@/lib/service";
import { identity, respond, sameOrigin } from "@/lib/http";
export const GET = (r: Request) =>
  respond(async () => adminData(await identity(r)));
export const POST = (r: Request) =>
  respond(async () => {
    sameOrigin(r);
    return administer(await identity(r), await r.json());
  });
