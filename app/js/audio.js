import { RECITER_AUDIO_FOLDERS } from "./quran-audio-sync.js";
import { findUnit } from "./data.js";
import { normalizeSpeed } from "./playback-speed.js";
const expand = (corpus, units) => {
  const seen = new Set();
  return units
    .flatMap((u) =>
      u.sources ? u.sources.map((id) => findUnit(corpus, id)) : [u],
    )
    .filter(
      (u) =>
        u &&
        !seen.has(u.playbackIdentity || u.id) &&
        seen.add(u.playbackIdentity || u.id),
    );
};
const folders = RECITER_AUDIO_FOLDERS;
let active,
  loading,
  run = 0,
  speed = 1,
  clip = null,
  cancelPlayback = null;
function armClip() {
  if (!clip?.started) return;
  clearTimeout(clip.timer);
  clip.timer = setTimeout(
    clip.finish,
    Math.max(0, ((clip.end - clip.player.currentTime) * 1000) / speed),
  );
}
function clearClip() {
  if (clip) clearTimeout(clip.timer);
  clip = null;
}
export function setSpeed(value) {
  speed = normalizeSpeed(value);
  if (active) {
    active.preservesPitch = true;
    active.playbackRate = speed;
    armClip();
  }
  return speed;
}
export function stop() {
  run++;
  clearClip();
  cancelPlayback?.();
  cancelPlayback = null;
  loading?.abort();
  loading = null;
  if (active) {
    active.pause();
    active.src = "";
    active = null;
  }
}
async function loadAudio(url) {
  const controller = new AbortController();
  loading = controller;
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const body = await response.blob();
    return new Response(body, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
    });
  } catch (error) {
    if (error.name === "AbortError")
      throw Error(
        "L’audio n’a pas pu être chargé. Réessaie ou télécharge-le pour l’écouter hors connexion.",
      );
    throw error;
  } finally {
    clearTimeout(timer);
    if (loading === controller) loading = null;
  }
}
export function audioURL(corpus, unit, reciter = "minshawi") {
  if (unit.wordAudioURL) {
    if (
      !/^https:\/\/audio\.qurancdn\.com\/wbw\/\d{3}_\d{3}_\d{3}\.mp3$/.test(
        unit.wordAudioURL,
      )
    )
      throw Error("Source audio du mot invalide.");
    return unit.wordAudioURL;
  }
  if (corpus !== "quran") {
    if (!unit.audio) return null;
    const url = new URL(unit.audio, location.href);
    if (unit.audioRevision) url.searchParams.set("v", unit.audioRevision);
    return url.href;
  }
  const [s, n] = unit.id.split(":");
  return `https://everyayah.com/data/${folders[reciter] || folders.minshawi}/${s.padStart(3, "0")}${n.padStart(3, "0")}.mp3`;
}
export async function download(corpus, units, reciter, onProgress = () => {}) {
  units = expand(corpus, units);
  const cache = await caches.open("sakina-audio-v1");
  let i = 0;
  for (const unit of units) {
    const url = audioURL(corpus, unit, reciter);
    if (url && !(await cache.match(url))) {
      const r = await fetch(url);
      if (!r.ok) throw Error("Audio indisponible. Vérifie la connexion.");
      await cache.put(url, r);
    }
    onProgress(++i, units.length);
  }
}
export async function play(
  corpus,
  units,
  reciter,
  repeats = 1,
  onStep = () => {},
  onCycleComplete = () => {},
  onTime = () => {},
) {
  stop();
  units = expand(corpus, units);
  const token = run;
  try {
    // A live target lets the learner extend the current batch without restarting.
    for (
      let r = 0;
      r < (typeof repeats === "function" ? repeats() : repeats);
      r++
    ) {
      for (const unit of units) {
        if (token !== run) return;
        const url = audioURL(corpus, unit, reciter);
        if (!url)
          throw Error(
            "Ce passage ne dispose pas d’audio dans l’enregistrement fourni.",
          );
        const cache = await caches.open("sakina-audio-v1");
        let response = await cache.match(url);
        if (!response) {
          response = await loadAudio(url);
          if (!response.ok)
            throw Error(
              "Télécharge l’audio avec une connexion avant de l’écouter hors ligne.",
            );
          await cache.put(url, response.clone());
        }
        if (token !== run) return;
        const blob = URL.createObjectURL(await response.blob()),
          player = new Audio(blob);
        active = player;
        setSpeed(speed);
        let frame = null;
        const tick = () => {
          if (token !== run || player.paused) return;
          onTime(unit, player.currentTime, player.duration);
          frame = globalThis.requestAnimationFrame?.(tick);
        };
        player.onplaying = () => {
          if (token === run) {
            if (clip?.player === player) {
              clip.started = true;
              armClip();
            }
            onStep(unit, r + 1);
            onTime(unit, player.currentTime, player.duration);
            if (frame !== null) globalThis.cancelAnimationFrame?.(frame);
            if (globalThis.requestAnimationFrame)
              frame = requestAnimationFrame(tick);
          }
        };
        player.ontimeupdate = () => {
          if (token === run) {
            if (clip?.player === player && player.currentTime >= clip.end) {
              clip.finish();
              return;
            }
            onTime(unit, player.currentTime, player.duration);
          }
        };
        try {
          await new Promise((resolve, reject) => {
            let settled = false;
            const done = () => {
              if (settled) return;
              settled = true;
              resolve();
            };
            cancelPlayback = done;
            player.onended = done;
            player.onerror = () => reject(Error("Lecture audio impossible"));
            player.onpause = () => {
              if (token !== run) done();
            };
            if (unit.audioRange) {
              const { start, end } = unit.audioRange;
              if (
                !Number.isFinite(start) ||
                !Number.isFinite(end) ||
                start < 0 ||
                end <= start
              ) {
                reject(Error("Découpage audio indisponible pour ce mot."));
                return;
              }
              clip = {
                player,
                end,
                started: false,
                finish: () => {
                  done();
                  player.pause();
                },
              };
              let started = false;
              const begin = () => {
                if (started || token !== run) return;
                started = true;
                player.play().catch(reject);
              };
              player.onseeked = begin;
              player.onloadedmetadata = () => {
                if (token !== run) return;
                if (end > player.duration + 0.2) {
                  reject(
                    Error(
                      "Le découpage de ce mot ne correspond pas à cet audio.",
                    ),
                  );
                  return;
                }
                player.currentTime = start;
                if (start === 0) begin();
              };
              if (player.readyState >= 1) player.onloadedmetadata();
              else player.load();
            } else player.play().catch(reject);
          });
        } catch (error) {
          if (token === run) throw error;
          return;
        } finally {
          if (frame !== null) globalThis.cancelAnimationFrame?.(frame);
          if (clip?.player === player) clearClip();
          if (token === run) cancelPlayback = null;
          player.onended =
            player.onpause =
            player.onerror =
            player.onplaying =
            player.ontimeupdate =
            player.onseeked =
            player.onloadedmetadata =
              null;
          URL.revokeObjectURL(blob);
        }
      }
      if (token !== run) return;
      onCycleComplete(r + 1);
    }
  } catch (error) {
    if (token === run) throw error;
  } finally {
    if (token === run) {
      active = null;
      onStep(null, 0);
    }
  }
}
