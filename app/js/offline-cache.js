export const ASSET_CACHE = "sakina-offline-assets-v1";
const REVISION = "X-Sakina-Revision";
export async function responseHash(response) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await response.clone().arrayBuffer(),
  );
  return [...new Uint8Array(digest)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
}
export function createOfflineStore({
  manifest,
  baseURL,
  cacheStorage = globalThis.caches,
  fetcher = globalThis.fetch,
  hash = responseHash,
  shellCache = null,
}) {
  const base = new URL("./", baseURL),
    inflight = new Map();
  const url = (file) => new URL(file, base).href;
  const independent = (result) =>
    result ? { ...result, response: result.response.clone() } : null;
  const expected = (file) => manifest.files?.[file];
  const cacheKey = (file) => {
    const key = new URL(file, base);
    key.searchParams.set("__sakina_rev", expected(file));
    return key.href;
  };
  async function lookup(file) {
    const cache = await cacheStorage.open(ASSET_CACHE),
      hit = await cache.match(cacheKey(file));
    return hit?.headers.get(REVISION) === expected(file) ? hit : null;
  }
  async function keep(cache, file, response) {
    const body = await response.blob(),
      headers = new Headers(response.headers);
    headers.set(REVISION, expected(file));
    headers.delete("Content-Encoding");
    headers.set("Content-Length", String(body.size));
    const stored = new Response(body, { status: 200, headers });
    await cache.put(cacheKey(file), stored.clone());
    return stored;
  }
  async function ensure(file, { allowNetwork = true } = {}) {
    if (!/^[a-f0-9]{64}$/.test(expected(file) || ""))
      throw Error("Inventaire hors connexion invalide.");
    if (inflight.has(file)) return independent(await inflight.get(file));
    const task = (async () => {
      const stable = await cacheStorage.open(ASSET_CACHE),
        hit = await lookup(file);
      if (hit) return { response: hit, source: "cache" };
      const names = (await cacheStorage.keys()).filter((n) =>
        n.startsWith("sakina-recite-"),
      );
      for (const name of names) {
        const old = await cacheStorage.open(name),
          candidate = await old.match(url(file));
        if (
          candidate?.status === 200 &&
          (await hash(candidate)) === expected(file)
        )
          return {
            response: await keep(stable, file, candidate),
            source: "migrated",
          };
      }
      if (!allowNetwork) return null;
      const response = await fetcher(url(file), {
        cache: "no-cache",
        headers: { "X-Sakina-Offline-Fetch": "1" },
      });
      if (!response.ok || response.status !== 200)
        throw Error("Téléchargement incomplet : " + file);
      if ((await hash(response)) !== expected(file))
        throw Error(
          "Une mise à jour est arrivée pendant le téléchargement. Rouvre Sakina pour reprendre.",
        );
      return {
        response: await keep(stable, file, response),
        source: "network",
      };
    })();
    inflight.set(file, task);
    try {
      return independent(await task);
    } finally {
      inflight.delete(file);
    }
  }
  async function ready() {
    const cache = await cacheStorage.open(ASSET_CACHE);
    for (const [file, revision] of Object.entries(manifest.files)) {
      const hit = await cache.match(cacheKey(file));
      if (!hit || hit.headers.get(REVISION) !== revision) return false;
    }
    return true;
  }
  async function prepare(progress = () => {}) {
    let downloaded = 0,
      reused = 0,
      checked = 0;
    const files = Object.keys(manifest.files);
    for (const file of files) {
      const result = await ensure(file);
      if (result.source === "network") downloaded++;
      else reused++;
      progress({ checked: ++checked, total: files.length, downloaded, reused });
    }
    // Legacy downloads are removed only after every current file is safely retained.
    for (const name of await cacheStorage.keys())
      if (name.startsWith("sakina-recite-") && name !== shellCache)
        await cacheStorage.delete(name);
    return { downloaded, reused, total: files.length };
  }
  return { lookup, ensure, ready, prepare };
}
