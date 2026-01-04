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
