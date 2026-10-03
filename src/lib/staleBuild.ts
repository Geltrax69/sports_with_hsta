// After a new deploy the hashed page chunks of the previous build are gone, so
// a tab left open (e.g. 15 min) fails on the next lazy page with
// "error loading dynamically imported module". Reloading fetches the new
// index.html and its chunks. A short guard stops a reload loop if the chunk
// is genuinely broken.

const KEY = 'hsta.staleReloadAt'
const GUARD_MS = 30_000

export const isStaleChunkError = (err: unknown) =>
  /dynamically imported module|Failed to fetch dynamically|Importing a module script failed|error loading dynamically|Unable to preload CSS|ChunkLoadError/i.test(
    String((err as { message?: string })?.message ?? err),
  )

/** Reload once to pick up the new build. Returns false if we just did. */
export function reloadForNewBuild(): boolean {
  try {
    const last = Number(sessionStorage.getItem(KEY) || 0)
    if (Date.now() - last < GUARD_MS) return false
    sessionStorage.setItem(KEY, String(Date.now()))
  } catch {
    /* storage blocked — still reload once */
  }
  window.location.reload()
  return true
}
