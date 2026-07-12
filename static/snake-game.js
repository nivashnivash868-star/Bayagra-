(function () {
  const SnakeLogic = window.SnakeLogic;

  if (!SnakeLogic) {
    return;
  }

  const GRID_SIZE = 12;
  const TICK_MS = 160;

  function bootstrapSnakeGame() {
    const board = document.getElementById("snake-board");
    const score = document.getElementById("snake-score");
    const status = document.getElementById("snake-status");
    const pauseButton = document.getElementById("snake-pause");
    const restartButton = document.getElementById("snake-restart");

    if (!board || !score || !status || !pauseButton || !restartButton) {
      return;
    }

    let game = SnakeLogic.createGame({ gridSize: GRID_SIZE });

    function render() {
      score.textContent = String(game.score);
      if (game.didWin) {
        status.textContent = "You win";
      } else if (game.isGameOver) {
        status.textContent = "Game over";
      } else if (game.isPaused) {
        status.textContent = "Paused";
      } else {
        status.textContent = "Running";
      }

      pauseButton.textContent = game.isPaused ? "Resume" : "Pause";
      board.style.setProperty("--snake-grid-size", String(game.gridSize));
      board.innerHTML = buildBoardMarkup(game);
    }

    function restart() {
      game = SnakeLogic.createGame({ gridSize: GRID_SIZE });
      render();
    }

    function tick() {
      game = SnakeLogic.advanceGame(game);
      render();
    }

    function handleDirection(direction) {
      game = SnakeLogic.queueDirection(game, direction);
      render();
    }

    window.addEventListener("keydown", (event) => {
      if (isTextInput(event.target)) {
        return;
      }

      const direction = mapKeyToDirection(event.key);
      if (direction) {
        event.preventDefault();
        handleDirection(direction);
        return;
      }

      if (event.key === " " || event.key === "p" || event.key === "P") {
        event.preventDefault();
        game = SnakeLogic.togglePause(game);
        render();
        return;
      }

      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        restart();
      }
    });

    document.querySelectorAll(".snake-dir").forEach((button) => {
      button.addEventListener("click", () => {
        handleDirection(button.dataset.direction);
      });
    });

    pauseButton.addEventListener("click", () => {
      game = SnakeLogic.togglePause(game);
      render();
    });

    restartButton.addEventListener("click", restart);

    render();
    window.setInterval(tick, TICK_MS);
  }

  function buildBoardMarkup(game) {
    const segments = new Map(game.snake.map((segment, index) => [`${segment.x}:${segment.y}`, index]));
    const cells = [];

    for (let y = 0; y < game.gridSize; y += 1) {
      for (let x = 0; x < game.gridSize; x += 1) {
        const key = `${x}:${y}`;
        let className = "snake-cell";

        if (game.food && game.food.x === x && game.food.y === y) {
          className += " food";
        } else if (segments.has(key)) {
          className += segments.get(key) === 0 ? " head" : " body";
        }

        cells.push(`<div class="${className}" role="gridcell" aria-label="${describeCell(x, y, game, segments)}"></div>`);
      }
    }

    return cells.join("");
  }

  function describeCell(x, y, game, segments) {
    if (game.food && game.food.x === x && game.food.y === y) {
      return `Food at ${x}, ${y}`;
    }
    if (segments.has(`${x}:${y}`)) {
      return segments.get(`${x}:${y}`) === 0 ? `Snake head at ${x}, ${y}` : `Snake body at ${x}, ${y}`;
    }
    return `Empty cell at ${x}, ${y}`;
  }

  function mapKeyToDirection(key) {
    switch (key) {
      case "ArrowUp":
      case "w":
      case "W":
        return "UP";
      case "ArrowDown":
      case "s":
      case "S":
        return "DOWN";
      case "ArrowLeft":
      case "a":
      case "A":
        return "LEFT";
      case "ArrowRight":
      case "d":
      case "D":
        return "RIGHT";
      default:
        return null;
    }
  }

  function isTextInput(target) {
    return target instanceof HTMLElement && (
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable
    );
  }

  bootstrapSnakeGame();
}());
