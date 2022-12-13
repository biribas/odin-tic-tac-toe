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
  const _maxScore = 1;

  let _player1;
  let _player2;

  let _turn;
  let _currentRound;

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
      scoreboardController.playerOne.score = score;
    }
    else {
      score = _player2.increaseScore();
      scoreboardController.playerTwo.score = score;
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
    gameBoard.blockGameboard();
    displayController.finishGame();
    scoreboardController.finishGame();
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

  const _resetGame = () => {
    scoreboardController.playerOne.score = 0;
    scoreboardController.playerTwo.score = 0;

    _currentRound = 1;
    _turn = _player1.sign;

    scoreboardController.round = _currentRound;
    scoreboardController.changeTurn();

    gameBoard.clear();
    displayController.clear();
  }

  const playAgain = () => {
    _player1.resetScore();
    _player2.resetScore();

    gameBoard.unblockGameboard();
    displayController.playAgain();
    _resetGame();
  }

  const changeTurn = () => _turn = _turn === space.cross ? space.nought : space.cross;

  const obj = {
    checkVictory,
    checkDraw,
    handleVictory,
    handleDraw,
    startGame,
    playAgain,
    changeTurn
  }

  Object.defineProperty(obj, 'turn', {get: _getTurn});

  return obj;
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

  const finishGame = () => {
    const winner = [..._players].find(player => player.classList.contains('marked')).querySelector('.name').innerText;
    _roundCounter.innerText = `${winner} wins!`;
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

  Object.defineProperty(obj, 'playerTwoName', {set: _setPlayerTwoScore});
  Object.defineProperty(obj, 'round', {set: _setRound});

  return obj;
})();


const displayController = (() => {
  const _icons = [icons.cross, icons.nought];

  const _gameScreen = document.getElementById('game-screen');
  const _gameBoard = document.getElementById('gameboard');
  const _fields = _gameBoard.querySelectorAll('.field');
  const _playAgain = document.getElementById('play-again');

  _fields.forEach((field, index) => field.addEventListener('click', () => gameBoard.addMark(index)));
  _playAgain.addEventListener('click', gameController.playAgain);

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
    _playAgain.classList.add('active');
  }

  const playAgain = () => {
    _playAgain.classList.remove('active');
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
    playAgain,
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
      player.buttons[1].innerText = "Bot";
      player.difficulty = -1;
    }

    if (_playerOne.selected && _playerTwo.selected) {
      _startButton.classList.add('active');
    }
  }

  _playerOne.buttons.forEach((button, index) => button.addEventListener('click', () => _selectPlayer(index, _playerOne)));
  _playerTwo.buttons.forEach((button, index) => button.addEventListener('click', () => _selectPlayer(index, _playerTwo)));
  _startButton.addEventListener('click', () => gameController.startGame(_playerOne.difficulty, _playerTwo.difficulty));

  const hide = () => _menuScreen.classList.add('hidden');

  const show = () => _menuScreen.classList.remove('hidden');

  return {hide, show};
})();

// document.addEventListener('DOMContentLoaded', gameController.startGame());

