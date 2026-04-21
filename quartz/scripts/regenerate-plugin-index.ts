import { regeneratePluginIndex } from "../plugins/loader/gitLoader.js"

const verbose = process.argv.includes("--verbose")
await regeneratePluginIndex({ verbose })
