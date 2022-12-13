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
    human: "ph-person",
    robot: "ph-robot"
  }
  return Object.freeze(obj);
})();

const Player = (sign, difficulty) => {
  const _sign = sign;
  const _isBot = difficulty !== -1;
  let _score = 0;

  const increaseScore = () => ++_score;
  const resetScore = () => _score = 0;

  const obj = {
    increaseScore,
    resetScore
  }

  if (_isBot) {
    Object.defineProperty(obj, 'difficulty', {get: () => difficulty});
  }

  Object.defineProperty(obj, 'isBot', {get: () => _isBot});
  Object.defineProperty(obj, 'score', {get: () => _score});
  Object.defineProperty(obj, 'sign', {get: () => _sign});

  return obj;
}

const gameBoard = (() => {
  const _board = new Array(9);
  let _editable = true;

  const _getBoard = () => _board;

  const addMark = place => {
    if (_board[place] != space.empty || !_editable)
      return;

    _board[place] = gameController.turn;
    displayController.addMark(place);

    if (gameController.checkVictory(_board, place)) {
      gameController.handleVictory();
    }
    else if (gameController.checkDraw(_board)) {
      gameController.handleDraw();
    }
    else {
      gameController.changeTurn();
      scoreboardController.changeTurn();
    }
  };

  const clear = () => _board.fill(space.empty);

  const blockGameboard = () => _editable = false;
  const unblockGameboard = () => _editable = true;

  const obj = {
    addMark,
    clear,
    blockGameboard,
    unblockGameboard
  }

  Object.defineProperty(obj, 'board', {get: _getBoard});

  return obj;
})();


const gameController = (() => {
  const _maxScore = 3;

  let _player1;
  let _player2;

  let _turn;
  let _round = 1;

  const _getTurn = () => _turn;

  const _checkRows = (board, lastMove) => {
    const k = lastMove - lastMove % 3;
    const isWon = board[k] === board[k + 1] && board[k + 1] === board[k + 2];

    if (isWon) {
      displayController.highlightVictory(k, k + 1, k + 2);
    }

    return isWon;
  }

  const _checkColumns = (board, lastMove) => {
    const k = lastMove % 3;
    const isWon = board[k] === board[k + 3] && board[k + 3] === board[k + 6];

    if (isWon) {
      displayController.highlightVictory(k, k + 3, k + 6);
    }

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

  const checkDraw = board => !board.some(field => field === space.empty);

  const handleVictory = () => {
    let score;
    
    if (_player1.sign === _turn) {
      score = _player1.increaseScore();
      scoreboardController.playerOneScore = score;
    }
    else {
      score = _player2.increaseScore();
      scoreboardController.playerTwoScore = score;
    }

    if (score === _maxScore) {
      _finishGame();
    }
    else {
      displayController.finishRound(++_round);
      _finishRound();
    }
  }

  const handleDraw = () => {
    displayController.highlightDraw();
    displayController.finishRound(++_round);
    _finishRound();
  }

  const _finishRound = () => {
    gameController.changeTurn();
    gameBoard.blockGameboard();
    gameBoard.clear();
  }

  const _finishGame = () => {

  }

  const startGame = (player1, player2) => {
    _player1 = Player(space.cross, player1);
    _player2 = Player(space.nought, player2);

    scoreboardController.playerOneScore = _player1.score;
    scoreboardController.playerTwoScore = _player2.score;

    _turn = _player1.sign;
    scoreboardController.round = _round;
    scoreboardController.changeTurn();

    gameBoard.clear();
    displayController.clear();

    menuController.hide();
    displayController.show();
  }

  const changeTurn = () => _turn = _turn === space.cross ? space.nought : space.cross;

  const obj = {
    startGame,
    changeTurn,
    checkVictory,
    checkDraw,
    handleVictory,
    handleDraw
  }

  Object.defineProperty(obj, 'turn', {get: _getTurn});

  return obj;
})();


const scoreboardController = (() => {
  const players = document.querySelectorAll('.player');
  const _playerOneScore = document.querySelector('#player-one .score');
  const _playerTwoScore = document.querySelector('#player-two .score');
  const _roundCounter = document.getElementById('current-round');

  const _setPlayerOneScore = score => _playerOneScore.innerText = score;   
  const _setPlayerTwoScore = score => _playerTwoScore.innerText = score;   

  const _setRound = round => _roundCounter.innerText = round;
  
  const changeTurn = () => {
    const index = +(gameController.turn === space.nought);
    players[index].classList.add('marked');
    players[index ^ 1].classList.remove('marked');
  }

  const obj = {changeTurn}

  Object.defineProperty(obj, 'playerOneScore', {set: _setPlayerOneScore});
  Object.defineProperty(obj, 'playerTwoScore', {set: _setPlayerTwoScore});
  Object.defineProperty(obj, 'round', {set: _setRound});

  return obj;
})();


const displayController = (() => {
  const _icons = [icons.cross, icons.nought];

  const _gameScreen = document.getElementById('game-screen');
  const _gameBoard = document.getElementById('gameboard');
  const _fields = _gameBoard.querySelectorAll('.field');
  _fields.forEach((field, index) => field.addEventListener('click', gameBoard.addMark.bind(null, index)));

  const addMark = place => {
    const index = +(gameController.turn === space.nought);
    _fields[place].classList.add(_icons[index]);
  }

  const clear = () => {
    _fields.forEach(field => field.classList.remove(..._icons));
    _fields.forEach(field => field.classList.remove('victory'));
    _gameBoard.classList.remove('draw');
  }

  const highlightVictory = (...args) => {
    for (let i = 0; i < args.length; i++)  {
      _fields[args[i]].classList.add('victory');
    }
  }

  const highlightDraw = () => {
    _gameBoard.classList.add('draw');
  }

  const finishRound = round => {
    setTimeout(() => {
      displayController.clear();
      gameBoard.unblockGameboard();
      scoreboardController.changeTurn();
      scoreboardController.round = round;
    }, 1500);
  }

  const finishGame = () => {

  }

  const hide = () => _gameScreen.classList.add('hidden');

  const show = () => _gameScreen.classList.remove('hidden');

  return {
    addMark,
    clear,
    highlightVictory,
    highlightDraw,
    finishRound,
    finishGame,
    hide,
    show
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
    image: _playerOneCard.querySelector('.image'),
    buttons: [
      _playerOneCard.querySelector('.playerButton'),
      _playerOneCard.querySelector('.botButton')
    ],
    selected: false,
    difficulty: -1
  }

  const _playerTwo = {
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
      player.buttons[1].innerText = "Computer";
      player.difficulty = -1;
    }

    if (_playerOne.selected && _playerTwo.selected) {
      _startButton.classList.add('active');
    }
  }

  _playerOne.buttons.forEach((button, index) => button.addEventListener('click', _selectPlayer.bind(null, index, _playerOne)));
  _playerTwo.buttons.forEach((button, index) => button.addEventListener('click', _selectPlayer.bind(null, index, _playerTwo)));
  _startButton.addEventListener('click', gameController.startGame.bind(null, _playerOne.difficulty, _playerTwo.difficulty));

  const hide = () => _menuScreen.classList.add('hidden');

  const show = () => _menuScreen.classList.remove('hidden');

  return {hide, show};
})();

// document.addEventListener('DOMContentLoaded', gameController.startGame());

