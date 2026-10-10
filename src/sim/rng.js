/**
 * Deterministic, seedable RNG. Pure: every function takes a seed and returns a
 * new seed alongside the value, so the simulation never mutates anything
 * globally and a saved seed reproduces an identical sequence of races.
 *
 * Uses a mulberry32-style 32-bit generator.
 */

/**
 * Advance the generator, returning the new seed and a uint32 value.
 * @param {number} seed
 * @returns {{ seed: number, value: number }}
 */
export function nextUint32(seed) {
  const a = (seed + 0x6d2b79f5) | 0
  let t = Math.imul(a ^ (a >>> 15), 1 | a)
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
  const value = (t ^ (t >>> 14)) >>> 0
  return { seed: a >>> 0, value }
}

/**
 * Uniform float in [0, 1).
 * @param {number} seed
 * @returns {{ seed: number, value: number }}
 */
export function nextFloat(seed) {
  const r = nextUint32(seed)
  return { seed: r.seed, value: r.value / 4294967296 }
}

/**
 * Standard normal sample via Box–Muller.
 * @param {number} seed
 * @returns {{ seed: number, value: number }}
 */
export function nextNormal(seed) {
  const a = nextFloat(seed)
  const b = nextFloat(a.seed)
  const u1 = Math.max(a.value, 1e-9)
  const u2 = b.value
  const value = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
  return { seed: b.seed, value }
}

/**
 * Pick a random element from an array.
 * @template T
 * @param {number} seed
 * @param {readonly T[]} arr
 * @returns {{ seed: number, value: T }}
 */
export function pick(seed, arr) {
  const r = nextFloat(seed)
  const index = Math.min(arr.length - 1, Math.floor(r.value * arr.length))
  return { seed: r.seed, value: arr[index] }
}

/**
 * Create an initial seed from the clock (only place wall-clock time is read).
 * @returns {number}
 */
export function createSeed() {
  return (Date.now() ^ (Math.random() * 0xffffffff)) >>> 0
}
