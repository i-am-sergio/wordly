import React, { useEffect, useRef, useState } from 'react';

const Camera: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isRearCamera, setIsRearCamera] = useState(false); // Estado para controlar la cámara trasera

  useEffect(() => {
    // Función para inicializar la cámara
    const initializeCamera = async () => {
      try {
        // Enumerar dispositivos para verificar cuántas cámaras están disponibles
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');

        // Determinar si hay más de una cámara, para usar la trasera si está disponible
        if (videoDevices.length >= 2) {
          setIsRearCamera(true); // Usar la cámara trasera si está disponible
        } else {
          setIsRearCamera(false); // Usar la cámara frontal
        }

        // Obtener acceso a la cámara según el estado `isRearCamera`
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: isRearCamera ? 'environment' : 'user', // 'environment' para cámara trasera, 'user' para frontal
          },
        });

        // Asignar el stream al video
        const video = videoRef.current!;
        video.srcObject = stream;
        await video.play();
      } catch (error) {
        console.error('Error accessing camera:', error);
      }
    };

    // Iniciar la cámara al cargar el componente
    initializeCamera();

    // Función para dibujar el video en el canvas
    const drawToCanvas = () => {
      const videoElement = videoRef.current!;
      const canvasElement = canvasRef.current!;
      const canvasCtx = canvasElement.getContext('2d')!;

      // Dibujar el video en el canvas
      canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
      requestAnimationFrame(drawToCanvas); // Actualizar constantemente
    };

    videoRef.current?.addEventListener('play', drawToCanvas);

    // Limpiar cuando el componente se desmonte
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
      videoRef.current?.removeEventListener('play', drawToCanvas);
    };
  }, [isRearCamera]);

  return (
    <div style={{ position: 'relative' }}>
      <video
        ref={videoRef}
        style={{ display: 'none' }} // Ocultar el video original
        width="100%"
        height="100%"
      ></video>
      <canvas
        ref={canvasRef}
        width="100%"
        height="100%"
        style={{ border: '1px solid black' }}
      ></canvas>
    </div>
  );
};

export default Camera;
