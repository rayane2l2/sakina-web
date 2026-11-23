// Microphone audio waiting for a busy recognizer. Instead of dropping the microphone when a
// phone falls behind, late chunks are merged and sent as one piece as soon as the
// recognizer acknowledges the previous one. Only a backlog longer than `maxSeconds`
// means the phone genuinely cannot keep up.
export class AudioBacklog {
  constructor({ maxInFlight = 3, maxSeconds = 20 } = {}) {
    this.maxInFlight = maxInFlight;
    this.maxSeconds = maxSeconds;
    this.reset();
  }

  reset() {
    this.inFlight = 0;
    this.parts = [];
    this.queued = 0;
    this.rate = 16000;
    this.overflow = false;
  }

  // Returns the chunk to send now, or null when it was queued.
  push(samples, rate) {
    this.rate = rate;
    if (this.inFlight < this.maxInFlight && !this.parts.length) {
      this.inFlight += 1;
      return { samples, rate };
    }
    this.parts = [...this.parts, samples];
    this.queued += samples.length;
    if (this.queued / rate > this.maxSeconds) this.overflow = true;
    return null;
  }

  // The recognizer finished one chunk: release the merged backlog if there is room.
  done() {
    this.inFlight = Math.max(0, this.inFlight - 1);
    if (this.inFlight >= this.maxInFlight) return null;
    return this.flush();
  }

  // Everything still queued, merged, regardless of room: used when the recitation ends.
  flush() {
    if (!this.parts.length) return null;
    const merged = new Float32Array(this.queued);
    this.parts.reduce((offset, part) => {
      merged.set(part, offset);
      return offset + part.length;
    }, 0);
    this.parts = [];
    this.queued = 0;
    this.inFlight += 1;
    return { samples: merged, rate: this.rate };
  }
}
