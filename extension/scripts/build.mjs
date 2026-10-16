// Builds the SysAcad browser extension: bundles the content script with esbuild, writes one unpacked folder per
// browser under extension/dist/ and zips each one. Usage: `pnpm extension:build` (add `-- --public` to also copy the
// zips to public/extension/, where the site serves them for download).
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import { dirname, join, relative } from "node:path"
import { fileURLToPath } from "node:url"
import { crc32, deflateRawSync } from "node:zlib"
import { build } from "esbuild"

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const dist = join(root, "dist")
const publicDir = join(dirname(root), "public", "extension")
const copyToPublic = process.argv.includes("--public")

const TARGETS = [
  { name: "chrome", manifest: "manifest.chrome.json", esbuildTarget: ["chrome110", "edge110"] },
  { name: "firefox", manifest: "manifest.firefox.json", esbuildTarget: ["firefox115"] },
]

/** Fixed timestamp (1 Jan 2026, 00:00) so the same sources always produce the same zip. */
const DOS_TIME = 0
const DOS_DATE = ((2026 - 1980) << 9) | (1 << 5) | 1

async function listFiles(directory) {
  const files = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) files.push(...(await listFiles(path)))
    else files.push(path)
  }
  return files.sort()
}

/** Minimal zip writer (deflate, no extra fields): enough for browser extension packages. */
async function zipDirectory(directory, outputPath) {
  const locals = []
  const centrals = []
  let offset = 0
  for (const file of await listFiles(directory)) {
    const name = Buffer.from(relative(directory, file).split("\\").join("/"))
    const data = await readFile(file)
    const compressed = deflateRawSync(data, { level: 9 })
    const checksum = crc32(data)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)
    local.writeUInt16LE(20, 4)
    local.writeUInt16LE(0x0800, 6)
    local.writeUInt16LE(8, 8)
    local.writeUInt16LE(DOS_TIME, 10)
    local.writeUInt16LE(DOS_DATE, 12)
    local.writeUInt32LE(checksum, 14)
    local.writeUInt32LE(compressed.length, 18)
    local.writeUInt32LE(data.length, 22)
    local.writeUInt16LE(name.length, 26)
    local.writeUInt16LE(0, 28)
    const central = Buffer.alloc(46)
    central.writeUInt32LE(0x02014b50, 0)
    central.writeUInt16LE(20, 4)
    central.writeUInt16LE(20, 6)
    central.writeUInt16LE(0x0800, 8)
    central.writeUInt16LE(8, 10)
    central.writeUInt16LE(DOS_TIME, 12)
    central.writeUInt16LE(DOS_DATE, 14)
    central.writeUInt32LE(checksum, 16)
    central.writeUInt32LE(compressed.length, 20)
    central.writeUInt32LE(data.length, 24)
    central.writeUInt16LE(name.length, 28)
    central.writeUInt32LE(offset, 42)
    locals.push(local, name, compressed)
    centrals.push(central, name)
    offset += local.length + name.length + compressed.length
  }
  const centralSize = centrals.reduce((size, part) => size + part.length, 0)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)
  end.writeUInt16LE(centrals.length / 2, 8)
  end.writeUInt16LE(centrals.length / 2, 10)
  end.writeUInt32LE(centralSize, 12)
  end.writeUInt32LE(offset, 16)
  await writeFile(outputPath, Buffer.concat([...locals, ...centrals, end]))
}

async function main() {
  await rm(dist, { recursive: true, force: true })
  for (const target of TARGETS) {
    const outDir = join(dist, target.name)
    await mkdir(join(outDir, "icons"), { recursive: true })
    await build({
      entryPoints: [join(root, "src", "content.ts")],
      outfile: join(outDir, "content.js"),
      bundle: true,
      format: "iife",
      platform: "browser",
      target: target.esbuildTarget,
      minify: true,
      legalComments: "none",
      charset: "utf8",
      tsconfig: join(root, "tsconfig.json"),
    })
    await copyFile(join(root, target.manifest), join(outDir, "manifest.json"))
    for (const icon of await readdir(join(root, "icons"))) await copyFile(join(root, "icons", icon), join(outDir, "icons", icon))
    const zipPath = join(dist, `adhorarium-sysacad-${target.name}.zip`)
    await zipDirectory(outDir, zipPath)
    console.log(`built ${relative(process.cwd(), outDir)} and ${relative(process.cwd(), zipPath)}`)
    if (copyToPublic) {
      await mkdir(publicDir, { recursive: true })
      await copyFile(zipPath, join(publicDir, `adhorarium-sysacad-${target.name}.zip`))
      console.log(`copied to ${relative(process.cwd(), publicDir)}`)
    }
  }
}

await main()
