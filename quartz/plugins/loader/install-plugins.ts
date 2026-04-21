#!/usr/bin/env node
import fs from "fs"
import path from "path"
import YAML from "yaml"
import { installPlugins, parsePluginSource } from "./gitLoader.js"
import type { PluginSource } from "./types"

/**
 * Read `externalPlugins` from the same config file as the rest of Quartz
 * without importing `quartz.ts`. Loading the full config pulls in emitters that
 * import `.scss`, which Node/tsx cannot execute for this CLI script.
 */
function readExternalPlugins(): PluginSource[] {
  const CONFIG_YAML_PATH = path.join(process.cwd(), "quartz.config.yaml")
  const LEGACY_PLUGINS_JSON_PATH = path.join(process.cwd(), "quartz.plugins.json")
  const DEFAULT_CONFIG_YAML_PATH = path.join(process.cwd(), "quartz.config.default.yaml")
  const LEGACY_DEFAULT_PLUGINS_JSON_PATH = path.join(process.cwd(), "quartz.plugins.default.json")

  let configPath: string
  if (fs.existsSync(CONFIG_YAML_PATH)) configPath = CONFIG_YAML_PATH
  else if (fs.existsSync(LEGACY_PLUGINS_JSON_PATH)) configPath = LEGACY_PLUGINS_JSON_PATH
  else if (fs.existsSync(DEFAULT_CONFIG_YAML_PATH)) configPath = DEFAULT_CONFIG_YAML_PATH
  else if (fs.existsSync(LEGACY_DEFAULT_PLUGINS_JSON_PATH))
    configPath = LEGACY_DEFAULT_PLUGINS_JSON_PATH
  else return []

  const raw = fs.readFileSync(configPath, "utf-8")
  const json =
    configPath.endsWith(".yaml") || configPath.endsWith(".yml")
      ? (YAML.parse(raw) as Record<string, unknown>)
      : (JSON.parse(raw) as Record<string, unknown>)

  const external = json.externalPlugins
  if (!Array.isArray(external)) return []
  return external as PluginSource[]
}

async function main() {
  const externalPlugins = readExternalPlugins()

  if (externalPlugins.length === 0) {
    console.log("No external plugins to install.")
    return
  }

  console.log(`Installing ${externalPlugins.length} plugin(s) from Git...`)

  const specs = externalPlugins.map((source) => parsePluginSource(source))
  const installed = await installPlugins(specs, { verbose: true })

  if (installed.size === externalPlugins.length) {
    console.log("✓ All plugins installed successfully")
  } else {
    console.error(`✗ Only ${installed.size}/${externalPlugins.length} plugins installed`)
    process.exit(1)
  }
}

main().catch((err) => {
  console.error("Failed to install plugins:", err)
  process.exit(1)
})
