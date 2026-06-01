import { useEffect, useRef } from "react";

const TAU = Math.PI * 2;
const BLOOMS = [
  { count: 94, radius: 0.215, stem: 0.95, tilt: -0.04, x: 0.52, y: 0.57 },
  { count: 44, radius: 0.135, stem: 1.01, tilt: 0.06, x: 0.32, y: 0.7 },
  { count: 50, radius: 0.15, stem: 1.02, tilt: -0.12, x: 0.73, y: 0.72 }
];

export function DandelionField({ interactionRef }) {
  const canvasRef = useRef(null);
  const sceneRef = useRef(createScene());
  const frameRef = useRef(0);
  const lastFrameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return undefined;
    }

    function render(time) {
      resizeCanvas(canvas);
      const dt = Math.min((time - (lastFrameRef.current || time)) / 1000, 0.033);
      lastFrameRef.current = time;

      drawScene(context, sceneRef.current, interactionRef.current, time, dt);
      frameRef.current = requestAnimationFrame(render);
    }

    frameRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frameRef.current);
    };
  }, [interactionRef]);

  function resetBloom() {
    sceneRef.current = createScene();
  }

  return (
    <div className="dandelion-field">
      <canvas ref={canvasRef} aria-hidden="true" />
      <button className="reset-bloom" type="button" onClick={resetBloom}>
        Reset bloom
      </button>
    </div>
  );
}

function createScene() {
  const random = createRandom(1842);
  const seeds = BLOOMS.flatMap((bloom, bloomIndex) =>
    Array.from({ length: bloom.count }, () => {
      const angle = random() * TAU;
      const distance = 0.34 + Math.sqrt(random()) * 0.7;

      return {
        age: 0,
        angle,
        bloomIndex,
        detached: false,
        distance,
        drift: random() * TAU,
        opacity: 0.72 + random() * 0.28,
        phase: random() * TAU,
        releaseAt: 0,
        resistance: 0.38 + random() * 0.48,
        rotation: angle,
        size: 0.74 + random() * 0.58,
        spin: -0.75 + random() * 1.5,
        strain: 0,
        vx: 0,
        vy: 0,
        x: 0,
        y: 0
      };
    })
  );

  return { seeds };
}

function drawScene(context, scene, interaction, time, dt) {
  const { width, height } = context.canvas;
  const minSize = Math.min(width, height);

  drawBackdrop(context, width, height);
  drawStems(context, width, height, minSize, time);

  for (const seed of scene.seeds) {
    if (seed.detached) {
      updateLooseSeed(seed, interaction, width, height, minSize, time, dt);
      drawLooseSeed(context, seed, width, height, minSize, time);
    } else {
      drawAttachedSeed(context, seed, interaction, width, height, minSize, time, dt);
    }
  }

  drawSeedCores(context, width, height, minSize);
  drawInteractionGlow(context, interaction, width, height, minSize);
}

function drawBackdrop(context, width, height) {
  const gradient = context.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#17201b");
  gradient.addColorStop(0.56, "#20261d");
  gradient.addColorStop(1, "#111512");

  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  context.globalAlpha = 0.16;
  context.strokeStyle = "#d2e6bd";
  context.lineWidth = 1;

  for (let x = -width * 0.2; x < width * 1.2; x += 46) {
    context.beginPath();
    context.moveTo(x, height);
    context.bezierCurveTo(x + 28, height * 0.78, x - 24, height * 0.62, x + 18, height * 0.42);
    context.stroke();
  }

  context.globalAlpha = 1;
}

function drawStems(context, width, height, minSize, time) {
  context.save();
  context.lineCap = "round";

  for (const bloom of BLOOMS) {
    const sway = Math.sin(time * 0.00065 + bloom.x * 8) * minSize * 0.012;
    const headX = bloom.x * width + sway;
    const headY = bloom.y * height;
    const stemStartX = (bloom.x + bloom.tilt * 0.45) * width;
    const stemStartY = bloom.stem * height;
    const controlX = (bloom.x + bloom.tilt) * width + sway * 0.4;
    const controlY = (bloom.y + 0.2) * height;

    context.strokeStyle = "rgba(128, 171, 104, 0.76)";
    context.lineWidth = Math.max(2, minSize * 0.006);
    context.beginPath();
    context.moveTo(stemStartX, stemStartY);
    context.quadraticCurveTo(controlX, controlY, headX, headY);
    context.stroke();

    context.strokeStyle = "rgba(108, 151, 91, 0.5)";
    context.lineWidth = Math.max(1, minSize * 0.003);
    context.beginPath();
    context.moveTo(stemStartX, stemStartY - minSize * 0.12);
    context.quadraticCurveTo(stemStartX - minSize * 0.08, stemStartY - minSize * 0.19, stemStartX - minSize * 0.16, stemStartY - minSize * 0.14);
    context.stroke();
  }

  context.restore();
}

