# Dandelion Field

Dandelion Field is a React and MediaPipe hand-tracking experiment inspired by
the YOKE/Sennep Dandelion installation:

[yoke.dk/projects/dandelion](https://www.yoke.dk/projects/dandelion)

Your fingertip and hand movement bend and release digital dandelion seeds.

The prototype is built for fast experimentation:

- move your index finger to brush the dandelions,
- open your hand to create a stronger wind field,
- pinch to pull loose seeds back toward your fingers,
- reset the bloom from the stage.

## Create Your Own Copy

Open the template:

[github.com/cederdorff/dandelion-experiment](https://github.com/cederdorff/dandelion-experiment)

Click `Use this template`.

Create a new repository in your own GitHub account.

## Clone and Run

Open your new repository on GitHub.

Click the green `Code` button.

Choose `Open with GitHub Desktop`.

In GitHub Desktop, choose a local folder and click `Clone`.

In GitHub Desktop, click `Open in Visual Studio Code`.

In VS Code, open a terminal and run:

```bash
npm install
npm run dev
```

Open the local URL shown in the terminal, usually:

```text
http://localhost:5173/
```

Then:

1. Click `Start camera` and allow webcam access.
2. Hold one hand in front of the camera.
3. Brush the dandelions with your index finger.
4. Open your hand to release seeds faster.
5. Pinch your thumb and index finger to pull drifting seeds.

Webcam access works on `localhost` or `127.0.0.1`. Opening `index.html`
directly will usually block the camera.

## What to Try

Start with one hand clearly visible in the webcam. Move slowly at first, then
try different distances from the camera to see how the dandelion reacts.

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

The project has three important layers:

1. The webcam sees your hand.
2. MediaPipe turns the hand into landmark points.
3. The dandelion animation reacts to those points.

You do not need to understand everything before changing the project. Start with
small changes in one file, then test in the browser.

### `src/components/DandelionField.jsx`

This is the main creative file. It draws the dandelions, animates the seeds, and
decides how seeds move after they are released.

Good places to tweak:

- `BLOOMS` controls how many dandelions there are, where they are placed, and
  how large they are.
- `createScene` creates all the seeds and gives each seed slightly different
  values.
- `resistance` controls how difficult it is to release a seed.
- `drawBackdrop` controls the background.
- `drawStems` controls the stems.
- `drawFluff` controls the look of each seed.
- `updateLooseSeed` controls how released seeds drift.

Try changing one number at a time. For example, make one bloom larger, reduce
the seed count, or make the seeds drift slower.

### `src/gestures.js`

`src/gestures.js` is where MediaPipe landmarks become interaction values. The
main flow is:

```js
const gesture = getHandGesture(landmarks);
updateDandelionWithGesture(gesture, interactionRef.current);
```

Good places to tweak:

- `interaction.force` controls how strongly your hand affects the seeds.
- `gesture.wind` is based on open fingers and pinch strength.
- `isPinching` decides when thumb and index finger count as a pinch.
- `isOpenHand` decides when the hand should act like wind.

If the dandelion reacts too strongly, lower the values used in
`interaction.force`. If it reacts too weakly, raise them.

### `src/hooks/useHandTracking.js`

This file connects the webcam to the dandelion. It loads MediaPipe, reads the
webcam frames, detects the hand, and sends the result to `gestures.js`.

You usually do not need to edit this file unless you want to change how tracking
starts, stops, or updates the control panel.

### `src/App.css`

This file controls the visual layout: page size, colors, panel styling, buttons,
and the stage around the dandelion canvas.

Good places to tweak:

- `.stage` controls the main dandelion area.
- `.control-panel` controls the debug panel on the right.
- `.reset-bloom` controls the reset button.
- `h1` controls the title size.

## Customization Ideas

Here are some simple changes to try:

- Make a single large dandelion instead of three smaller ones.
- Change the background color or make it feel like night, spring, or a screen in
  a museum.
- Make the seeds release more slowly by increasing `resistance`.
- Make the seeds float longer by changing the movement in `updateLooseSeed`.
- Change the gesture so only an open hand releases seeds.
- Remove the control panel when you want a cleaner installation look.
- Add more blooms with different sizes and positions.
- Change the reset button text.

Challenge ideas:

- Make the dandelion slowly grow back after seeds have flown away.
- Make released seeds fade out over time.
- Make the flower bend toward or away from the hand.
- Create a different plant, such as grass, leaves, or falling petals.
