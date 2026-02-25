/**
 * Lightweight confetti launcher using a temporary canvas overlay.
 * Returns a function: fireConfetti(durationMs = 3000)
 */
export function useConfetti() {
  function fireConfetti(durationMs = 3000) {
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;pointer-events:none;'
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    document.body.appendChild(canvas)

    const ctx = canvas.getContext('2d')
    const COLORS = ['#FFD54F', '#F44336', '#4CAF50', '#00BCD4', '#FF9800', '#E040FB', '#FFFFFF']
    const PARTICLE_COUNT = 120
    const particles = []

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: canvas.width * Math.random(),
        y: canvas.height * Math.random() * -1, // start above screen
        w: 4 + Math.random() * 6,
        h: 4 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      })
    }

    const start = performance.now()

    function frame(now) {
      const elapsed = now - start
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const fade = elapsed > durationMs - 800
        ? Math.max(0, 1 - (elapsed - (durationMs - 800)) / 800)
        : 1

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.05 // gravity
        p.rot += p.rotSpeed
        p.opacity = fade

        // Wrap horizontally
        if (p.x < -10) p.x = canvas.width + 10
        if (p.x > canvas.width + 10) p.x = -10

        ctx.save()
        ctx.translate(p.x, p.y)
        ctx.rotate((p.rot * Math.PI) / 180)
        ctx.globalAlpha = p.opacity
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      }

      if (elapsed < durationMs) {
        requestAnimationFrame(frame)
      } else {
        canvas.remove()
      }
    }

    requestAnimationFrame(frame)
  }

  return { fireConfetti }
}
