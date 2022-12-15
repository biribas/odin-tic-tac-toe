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

  const _getBoard = () => _board;

  const addMark = place => {
    if (_board[place] != space.empty)
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

  const isEmpty = () => _board.every(field => field === space.empty);

  const obj = {
    addMark,
    clear,
    isEmpty
  }

  Object.defineProperty(obj, 'board', {get: _getBoard});

  return obj;
})();

const gameController = (() => {
  const _maxScore = 1;
  const _maxRounds = 10;

  let _player1;
  let _player2;

  let _turn;
  let _currentRound;

  const _getTurn = () => _turn;

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

  const evaluate = (board, lastMove) => {
    if (!checkVictory(board, lastMove))
      return 0;

    if (board[lastMove] === space.cross)
      return 10;
    
    return -10;
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
    scoreboardController.round = _currentRound;

    _turn = _player1.sign;
    scoreboardController.changeTurn();

    gameBoard.clear();
    displayController.clear();

    _setUpTurn();
  }

  const playAgain = () => {
    _player1.resetScore();
    _player2.resetScore();

    displayController.unblockGameboard();
    displayController.playAgain();
    _resetGame();
  }

  const _setUpTurn = () => {
    const nextPlayer = _turn === space.cross ? _player1 : _player2; 

    if (nextPlayer.isBot) {
      displayController.blockGameboard();
      setTimeout(() => gameBoard.addMark(botController.findBestMove(_turn)), 500);
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
    evaluate,
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

const botController = (() => {
  const _isMovesLeft = board => board.some(field => field === space.empty);

  const _getScore = (board, isMax, depth) => {
    const k = (-1) ** isMax;
    let best = k * Infinity;

    for (let index = 0; index < 9; index++) {
      if (board[index] !== space.empty)
        continue;

      board[index] = isMax ? space.cross : space.nought;

      const args = [best, _minimax(board, depth + 1, !isMax, index)];
      best = isMax ? Math.max(...args) : Math.min(...args);

      board[index] = space.empty;
    }

    return best;
  }

  const _minimax = (board, depth, isMax, lastMove) => {
    const score = gameController.evaluate(board, lastMove);

    if (score === 10)
      return score - depth;

    if (score === -10)
      return score + depth;

    if (!_isMovesLeft(board))
      return 0;

    return _getScore(board, isMax, depth);
  }

  const findBestMove = (turn) => {
    const board = gameBoard.board;
    const isMax = turn === space.cross; 
    const k = (-1) ** isMax;

    let bestScore = k * Infinity;
    let bestMove;

    if (gameBoard.isEmpty())  {
      const corners = [0, 2, 6, 8];
      const random = Math.floor(Math.random() * corners.length);
      return corners[random];
    }

    for (let index = 0; index < 9; index++) {
      if (board[index] !== space.empty)
        continue;

      board[index] = turn;
      const moveScore = _minimax(board, 0, !isMax, index)
      board[index] = space.empty;

      const condition = isMax ? moveScore > bestScore : moveScore < bestScore;
      if (condition) {
        bestMove = index;
        bestScore = moveScore;
      }
    }

    displayController.removeHighlight();

    return bestMove;
  }

  return {findBestMove};
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
    const playerOne = +_playerOne.score.innerText;
    const playerTwo = +_playerTwo.score.innerText;

    let str;
    if (playerOne === playerTwo) {
      str = "It's a tie..."
    }
    else {
      const winner = playerOne > playerTwo ? _playerOne.name.innerText : _playerTwo.name.innerText;
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

  Object.defineProperty(obj, 'playerTwoName', {set: _setPlayerTwoScore});
  Object.defineProperty(obj, 'round', {set: _setRound});

  return obj;
})();

const displayController = (() => {
  const _icons = [icons.cross, icons.nought];
  let _editable = true;

  const _gameScreen = document.getElementById('game-screen');
  const _gameBoard = document.getElementById('gameboard');
  const _fields = _gameBoard.querySelectorAll('.field');
  const _playAgain = document.getElementById('play-again');

  _fields.forEach((field, index) => field.addEventListener('click', () => _editable && gameBoard.addMark(index)));
  _playAgain.addEventListener('click', gameController.playAgain);

  const addMark = place => {
    const index = +(gameController.turn === space.nought);
    _fields[place].classList.add(_icons[index]);
  }

  const clear = () => {
    _fields.forEach(field => field.classList.remove(..._icons));
    _gameBoard.classList.remove('draw');
    removeHighlight();
  }

  const highlightVictory = (...args) => {
    for (let i = 0; i < args.length; i++)  {
      _fields[args[i]].classList.add('victory');
    }
  }

  const highlightDraw = () => {
    _gameBoard.classList.add('draw');
  }

  const removeHighlight = () => _fields.forEach(field => field.classList.remove('victory'));

  const finishRound = round => {
    setTimeout(() => {
      gameController.changeTurn();
      displayController.clear();
      displayController.unblockGameboard();
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

  const blockGameboard = () => _editable = false;
  const unblockGameboard = () => _editable = true;

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

