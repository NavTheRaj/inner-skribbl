import { useEffect, useMemo, useRef, useState } from 'react'

const COLORS = ['#0ea5e9', '#ec4899', '#10b981', '#f59e0b', '#6366f1']

function DrawingCanvas({ strokes, onStroke }) {
  const svgRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [points, setPoints] = useState([])
  const [color] = useState(() => COLORS[Math.floor(Math.random() * COLORS.length)])

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return

    const handleUp = () => {
      if (isDrawing && points.length > 1) {
        onStroke({
          id: crypto.randomUUID(),
          points,
          color,
          width: 3,
        })
      }
      setIsDrawing(false)
      setPoints([])
    }

    window.addEventListener('mouseup', handleUp)
    window.addEventListener('touchend', handleUp)
    return () => {
      window.removeEventListener('mouseup', handleUp)
      window.removeEventListener('touchend', handleUp)
    }
  }, [isDrawing, points, color, onStroke])

  const activePath = useMemo(() => points.map((p) => `${p.x},${p.y}`).join(' '), [points])

  const handleDown = (event) => {
    const { left, top } = svgRef.current.getBoundingClientRect()
    const x = (event.clientX || event.touches?.[0]?.clientX) - left
    const y = (event.clientY || event.touches?.[0]?.clientY) - top
    setPoints([{ x, y }])
    setIsDrawing(true)
  }

  const handleMove = (event) => {
    if (!isDrawing) return
    const { left, top } = svgRef.current.getBoundingClientRect()
    const x = (event.clientX || event.touches?.[0]?.clientX) - left
    const y = (event.clientY || event.touches?.[0]?.clientY) - top
    setPoints((prev) => [...prev, { x, y }])
  }

  return (
    <div className="canvas-wrapper">
      <svg
        ref={svgRef}
        onMouseDown={handleDown}
        onMouseMove={handleMove}
        onTouchStart={handleDown}
        onTouchMove={handleMove}
        width="100%"
        height="100%"
        style={{ touchAction: 'none' }}
      >
        {strokes.map((stroke) => (
          <polyline
            key={stroke.id}
            fill="none"
            stroke={stroke.color}
            strokeWidth={stroke.width}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={stroke.points.map((p) => `${p.x},${p.y}`).join(' ')}
          />
        ))}
        {isDrawing && points.length > 0 && (
          <polyline
            fill="none"
            stroke={color}
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
            points={activePath}
          />
        )}
      </svg>
    </div>
  )
}

export default DrawingCanvas
