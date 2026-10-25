import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCcw, Trash2, Check, Keyboard, Edit3 } from 'lucide-react';

interface Point {
  // Normalized 0 to 1 coordinates for responsive resizing
  nx: number;
  ny: number;
}

export type Stroke = Point[];

interface HandwritingCanvasProps {
  onConfirmHandwriting: (imageBase64: string, spatialFeatures?: any) => void;
  onSwitchToTyping: () => void;
  isRecognizing?: boolean;
  onCancelRecognition?: () => void;
}

export const HandwritingCanvas: React.FC<HandwritingCanvasProps> = ({
  onConfirmHandwriting,
  onSwitchToTyping,
  isRecognizing = false,
  onCancelRecognition,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const isDrawingRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Redraw all strokes onto canvas
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    // Reset transform and clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // Fill crisp white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    // Draw subtle rice paper / grid guide lines
    ctx.save();
    ctx.strokeStyle = '#E8E4DD';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);

    // Cross lines in the center (米字格 / 十字格 style)
    ctx.beginPath();
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Diagonal lines
    ctx.strokeStyle = '#F0EBE1';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(w, h);
    ctx.moveTo(w, 0);
    ctx.lineTo(0, h);
    ctx.stroke();
    ctx.restore();

    // Setup brush stroke
    ctx.strokeStyle = '#181716';
    ctx.lineWidth = Math.max(6, Math.min(w, h) * 0.024);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const allStrokesToDraw = currentStroke ? [...strokes, currentStroke] : strokes;

    for (const stroke of allStrokesToDraw) {
      if (stroke.length === 0) continue;
      ctx.beginPath();
      const first = stroke[0];
      ctx.moveTo(first.nx * w, first.ny * h);

      if (stroke.length === 1) {
        // Draw single dot
        ctx.arc(first.nx * w, first.ny * h, ctx.lineWidth / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#181716';
        ctx.fill();
        continue;
      }

      for (let i = 1; i < stroke.length; i++) {
        const p = stroke[i];
        ctx.lineTo(p.nx * w, p.ny * h);
      }
      ctx.stroke();
    }
  }, [strokes, currentStroke]);

  // Adjust canvas size for device pixel ratio
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    // Use square aspect ratio or comfortable height
    const size = Math.min(rect.width, window.innerHeight * 0.46);
    const targetWidth = rect.width;
    const targetHeight = Math.max(280, size);

    canvas.width = targetWidth * dpr;
    canvas.height = targetHeight * dpr;
    canvas.style.width = `${targetWidth}px`;
    canvas.style.height = `${targetHeight}px`;

    redraw();
  }, [redraw]);

  // Handle window resize and rotation
  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('orientationchange', resizeCanvas);
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('orientationchange', resizeCanvas);
    };
  }, [resizeCanvas]);

  // Update redraw when strokes change
  useEffect(() => {
    redraw();
    setHasDrawn(strokes.length > 0 || Boolean(currentStroke));
    if (strokes.length > 0) {
      setErrorMessage(null);
    }
  }, [strokes, currentStroke, redraw]);

  // Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;

    setCurrentStroke([{ nx, ny }]);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !canvasRef.current) return;
    e.preventDefault();

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    setCurrentStroke((prev) => (prev ? [...prev, { nx, ny }] : [{ nx, ny }]));
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    isDrawingRef.current = false;

    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }

    if (currentStroke && currentStroke.length > 0) {
      setStrokes((prev) => [...prev, currentStroke]);
      setCurrentStroke(null);
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDrawingRef.current = false;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // ignore
    }
    if (currentStroke && currentStroke.length > 0) {
      setStrokes((prev) => [...prev, currentStroke]);
      setCurrentStroke(null);
    }
  };

  // Undo one stroke
  const handleUndo = () => {
    setStrokes((prev) => prev.slice(0, -1));
  };

  // Clear all strokes
  const handleClear = () => {
    setStrokes([]);
    setCurrentStroke(null);
    setErrorMessage(null);
  };

  // Export full uncropped canvas image with grid context and computed spatial features
  const handleComplete = () => {
    if (strokes.length === 0) {
      setErrorMessage('畫布尚無字跡，請先在方格內寫一個字。');
      return;
    }

    // Find bounding box across all points (normalized 0 to 1)
    let minX = 1;
    let maxX = 0;
    let minY = 1;
    let maxY = 0;

    let totalPoints = 0;
    strokes.forEach((stroke) => {
      stroke.forEach((p) => {
        if (p.nx < minX) minX = p.nx;
        if (p.nx > maxX) maxX = p.nx;
        if (p.ny < minY) minY = p.ny;
        if (p.ny > maxY) maxY = p.ny;
        totalPoints++;
      });
    });

    const charW = Math.max(0, maxX - minX);
    const charH = Math.max(0, maxY - minY);

    // Validate that user didn't just tap a single dot
    if (charW < 0.04 && charH < 0.04 && totalPoints < 4) {
      setErrorMessage('筆跡過小，請寫下完整中文字。');
      return;
    }

    // Compute 4 spatial observations directly from uncropped coordinates
    const occupancy = Math.max(charW, charH);
    let sizeObs = '適中（體態端正，四邊留有從容呼吸空間）';
    if (occupancy >= 0.72) {
      sizeObs = '偏大（字勢開闊充盈，幾乎佔滿方格）';
    } else if (occupancy <= 0.38) {
      sizeObs = '偏小（字態凝縮內斂，四周留白寬廣）';
    }

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    let positionObs = '居中（端居九宮方格正中，重心穩固）';
    if (cy < 0.42) {
      positionObs = '偏上（字勢上提懸頂，有登高遠眺之態）';
    } else if (cy > 0.58) {
      positionObs = '偏下（字勢沉底扎根，重心安穩著地）';
    } else if (cx < 0.42) {
      positionObs = '偏左（字勢倚靠左側，含蓄審慎）';
    } else if (cx > 0.58) {
      positionObs = '偏右（字勢向右伸展，積極向外探索）';
    }

    // Slant estimation
    let slantObs = '端正（主幹垂直端整，骨架分明）';
    // Check general slope of strokes
    let slopeSum = 0;
    let slopeCount = 0;
    strokes.forEach((stroke) => {
      if (stroke.length >= 3) {
        const p1 = stroke[0];
        const p2 = stroke[stroke.length - 1];
        const dy = p2.ny - p1.ny;
        const dx = p2.nx - p1.nx;
        if (Math.abs(dy) > 0.1) {
          slopeSum += dx / dy;
          slopeCount++;
        }
      }
    });
    if (slopeCount > 0) {
      const avgLean = slopeSum / slopeCount;
      if (avgLean > 0.22) {
        slantObs = '略向右欹（筆勢微向右斜，靈動前瞻）';
      } else if (avgLean < -0.22) {
        slantObs = '略向左傾（筆勢微向左倒，別具一格）';
      }
    }

    // Density estimation
    let densityObs = '分佈勻稱（疏密有致，點畫停勻）';
    const strokeDensity = strokes.length / (occupancy || 0.5);
    if (strokeDensity >= 16) {
      densityObs = '緊密密聚（筆劃密聚凝聚，結構緊湊）';
    } else if (strokeDensity <= 8 && strokes.length <= 4) {
      densityObs = '疏朗舒展（用筆簡約，氣韻疏朗開闊）';
    }

    const computedSpatial = {
      size: sizeObs,
      position: positionObs,
      slant: slantObs,
      density: densityObs,
      occupancyRatio: Math.round(occupancy * 100),
      centerCoord: { x: Math.round(cx * 100), y: Math.round(cy * 100) },
      strokeCount: strokes.length,
    };

    // Render FULL uncropped canvas into square export
    const targetSize = 512;
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = targetSize;
    exportCanvas.height = targetSize;
    const expCtx = exportCanvas.getContext('2d');
    if (!expCtx) return;

    // 1. Crisp white background
    expCtx.fillStyle = '#FFFFFF';
    expCtx.fillRect(0, 0, targetSize, targetSize);

    // 2. Draw subtle classical rice paper grid lines (米字格) to preserve exact spatial frame
    expCtx.save();
    expCtx.strokeStyle = '#E8E2D6';
    expCtx.lineWidth = 1;
    expCtx.setLineDash([4, 4]);

    // Border
    expCtx.strokeRect(8, 8, targetSize - 16, targetSize - 16);

    // Cross lines
    expCtx.beginPath();
    expCtx.moveTo(targetSize / 2, 8);
    expCtx.lineTo(targetSize / 2, targetSize - 8);
    expCtx.moveTo(8, targetSize / 2);
    expCtx.lineTo(targetSize - 8, targetSize / 2);
    expCtx.stroke();

    // Diagonals
    expCtx.strokeStyle = '#F2ECE0';
    expCtx.beginPath();
    expCtx.moveTo(8, 8);
    expCtx.lineTo(targetSize - 8, targetSize - 8);
    expCtx.moveTo(targetSize - 8, 8);
    expCtx.lineTo(8, targetSize - 8);
    expCtx.stroke();
    expCtx.restore();

    // 3. Draw strokes onto full canvas at their exact uncropped coordinates
    expCtx.save();
    expCtx.strokeStyle = '#121212';
    expCtx.lineWidth = Math.max(7, targetSize * 0.024);
    expCtx.lineCap = 'round';
    expCtx.lineJoin = 'round';

    for (const stroke of strokes) {
      if (stroke.length === 0) continue;
      expCtx.beginPath();
      const first = stroke[0];
      expCtx.moveTo(first.nx * targetSize, first.ny * targetSize);

      if (stroke.length === 1) {
        expCtx.arc(
          first.nx * targetSize,
          first.ny * targetSize,
          expCtx.lineWidth / 2,
          0,
          Math.PI * 2
        );
        expCtx.fillStyle = '#121212';
        expCtx.fill();
        continue;
      }

      for (let i = 1; i < stroke.length; i++) {
        const p = stroke[i];
        expCtx.lineTo(p.nx * targetSize, p.ny * targetSize);
      }
      expCtx.stroke();
    }
    expCtx.restore();

    const dataUrl = exportCanvas.toDataURL('image/png');
    onConfirmHandwriting(dataUrl, computedSpatial);
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Canvas container with touch-action: none */}
      <div
        ref={containerRef}
        className="w-full relative rounded-2xl shadow-sm border-2 border-[#DCD6CA] bg-white overflow-hidden"
        style={{ touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          className="w-full cursor-crosshair select-none block"
          style={{ touchAction: 'none' }}
        />

        {/* Tip overlay when empty */}
        {!hasDrawn && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center text-[#999285]">
            <Edit3 className="w-8 h-8 mb-2 opacity-40 text-[#B9382C]" />
            <p className="text-xl font-serif">在此以手指寫一個中文字</p>
            <p className="text-sm mt-1 text-[#A8A196]">米字格內書寫，字跡更清晰</p>
          </div>
        )}

        {/* Stroke count indicator */}
        {strokes.length > 0 && (
          <div className="absolute top-2.5 right-3 bg-[#FAF7F2]/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-xs font-serif text-[#666056] border border-[#E3DDD2]">
            已寫 {strokes.length} 筆
          </div>
        )}
      </div>

      {/* Error message callout */}
      {errorMessage && (
        <div className="w-full mt-3 px-4 py-2.5 bg-[#FFF2F0] border border-[#F5C2BE] text-[#9E2A2B] rounded-xl text-base font-serif flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-sm underline ml-2 cursor-pointer"
          >
            了解
          </button>
        </div>
      )}

      {/* Control Buttons row (touch targets ≥ 48px) */}
      <div className="w-full mt-4 grid grid-cols-3 gap-2.5">
        <button
          type="button"
          onClick={handleUndo}
          disabled={strokes.length === 0 || isRecognizing}
          className="min-h-[48px] px-3 py-2.5 rounded-xl border border-[#D5CFC3] bg-white text-[#4A453E] hover:bg-[#F5F2EB] disabled:opacity-40 disabled:cursor-not-allowed text-base font-serif flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
          title="撤銷最後一筆"
        >
          <RotateCcw className="w-4 h-4 text-[#7A7468]" />
          <span>復原一筆</span>
        </button>

        <button
          type="button"
          onClick={handleClear}
          disabled={strokes.length === 0 || isRecognizing}
          className="min-h-[48px] px-3 py-2.5 rounded-xl border border-[#D5CFC3] bg-white text-[#4A453E] hover:bg-[#F5F2EB] disabled:opacity-40 disabled:cursor-not-allowed text-base font-serif flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs active:scale-[0.98]"
          title="清除整幅字跡"
        >
          <Trash2 className="w-4 h-4 text-[#7A7468]" />
          <span>清除重寫</span>
        </button>

        <button
          type="button"
          onClick={handleComplete}
          disabled={strokes.length === 0 || isRecognizing}
          className="min-h-[48px] px-3 py-2.5 rounded-xl bg-[#B9382C] text-white hover:bg-[#A32F24] disabled:opacity-40 disabled:cursor-not-allowed text-base font-serif font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
        >
          {isRecognizing ? (
            <span className="flex items-center gap-1.5">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              辨識中...
            </span>
          ) : (
            <>
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>寫好了</span>
            </>
          )}
        </button>
      </div>

      {/* Recognizing active feedback & immediate exit option */}
      {isRecognizing && (
        <div className="w-full mt-3 p-3 bg-[#FFF9F2] border border-[#F5D8BF] rounded-xl flex items-center justify-between shadow-2xs animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-serif text-[#8C4A1E]">
            <span className="w-3.5 h-3.5 border-2 border-[#B9382C] border-t-transparent rounded-full animate-spin shrink-0" />
            <span>AI 正快速辨識筆跡中...</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onCancelRecognition?.();
                onSwitchToTyping();
              }}
              className="px-2.5 py-1 text-xs font-serif font-bold text-[#B9382C] hover:bg-[#FFEADA] rounded-lg border border-[#E8B89E] transition-colors cursor-pointer"
            >
              直接改打字
            </button>
            {onCancelRecognition && (
              <button
                type="button"
                onClick={onCancelRecognition}
                className="px-2 py-1 text-xs font-serif text-[#786E5E] hover:text-[#2E2922] transition-colors cursor-pointer"
              >
                取消
              </button>
            )}
          </div>
        </div>
      )}

      {/* Alternative input switch */}
      <div className="w-full mt-3 flex justify-center">
        <button
          type="button"
          onClick={() => {
            if (isRecognizing) {
              onCancelRecognition?.();
            }
            onSwitchToTyping();
          }}
          className="min-h-[44px] px-4 py-2 text-sm text-[#6C6558] hover:text-[#B9382C] flex items-center gap-1.5 font-serif cursor-pointer hover:underline transition-colors"
        >
          <Keyboard className="w-4 h-4" />
          <span>手寫不便？改用打字輸入</span>
        </button>
      </div>
    </div>
  );
};
