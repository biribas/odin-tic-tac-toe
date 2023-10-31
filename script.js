Array.prototype.random = function () {
  return this[Math.floor(Math.random() * this.length)];
}

const space = (() => {
  const obj = {
    empty: null,
    cross: 'X',
    nought: 'O'
  } 
  return Object.freeze(obj);
})();

const icons = (() => {
  const obj = {
    cross: "ph-x-bold",
    nought: "ph-circle-bold",
    human: "ph-person-simple",
    robot: "ph-robot"
  }
  return Object.freeze(obj);
})();

const Player = (sign, difficulty) => {
  const _sign = sign;
  const _isBot = difficulty !== -1;
  let _score = 0;
  let _paused = false;

  const increaseScore = () => ++_score;
  const resetScore = () => _score = 0;
  const pause = () => _paused = true;

  const obj = {
    increaseScore,
    resetScore,
    pause
  }

  if (_isBot)
    Object.defineProperty(obj, 'difficulty', {get: () => difficulty});

  Object.defineProperty(obj, 'paused', {get: () => _paused});
  Object.defineProperty(obj, 'isBot', {get: () => _isBot});
  Object.defineProperty(obj, 'score', {get: () => _score});
  Object.defineProperty(obj, 'sign', {get: () => _sign});

  return obj;
}

const gameBoard = (() => {
  const _board = new Array(9);

  const addMark = place => {
    if (_board[place] !== space.empty)
      return;

    _board[place] = gameController.turn;
    displayController.addMark(place);

    if (gameController.checkVictory(_board, place)) {
      gameController.handleVictory();
    }
    else if (gameController.isFull(_board)) {
      gameController.handleDraw();
    }
    else {
      gameController.changeTurn();
      scoreboardController.changeTurn();
    }
  };

  const clear = () => _board.fill(space.empty);

  const isEmpty = () => _board.every(field => field === space.empty);

  const obj = {
    addMark,
    clear,
    isEmpty,
  }

  Object.defineProperty(obj, 'board', {get: () => [..._board]});

  return obj;
})();

