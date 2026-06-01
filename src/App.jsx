import { ControlPanel } from './components/ControlPanel'
import { StatusPill } from './components/StatusPill'
import { TrackingStage } from './components/TrackingStage'
import { useHandTracking } from './hooks/useHandTracking'
import './App.css'

function App() {
  const {
    canvasRef,
    handleCameraError,
    handleCameraReady,
    isLoading,
    isRunning,
    interactionRef,
    startCamera,
    stopCamera,
    tracking,
    webcamRef,
  } = useHandTracking()

  return (
    <main className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Interactive installation study</p>
          <h1>Dandelion Field</h1>
        </div>
        <StatusPill mode={tracking.mode} label={tracking.label} />
      </header>

      <section className="workspace" aria-label="Hand controlled object">
        <TrackingStage
          canvasRef={canvasRef}
          interactionRef={interactionRef}
          onCameraError={handleCameraError}
          onCameraReady={handleCameraReady}
          isLoading={isLoading}
          isRunning={isRunning}
          onStartCamera={startCamera}
          webcamRef={webcamRef}
        />

        <ControlPanel
          isLoading={isLoading}
          isRunning={isRunning}
          onStartCamera={startCamera}
          onStopCamera={stopCamera}
          tracking={tracking}
        />
      </section>
    </main>
  )
}

export default App
