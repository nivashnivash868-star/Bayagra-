const test = require("node:test");
const assert = require("node:assert/strict");
const SnakeLogic = require("./snake-logic.js");

test("advanceGame moves the snake forward by one cell", () => {
  const game = SnakeLogic.createGame({
    gridSize: 8,
    snake: [
      { x: 3, y: 4 },
      { x: 2, y: 4 },
      { x: 1, y: 4 }
    ],
    direction: "RIGHT",
    food: { x: 7, y: 7 }
  });

  const next = SnakeLogic.advanceGame(game);

  assert.deepEqual(next.snake, [
    { x: 4, y: 4 },
    { x: 3, y: 4 },
    { x: 2, y: 4 }
  ]);
  assert.equal(next.score, 0);
  assert.equal(next.isGameOver, false);
});

test("queueDirection prevents reversing into the opposite direction", () => {
  const game = SnakeLogic.createGame({
    direction: "RIGHT",
    food: { x: 5, y: 5 }
  });

  const queued = SnakeLogic.queueDirection(game, "LEFT");

  assert.equal(queued.queuedDirection, null);
});

test("advanceGame grows the snake and increments score when food is eaten", () => {
  const game = SnakeLogic.createGame({
    gridSize: 8,
    snake: [
      { x: 3, y: 3 },
      { x: 2, y: 3 },
      { x: 1, y: 3 }
    ],
    direction: "RIGHT",
    food: { x: 4, y: 3 }
  });

  const next = SnakeLogic.advanceGame(game, () => 0);

  assert.deepEqual(next.snake, [
    { x: 4, y: 3 },
    { x: 3, y: 3 },
    { x: 2, y: 3 },
    { x: 1, y: 3 }
  ]);
  assert.equal(next.score, 1);
  assert.notDeepEqual(next.food, { x: 4, y: 3 });
});

test("advanceGame ends the game when the snake hits a wall", () => {
  const game = SnakeLogic.createGame({
    gridSize: 5,
    snake: [
      { x: 4, y: 1 },
      { x: 3, y: 1 },
      { x: 2, y: 1 }
    ],
    direction: "RIGHT",
    food: { x: 0, y: 0 }
  });

  const next = SnakeLogic.advanceGame(game);

  assert.equal(next.isGameOver, true);
});

test("advanceGame ends the game when the snake hits its own body", () => {
  const game = SnakeLogic.createGame({
    gridSize: 6,
    snake: [
      { x: 2, y: 2 },
      { x: 2, y: 3 },
      { x: 1, y: 3 },
      { x: 1, y: 2 },
      { x: 1, y: 1 },
      { x: 2, y: 1 }
    ],
    direction: "DOWN",
    food: { x: 5, y: 5 }
  });

  const next = SnakeLogic.advanceGame(game);

  assert.equal(next.isGameOver, true);
});

test("spawnFood only places food on open cells", () => {
  const snake = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 }
  ];

  const food = SnakeLogic.spawnFood(snake, 2, () => 0);

  assert.deepEqual(food, { x: 1, y: 1 });
});
