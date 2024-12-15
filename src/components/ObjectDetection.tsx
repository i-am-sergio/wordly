import React, { useRef, useEffect } from "react";
import { FilesetResolver, ObjectDetector } from "@mediapipe/tasks-vision";

const ObjectDetection: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const videoElement = videoRef.current!;
    const canvasElement = canvasRef.current!;
    const canvasCtx = canvasElement.getContext("2d")!;

    let detector: ObjectDetector | null = null;

    const initializeObjectDetection = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        // path/to/wasm/root
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
      );
      // Cargar el modelo preentrenado de detección de objetos
      detector = await ObjectDetector.createFromOptions(vision,{
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-tasks/object_detector/efficientdet_lite0_uint8.tflite",
        },
        scoreThreshold: 0.5, // Confianza mínima para detección
      });

      await detector.setOptions({ runningMode: "IMAGE" });


      const startCamera = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        videoElement.srcObject = stream;
        videoElement.play();

        // Ajustar tamaño del canvas al video
        videoElement.onloadedmetadata = () => {
          canvasElement.width = videoElement.videoWidth;
          canvasElement.height = videoElement.videoHeight;
        };
      };

      startCamera();

      const detectObjects = async () => {
        if (!detector || !videoElement) return;
      
        const processFrame = async () => {
          if (!detector || videoElement.readyState < 2) {
            requestAnimationFrame(processFrame);
            return;
          }
      
          try {
            const detections = await detector.detect(videoElement);
            canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
            canvasCtx.drawImage(
              videoElement,
              0,
              0,
              canvasElement.width,
              canvasElement.height
            );
      
            detections.detections.forEach((detection) => {
              const { originX, originY, width, height } = detection.boundingBox || {};
              if (originX !== undefined && originY !== undefined && width && height) {
                canvasCtx.strokeStyle = "#00FF00";
                canvasCtx.lineWidth = 2;
                canvasCtx.strokeRect(originX, originY, width, height);
      
                const label = `${detection.categories[0].categoryName} (${(
                  detection.categories[0].score * 100
                ).toFixed(2)}%)`;
                canvasCtx.fillStyle = "#00FF00";
                canvasCtx.font = "16px Arial";
                canvasCtx.fillText(label, originX, originY > 10 ? originY - 5 : originY + 20);
              }
            });
          } catch (error) {
            console.error("Error durante la detección de objetos:", error);
          }
      
          requestAnimationFrame(processFrame);
        };
      
        processFrame();
      };
      
      detectObjects();
    };

    initializeObjectDetection();

    return () => {
      // Liberar recursos
      detector?.close();
    };
  }, []);

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
      <video
        ref={videoRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "none", // Ocultar el video original
        }}
      ></video>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          objectFit: "contain", // Ajusta el contenido sin deformar
        }}
      ></canvas>
    </div>
  );
};

export default ObjectDetection;
