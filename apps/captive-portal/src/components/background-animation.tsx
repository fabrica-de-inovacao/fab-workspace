import { useEffect, useRef } from 'react'

/**
 * BackgroundAnimation
 * Canvas que desenha trilhas orgânicas (circuitos + folhas + lâmpadas)
 * sobre uma malha pontilhada. Pensado para o fundo da tela de login:
 * - respeita o devicePixelRatio para nitidez em telas Retina
 * - pausa quando a aba não está visível (economia de CPU/GPU)
 * - degrada suavemente quando o usuário prefere menos movimento
 * - os ramos desviam da região central onde flutua o card de login
 */
export function BackgroundAnimation() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvasEl = canvasRef.current
    if (!canvasEl) return
    const context = canvasEl.getContext('2d')
    if (!context) return
    const canvas = canvasEl
    const ctx = context
    let animationFrameId = 0

    // --- Configuração ---
    const GRID_SIZE = 56
    const DRAW_SPEED = 0.035
    const MAX_BRANCHES = 9
    const SPAWN_PROBABILITY = 0.025
    const INITIAL_BRANCHES = 4
    const DOT_ALPHA = 0.55

    // Paleta alinhada ao tema (@theme em index.css)
    const COLORS = {
      primary: '#0066A1',
      accent: '#2EA3D2',
      secondary: '#8EC63F',
      warning: '#FFD100',
      dot: '#CBD5E1',
    }

    // Zona de exclusão para o card de login (eixo px, CSS pixels).
    // Recalculada a cada resize com fallback centrado.
    const keepOut = { cx: 0, cy: 0, rx: 0, ry: 0 }
    const computeKeepOut = () => {
      const card = document.querySelector<HTMLElement>('[data-login-card]')
      if (card) {
        const r = card.getBoundingClientRect()
        keepOut.cx = r.left + r.width / 2
        keepOut.cy = r.top + r.height / 2
        keepOut.rx = (r.width / 2 + 36) / GRID_SIZE
        keepOut.ry = (r.height / 2 + 36) / GRID_SIZE
      } else {
        keepOut.cx = canvas.width / 2
        keepOut.cy = canvas.height / 2
        keepOut.rx = 200 / GRID_SIZE
        keepOut.ry = 240 / GRID_SIZE
      }
    }

    const isInsideKeepOut = (gx: number, gy: number) => {
      const px = gx * GRID_SIZE
      const py = gy * GRID_SIZE
      const dx = (px - keepOut.cx) / (keepOut.rx * GRID_SIZE)
      const dy = (py - keepOut.cy) / (keepOut.ry * GRID_SIZE)
      return dx * dx + dy * dy < 1
    }

    const gridRegistry = new Map<string, { type: string; owner: number }>()
    let activeBranches: CircuitBranch[] = []
    let branchIdCounter = 0

    // --- DPI-aware resize ---
    const resizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const w = window.innerWidth
      const h = window.innerHeight
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      computeKeepOut()
    }
    window.addEventListener('resize', resizeCanvas)
    resizeCanvas()

    const getGridKey = (x: number, y: number) => `${x},${y}`

    const drawDotGrid = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      ctx.fillStyle = COLORS.dot
      ctx.globalAlpha = DOT_ALPHA
      for (let x = 0; x <= w; x += GRID_SIZE) {
        for (let y = 0; y <= h; y += GRID_SIZE) {
          ctx.beginPath()
          ctx.arc(x, y, 1.2, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.globalAlpha = 1
    }

    const drawJoint = (x: number, y: number, opacity: number) => {
      ctx.save()
      ctx.globalAlpha = opacity
      ctx.beginPath()
      ctx.arc(x * GRID_SIZE, y * GRID_SIZE, 5.5, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.lineWidth = 2.4
      ctx.strokeStyle = COLORS.primary
      ctx.stroke()
      ctx.restore()
    }

    const drawLamp = (x: number, y: number, scale: number, opacity: number) => {
      ctx.save()
      ctx.translate(x * GRID_SIZE, y * GRID_SIZE)
      ctx.scale(scale, scale)
      ctx.globalAlpha = opacity

      // Base conectora (3 linhas)
      ctx.strokeStyle = COLORS.primary
      ctx.lineWidth = 3
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(-6, -5)
      ctx.lineTo(6, -5)
      ctx.moveTo(-6, -10)
      ctx.lineTo(6, -10)
      ctx.moveTo(-6, -15)
      ctx.lineTo(6, -15)
      ctx.stroke()

      // Bulbo amarelo com brilho suave
      ctx.beginPath()
      ctx.arc(0, -30, 12, 0, Math.PI * 2)
      ctx.fillStyle = '#ffffff'
      ctx.fill()
      ctx.lineWidth = 3.5
      ctx.strokeStyle = COLORS.warning
      ctx.stroke()

      // Glow
      ctx.globalAlpha = opacity * 0.18 * scale
      ctx.beginPath()
      ctx.arc(0, -30, 22, 0, Math.PI * 2)
      ctx.fillStyle = COLORS.warning
      ctx.fill()

      ctx.restore()
    }

    const drawLeaf = (x: number, y: number, scale: number, opacity: number, angle: number) => {
      ctx.save()
      ctx.translate(x * GRID_SIZE, y * GRID_SIZE)
      ctx.rotate(angle)
      ctx.translate(0, -9)
      ctx.scale(scale, scale)
      ctx.globalAlpha = opacity

      ctx.fillStyle = COLORS.secondary
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.bezierCurveTo(11, -4, 11, -18, 0, -24)
      ctx.bezierCurveTo(-11, -18, -11, -4, 0, 0)
      ctx.fill()

      ctx.restore()
    }

    type Segment = { x1: number; y1: number; x2: number; y2: number }
    type NodeItem = { type: 'leaf' | 'lamp'; x: number; y: number; scale: number; angle?: number }

    class CircuitBranch {
      id: number
      parentId: number | null
      gx: number
      gy: number
      dir: [number, number]
      segments: Segment[]
      joints: Array<{ x: number; y: number }>
      nodes: NodeItem[]
      state: 'growing' | 'waiting' | 'fading' | 'dead'
      progress: number
      waitTimer: number
      opacity: number
      maxLength: number

      constructor(startX: number, startY: number, dir?: [number, number], parentId: number | null = null) {
        this.id = branchIdCounter++
        this.parentId = parentId
        this.gx = startX
        this.gy = startY
        if (!dir) {
          const dirs: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1]]
          this.dir = dirs[Math.floor(Math.random() * dirs.length)] ?? [1, 0]
        } else {
          this.dir = dir
        }
        this.segments = []
        this.nodes = []
        this.joints = [{ x: this.gx, y: this.gy }]
        this.state = 'growing'
        this.progress = 0
        this.waitTimer = 0
        this.opacity = 0
        this.maxLength = Math.floor(Math.random() * 5) + 3
        gridRegistry.set(getGridKey(this.gx, this.gy), { type: 'path', owner: this.id })
      }

      private pickTurn(): [number, number] {
        if (this.dir[0] !== 0) return [0, Math.random() > 0.5 ? 1 : -1]
        return [Math.random() > 0.5 ? 1 : -1, 0]
      }

      update() {
        if (this.state === 'dead') return

        if (this.state === 'growing' && this.opacity < 1) this.opacity += 0.04

        if (this.state === 'waiting') {
          this.waitTimer++
          if (this.waitTimer > 240) this.state = 'fading'
          this.updateNodesGrowth()
          return
        }

        if (this.state === 'fading') {
          this.opacity -= 0.008
          if (this.opacity <= 0) {
            this.state = 'dead'
            this.cleanupRegistry()
          }
          return
        }

        if (this.state !== 'growing') return

        this.progress += DRAW_SPEED
        if (this.progress < 1) return

        // Próxima célula
        const prevX = this.gx
        const prevY = this.gy
        let nextX = this.gx + this.dir[0]
        let nextY = this.gy + this.dir[1]

        // Desvia da zona do card
        let attempts = 0
        while (isInsideKeepOut(nextX, nextY) && attempts < 4) {
          this.dir = this.pickTurn()
          nextX = this.gx + this.dir[0]
          nextY = this.gy + this.dir[1]
          attempts++
        }

        this.gx = nextX
        this.gy = nextY
        this.segments.push({ x1: prevX, y1: prevY, x2: this.gx, y2: this.gy })
        this.joints.push({ x: this.gx, y: this.gy })
        this.progress = 0

        const currentKey = getGridKey(this.gx, this.gy)
        const registryHit = gridRegistry.get(currentKey)
        const w = window.innerWidth
        const h = window.innerHeight
        const outOfBounds =
          this.gx * GRID_SIZE < 0 ||
          this.gx * GRID_SIZE > w ||
          this.gy * GRID_SIZE < 0 ||
          this.gy * GRID_SIZE > h

        // Folha ocasional no meio do caminho
        if (Math.random() < 0.06) {
          const angle = Math.atan2(this.dir[1], this.dir[0]) + (Math.random() > 0.5 ? Math.PI / 4 : -Math.PI / 4)
          this.nodes.push({ type: 'leaf', x: this.gx, y: this.gy, scale: 0, angle })
        }

        if (outOfBounds || (registryHit && registryHit.owner !== this.id && registryHit.owner !== this.parentId)) {
          if (!outOfBounds && registryHit && registryHit.type !== 'lamp' && Math.random() < 0.25) {
            const angle = Math.random() * Math.PI * 2
            this.nodes.push({ type: 'leaf', x: this.gx, y: this.gy, scale: 0, angle })
          }
          this.state = 'waiting'
          return
        }

        if (this.segments.length >= this.maxLength) {
          if (Math.random() < 0.6) {
            this.nodes.push({ type: 'lamp', x: this.gx, y: this.gy, scale: 0 })
            gridRegistry.set(currentKey, { type: 'lamp', owner: this.id })
          } else {
            const angle = Math.atan2(this.dir[1], this.dir[0])
            this.nodes.push({ type: 'leaf', x: this.gx, y: this.gy, scale: 0, angle })
          }
          this.state = 'waiting'
          return
        }

        gridRegistry.set(currentKey, { type: 'path', owner: this.id })

        if (Math.random() < 0.28) this.dir = this.pickTurn()
        if (Math.random() < 0.12) {
          const newDir = this.pickTurn()
          activeBranches.push(new CircuitBranch(this.gx, this.gy, newDir, this.id))
        }
      }

      updateNodesGrowth() {
        for (const node of this.nodes) if (node.scale < 1) node.scale += 0.05
      }

      cleanupRegistry() {
        gridRegistry.forEach((value, key) => {
          if (value.owner === this.id) gridRegistry.delete(key)
        })
      }

      draw() {
        if (this.state === 'dead') return
        ctx.save()
        ctx.globalAlpha = Math.max(0, this.opacity)

        ctx.beginPath()
        ctx.strokeStyle = COLORS.primary
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        if (this.segments.length > 0 && this.segments[0]) {
          ctx.moveTo(this.segments[0].x1 * GRID_SIZE, this.segments[0].y1 * GRID_SIZE)
          for (const seg of this.segments) {
            ctx.lineTo(seg.x2 * GRID_SIZE, seg.y2 * GRID_SIZE)
          }
        }
        ctx.stroke()

        if (this.state === 'growing') {
          const sx = this.gx
          const sy = this.gy
          const ex = sx + this.dir[0] * this.progress
          const ey = sy + this.dir[1] * this.progress
          ctx.beginPath()
          ctx.moveTo(sx * GRID_SIZE, sy * GRID_SIZE)
          ctx.lineTo(ex * GRID_SIZE, ey * GRID_SIZE)
          ctx.stroke()
        }

        for (const j of this.joints) drawJoint(j.x, j.y, this.opacity)
        for (const node of this.nodes) {
          if (node.type === 'leaf') drawLeaf(node.x, node.y, node.scale, this.opacity, node.angle ?? 0)
          else drawLamp(node.x, node.y, node.scale, this.opacity)
        }

        ctx.restore()
      }
    }

    // --- Loop principal ---
    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      drawDotGrid()

      activeBranches = activeBranches.filter((b) => b.state !== 'dead')

      if (activeBranches.length < MAX_BRANCHES && Math.random() < SPAWN_PROBABILITY) {
        const w = window.innerWidth
        const h = window.innerHeight
        let sx = 0
        let sy = 0
        let tries = 0
        do {
          sx = Math.floor(Math.random() * (w / GRID_SIZE))
          sy = Math.floor(Math.random() * (h / GRID_SIZE))
          tries++
        } while (isInsideKeepOut(sx, sy) && tries < 6)
        activeBranches.push(new CircuitBranch(sx, sy))
      }

      for (const branch of activeBranches) {
        branch.update()
        branch.draw()
      }

      animationFrameId = requestAnimationFrame(animate)
    }

    // Semente inicial longe do centro
    for (let i = 0; i < INITIAL_BRANCHES; i++) {
      const w = window.innerWidth
      const h = window.innerHeight
      let sx = 0
      let sy = 0
      let tries = 0
      do {
        sx = Math.floor(Math.random() * (w / GRID_SIZE))
        sy = Math.floor(Math.random() * (h / GRID_SIZE))
        tries++
      } while (isInsideKeepOut(sx, sy) && tries < 6)
      activeBranches.push(new CircuitBranch(sx, sy))
    }

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!prefersReduced) {
      animate()
    } else {
      // Frame estático único para respeitar a preferência
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
      drawDotGrid()
    }

    // Pausa/retoma quando a aba fica oculta
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId)
      } else if (!prefersReduced) {
        animate()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      document.removeEventListener('visibilitychange', onVisibility)
      cancelAnimationFrame(animationFrameId)
      gridRegistry.clear()
    }
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#fcfcfd]">
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  )
}
