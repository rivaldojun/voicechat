"use client"

import { useEffect, useRef } from "react"

interface AudioVisualizerProps {
  isActive: boolean
}

export default function AudioVisualizer({ isActive }: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()

      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr

      ctx.scale(dpr, dpr)
    }

    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)

    // Animation variables
    const particles: Particle[] = []
    const particleCount = 50

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle(canvas))
    }

    // Animation function
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw center circle
      const centerX = canvas.width / 2 / (window.devicePixelRatio || 1)
      const centerY = canvas.height / 2 / (window.devicePixelRatio || 1)
      const radius = isActive ? 40 + Math.sin(Date.now() / 200) * 10 : 30

      // Gradient for center circle
      const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 2)

      gradient.addColorStop(0, isActive ? "rgba(139, 92, 246, 0.8)" : "rgba(139, 92, 246, 0.3)")
      gradient.addColorStop(1, "rgba(139, 92, 246, 0)")

      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      // Update and draw particles
      particles.forEach((particle) => {
        particle.update(isActive)
        particle.draw(ctx)
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener("resize", setCanvasDimensions)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isActive])

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-0 pointer-events-none" />
}

class Particle {
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  canvas: HTMLCanvasElement
  alpha: number
  color: string

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.x = canvas.width / 2 / (window.devicePixelRatio || 1)
    this.y = canvas.height / 2 / (window.devicePixelRatio || 1)
    this.size = Math.random() * 3 + 1
    const angle = Math.random() * Math.PI * 2
    const speed = Math.random() * 1 + 0.5
    this.speedX = Math.cos(angle) * speed
    this.speedY = Math.sin(angle) * speed
    this.alpha = Math.random() * 0.5 + 0.1

    // blue color variations
    const hue = 270 + Math.random() * 30 - 15 // blue hue with variation
    const saturation = 70 + Math.random() * 30 // 70-100%
    const lightness = 50 + Math.random() * 20 // 50-70%
    this.color = `hsla(${hue}, ${saturation}%, ${lightness}%, ${this.alpha})`
  }

  update(isActive: boolean) {
    // Move particles
    this.x += this.speedX * (isActive ? 1.5 : 0.5)
    this.y += this.speedY * (isActive ? 1.5 : 0.5)

    // Fade out as they move away from center
    const centerX = this.canvas.width / 2 / (window.devicePixelRatio || 1)
    const centerY = this.canvas.height / 2 / (window.devicePixelRatio || 1)
    const distance = Math.sqrt(Math.pow(this.x - centerX, 2) + Math.pow(this.y - centerY, 2))

    this.alpha = Math.max(0, 0.5 - distance / 300)

    // Reset particle if it's too far or faded out
    if (
      this.alpha <= 0.01 ||
      this.x < 0 ||
      this.x > this.canvas.width / (window.devicePixelRatio || 1) ||
      this.y < 0 ||
      this.y > this.canvas.height / (window.devicePixelRatio || 1)
    ) {
      this.x = centerX
      this.y = centerY
      const angle = Math.random() * Math.PI * 2
      const speed = Math.random() * 1 + 0.5
      this.speedX = Math.cos(angle) * speed
      this.speedY = Math.sin(angle) * speed
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = this.color.replace(/[\d.]+\)$/, `${this.alpha})`)
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
  }
}
