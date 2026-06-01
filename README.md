# Dandelion Field

Dandelion Field is a React and MediaPipe hand-tracking experiment inspired by
the YOKE/Sennep Dandelion installation. Instead of moving a puck, your fingertip
and hand movement bend and release digital dandelion seeds.

The prototype is built for fast experimentation:

- move your index finger to brush the dandelions,
- open your hand to create a stronger wind field,
- pinch to pull loose seeds back toward your fingers,
- reset the bloom from the stage.

## Install and Run

```bash
npm install
npm run dev
```

Open the local URL Vite prints, usually:

```text
http://localhost:5173/
```

Webcam access works on `localhost` or `127.0.0.1`. Opening `index.html`
directly will usually block the camera.

## What to Try

1. Click `Start camera` and allow webcam access.
2. Hold one hand in front of the camera.
3. Brush the dandelions with your index finger.
4. Open your hand to release seeds faster.
5. Pinch your thumb and index finger to pull drifting seeds.

The control panel shows the detected hand, gesture, tracking confidence, wind
strength, and pinch state.

## Project Structure

```text
src/
  App.jsx                         Puts the page together.
  components/
    DandelionField.jsx            Draws and animates the dandelion installation.
    TrackingStage.jsx             Layers the webcam, dandelions, and landmarks.
    ControlPanel.jsx              Shows hand, gesture, confidence, wind, and pinch.
    StatusPill.jsx                Shows the current tracking status.
  hooks/
    useHandTracking.js            Starts/stops tracking and reads webcam frames.
  gestures.js                     Converts landmarks into dandelion interaction.
  handTracking.js                 MediaPipe setup and hand drawing helpers.
  App.css                         App layout and component styling.
  index.css                       Global page styling.
  main.jsx                        Starts React.
```

## Main Editing Points

`src/components/DandelionField.jsx` is where the dandelion behavior lives. It
owns the seed simulation, reset button, and canvas drawing.

`src/gestures.js` is where MediaPipe landmarks become interaction values. The
main flow is:

```js
const gesture = getHandGesture(landmarks);
updateDandelionWithGesture(gesture, interactionRef.current);
```

Useful variables to experiment with:

- `BLOOMS` in `DandelionField.jsx` controls bloom count, position, and size.
- `resistance` controls how easily seeds detach.
- `interaction.force` controls how strongly your hand affects the seeds.
- `gesture.wind` is based on open fingers and pinch strength.

## Build Checks

```bash
npm run lint
npm run build
```
