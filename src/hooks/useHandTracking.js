import { useEffect, useRef, useState } from 'react'
import {
  READY_STATUS,
  clearCanvas,
  createHandLandmarker,
  drawHand,
  resizeCanvasToVideo,
} from '../handTracking'
import {
  clearDandelionInteraction,
  createDandelionInteraction,
  getHandGesture,
  updateDandelionWithGesture,
} from '../gestures'

export function useHandTracking() {
  const webcamRef = useRef(null)
  const canvasRef = useRef(null)
  const interactionRef = useRef(createDandelionInteraction())
  const handLandmarkerRef = useRef(null)
  const animationRef = useRef(0)
  const lastVideoTimeRef = useRef(-1)

  const [isRunning, setIsRunning] = useState(false)
  const [tracking, setTracking] = useState(READY_STATUS)

  function stopCamera() {
    cancelAnimationFrame(animationRef.current)

    animationRef.current = 0
    lastVideoTimeRef.current = -1

    clearCanvas(canvasRef.current)
    clearDandelionInteraction(interactionRef.current)
    setIsRunning(false)
    setTracking(READY_STATUS)
  }

  function runFrameLoop() {
    const video = webcamRef.current?.video
    const canvas = canvasRef.current
    const handLandmarker = handLandmarkerRef.current

    if (!video || !canvas || !handLandmarker) {
      return
    }

    resizeCanvasToVideo(canvas, video)

    if (hasNewVideoFrame(video, lastVideoTimeRef.current)) {
      lastVideoTimeRef.current = video.currentTime
      const results = handLandmarker.detectForVideo(video, performance.now())
      const landmarks = results.landmarks?.[0]

      if (landmarks) {
        drawHand(canvas, landmarks)
        const gesture = getHandGesture(landmarks)

        updateDandelionWithGesture(gesture, interactionRef.current)
        setTracking(createTrackingStatus(results, gesture))
      } else {
        clearCanvas(canvas)
        clearDandelionInteraction(interactionRef.current)
        setTracking(createSearchingStatus())
      }
    }

    animationRef.current = requestAnimationFrame(runFrameLoop)
  }

  async function startCamera() {
    if (isRunning || tracking.mode === 'loading') {
      return
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setTracking(createErrorStatus('Camera unavailable'))
      return
    }

    setTracking({
      ...READY_STATUS,
      mode: 'loading',
      label: 'Loading model',
    })

    try {
      if (!handLandmarkerRef.current) {
        handLandmarkerRef.current = await createHandLandmarker()
      }

      setIsRunning(true)
      setTracking(createSearchingStatus())
    } catch (error) {
      console.error(error)
      stopCamera()
      setTracking(createErrorStatus(getCameraErrorLabel(error)))
    }
  }

  function handleCameraReady() {
    cancelAnimationFrame(animationRef.current)
    runFrameLoop()
  }

  function handleCameraError(error) {
    console.error(error)
    stopCamera()
    setTracking(createErrorStatus(getCameraErrorLabel(error)))
  }

  useEffect(() => {
    clearDandelionInteraction(interactionRef.current)

    return () => {
      cancelAnimationFrame(animationRef.current)
      handLandmarkerRef.current?.close()
    }
  }, [])

  return {
    canvasRef,
    handleCameraError,
    handleCameraReady,
    interactionRef,
    isLoading: tracking.mode === 'loading',
    isRunning,
    startCamera,
    stopCamera,
    tracking,
    webcamRef,
  }
}

function hasNewVideoFrame(video, lastVideoTime) {
  return (
    video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
    video.videoWidth > 0 &&
    video.currentTime !== lastVideoTime
  )
}

function createSearchingStatus() {
  return {
    ...READY_STATUS,
    mode: 'searching',
    label: 'Looking for hand',
  }
}

function createTrackingStatus(results, gesture) {
  const hand = results.handednesses?.[0]?.[0]

  return {
    mode: 'tracking',
    label: getTrackingLabel(gesture),
    hand: hand?.categoryName ?? 'Hand',
    confidence: hand?.score ?? gesture.grip,
    gesture: gesture.name,
    pinching: gesture.isPinching,
    wind: gesture.wind,
  }
}

function getTrackingLabel(gesture) {
  if (gesture.isPinching) {
    return 'Pinch pull'
  }

  if (gesture.isOpenHand) {
    return 'Wind hand'
  }

  return 'Finger brush'
}

function createErrorStatus(label) {
  return {
    ...READY_STATUS,
    mode: 'error',
    label,
  }
}

function getCameraErrorLabel(error) {
  if (error instanceof DOMException && error.name === 'NotAllowedError') {
    return 'Camera blocked'
  }

  return 'Tracking failed'
}
