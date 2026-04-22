import esbuild from "esbuild";
import process from "node:process";

const prod = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

const context = await esbuild.context({
  entryPoints: ["main.ts"],
  bundle: true,
  format: "cjs",
  target: "es2020",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
  external: ["obsidian", "electron", "@codemirror/*"],
});

if (watch) {
  await context.watch();
  console.log("[obsidian-memos] watching...");
} else {
  await context.rebuild();
  await context.dispose();
}