function drawAttachedSeed(context, seed, interaction, width, height, minSize, time, dt) {
  const bloom = BLOOMS[seed.bloomIndex];
  const anchor = getBloomAnchor(bloom, width, height, minSize, time);
  const radius = bloom.radius * minSize;
  const angle = seed.angle + Math.sin(time * 0.0014 + seed.phase) * 0.035;
  const naturalX = anchor.x + Math.cos(angle) * radius * seed.distance;
  const naturalY = anchor.y + Math.sin(angle) * radius * seed.distance * 0.84;
  const influence = getInfluence(interaction, naturalX, naturalY, width, height, minSize);
  const awayX = influence.awayX * influence.amount * minSize * 0.09;
  const awayY = influence.awayY * influence.amount * minSize * 0.09;
  const endX = naturalX + awayX;
  const endY = naturalY + awayY;
  const speed = Math.hypot(interaction.velocityX || 0, interaction.velocityY || 0);
  const pressure = influence.amount * (interaction.force + speed * 0.09);

  seed.strain += (influence.amount - seed.strain) * Math.min(1, dt * 12);

  if (interaction.active && pressure > seed.resistance) {
    releaseSeed(seed, endX / width, endY / height, influence, interaction, time);
    return;
  }

  context.save();
  context.globalAlpha = seed.opacity;
  context.strokeStyle = `rgba(238, 232, 204, ${0.34 + seed.strain * 0.3})`;
  context.lineWidth = Math.max(0.7, minSize * 0.0014);
  context.beginPath();
  context.moveTo(anchor.x, anchor.y);
  context.lineTo(endX, endY);
  context.stroke();
  drawFluff(context, endX, endY, angle + seed.strain * 0.7, seed.size, minSize, 0.86);
  context.restore();
}

function updateLooseSeed(seed, interaction, width, height, minSize, time, dt) {
  const turbulence = Math.sin(time * 0.0012 + seed.drift + seed.y * 9) * 0.018;
  seed.age += dt;
  seed.vx += (turbulence + 0.006) * dt;
  seed.vy += (-0.018 + Math.cos(time * 0.001 + seed.phase) * 0.006) * dt;

  if (interaction.active) {
    const pointerX = interaction.x * width;
    const pointerY = interaction.y * height;
    const seedX = seed.x * width;
    const seedY = seed.y * height;
    const dx = seedX - pointerX;
    const dy = seedY - pointerY;
    const distance = Math.max(Math.hypot(dx, dy), 1);
    const radius = minSize * (0.12 + interaction.force * 0.22);

    if (distance < radius) {
      const amount = (1 - distance / radius) * interaction.force;

      if (interaction.isPinching) {
        seed.vx -= (dx / distance) * amount * 0.13 * dt;
        seed.vy -= (dy / distance) * amount * 0.13 * dt;
      } else {
        seed.vx += ((dx / distance) * 0.07 + interaction.velocityX * 0.018) * amount * dt;
        seed.vy += ((dy / distance) * 0.07 + interaction.velocityY * 0.018) * amount * dt;
      }
    }
  }

  seed.vx *= Math.pow(0.982, dt * 60);
  seed.vy *= Math.pow(0.988, dt * 60);
  seed.x += seed.vx * dt;
  seed.y += seed.vy * dt;
  seed.rotation += seed.spin * dt;
}

function drawLooseSeed(context, seed, width, height, minSize, time) {
  const x = seed.x * width;
  const y = seed.y * height;
  const fade = clamp(1 - Math.max(0, seed.age - 8) / 4, 0, 1);

  if (x < -60 || x > width + 60 || y < -80 || y > height + 80 || fade <= 0) {
    return;
  }

  context.save();
  context.globalAlpha = seed.opacity * fade;
  drawFluff(
    context,
    x,
    y,
    seed.rotation + Math.sin(time * 0.001 + seed.phase) * 0.25,
    seed.size,
    minSize,
    1
  );
  context.restore();
}

