import { auth } from "./auth";
import { AppError } from "./service";
import { ZodError } from "zod";
import { Prisma } from "../generated/prisma/client";
export async function identity(request: Request) {
  return (await auth.api.getSession({ headers: request.headers }))?.user.id;
}
export async function respond(fn: () => Promise<unknown>) {
  try {
    return Response.json(await fn());
  } catch (error) {
    if (error instanceof AppError)
      return Response.json({ error: error.message }, { status: error.status });
    if (error instanceof ZodError)
      return Response.json(
        {
          error: error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        },
        { status: 400 },
      );
    if (error instanceof SyntaxError)
      return Response.json({ error: "Invalid JSON." }, { status: 400 });
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      return Response.json(
        { error: "That record already exists." },
        { status: 409 },
      );
    console.error(
      "Request failed",
      error instanceof Error ? error.name : "Unknown",
    );
    return Response.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
export function sameOrigin(request: Request) {
  if (
    request.headers.get("origin") !==
    new URL(process.env.BETTER_AUTH_URL ?? request.url).origin
  )
    throw new AppError(403, "Invalid request origin.");
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    throw new AppError(415, "Send JSON data.");
  if (Number(request.headers.get("content-length") ?? 0) > 32768)
    throw new AppError(413, "Request is too large.");
}
