import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import assert from "node:assert/strict";

// Export only the already-rendered public portfolio, never the API or account data.
const html = await readFile(".next/server/app/index.html", "utf8");
let main = html.match(/<main\b[\s\S]*?<\/main>/)?.[0];
assert.ok(main, "Build the Next.js application first.");
const repository =
  "https://github.com/mrabishekraj2004-cpu/helpdeskflow-portfolio";
main = main
  .replaceAll('href="/login"', `href="${repository}#local-setup"`)
  .replaceAll(
    'href="/case-study"',
    `href="${repository}/blob/main/docs/case-study.md"`,
  )
  .replaceAll('href="/"', 'href="./"')
  .replaceAll('src="/screenshots/', 'src="./screenshots/')
  .replaceAll("Open workspace", "Run locally")
  .replaceAll("Explore the app", "Run the helpdesk locally")
  .replaceAll(
    "Version 1 · Local application",
    "Version 1 · Public project showcase",
  )
  .replaceAll(
    "A public running demo is not configured yet.",
    "This portfolio is hosted on GitHub Pages. The full helpdesk runs locally; an online application demo is not configured yet.",
  );
assert.ok(
  !/<script|href="\/(?:login|desk)|\/api\//.test(main),
  "Protected application content must not be exported.",
);
await mkdir("dist-pages/screenshots", { recursive: true });
const cssPaths = [...html.matchAll(/href="(\/_next\/[^"?]+\.css)"/g)].map(
  (m) => m[1],
);
assert.ok(cssPaths.length > 0, "Compiled styles not found.");
const styles = [];
for (const [index, css] of cssPaths.entries()) {
  const target = `style-${index}.css`;
  await copyFile(
    `.next/static/${css.split("/_next/static/")[1]}`,
    `dist-pages/${target}`,
  );
  styles.push(`<link rel="stylesheet" href="./${target}">`);
}
for (const name of [
  "agent-desktop.png",
  "agent-mobile.png",
  "ticket-detail.png",
  "portfolio-mobile.png",
]) {
  await copyFile(
    `public/screenshots/${name}`,
    `dist-pages/screenshots/${name}`,
  );
}
await writeFile(
  "dist-pages/index.html",
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>HelpDeskFlow — Abishek Akash</title><meta name="description" content="Abishek Akash’s AI-assisted IT helpdesk portfolio. Seeking a trainee IT opportunity in Colombo.">${styles.join("")}</head><body><a class="skip" href="#main">Skip to content</a>${main}</body></html>`,
);
await writeFile("dist-pages/.nojekyll", "");
console.log(
  "Built public-only GitHub Pages portfolio in dist-pages. No sign-in, API, environment files, or database data included.",
);