function drawSeedCores(context, width, height, minSize) {
  context.save();

  for (const bloom of BLOOMS) {
    const x = bloom.x * width;
    const y = bloom.y * height;
    const coreRadius = Math.max(3, minSize * bloom.radius * 0.038);

    context.fillStyle = "rgba(198, 160, 80, 0.72)";
    context.beginPath();
    context.arc(x, y, coreRadius, 0, TAU);
    context.fill();

    context.fillStyle = "rgba(255, 222, 126, 0.86)";
    context.beginPath();
    context.arc(x - coreRadius * 0.28, y - coreRadius * 0.25, coreRadius * 0.42, 0, TAU);
    context.fill();
  }

  context.restore();
}

function drawInteractionGlow(context, interaction, width, height, minSize) {
  const isFresh = performance.now() - (interaction.updatedAt || 0) < 900;

  if (!interaction.active || !isFresh) {
    return;
  }

  const x = interaction.x * width;
  const y = interaction.y * height;
  const radius = minSize * (0.085 + interaction.force * 0.15);
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(246, 214, 130, ${0.18 + interaction.force * 0.18})`);
  gradient.addColorStop(0.45, "rgba(225, 236, 186, 0.09)");
  gradient.addColorStop(1, "rgba(225, 236, 186, 0)");

  context.save();
  context.fillStyle = gradient;
  context.beginPath();
  context.arc(x, y, radius, 0, TAU);
  context.fill();
  context.strokeStyle = `rgba(246, 232, 180, ${0.22 + interaction.force * 0.28})`;
  context.lineWidth = Math.max(1, minSize * 0.002);
  context.beginPath();
  context.arc(x, y, Math.max(10, radius * 0.22), 0, TAU);
  context.stroke();
  context.restore();
}

function drawFluff(context, x, y, angle, size, minSize, opacity) {
  const length = minSize * 0.017 * size;
  const spread = minSize * 0.011 * size;
  const stemLength = minSize * 0.012 * size;
  const baseX = x - Math.cos(angle) * stemLength;
  const baseY = y - Math.sin(angle) * stemLength;

  context.save();
  context.translate(x, y);
  context.rotate(angle);
  context.strokeStyle = `rgba(246, 244, 226, ${0.56 * opacity})`;
  context.lineWidth = Math.max(0.6, minSize * 0.001);

  for (let i = -2; i <= 2; i += 1) {
    const branchAngle = -Math.PI / 2 + i * 0.32;

    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(Math.cos(branchAngle) * spread, Math.sin(branchAngle) * length);
    context.stroke();
  }

  context.restore();

  context.strokeStyle = `rgba(207, 177, 104, ${0.48 * opacity})`;
  context.lineWidth = Math.max(0.7, minSize * 0.0011);
  context.beginPath();
  context.moveTo(baseX, baseY);
  context.lineTo(x, y);
  context.stroke();
}

function getBloomAnchor(bloom, width, height, minSize, time) {
  return {
    x: bloom.x * width + Math.sin(time * 0.00065 + bloom.x * 8) * minSize * 0.012,
    y: bloom.y * height
  };
}

function getInfluence(interaction, seedX, seedY, width, height, minSize) {
  const isFresh = performance.now() - (interaction.updatedAt || 0) < 900;

  if (!interaction.active || !isFresh) {
    return { amount: 0, awayX: 0, awayY: 0 };
  }

  const pointerX = interaction.x * width;
  const pointerY = interaction.y * height;
  const dx = seedX - pointerX;
  const dy = seedY - pointerY;
  const distance = Math.max(Math.hypot(dx, dy), 1);
  const radius = minSize * (0.1 + interaction.force * 0.24 + (interaction.isOpenHand ? 0.08 : 0));
  const amount = clamp(1 - distance / radius, 0, 1);

  return {
    amount,
    awayX: dx / distance,
    awayY: dy / distance
  };
}

function releaseSeed(seed, x, y, influence, interaction, time) {
  const push = 0.05 + interaction.force * 0.14;

  seed.detached = true;
  seed.releaseAt = time;
  seed.age = 0;
  seed.x = x;
  seed.y = y;
  seed.vx = interaction.velocityX * 0.035 + influence.awayX * push + Math.sin(seed.phase) * 0.018;
  seed.vy = interaction.velocityY * 0.035 + influence.awayY * push - 0.035 + Math.cos(seed.phase) * 0.014;
}

function resizeCanvas(canvas) {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.floor(canvas.clientWidth * pixelRatio));
  const height = Math.max(1, Math.floor(canvas.clientHeight * pixelRatio));

  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
}

function createRandom(seed) {
  return function random() {
    let next = seed += 0x6d2b79f5;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);

    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
