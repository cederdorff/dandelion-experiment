const LANDMARK = {
  WRIST: 0,
  THUMB_TIP: 4,
  INDEX_BASE: 5,
  INDEX_TIP: 8,
  MIDDLE_BASE: 9,
  MIDDLE_TIP: 12,
  RING_BASE: 13,
  RING_TIP: 16,
  PINKY_BASE: 17,
  PINKY_TIP: 20
};

export function createDandelionInteraction() {
  return {
    active: false,
    force: 0,
    grip: 0,
    isOpenHand: false,
    isPinching: false,
    source: "camera",
    updatedAt: 0,
    velocityX: 0,
    velocityY: 0,
    wind: 0,
    x: 0.5,
    y: 0.5
  };
}

export function getHandGesture(landmarks) {
  const wrist = landmarks[LANDMARK.WRIST];
  const thumbTip = landmarks[LANDMARK.THUMB_TIP];
  const indexTip = landmarks[LANDMARK.INDEX_TIP];
  const middleBase = landmarks[LANDMARK.MIDDLE_BASE];

  const pinchDistance = getDistance(indexTip, thumbTip);
  const grip = clamp(1 - (pinchDistance - 0.035) / 0.11, 0, 1);
  const isPinching = grip > 0.6;
  const isPointingUp = indexTip.y < wrist.y;
  const openFingerCount = countOpenFingers(landmarks);
  const wind = clamp(openFingerCount / 4 + grip * 0.22, 0, 1);

  return {
    grip,
    indexTip,
    isOpenHand: openFingerCount >= 4,
    openFingerCount,
    isPinching,
    isPointingUp,
    name: getGestureName({ isPinching, isPointingUp, openFingerCount }),
    rotation: clamp((middleBase.x - wrist.x) * -115, -34, 34),
    wind
  };
}

export function updateDandelionWithGesture(gesture, interaction) {
  if (!interaction) {
    return;
  }

  const now = performance.now();
  const targetX = 1 - clamp(gesture.indexTip.x, 0.03, 0.97);
  const targetY = clamp(gesture.indexTip.y, 0.06, 0.94);
  const currentX = Number.isFinite(interaction.x) ? interaction.x : targetX;
  const currentY = Number.isFinite(interaction.y) ? interaction.y : targetY;
  const nextX = currentX + (targetX - currentX) * 0.34;
  const nextY = currentY + (targetY - currentY) * 0.34;
  const elapsed = Math.max((now - (interaction.updatedAt || now)) / 1000, 1 / 120);
  const velocityX = (nextX - currentX) / elapsed;
  const velocityY = (nextY - currentY) / elapsed;
  const speed = Math.hypot(velocityX, velocityY);
  const motionWind = clamp(speed * 0.2, 0, 0.5);

  interaction.active = true;
  interaction.force = clamp(0.16 + gesture.grip * 0.36 + gesture.wind * 0.44 + motionWind, 0, 1);
  interaction.grip = gesture.grip;
  interaction.isOpenHand = gesture.isOpenHand;
  interaction.isPinching = gesture.isPinching;
  interaction.source = "camera";
  interaction.updatedAt = now;
  interaction.velocityX = velocityX;
  interaction.velocityY = velocityY;
  interaction.wind = clamp(gesture.wind + motionWind, 0, 1);
  interaction.x = nextX;
  interaction.y = nextY;
}

export function clearDandelionInteraction(interaction) {
  if (!interaction) {
    return;
  }

  interaction.active = false;
  interaction.force = 0;
  interaction.grip = 0;
  interaction.isOpenHand = false;
  interaction.isPinching = false;
  interaction.velocityX = 0;
  interaction.velocityY = 0;
  interaction.wind = 0;
}

function getGestureName({ isPinching, isPointingUp, openFingerCount }) {
  if (isPinching) {
    return "Pinch";
  }

  if (openFingerCount >= 4) {
    return "Open hand";
  }

  if (isPointingUp) {
    return "Pointing up";
  }

  return "Tracking";
}

function countOpenFingers(landmarks) {
  const openFingers = [
    landmarks[LANDMARK.INDEX_TIP].y < landmarks[LANDMARK.INDEX_BASE].y,
    landmarks[LANDMARK.MIDDLE_TIP].y < landmarks[LANDMARK.MIDDLE_BASE].y,
    landmarks[LANDMARK.RING_TIP].y < landmarks[LANDMARK.RING_BASE].y,
    landmarks[LANDMARK.PINKY_TIP].y < landmarks[LANDMARK.PINKY_BASE].y
  ];

  return openFingers.filter(Boolean).length;
}

function getDistance(pointA, pointB) {
  return Math.hypot(pointA.x - pointB.x, pointA.y - pointB.y);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
