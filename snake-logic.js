(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
    return;
  }
  root.SnakeLogic = factory();
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const DIRECTIONS = {
    UP: { x: 0, y: -1 },
    DOWN: { x: 0, y: 1 },
    LEFT: { x: -1, y: 0 },
    RIGHT: { x: 1, y: 0 }
  };

  function createGame(options = {}) {
    const gridSize = options.gridSize || 12;
    const snake = options.snake || [
      { x: 2, y: Math.floor(gridSize / 2) },
      { x: 1, y: Math.floor(gridSize / 2) },
      { x: 0, y: Math.floor(gridSize / 2) }
    ];
    const direction = options.direction || "RIGHT";
    const food = options.food || spawnFood(snake, gridSize, options.random || Math.random);
    return {
      gridSize,
      snake: cloneSegments(snake),
      direction,
      queuedDirection: null,
      food,
      score: options.score || 0,
      isGameOver: false,
      isPaused: false,
      didWin: false
    };
  }

  function queueDirection(game, nextDirection) {
    if (!DIRECTIONS[nextDirection] || game.isGameOver) {
      return game;
    }

    if (game.queuedDirection) {
      return game;
    }

    if (isOpposite(game.direction, nextDirection)) {
      return game;
    }

    return {
      ...game,
      queuedDirection: nextDirection
    };
  }

  function togglePause(game) {
    if (game.isGameOver) {
      return game;
    }

    return {
      ...game,
      isPaused: !game.isPaused
    };
  }

  function advanceGame(game, random = Math.random) {
    if (game.isGameOver || game.isPaused) {
      return game;
    }

    const direction = game.queuedDirection || game.direction;
    const offset = DIRECTIONS[direction];
    const head = game.snake[0];
    const nextHead = { x: head.x + offset.x, y: head.y + offset.y };
    const ateFood = positionsEqual(nextHead, game.food);
    const occupiedSegments = ateFood ? game.snake : game.snake.slice(0, -1);

    if (hitsBoundary(nextHead, game.gridSize) || containsPosition(occupiedSegments, nextHead)) {
      return {
        ...game,
        direction,
        queuedDirection: null,
        isGameOver: true
      };
    }

    const snake = [nextHead].concat(game.snake);
    if (!ateFood) {
      snake.pop();
    }

    const nextFood = ateFood ? spawnFood(snake, game.gridSize, random) : game.food;
    const didWin = ateFood && !nextFood;

    return {
      ...game,
      snake,
      direction,
      queuedDirection: null,
      food: nextFood,
      score: game.score + (ateFood ? 1 : 0),
      isGameOver: didWin,
      didWin
    };
  }

  function spawnFood(snake, gridSize, random = Math.random) {
    const openCells = [];

    for (let y = 0; y < gridSize; y += 1) {
      for (let x = 0; x < gridSize; x += 1) {
        if (!containsPosition(snake, { x, y })) {
          openCells.push({ x, y });
        }
      }
    }

    if (!openCells.length) {
      return null;
    }

    const index = Math.floor(random() * openCells.length);
    return openCells[index];
  }

  function positionsEqual(first, second) {
    return Boolean(first) && Boolean(second) && first.x === second.x && first.y === second.y;
  }

  function containsPosition(segments, position) {
    return segments.some((segment) => positionsEqual(segment, position));
  }

  function hitsBoundary(position, gridSize) {
    return position.x < 0 || position.y < 0 || position.x >= gridSize || position.y >= gridSize;
  }

  function isOpposite(currentDirection, nextDirection) {
    return (
      (currentDirection === "UP" && nextDirection === "DOWN") ||
      (currentDirection === "DOWN" && nextDirection === "UP") ||
      (currentDirection === "LEFT" && nextDirection === "RIGHT") ||
      (currentDirection === "RIGHT" && nextDirection === "LEFT")
    );
  }

  function cloneSegments(segments) {
    return segments.map((segment) => ({ x: segment.x, y: segment.y }));
  }

  return {
    DIRECTIONS,
    advanceGame,
    createGame,
    queueDirection,
    spawnFood,
    togglePause
  };
}));