const gameController = (() => {
  const _maxScore = 3;
  const _maxRounds = 10;

  let _player1;
  let _player2;

  let _turn;
  let _currentRound;

  const _checkRows = (board, lastMove) => {
    const k = lastMove - lastMove % 3;
    const isWon = board[k] === board[k + 1] && board[k + 1] === board[k + 2];

    if (isWon)
      displayController.highlightVictory(k, k + 1, k + 2);

    return isWon;
  }

  const _checkColumns = (board, lastMove) => {
    const k = lastMove % 3;
    const isWon = board[k] === board[k + 3] && board[k + 3] === board[k + 6];

    if (isWon) 
      displayController.highlightVictory(k, k + 3, k + 6);

    return isWon;
  }

  const _checkDiagonals = (board, lastMove) => {
    if (lastMove % 2 != 0)
      return false;

    let k = lastMove % 4;
    const counter = 1 + (lastMove === 4);

    for (let i = 0; i < counter; i++, k += 2) {
      if (board[k] === board[4] && board[4] === board[8 - k]) {
        displayController.highlightVictory(k, 4, 8 - k);
        return true;
      }
    }
    return false;
  }

  const checkVictory = (board, lastMove) => {
    const args = [board, lastMove];
    return _checkRows(...args) || _checkColumns(...args) || _checkDiagonals(...args);
  }

  const isFull = board => !board.some(field => field === space.empty);

  const handleVictory = () => {
    let score;
    
    if (_player1.sign === _turn) {
      score = _player1.increaseScore();
      scoreboardController.playerOne.score = score;
    }
    else {
      score = _player2.increaseScore();
      scoreboardController.playerTwo.score = score;
    }

    if (score === _maxScore)
      _finishGame();
    else
      _finishRound();
  }

  const handleDraw = () => {
    displayController.highlightDraw();
    _finishRound();
  }

  const _finishRound = () => {
    if (_currentRound === _maxRounds) {
      _finishGame();
    }
    else {
      gameBoard.clear();
      displayController.blockGameboard();
      displayController.finishRound(++_currentRound);
    }
  }

  const _finishGame = () => {
    displayController.blockGameboard();
    displayController.finishGame();
    scoreboardController.finishGame(_player1.score, _player2.score);
  }

  const _setScoreBoardNames = () => {
    const names = ['Player', 'Bot'];

    scoreboardController.playerOne.name = names[+_player1.isBot];
    scoreboardController.playerTwo.name = names[+_player2.isBot];

    if (!(_player1.isBot ^ _player2.isBot)) {
      scoreboardController.playerOne.name += ' One';
      scoreboardController.playerTwo.name += ' Two';
    }
  }

  const startGame = (player1, player2) => {
    _player1 = Player(space.cross, player1);
    _player2 = Player(space.nought, player2);
    _setScoreBoardNames();

    _resetGame();
    menuController.hide();
    displayController.show();
  }

  const pauseBots = () => {
    _player1.pause();
    _player2.pause();
  }

  const _resetGame = () => {
    _player1.resetScore();
    _player2.resetScore();

    scoreboardController.playerOne.score = 0;
    scoreboardController.playerTwo.score = 0;

    _currentRound = 1;
    scoreboardController.round = _currentRound;

    _turn = _player1.sign;
    scoreboardController.changeTurn();
    _setUpTurn();

    gameBoard.clear();
    displayController.clear();
  }

  const playAgain = () => {
    displayController.unblockGameboard();
    displayController.playAgain();
    _resetGame();
  }

  const _setUpTurn = () => {
    const nextPlayer = _turn === space.cross ? _player1 : _player2; 

    if (nextPlayer.paused)
      return;

    if (nextPlayer.isBot && !nextPlayer.paused) {
      displayController.blockGameboard();
      setTimeout(() => gameBoard.addMark(botController.move(nextPlayer.difficulty)), 500);
    }
    else {
      displayController.unblockGameboard();
    }
  }

  const changeTurn = () => {
    _turn = _turn === space.cross ? space.nought : space.cross;
    _setUpTurn();
  }

  const obj = {
    checkVictory,
    isFull,
    handleVictory,
    handleDraw,
    startGame,
    pauseBots,
    playAgain,
    changeTurn
  }

  Object.defineProperty(obj, 'turn', {get: () => _turn});

  return obj;
})();

const botController = (() => {
  const _actions = board => board.reduce((array, field, index) => field === space.empty ? [...array, index] : array, []);

  const _minimax = (board, isMax, depth, lastMove) => {
    if (gameController.checkVictory(board, lastMove)) {
      const score = board[lastMove] === space.cross ? 10 : -10;
      return score - Math.sign(score) * depth;
    }

    if (gameController.isFull(board)) {
      return 0;
    }

    let best = (-1) ** isMax * Infinity;

    for (const action of _actions(board)) {
      board[action] = isMax ? space.cross : space.nought;
      const args = [best, _minimax(board, !isMax, depth + 1, action)];
      best = isMax ? Math.max(...args) : Math.min(...args);
      board[action] = space.empty;
    }

    return best;
  }

  const move = difficulty => {
    const board = gameBoard.board;

    // Easy mode
    if (difficulty === 0) {
      return _actions(board).random();
    }

    // First move
    if (gameBoard.isEmpty())  {
      // Normal and Hard
      if (difficulty < 3) {
        return _actions(board).random();
      }
      // Impossible
      const corners = [0, 2, 6, 8];
      const random = Math.floor(Math.random() * corners.length);
      return corners[random];
    }

    // Difficulty handler
    if (difficulty == 1 && Math.random() > 0.5 || difficulty == 2 && Math.random() > 0.8) {
      return _actions(board).random();
    }

    const moves = [];
    const turn = gameController.turn;
    const isMax = turn === space.cross; 

    for (const action of _actions(board)) {
      board[action] = turn;
      const moveScore = _minimax(board, !isMax, 0, action);
      board[action] = space.empty;
      moves.push({index: action, score: moveScore});
    }

    displayController.removeHighlight();

    const scores = moves.map(obj => obj.score);
    const bestScore = isMax ? Math.max(...scores) : Math.min(...scores);
    const bestMoves = moves.filter(obj => obj.score === bestScore).map(obj => obj.index);

    return bestMoves.random();
  }

  return {move};
})();

