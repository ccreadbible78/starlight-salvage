// Starlight Salvage — keyboard and mouse, in one place. Keys are tracked
// as a live set plus an edge-triggered "just pressed" queue that the loop
// drains once per frame; clicks carry their canvas coordinates so menu
// buttons and upgrade cards are plain hit-tests in main.js.
export const ACTION_CONFIRM = 'confirm';
export const ACTION_PAUSE = 'pause';
export const ACTION_RESTART = 'restart';
export const ACTION_DASH = 'dash';
export const ACTION_MUTE = 'mute';

const KEY_ACTIONS = {
  Enter: ACTION_CONFIRM,
  Space: ACTION_CONFIRM,
  KeyP: ACTION_PAUSE,
  Escape: ACTION_PAUSE,
  KeyR: ACTION_RESTART,
  ShiftLeft: ACTION_DASH,
  ShiftRight: ACTION_DASH,
  KeyM: ACTION_MUTE,
  Digit1: 'upgrade1',
  Digit2: 'upgrade2',
  Digit3: 'upgrade3',
};

export function createInput(canvas) {
  const down = new Set();
  const pressedQueue = [];
  const clicks = [];
  const mouse = { x: 0, y: 0, inside: false, down: false };

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function onKeyDown(event) {
    const action = KEY_ACTIONS[event.code];
    if (action) {
      if (!event.repeat) pressedQueue.push(action);
      event.preventDefault();
    }
    down.add(event.code);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.code)) {
      event.preventDefault();
    }
  }

  function onKeyUp(event) {
    down.delete(event.code);
  }

  function onPointerMove(event) {
    const p = canvasPoint(event);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.inside = true;
  }

  function onPointerDown(event) {
    const p = canvasPoint(event);
    mouse.x = p.x;
    mouse.y = p.y;
    mouse.inside = true;
    mouse.down = true;
    clicks.push({ x: p.x, y: p.y });
  }

  function onPointerUp() {
    mouse.down = false;
  }

  function onBlur() {
    down.clear();
    mouse.down = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointerup', onPointerUp);

  return {
    mouse,
    isDown(code) {
      return down.has(code);
    },
    // Any movement key held: arrows or WASD.
    moveVector() {
      let x = 0;
      let y = 0;
      if (down.has('ArrowLeft') || down.has('KeyA')) x -= 1;
      if (down.has('ArrowRight') || down.has('KeyD')) x += 1;
      if (down.has('ArrowUp') || down.has('KeyW')) y -= 1;
      if (down.has('ArrowDown') || down.has('KeyS')) y += 1;
      if (x !== 0 && y !== 0) {
        const len = Math.hypot(x, y);
        x /= len;
        y /= len;
      }
      return { x, y };
    },
    // Drain this frame's edge-triggered actions, oldest first.
    takePressed() {
      return pressedQueue.splice(0, pressedQueue.length);
    },
    // Drain this frame's clicks, oldest first.
    takeClicks() {
      return clicks.splice(0, clicks.length);
    },
    // Test-only hook: a scripted playthrough steers the mouse by moving
    // the pointer through the same event the player uses.
    steerTo(x, y) {
      canvas.dispatchEvent(
        new PointerEvent('pointermove', { clientX: x, clientY: y, bubbles: true }),
      );
    },
    pressKey(code) {
      window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true }));
      window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true }));
    },
  };
}
