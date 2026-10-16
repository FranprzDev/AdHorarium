import { dominantPlan } from "./table"
import { SYSACAD_PAYLOAD_VERSION, SysacadFragmentKey, SysacadSource, type SysacadPayload, type SysacadRow } from "./types"

/** Page of the app that receives the payload. */
export const SYSACAD_IMPORT_PATH = "/importar/sysacad"

/** Encoded payloads longer than this are deflated; plain base64url keeps short payloads readable when debugging. */
export const PLAIN_FRAGMENT_LIMIT = 2_000

/** Upper bound accepted when reading a fragment, far above a full career (about 6 KB deflated). */
export const MAX_FRAGMENT_LENGTH = 60_000

const COMPRESSION_FORMAT = "deflate-raw"

export function buildSysacadPayload(rows: SysacadRow[], capturedAt: Date = new Date()): SysacadPayload {
  return {
    v: SYSACAD_PAYLOAD_VERSION,
    source: SysacadSource.FrtSysacad,
    capturedAt: capturedAt.toISOString(),
    plan: dominantPlan(rows),
    rows,
  }
}

export function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export function base64UrlToBytes(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/")
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4))
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return bytes
}

export class SysacadFragmentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SysacadFragmentError"
  }
}

/** Global stream classes; looked up at runtime because the project's TypeScript DOM lib predates them. */
enum ByteStreamClass {
  Compression = "CompressionStream",
  Decompression = "DecompressionStream",
}

type ByteTransformStream = { readable: ReadableStream<Uint8Array>; writable: WritableStream<Uint8Array> }
type ByteTransformStreamConstructor = new (format: string) => ByteTransformStream

function byteStream(kind: ByteStreamClass): ByteTransformStreamConstructor | null {
  const value: unknown = Reflect.get(globalThis, kind)
  return typeof value === "function" ? (value as ByteTransformStreamConstructor) : null
}

export function isCompressionSupported(): boolean {
  return byteStream(ByteStreamClass.Compression) !== null && byteStream(ByteStreamClass.Decompression) !== null
}

async function transform(bytes: Uint8Array, kind: ByteStreamClass): Promise<Uint8Array> {
  const Stream = byteStream(kind)
  if (!Stream) throw new SysacadFragmentError("Tu navegador no puede leer datos comprimidos. Actualizalo.")
  const output = new Blob([bytes]).stream().pipeThrough(new Stream(COMPRESSION_FORMAT))
  return new Uint8Array(await new Response(output).arrayBuffer())
}

/**
 * Encodes the payload as a URL fragment (`data=…`, or `dataz=…` when deflated). The fragment is never sent to any
 * server: the import page reads it in the browser.
 */
export async function encodeSysacadFragment(payload: SysacadPayload, plainLimit: number = PLAIN_FRAGMENT_LIMIT): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(payload))
  const plain = bytesToBase64Url(json)
  if (plain.length <= plainLimit || !isCompressionSupported()) return `${SysacadFragmentKey.Plain}=${plain}`
  const deflated = await transform(json, ByteStreamClass.Compression)
  return `${SysacadFragmentKey.Deflated}=${bytesToBase64Url(deflated)}`
}

/** Reads a fragment (with or without the leading `#`) back into untrusted JSON; validate it with the payload schema. */
export async function decodeSysacadFragment(fragment: string): Promise<unknown> {
  const params = new URLSearchParams(fragment.startsWith("#") ? fragment.slice(1) : fragment)
  const plain = params.get(SysacadFragmentKey.Plain)
  const deflated = params.get(SysacadFragmentKey.Deflated)
  const encoded = plain ?? deflated
  if (!encoded) throw new SysacadFragmentError("El enlace no trae datos de SysAcad.")
  if (encoded.length > MAX_FRAGMENT_LENGTH) throw new SysacadFragmentError("Los datos de SysAcad son demasiado grandes.")
  try {
    const bytes = base64UrlToBytes(encoded)
    const json = plain !== null ? bytes : await transform(bytes, ByteStreamClass.Decompression)
    return JSON.parse(new TextDecoder().decode(json))
  } catch {
    throw new SysacadFragmentError("No pudimos leer los datos de SysAcad. Volvé a generarlos desde la extensión.")
  }
}

/** Absolute URL that opens the import page with the payload in its fragment. */
export async function buildSysacadImportUrl(appOrigin: string, payload: SysacadPayload): Promise<string> {
  return `${appOrigin}${SYSACAD_IMPORT_PATH}#${await encodeSysacadFragment(payload)}`
}
