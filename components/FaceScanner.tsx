"use client";

import { useEffect, useRef } from "react";
import {
  FaceLandmarker,
  FilesetResolver,
} from "@mediapipe/tasks-vision";

export default function FaceScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);

  useEffect(() => {
    let stream: MediaStream;

    async function initCamera() {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/wasm"
      );

      const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/face_landmarker.task",
          delegate: "GPU",
        },
        outputFaceBlendshapes: false,
        outputFacialTransformationMatrixes: false,
        numFaces: 1,
      });

      faceLandmarkerRef.current = faceLandmarker;
      requestAnimationFrame(scanFace);
    }

    function scanFace() {
      if (
        !videoRef.current ||
        !canvasRef.current ||
        !faceLandmarkerRef.current
      ) return;

      const canvasCtx = canvasRef.current.getContext("2d");
      if (!canvasCtx) return;

      canvasCtx.drawImage(videoRef.current, 0, 0, 640, 480);

      const results = faceLandmarkerRef.current.detectForVideo(
        videoRef.current,
        performance.now()
      );

      if (results?.faceLandmarks?.length) {
        canvasCtx.fillStyle = "red";
        for (const landmark of results.faceLandmarks[0]) {
          canvasCtx.beginPath();
          canvasCtx.arc(landmark.x * 640, landmark.y * 480, 2, 0, 2 * Math.PI);
          canvasCtx.fill();
        }
      }

      requestAnimationFrame(scanFace);
    }

    initCamera();

    return () => {
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <div className="relative w-[640px] h-[480px]">
      <video ref={videoRef} className="absolute z-0" width={640} height={480} />
      <canvas ref={canvasRef} className="absolute z-10" width={640} height={480} />
    </div>
  );
}
