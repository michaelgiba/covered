// Simple FFT implementation for real-time audio visualization
// Based on standard Cooley-Tukey algorithm

export const calculateFFT = (input: number[]): number[] => {
    const n = input.length;
    const output = new Array(n).fill(0);

    // We only need the magnitude of the first n/2 bins (real input)
    // This is a simplified DFT for visualization purposes (O(N^2) but N is small, e.g. 64)
    // For N=64, N^2 = 4096 operations, which is fine for JS frame budget.
    // If we needed larger N, we'd use a proper FFT implementation.

    const halfN = n / 2;
    const magnitudes = new Array(halfN).fill(0);

    for (let k = 0; k < halfN; k++) {
        let real = 0;
        let imag = 0;
        for (let t = 0; t < n; t++) {
            const angle = (2 * Math.PI * k * t) / n;
            real += input[t] * Math.cos(angle);
            imag -= input[t] * Math.sin(angle);
        }
        // Magnitude
        magnitudes[k] = Math.sqrt(real * real + imag * imag);
    }

    // Normalize to 0-255 range roughly to match Web Audio API's getByteFrequencyData
    // Web Audio API returns dB scaled values, but linear magnitude is often enough for simple viz.
    // Let's try to approximate the scaling.
    // Input is -1 to 1. Max magnitude for a bin could be N/2.
    // So we divide by N/2 and scale to 255.

    return magnitudes.map(m => {
        const normalized = m / (n / 2);
        // Convert to 0-255 range, maybe applying some log scale if needed, 
        // but web's getByteFrequencyData is linear in dB? No, it's dB.
        // 20 * log10(normalized) is dB.
        // Let's stick to linear for now and tweak if it looks wrong.
        // Actually, let's just return 0-255 scaled linear for simplicity first.
        return Math.min(255, normalized * 255 * 2); // Boost a bit
    });
};

/**
 * Calculates the magnitude of specific frequency bins using a sparse DFT.
 * This is O(N * K) where N is input length and K is number of indices.
 * Much faster than full FFT when we only need a few bins.
 */
export const calculateMagnitudes = (input: number[], indices: number[]): number[] => {
    const n = input.length;
    return indices.map(k => {
        let real = 0;
        let imag = 0;
        for (let t = 0; t < n; t++) {
            const angle = (2 * Math.PI * k * t) / n;
            real += input[t] * Math.cos(angle);
            imag -= input[t] * Math.sin(angle);
        }
        const magnitude = Math.sqrt(real * real + imag * imag);
        if (n === 0) return 0;

        // Normalize magnitude to 0-1 range
        // For DC (k=0), max magnitude is N. For AC (k>0), max is N/2.
        const normalized = k === 0 ? magnitude / n : magnitude / (n / 2);

        // Convert to dB (Web Audio API style)
        // 20 * log10(normalized) gives dB relative to full scale (0 dB)
        // Common range is -100 dB to 0 dB
        let db = 20 * Math.log10(normalized + 1e-10); // Avoid log(0)

        // Map -100dB..-30dB to 0..255 (approximate typical visualizer range)
        // -100dB -> 0
        // -30dB -> 255
        const minDb = -100;
        const maxDb = -30;

        let scaled = ((db - minDb) / (maxDb - minDb)) * 255;

        return Math.max(0, Math.min(255, scaled));
    });
};
