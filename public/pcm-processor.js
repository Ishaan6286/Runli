// public/pcm-processor.js
// AudioWorkletProcessor that captures raw PCM samples from the microphone
// and posts them to the main thread as Int16Array chunks.
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    // Accumulate samples until we have a full 4096-sample chunk
    // (matching the old ScriptProcessorNode buffer size).
    this._buffer = new Float32Array(4096);
    this._bufferIndex = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channel = input[0];

    for (let i = 0; i < channel.length; i++) {
      this._buffer[this._bufferIndex++] = channel[i];

      if (this._bufferIndex === this._buffer.length) {
        // Convert Float32 → Int16 and send to main thread
        const pcm16 = new Int16Array(this._buffer.length);
        for (let j = 0; j < this._buffer.length; j++) {
          const val = Math.max(-1, Math.min(1, this._buffer[j]));
          pcm16[j] = val < 0 ? val * 32768 : val * 32767;
        }
        this.port.postMessage({ pcm16: pcm16.buffer }, [pcm16.buffer]);
        this._bufferIndex = 0;
      }
    }

    return true; // Keep processor alive
  }
}

registerProcessor('pcm-processor', PCMProcessor);
