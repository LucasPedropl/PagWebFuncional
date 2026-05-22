import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface CameraCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCapture: (dataUrl: string) => void;
  initialPhoto?: string | null;
}

export const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({
  isOpen,
  onClose,
  onCapture,
  initialPhoto,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [preview, setPreview] = useState<string | null>(initialPhoto ?? null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  };

  const startCamera = async () => {
    setIsStarting(true);
    setError(null);
    stopCamera();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPreview(null);
    } catch {
      setError('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    } finally {
      setIsStarting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setPreview(initialPhoto ?? null);
      if (!initialPhoto) {
        startCamera();
      }
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [isOpen, initialPhoto]);

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setPreview(dataUrl);
    stopCamera();
  };

  const handleSave = () => {
    if (!preview) return;
    onCapture(preview);
    onClose();
  };

  const retake = () => {
    setPreview(null);
    startCamera();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tirar foto"
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          {preview ? (
            <Button type="button" onClick={handleSave} className="bg-slate-900 hover:bg-slate-800">
              Usar esta foto
            </Button>
          ) : (
            <Button type="button" onClick={capturePhoto} disabled={!!error || isStarting} className="bg-slate-900 hover:bg-slate-800">
              <Camera className="w-4 h-4 mr-2" />
              Capturar
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Posicione seu rosto na câmera para registrar a foto de identificação do contrato.
        </p>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : preview ? (
          <div className="space-y-3">
            <img src={preview} alt="Foto capturada" className="w-full max-h-[360px] object-contain rounded-xl border border-gray-200 bg-black" />
            <Button type="button" variant="outline" onClick={retake} className="text-sm py-2">
              <RefreshCw className="w-4 h-4 mr-2" />
              Tirar outra foto
            </Button>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden border border-gray-200 bg-black">
            <video
              ref={videoRef}
              className="w-full max-h-[360px] object-contain mirror"
              playsInline
              muted
              style={{ transform: 'scaleX(-1)' }}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};