const scoreboardController = (() => {
  const _players = document.querySelectorAll('.player');
  const _roundCounter = document.getElementById('round-counter');

  const _playerOne = {
    name: document.querySelector('#player-one .name'),
    score: document.querySelector('#player-one .score')
  }
  const _playerTwo = {
    name: document.querySelector('#player-two .name'),
    score: document.querySelector('#player-two .score')
  }

  const _getPlayerOneName = () => _playerOne.name.innerText;
  const _getPlayerTwoName = () => _playerTwo.name.innerText;

  const _setPlayerOneName = name => _playerOne.name.innerText = name;
  const _setPlayerTwoName = name => _playerTwo.name.innerText = name;

  const _setPlayerOneScore = score => _playerOne.score.innerText = score;   
  const _setPlayerTwoScore = score => _playerTwo.score.innerText = score;   

  const _setRound = round => _roundCounter.innerText = 'Round ' + round;
  
  const changeTurn = () => {
    const index = +(gameController.turn === space.nought);
    _players[index].classList.add('marked');
    _players[index ^ 1].classList.remove('marked');
  }

  const finishGame = (player1, player2) => {
    let str;
    if (player1 === player2) {
      str = "It's a tie..."
    }
    else {
      const winner = player1 > player2 ? _playerOne.name.innerText : _playerTwo.name.innerText;
      str = `${winner} wins!`;
    }

    _roundCounter.innerText = str;
  }

  const playerOne = {};
  Object.defineProperty(playerOne, 'name', {set: _setPlayerOneName, get: _getPlayerOneName});
  Object.defineProperty(playerOne, 'score', {set: _setPlayerOneScore});

  const playerTwo = {};
  Object.defineProperty(playerTwo, 'name', {set: _setPlayerTwoName, get: _getPlayerTwoName});
  Object.defineProperty(playerTwo, 'score', {set: _setPlayerTwoScore});

  const obj = {
    changeTurn,
    finishGame,
    playerOne,
    playerTwo
  }

  Object.defineProperty(obj, 'round', {set: _setRound});

  return obj;
})();

const displayController = (() => {
  let _blocked = true;
  const _icons = [icons.cross, icons.nought];

  const _gameScreen = document.getElementById('game-screen');
  const _gameBoard = document.getElementById('gameboard');
  const _fields = _gameBoard.querySelectorAll('.field');

  const _buttons = document.getElementById('end-game-buttons')
  const _playAgain = document.getElementById('play-again');
  const _changeMode = document.getElementById('change-mode');

  _fields.forEach((field, index) => field.addEventListener('click', () => !_blocked && gameBoard.addMark(index)));

  _playAgain.addEventListener('click', gameController.playAgain);

  _changeMode.addEventListener('click', () => {
    hide();
    menuController.show();
  });

  const addMark = place => {
    const index = +(gameController.turn === space.nought);
    _fields[place].classList.add(_icons[index]);
  }

  const clear = () => {
    _fields.forEach(field => field.classList.remove(..._icons));
    removeHighlight();
  }

  const highlightVictory = (...args) => {
    for (let i = 0; i < args.length; i++)  {
      _fields[args[i]].classList.add('victory');
    }
  }

  const highlightDraw = () => _gameBoard.classList.add('draw');

  const removeHighlight = () => {
    _gameBoard.classList.remove('draw');
    _fields.forEach(field => field.classList.remove('victory'));
  }

  const finishRound = round => {
    setTimeout(() => {
      gameController.changeTurn();
      displayController.clear();
      scoreboardController.changeTurn();
      scoreboardController.round = round;
    }, 1500);
  }

  const finishGame = () => _buttons.classList.add('active');

  const playAgain = () => _buttons.classList.remove('active');

  const hide = () => {
    gameController.pauseBots();
    _gameScreen.classList.add('hidden');
    _buttons.classList.remove('active');
  }

  const show = () => _gameScreen.classList.remove('hidden');

  const blockGameboard = () => {
    _blocked = true;
    _gameBoard.classList.add('blocked');
  }
  const unblockGameboard = () => {
    _blocked = false;
    _gameBoard.classList.remove('blocked');
  } 

  return {
    addMark,
    clear,
    highlightVictory,
    highlightDraw,
    removeHighlight,
    finishRound,
    finishGame,
    playAgain,
    hide,
    show,
    blockGameboard,
    unblockGameboard
  }
})();

