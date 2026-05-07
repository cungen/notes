import esbuild from "esbuild";
import process from "node:process";

const prod = process.argv[2] === "production";

const context = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  outfile: "main.js",
  external: ["obsidian"],
  format: "cjs",
  target: "es2022",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  platform: "browser",
  minify: prod,
  loader: {
    ".css": "text",
  },
});

if (prod) {
  await context.rebuild();
  const { statSync } = await import("node:fs");
  const bytes = statSync("main.js").size;
  console.log(`zmind: build ok → main.js (${bytes} bytes)`);
  process.exit(0);
} else {
  await context.watch();
}
