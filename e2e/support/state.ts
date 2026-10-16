import { mkdir, readFile, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { runId, stateDir } from "./env"

/** Values one test hands to a later one (tests run in separate attempts, so module state does not survive). */
export enum StateKey {
  ShareLink = "shareLink",
}

type RunState = Partial<Record<StateKey, string>>

const stateFile = join(stateDir, `${runId}.json`)

async function readState(): Promise<RunState> {
  try {
    return JSON.parse(await readFile(stateFile, "utf8")) as RunState
  } catch {
    return {}
  }
}

export async function saveState(key: StateKey, value: string): Promise<void> {
  const state = await readState()
  state[key] = value
  await mkdir(stateDir, { recursive: true })
  await writeFile(stateFile, JSON.stringify(state, null, 2))
}

export async function loadState(key: StateKey): Promise<string> {
  const value = (await readState())[key]
  if (!value) throw new Error(`Missing ${key} for run ${runId}: run the test that creates it first`)
  return value
}
