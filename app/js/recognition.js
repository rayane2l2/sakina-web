import { normalizeModel } from "./model-choice.js";
import { AudioBacklog } from "./audio-backlog.js";

const MODEL_RATE = 16000;
const LAST_MODEL_PART = new URL("../models/v3.1/zipformer-04.bin", import.meta.url).href;

// A 16 kHz context lets the browser resample natively, so a third of the audio reaches the
// worker and the engine never resamples. Browsers that refuse it keep their own rate.
function captureContext() {
  try {
    return new AudioContext({ sampleRate: MODEL_RATE });
  } catch {
    return new AudioContext();
  }
}

// True when offline preparation already stored the model: warming it up costs no data.
async function modelStored() {
  try {
    return Boolean(await globalThis.caches?.match(LAST_MODEL_PART));
  } catch {
    return false;
  }
}
export class Recognition extends EventTarget {
  constructor(model = "v3.1") {
    super();
    this.model = normalizeModel(model);
    this.worker = null;
    this.loaded = false;
    this.active = false;
    this.backlog = new AudioBacklog();
    this.generation = 0;
  }

  emit(type, detail) {
    this.dispatchEvent(new CustomEvent(type, { detail }));
  }

  // Move the reading cursor without reloading the model or closing the microphone.
  resetSegment() {
    this.backlog.reset();
    const id = ++this.generation;
    if (this.loaded) this.worker?.postMessage({ type: "reset", id });
    return id;
  }

  // Loads the model in the background before the microphone is tapped, so the first tap
  // answers at once. Only when the model is already stored on the device.
  async prewarm() {
    if (this.loaded || this.loading || this.prewarming) return;
    this.prewarming = true;
    try {
      if (await modelStored()) await this.init();
    } catch {
      // A failed warm-up is retried by the real start, which reports the error.
    } finally {
      this.prewarming = false;
    }
  }

  // Sends late audio as soon as the worker has digested the previous chunk.
  release() {
    const next = this.backlog.done();
    if (next) this.send(next);
  }

  send({ samples, rate }) {
    this.worker.postMessage({ type: "audio", samples, rate, id: this.generation }, [samples.buffer]);
  }

  async init() {
    if (this.loaded) return;

    if (this.loading) return this.loading;

    this.loading = new Promise((resolve, reject) => {
      this.worker = new Worker(new URL("./asr-worker.js", import.meta.url));

      this.worker.onmessage = ({ data }) => {
        if (data.type === "ready") {
          this.loaded = true;
          resolve();
        }

        if ((data.type === "result" || data.type === "tick") && data.id === this.generation) {
          this.release();
          if (data.type === "result") this.emit("result", data);
        }

        if (data.type === "error") {
          reject(Error(data.message));
          this.emit("error", data.message);
        }
      };

      this.worker.onerror = (e) => {
        reject(Error(e.message));
        this.emit("error", e.message);
      };

      this.worker.postMessage({ type: "init", model: this.model });
    });

    return this.loading;
  }

  async start({ maxDuration = 120000 } = {}) {
    if (this.active) return;

    try {
      // Resume the audio context during the actual button gesture (Safari/WebView).

      this.context = captureContext();
      await this.context.resume();

      await this.init();

      if (!navigator.mediaDevices?.getUserMedia)
        throw Error(
          "Le microphone nécessite une page HTTPS ou l’application Android.",
        );

      this.media = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      await this.context.audioWorklet.addModule(
        new URL("./microphone-worklet.js", import.meta.url),
      );

      try {
        this.source = this.context.createMediaStreamSource(this.media);
      } catch {
        // Some browsers cannot connect a microphone to a context at another rate.
        await this.context.close();
        this.context = new AudioContext();
        await this.context.resume();
        await this.context.audioWorklet.addModule(new URL("./microphone-worklet.js", import.meta.url));
        this.source = this.context.createMediaStreamSource(this.media);
      }

      this.capture = new AudioWorkletNode(this.context, "sakina-capture");

      this.mute = this.context.createGain();
      this.mute.gain.value = 0;

      this.resetSegment();
      this.active = true;

      this.capture.port.onmessage = ({ data }) => {
        if (data.flushed) {
          this.flushResolve?.();
          return;
        }
        if (!this.active) return;


        this.emit(
          "level",
          Math.sqrt(
            data.samples.reduce((s, x) => s + x * x, 0) / data.samples.length,
          ),
        );

        const now = this.backlog.push(data.samples, data.rate);
        if (now) this.send(now);
        if (this.backlog.overflow) {
          this.stop(false);
          this.emit("error", "Le téléphone traite trop lentement. Essaie une portion plus courte.");
        }
      };

      this.source.connect(this.capture);
      this.capture.connect(this.mute);
      this.mute.connect(this.context.destination);

      this.limit = setTimeout(
        () => {
          this.stop();
          this.emit("limit", null);
        },
        Math.max(120000, Math.min(600000, Number(maxDuration) || 120000)),
      );
    } catch (e) {
      await this.stop(false);
      throw e;
    }
  }

  async stop(finish = true) {
    if (this.stopping) return this.stopping;
    const operation = this.finishCapture(finish);
    this.stopping = operation;
    try {
      await operation;
    } finally {
      if (this.stopping === operation) this.stopping = null;
    }
  }
  async finishCapture(finish) {
    const wasActive = this.active;
    clearTimeout(this.limit);
    if (wasActive && finish && this.capture) {
      // Flush the worklet's short final buffer BEFORE closing its audio context.
      await new Promise((resolve) => {
        const timer = setTimeout(() => {
          this.flushResolve = null;
          resolve();
        }, 350);
        this.flushResolve = () => {
          clearTimeout(timer);
          this.flushResolve = null;
          resolve();
        };
        this.capture.port.postMessage({ type: "flush" });
      });
    }
    this.active = false;
    this.capture?.disconnect();
    this.source?.disconnect();
    this.mute?.disconnect();
    this.media?.getTracks().forEach((t) => t.stop());
    this.media = null;
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (!finish)
      this.worker?.postMessage({ type: "cancel", id: ++this.generation });
    if (wasActive && finish) {
      const rest = this.backlog.flush();
      if (rest) this.send(rest);
      this.worker?.postMessage({ type: "finish", id: this.generation });
    }
  }
  dispose() {
    this.stop(false);
    this.worker?.terminate();
    this.worker = null;
    this.loaded = false;
    this.loading = null;
  }

  async file(file) {
    await this.init();
    await this.stop(false);

    const ctx = new AudioContext();
    let decoded;

    try {
      decoded = await ctx.decodeAudioData(await file.arrayBuffer());
    } finally {
      await ctx.close();
    }

    if (decoded.duration > 120)
      throw Error("Choisis un audio de moins de deux minutes.");

    const offline = new OfflineAudioContext(
      1,
      Math.ceil(decoded.duration * 16000),
      16000,
    );

    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();

    const mono = (await offline.startRendering()).getChannelData(0);

    this.worker.postMessage({ type: "reset", id: ++this.generation });

    for (let i = 0; i < mono.length; i += 5120) {
      const samples = mono.slice(i, i + 5120);
      this.worker.postMessage(
        { type: "audio", rate: 16000, samples, id: this.generation },
        [samples.buffer],
      );
    }

    this.worker.postMessage({ type: "finish", id: this.generation });
  }
}