const menuController = (() => {
  const _menuScreen = document.getElementById('main-menu');

  const _playerOneCard = document.getElementById('player-one-card');
  const _playerTwoCard = document.getElementById('player-two-card');
  const _startButton = document.getElementById('start-game');

  const _icons = [icons.human, icons.robot]
  const _difficulties = ["Easy", "Normal", "Hard", "Impossible"];

  const _playerOne = {
    sign: icons.cross,
    image: _playerOneCard.querySelector('.image'),
    buttons: [
      _playerOneCard.querySelector('.playerButton'),
      _playerOneCard.querySelector('.botButton')
    ],
    selected: false,
    difficulty: -1
  }

  const _playerTwo = {
    sign: icons.nought,
    image: _playerTwoCard.querySelector('.image'),
    buttons: [
      _playerTwoCard.querySelector('.playerButton'),
      _playerTwoCard.querySelector('.botButton')
    ],
    selected: false,
    difficulty: -1
  }

  const _changeImage = (icon, node) => {
    node.classList.remove(...Object.values(icons));
    node.classList.add(icon);
  }

  const _changeDifficuty = player => {
    player.difficulty = (player.difficulty + 1) % _difficulties.length;  
    player.buttons[1].innerText = _difficulties[player.difficulty];
  }

  const _selectPlayer = (index, player) => {
    player.selected = true;
    player.buttons[index].classList.add('selected');
    player.buttons[index ^ 1].classList.remove('selected');
    _changeImage(_icons[index], player.image);

    if (index === 1) {
      _changeDifficuty(player);
    }
    else {
      player.buttons[1].innerText = 'Bot';
      player.difficulty = -1;
    }

    if (_playerOne.selected && _playerTwo.selected) {
      _startButton.classList.add('active');
    }
  }

  _playerOne.buttons.forEach((button, index) => button.addEventListener('click', () => _selectPlayer(index, _playerOne)));
  _playerTwo.buttons.forEach((button, index) => button.addEventListener('click', () => _selectPlayer(index, _playerTwo)));
  _startButton.addEventListener('click', () => gameController.startGame(_playerOne.difficulty, _playerTwo.difficulty));

  const _resetCard = player => {
    player.buttons.forEach(button => button.classList.remove('selected'));
    player.buttons[1].innerText = 'Bot';
    player.image.classList.remove(..._icons);
    player.image.classList.add(player.sign);
    player.selected = false;
    player.difficulty = -1;
  }

  const hide = () => {
    _resetCard(_playerOne);
    _resetCard(_playerTwo);
    _menuScreen.classList.add('hidden');
    _startButton.classList.remove('active');
  }

  const show = () => _menuScreen.classList.remove('hidden');

  return {hide, show};
})();

