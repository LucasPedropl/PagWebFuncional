import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eraser, PenLine } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface SignaturePadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
  initialSignature?: string | null;
}

export const SignaturePadModal: React.FC<SignaturePadModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSignature,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStroke, setHasStroke] = useState(false);

  const getPoint = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in event) {
      const touch = event.touches[0] ?? event.changedTouches[0];
      if (!touch) return null;
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  };

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (initialSignature) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        setHasStroke(true);
      };
      img.src = initialSignature;
    } else {
      setHasStroke(false);
    }
  }, [initialSignature]);

  useEffect(() => {
    if (isOpen) {
      setupCanvas();
    }
  }, [isOpen, setupCanvas]);

  const startDrawing = (event: React.MouseEvent | React.TouchEvent) => {
    event.preventDefault();
    const canvas = canvasRef.current;
    const point = getPoint(event);
    if (!canvas || !point) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(point.x, point.y);
  };

  const draw = (event: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    event.preventDefault();

    const canvas = canvasRef.current;
    const point = getPoint(event);
    if (!canvas || !point) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    setHasStroke(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    setupCanvas();
    setHasStroke(false);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasStroke) return;
    onSave(canvas.toDataURL('image/png'));
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Assinar contrato"
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="button" onClick={handleSave} disabled={!hasStroke} className="bg-slate-900 hover:bg-slate-800">
            Salvar assinatura
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Desenhe sua assinatura com o dedo ou o mouse na área abaixo.
        </p>

        <div className="relative border-2 border-dashed border-slate-300 rounded-xl overflow-hidden bg-white touch-none">
          <canvas
            ref={canvasRef}
            width={640}
            height={220}
            className="w-full h-[220px] cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!hasStroke && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-gray-400">
              <PenLine className="w-4 h-4 mr-2" />
              Assine aqui
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={clearCanvas} className="text-sm py-2">
            <Eraser className="w-4 h-4 mr-2" />
            Limpar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
