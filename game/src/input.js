// Keyboard + mouse input. Tracks held keys, the mouse position in canvas pixels,
// and click events the game loop consumes once per frame.
export function createInput(canvas) {
  const input = {
    keys: new Set(),
    mouse: { x: 0, y: 0, down: false },
    clicked: null, // {x, y} of the last mouse press, consumed by the game
    pressedKeys: new Set(), // keys pressed since the last frame, consumed by the game
  };

  function canvasPos(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }

  window.addEventListener('keydown', (event) => {
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) event.preventDefault();
    if (!event.repeat) input.pressedKeys.add(key);
    input.keys.add(key);
  });
  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.key.length === 1 ? event.key.toLowerCase() : event.key);
  });
  window.addEventListener('blur', () => { input.keys.clear(); });
  canvas.addEventListener('mousemove', (event) => {
    const p = canvasPos(event);
    input.mouse.x = p.x; input.mouse.y = p.y;
  });
  canvas.addEventListener('mousedown', (event) => {
    const p = canvasPos(event);
    input.mouse.x = p.x; input.mouse.y = p.y;
    input.mouse.down = true;
    input.clicked = { x: p.x, y: p.y, button: event.button };
  });
  window.addEventListener('mouseup', () => { input.mouse.down = false; });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  return input;
}

export function keyDown(input, ...names) {
  return names.some((n) => input.keys.has(n));
}
export function keyPressed(input, ...names) {
  return names.some((n) => input.pressedKeys.has(n));
}
export function consumeClick(input) {
  const c = input.clicked;
  input.clicked = null;
  return c;
}
export function endFrame(input) {
  input.pressedKeys.clear();
  input.clicked = null;
}
