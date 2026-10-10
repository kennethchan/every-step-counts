/**
 * v-tooltip — a lightweight, styled tooltip directive.
 *
 * Native `title` tooltips are slow, unstylable and clash with the pixel-console
 * look. This renders a single shared floating layer instead, positioned next to
 * the target and clamped to the viewport.
 *
 * Usage:
 *   v-tooltip="'Simple text'"
 *   v-tooltip="{ text: 'Line one\nLine two', place: 'top' }"
 *
 * Placement options: 'bottom' (default), 'top', 'left', 'right'.
 * Shows on hover AND keyboard focus, so it stays accessible.
 */

/** The single shared tooltip element. @type {HTMLElement|null} */
let layer = null
/** The element currently being described. @type {any} */
let target = null

const OFFSET = 8
const MARGIN = 8

function ensureLayer() {
  if (layer) return layer
  layer = document.createElement('div')
  layer.className = 'tt'
  layer.setAttribute('role', 'tooltip')
  layer.hidden = true
  document.body.appendChild(layer)
  return layer
}

/**
 * Position the layer relative to the target, flipping when it would overflow.
 * @param {HTMLElement} el
 * @param {HTMLElement} tip
 * @param {'top'|'bottom'|'left'|'right'} preferred
 */
function position(el, tip, preferred) {
  const rect = el.getBoundingClientRect()
  const tw = tip.offsetWidth
  const th = tip.offsetHeight
  const vw = window.innerWidth
  const vh = window.innerHeight

  // Flip vertically when there's no room where we'd prefer to be.
  let p = preferred
  if (p === 'bottom' && rect.bottom + OFFSET + th > vh - MARGIN && rect.top - OFFSET - th > MARGIN) {
    p = 'top'
  } else if (p === 'top' && rect.top - OFFSET - th < MARGIN && rect.bottom + OFFSET + th < vh - MARGIN) {
    p = 'bottom'
  }

  let left
  let top

  if (p === 'top' || p === 'bottom') {
    left = rect.left + rect.width / 2 - tw / 2
    top = p === 'bottom' ? rect.bottom + OFFSET : rect.top - OFFSET - th
  } else {
    top = rect.top + rect.height / 2 - th / 2
    left = p === 'right' ? rect.right + OFFSET : rect.left - OFFSET - tw
  }

  // Clamp into the viewport.
  left = Math.max(MARGIN, Math.min(vw - tw - MARGIN, left))
  top = Math.max(MARGIN, Math.min(vh - th - MARGIN, top))

  tip.style.left = `${Math.round(left)}px`
  tip.style.top = `${Math.round(top)}px`
  tip.dataset.place = p
}

const show = () => {
  if (!target) return
  const tip = ensureLayer()
  tip.textContent = target.__ttText
  tip.hidden = false
  // Force a reflow so the width/height are measurable before positioning.
  void tip.offsetWidth
  position(target, tip, /** @type {any} */ (target.__ttPlace || 'bottom'))
  tip.classList.add('show')
}

const hide = () => {
  if (!layer) return
  layer.classList.remove('show')
  layer.hidden = true
}

/**
 * Read config onto the ELEMENT (not a module-global) so each directive instance
 * keeps its own text and placement.
 * @param {HTMLElement} el
 * @param {import('vue').DirectiveBinding} binding
 */
function readConfig(el, binding) {
  const value = binding.value
  if (value === undefined || value === null || value === '') {
    el.__ttText = ''
    return
  }
  if (typeof value === 'object') {
    el.__ttText = value.text ?? ''
    el.__ttPlace = value.place ?? 'bottom'
  } else {
    el.__ttText = String(value)
    el.__ttPlace = 'bottom'
  }
}

export const tooltipDirective = {
  mounted(el, binding) {
    readConfig(el, binding)

    const onEnter = () => {
      if (!el.__ttText) return
      target = el
      show()
    }

    el.__ttEnter = onEnter
    el.__ttLeave = hide

    el.addEventListener('mouseenter', onEnter)
    el.addEventListener('mouseleave', hide)
    el.addEventListener('focus', onEnter)
    el.addEventListener('blur', hide)
    el.addEventListener('mousedown', hide)
    window.addEventListener('scroll', hide, true)
    window.addEventListener('resize', hide)
  },

  updated(el, binding) {
    readConfig(el, binding)
    if (target === el && layer && !layer.hidden) {
      layer.textContent = el.__ttText
      position(el, layer, /** @type {any} */ (el.__ttPlace || 'bottom'))
    }
  },

  unmounted(el) {
    el.removeEventListener('mouseenter', el.__ttEnter)
    el.removeEventListener('mouseleave', el.__ttLeave)
    el.removeEventListener('focus', el.__ttEnter)
    el.removeEventListener('blur', el.__ttLeave)
    el.removeEventListener('mousedown', el.__ttLeave)
    window.removeEventListener('scroll', hide, true)
    window.removeEventListener('resize', hide)
    if (target === el) {
      hide()
      target = null
    }
  },
}

/** Fallback export name used when registering. */
export default tooltipDirective
