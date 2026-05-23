import React, { useRef, useState, useEffect, useCallback } from "react";

/**
 * CanvasEngine - self-contained canvas with:
 *  - pen / eraser
 *  - undo / redo
 *  - clear
 *  - download
 *  - zoom (buttons)
 *  - multi-youtube/other logic is outside (this file only exposes the canvas)
 *
 * Usage: <CanvasEngine />
 *
 * Important: if you already have toolbar in Dashboard, remove the duplicate toolbar there.
 */

function CanvasEngine() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const ctxRef = useRef(null);

  const drawingRef = useRef(false);
  const currentStrokeRef = useRef(null);

  const undoStackRef = useRef([]); // authoritative stroke stack for undo/redo
  const redoStackRef = useRef([]);

  const [tool, setTool] = useState("pen"); // "pen" | "eraser"
  const [color, setColor] = useState("#000000");
  const [width, setWidth] = useState(6);
  const [strokes, setStrokes] = useState([]); // mirror of undoStackRef (for re-render triggers)
  const [scale, setScale] = useState(1);

  // get devicePixelRatio once (we still read it on resize since DPR can change in some environments)
  const getDpr = () => window.devicePixelRatio || 1;

  // -----------------------
  // Canvas sizing + transform
  // -----------------------
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = getDpr();

    // Internal pixel size
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);

    // CSS size
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";

    const ctx = canvas.getContext("2d");
    ctxRef.current = ctx;

    // set a transform so drawing coordinates can be expressed in CSS pixels,
    // and later we multiply by scale (zoom)
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);

    // redraw current strokes after resizing
    redrawAll(ctx, undoStackRef.current);
  }, [scale]);

  useEffect(() => {
    // observe container resize
    const ro = new ResizeObserver(resizeCanvas);
    if (containerRef.current) ro.observe(containerRef.current);

    // initial call
    resizeCanvas();

    return () => ro.disconnect();
  }, [resizeCanvas]);

  // Reapply transform on scale change and redraw
  useEffect(() => {
    const ctx = ctxRef.current;
    if (!ctx) return;
    const dpr = getDpr();
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
    redrawAll(ctx, undoStackRef.current);
  }, [scale]);

  // -----------------------
  // Undo / Redo / Clear
  // -----------------------
  const setStacksToState = () => {
    // keep strokes state in sync with undo stack
    setStrokes([...undoStackRef.current]);
  };

  const pushStroke = (stroke) => {
    // push a deep-copy (points is array)
    const copy = { ...stroke, points: stroke.points.map(p => ({ ...p })) };
    undoStackRef.current.push(copy);
    redoStackRef.current = [];
    setStacksToState();
  };

  const undo = () => {
    if (!undoStackRef.current.length) return;
    const s = undoStackRef.current.pop();
    redoStackRef.current.push(s);
    setStacksToState();
    // redraw
    const ctx = ctxRef.current;
    if (ctx) redrawAll(ctx, undoStackRef.current);
  };

  const redo = () => {
    if (!redoStackRef.current.length) return;
    const s = redoStackRef.current.pop();
    undoStackRef.current.push(s);
    setStacksToState();
    const ctx = ctxRef.current;
    if (ctx) redrawAll(ctx, undoStackRef.current);
  };

  const clearAll = () => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    setStacksToState();
    const ctx = ctxRef.current;
    if (ctx) {
      // clear canvas fully (reset transform then clear, then reapply)
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }
  };

  // -----------------------
  // Pointer coordinate mapping
  // We store points in CSS-pixel coordinates (i.e., 0..rect.width).
  // When drawing, ctx has transform = scale * dpr, so we must divide client delta by scale.
  // -----------------------
  const getPointerCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    // use clientX/Y relative to element
    const cssX = e.clientX - rect.left;
    const cssY = e.clientY - rect.top;

    // convert to logical coordinates we store (CSS pixels)
    const x = cssX / Math.max(scale, 1e-8);
    const y = cssY / Math.max(scale, 1e-8);

    return { x, y };
  };

  // -----------------------
  // Drawing handlers
  // -----------------------
  const startDrawing = (e) => {
    if (e.button && e.button !== 0) return; // only primary mouse button
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture?.(e.pointerId);

    const { x, y } = getPointerCoords(e);
    drawingRef.current = true;

    // create stroke object
    currentStrokeRef.current = {
      id: Date.now() + Math.random(),
      type: tool === "eraser" ? "eraser" : "pen",
      color: tool === "eraser" ? null : color,
      width,
      points: [{ x, y }]
    };

    const ctx = ctxRef.current;
    if (!ctx) return;

    // prepare the context for live drawing (must match redraw logic)
    ctx.beginPath();
    ctx.globalCompositeOperation =
      currentStrokeRef.current.type === "eraser"
        ? "destination-out"
        : "source-over";

    ctx.strokeStyle =
      currentStrokeRef.current.type === "eraser"
        ? "rgba(0,0,0,1)"
        : currentStrokeRef.current.color;

    ctx.lineWidth = currentStrokeRef.current.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // move to the point in the same coordinate space as strokes (CSS pixels)
    ctx.moveTo(x, y);
  };

  const moveDrawing = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();

    const ctx = ctxRef.current;
    if (!ctx) return;

    const { x, y } = getPointerCoords(e);

    // draw to client point
    ctx.lineTo(x, y);
    ctx.stroke();

    // store point
    if (currentStrokeRef.current) {
      currentStrokeRef.current.points.push({ x, y });
    }
  };

  const endDrawing = (e) => {
    if (!drawingRef.current) return;
    e?.preventDefault();

    const canvas = canvasRef.current;
    canvas?.releasePointerCapture?.(e?.pointerId);

    drawingRef.current = false;
    ctxRef.current?.closePath();

    if (currentStrokeRef.current) {
      pushStroke(currentStrokeRef.current);
      currentStrokeRef.current = null;
    }
  };

  // -----------------------
  // Redraw entire stack
  // -----------------------
  function redrawAll(ctx, strokesToDraw) {
    if (!ctx) return;

    // clear full surface (use identity to avoid transform issues)
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.restore();

    const dpr = getDpr();

    // reapply transform (zoom * DPR) so drawing uses CSS-px coords
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);

    // draw every stroke
    for (const stroke of strokesToDraw) {
      if (!stroke || !stroke.points || stroke.points.length === 0) continue;

      ctx.beginPath();

      ctx.globalCompositeOperation =
        stroke.type === "eraser" ? "destination-out" : "source-over";

      ctx.strokeStyle =
        stroke.type === "eraser" ? "rgba(0,0,0,1)" : stroke.color || "#000";

      ctx.lineWidth = stroke.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      const p0 = stroke.points[0];
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < stroke.points.length; i++) {
        const p = stroke.points[i];
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    // return to default composite mode
    ctx.globalCompositeOperation = "source-over";
  }

  // -----------------------
  // Download
  // -----------------------
  const downloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create export canvas sized to device pixels (to keep quality)
    const rect = canvas.getBoundingClientRect();
    const dpr = getDpr();

    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = Math.floor(rect.width * dpr);
    exportCanvas.height = Math.floor(rect.height * dpr);

    const exportCtx = exportCanvas.getContext("2d");
    // white background
    exportCtx.fillStyle = "#ffffff";
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // re-draw strokes into export context with DPR applied but no extra scale
    // transform for export: (dpr, 0, 0, dpr, 0, 0) * scale
    exportCtx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);

    for (const stroke of undoStackRef.current) {
      if (!stroke || !stroke.points?.length) continue;
      exportCtx.beginPath();
      exportCtx.globalCompositeOperation =
        stroke.type === "eraser" ? "destination-out" : "source-over";
      exportCtx.strokeStyle =
        stroke.type === "eraser" ? "rgba(0,0,0,1)" : stroke.color || "#000";
      exportCtx.lineWidth = stroke.width;
      exportCtx.lineCap = "round";
      exportCtx.lineJoin = "round";

      exportCtx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        const p = stroke.points[i];
        exportCtx.lineTo(p.x, p.y);
      }
      exportCtx.stroke();
    }

    const link = document.createElement("a");
    link.download = `canvas-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL("image/png");
    link.click();
  };

  // -----------------------
  // Keyboard shortcuts
  // -----------------------
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        undo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.shiftKey && e.key === "Z"))) {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // -----------------------
  // Render
  // -----------------------
  return (
    <>
      <div className="toolbar">
        <button onClick={undo}>↶</button>
        <button onClick={redo}>↷</button>
        <button onClick={clearAll}>🗑</button>
        <button onClick={downloadPNG}>⬇</button>

        <button
          className={tool === "pen" ? "active" : ""}
          onClick={() => setTool("pen")}
        >
          ✏
        </button>

        <button
          className={tool === "eraser" ? "active" : ""}
          onClick={() => setTool("eraser")}
        >
          🧽
        </button>

        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          title="Pen color"
          disabled={tool === "eraser"}
        />

        <button onClick={() => setScale((s) => s * 1.1)}>+</button>
        <button onClick={() => setScale((s) => s / 1.1)}>−</button>

        <input
          type="range"
          min="1"
          max="40"
          value={width}
          onChange={(e) => setWidth(+e.target.value)}
        />
        <small>{width} px</small>
      </div>

      <div ref={containerRef} className="canvas-container" style={{ flex: 1 }}>
        <canvas
          ref={canvasRef}
          onPointerDown={startDrawing}
          onPointerMove={moveDrawing}
          onPointerUp={endDrawing}
          onPointerCancel={endDrawing}
          onPointerLeave={endDrawing}
          style={{ touchAction: "none", width: "100%", height: "100%" }}
        />
      </div>
    </>
  );
}

export default CanvasEngine;