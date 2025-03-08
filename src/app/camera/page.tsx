"use client";

import React, { useRef, useState, useEffect } from "react";
import * as tf from "@tensorflow/tfjs";
import * as handpose from "@tensorflow-models/handpose";
import "@tensorflow/tfjs-backend-webgl";

function Test() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [model, setModel] = useState<handpose.HandPose | null>(null);
  const [gesture, setGesture] = useState<string>("");
  const [previousGesture, setPreviousGesture] = useState<string>("");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [result, setResult] = useState<string>("");
  const [computerChoice, setComputerChoice] = useState<string>("");

  // Load the handpose model
  useEffect(() => {
    const loadModel = async () => {
      const loadedModel = await handpose.load();
      setModel(loadedModel);
      console.log("Handpose model loaded");
    };
    loadModel();
  }, []);

  // Set up webcam
  useEffect(() => {
    const setupCamera = async () => {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    };
    setupCamera();
  }, []);

  // Detect hand gestures (updated version)
  useEffect(() => {
    if (!model || !videoRef.current) return;

    let lastDetectionTime = Date.now();
    const TIMEOUT_DURATION = 500; // 500ms timeout for hand detection
    let animationFrameId: number;

    const detectHandGesture = async () => {
      if (videoRef.current && model) {
        // Check if video is ready with valid dimensions
        if (
          videoRef.current.readyState === 4 &&
          videoRef.current.videoWidth > 0 &&
          videoRef.current.videoHeight > 0
        ) {
          try {
            const predictions = await model.estimateHands(videoRef.current);

            // If no hands are detected
            if (predictions.length === 0) {
              // If it's been more than TIMEOUT_DURATION since we last saw a hand,
              // set gesture to unknown
              if (Date.now() - lastDetectionTime > TIMEOUT_DURATION) {
                setGesture("unknown");
              }
            } else {
              // We detected a hand, update the last detection time
              lastDetectionTime = Date.now();

              const fingers = predictions[0].landmarks;

              // Check finger extension using correct landmarks
              const isThumbExtended = fingers[4][1] < fingers[2][1]; // Tip vs MCP
              const isIndexExtended = fingers[8][1] < fingers[6][1]; // Tip vs PIP
              const isMiddleExtended = fingers[12][1] < fingers[10][1]; // Tip vs PIP
              const isRingExtended = fingers[16][1] < fingers[14][1]; // Tip vs PIP
              const isPinkyExtended = fingers[20][1] < fingers[18][1]; // Tip vs PIP

              // Determine gesture with more precise checks
              if (
                isIndexExtended &&
                isMiddleExtended &&
                !isRingExtended &&
                !isPinkyExtended
              ) {
                setGesture("scissors");
              } else if (
                isIndexExtended &&
                isMiddleExtended &&
                isRingExtended &&
                isPinkyExtended
              ) {
                setGesture("paper");
              } else if (
                !isIndexExtended &&
                !isMiddleExtended &&
                !isRingExtended &&
                !isPinkyExtended
              ) {
                setGesture("rock");
              } else {
                setGesture("unknown");
              }
            }
          } catch (error) {
            console.error("Error in hand detection:", error);
            setGesture("unknown");
          }
        }

        animationFrameId = requestAnimationFrame(detectHandGesture);
      }
    };

    detectHandGesture();

    // Cleanup function to set gesture to unknown and cancel animation frame when component unmounts
    return () => {
      setGesture("unknown");
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [model]);

  // Update previous gesture when gesture changes
  useEffect(() => {
    // If we're in the middle of a countdown and the gesture changes, reset the countdown
    if (countdown !== null && gesture !== previousGesture && gesture !== "") {
      setCountdown(null);
    }

    // Update the previous gesture
    setPreviousGesture(gesture);
  }, [gesture]);

  // Start countdown when gesture is detected
  useEffect(() => {
    // Reset countdown if gesture becomes unknown or changes
    if (gesture === "unknown" || gesture === "") {
      setCountdown(null);
      return;
    }

    // Start a new countdown only if we don't already have one running
    if (gesture && countdown === null) {
      setCountdown(1.5);
    }
  }, [gesture, countdown]);

  // Countdown timer
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else {
      // When countdown reaches 0, determine the result
      const choices = ["rock", "paper", "scissors"];
      const computerSelection = choices[Math.floor(Math.random() * 3)];
      setComputerChoice(computerSelection);

      // Determine winner
      if (gesture === computerSelection) {
        setResult("It's a tie!");
      } else if (
        (gesture === "rock" && computerSelection === "scissors") ||
        (gesture === "paper" && computerSelection === "rock") ||
        (gesture === "scissors" && computerSelection === "paper")
      ) {
        setResult("You win!");
      } else {
        setResult("Computer wins!");
      }

      // Reset after 3 seconds
      setTimeout(() => {
        setGesture("");
        setCountdown(null);
        setResult("");
        setComputerChoice("");
      }, 3000);
    }
  }, [countdown, gesture]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-6">Rock Paper Scissors</h1>

      <div className="relative mb-6">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-96 h-72 border-4 border-blue-500 rounded-lg"
        />

        {gesture && gesture !== "unknown" && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white px-3 py-1 rounded-lg">
            Detected: {gesture}
          </div>
        )}
      </div>

      {countdown !== null && (
        <div className="text-6xl font-bold text-blue-600 mb-4">{countdown}</div>
      )}

      {result && (
        <div className="text-center mb-4">
          <div className="text-2xl mb-2">
            You chose: <span className="font-bold">{gesture}</span>
          </div>
          <div className="text-2xl mb-4">
            Computer chose: <span className="font-bold">{computerChoice}</span>
          </div>
          <div className="text-4xl font-bold text-purple-600">{result}</div>
        </div>
      )}

      <div className="mt-6 text-gray-600">
        Show your hand gesture (rock, paper, or scissors) to the camera
      </div>
    </div>
  );
}

export default Test;
