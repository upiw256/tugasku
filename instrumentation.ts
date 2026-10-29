// Logika Node.js runtime (worker, seed, dll.) dipindah ke instrumentation.node.ts
// agar tidak di-bundle ke Edge Runtime oleh Next.js.
export async function register() {}