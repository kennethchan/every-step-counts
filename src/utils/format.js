/**
 * Formatting helpers shared by the sim and the UI.
 */

/**
 * Format seconds as m:ss or h:mm:ss.
 * @param {number} seconds
 * @returns {string}
 */
export function fmtTime(seconds) {
  const total = Math.max(0, Math.round(seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Format seconds as a per-kilometre pace, e.g. "4:32 /km".
 * @param {number} secondsPerKm
 * @returns {string}
 */
export function fmtPace(secondsPerKm) {
  return `${fmtTime(secondsPerKm)} /km`
}

/**
 * Pace (seconds per km) for a performance over a distance.
 * @param {number} timeSeconds
 * @param {number} distanceMetres
 * @returns {number}
 */
export function paceOf(timeSeconds, distanceMetres) {
  if (!distanceMetres) return 0
  return timeSeconds / (distanceMetres / 1000)
}

/**
 * Format a performance directly as pace, e.g. "4:32 /km".
 * @param {number} timeSeconds
 * @param {number} distanceMetres
 * @returns {string}
 */
export function fmtPaceOf(timeSeconds, distanceMetres) {
  return fmtPace(paceOf(timeSeconds, distanceMetres))
}

/**
 * Ordinal suffix helper (1st, 2nd, 3rd...).
 * @param {number} n
 * @returns {string}
 */
export function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

/**
 * Format a distance in metres as a friendly label.
 * @param {number} metres
 * @returns {string}
 */
export function fmtDistance(metres) {
  if (metres >= 1000) {
    const km = metres / 1000
    return `${Number.isInteger(km) ? km : km.toFixed(3).replace(/0+$/, '').replace(/\.$/, '')} km`
  }
  return `${metres} m`
}

/**
 * Money formatting.
 * @param {number} amount
 * @returns {string}
 */
export function fmtMoney(amount) {
  return `$${Math.round(amount).toLocaleString('en-US')}`
}
