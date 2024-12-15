import React, { useRef, useEffect } from 'react';
import { Hands, HAND_CONNECTIONS } from '@mediapipe/hands';
import * as drawingUtils from '@mediapipe/drawing_utils';

const HandsCanvas: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current!;
    const canvasElement = canvasRef.current!;
    const canvasCtx = canvasElement.getContext('2d')!;

    const hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
    });

    hands.setOptions({
      selfieMode: true, // Asegura que use la cámara delantera
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    const isInteracting = (x: number, y: number, canvasWidth: number, canvasHeight: number): boolean => {
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const threshold = canvasWidth * 0.1; // Umbral: 10% del ancho del canvas
      const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
      return distance < threshold;
    };

    hands.onResults((results) => {
      canvasCtx.save();
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

      // Ajustar tamaño dinámico para evitar deformaciones
      canvasElement.width = videoElement.videoWidth;
      canvasElement.height = videoElement.videoHeight;

      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

      if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
          // Dibuja las conexiones y landmarks
          drawingUtils.drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
            color: '#00FF00',
            lineWidth: 2,
          });
          drawingUtils.drawLandmarks(canvasCtx, landmarks, {
            color: '#FF0000',
            lineWidth: 1,
          });

          // Obtiene las coordenadas del extremo del dedo índice
          const indexTip = landmarks[8]; // Landmark del extremo del dedo índice

          // Convertir coordenadas normalizadas a píxeles
          const xPixel = indexTip.x * canvasElement.width;
          const yPixel = indexTip.y * canvasElement.height;

          console.log(`Index finger tip in pixels: x=${xPixel}, y=${yPixel}`);

          // Comprobar si está interactuando con el objeto
          if (isInteracting(xPixel, yPixel, canvasElement.width, canvasElement.height)) {
            console.log("INTERACTUANDO CON OBJETO");
          }
        }
      }
      canvasCtx.restore();
    });

    const startCamera = async () => {
      try {
        // Verificar si el navegador soporta getUserMedia
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('El navegador no soporta acceso a la cámara');
        }
    
        // Obtener todos los dispositivos de medios disponibles
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
    
        // Imprimir el número de cámaras detectadas y sus propiedades
        console.log(`Número de cámaras detectadas: ${videoDevices.length}`);
        videoDevices.forEach((device, index) => {
          console.log(`Cámara ${index + 1}:`);
          console.log(`  - ID: ${device.deviceId}`);
          console.log(`  - Nombre: ${device.label}`);
          console.log(`  - Tipo: ${device.kind}`);
        });

        // alert(`Número de cámaras detectadas: ${videoDevices.length}`);
        // videoDevices.forEach((device, index) => {
        //   alert(`Cámara ${index + 1}:\nID: ${device.deviceId}\nNombre: ${device.label}\nTipo: ${device.kind}`);
        // });
    
        // Intentar obtener acceso a la cámara trasera primero, si está disponible
        let videoDeviceId = null;
    
        // Primero, intentar con la cámara trasera (buscando la cámara que no tenga 'front' en su label)
        const rearCamera = videoDevices.find(device => !device.label.toLowerCase().includes('front'));
        if (rearCamera) {
          videoDeviceId = rearCamera.deviceId;
        } else {
          // Si no se encuentra cámara trasera, intentar con la cámara delantera (facingMode: 'user')
          const frontCamera = videoDevices.find(device => device.label.toLowerCase().includes('front'));
          if (frontCamera) {
            videoDeviceId = frontCamera.deviceId;
          } else {
            // Si no se encuentra ninguna cámara, intentar con la primera cámara disponible
            if (videoDevices.length > 0) {
              videoDeviceId = videoDevices[0].deviceId;
            }
          }
        }
    
        if (!videoDeviceId) {
          throw new Error('No se pudo encontrar una cámara');
        }
    
        // Solicitar acceso a la cámara seleccionada
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            deviceId: { exact: videoDeviceId }, // Seleccionar la cámara por su ID
          },
        });
    
        // Establecer el flujo de video a la referencia del video
        videoElement.srcObject = stream;
        videoElement.play();
      } catch (err) {
        console.error('Error al acceder a la cámara: ', err);
        alert('No se pudo acceder a la cámara. Asegúrate de que los permisos estén habilitados.');
      }
    };
    
    startCamera();

    const cameraStream = () => {
      const onFrame = async () => {
        await hands.send({ image: videoElement });
        requestAnimationFrame(onFrame);
      };
      onFrame();
    };

    videoElement.addEventListener('loadeddata', cameraStream);

    return () => {
      hands.close();
      videoElement.removeEventListener('loadeddata', cameraStream);
    };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <video
        ref={videoRef}
        className="input_video"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          display: 'none', // Ocultar el video original
        }}
      ></video>
      <canvas
        ref={canvasRef}
        className="output_canvas"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'contain', // Ajusta el contenido sin deformar
        }}
      ></canvas>
    </div>
  );
};

export default HandsCanvas;
