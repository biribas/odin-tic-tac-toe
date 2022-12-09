const space = (() => {
  const obj = {
    empty: null,
    cross: 'X',
    nought: 'O'
  } 
  return Object.freeze(obj);
})();


const Player = sign => {
  const _sign = sign;
  let _score = 0;

  const _getScore = () => _score;
  const _getSign = () => _sign;

  const increaseScore = () => ++_score;
  const resetScore = () => _score = 0;

  const obj = {
    increaseScore,
    resetScore,
  }

  Object.defineProperty(obj, 'score', {get: _getScore})
  Object.defineProperty(obj, 'sign', {get: _getSign})

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
      gameController.finishRound();
      displayController.finishRound();
    }

    gameController.changeTurn();
  };

  const clear = () => _board.fill(space.empty);

  const obj = {
    addMark,
    clear
  }

  Object.defineProperty(obj, 'board', {get: _getBoard});

  return obj;
})();


const gameController = (() => {
  const _maxScore = 3;

  const _player1 = Player(space.cross);
  const _player2 = Player(space.nought);

  let _turn;
  let _round = 1;

  const _getTurn = () => _turn;

  const _checkRows = (board, lastMove) => {
    const k = lastMove - lastMove % 3;
    const isWon = board[k] === board[k + 1] && board[k + 1] === board[k + 2];

    if (isWon) {
      displayController.highlight(k, k + 1, k + 2);
    }

    return isWon;
  }

  const _checkColumns = (board, lastMove) => {
    const k = lastMove % 3;
    const isWon = board[k] === board[k + 3] && board[k + 3] === board[k + 6];

    if (isWon) {
      displayController.highlight(k, k + 3, k + 6);
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
        displayController.highlight(k, 4, 8 - k);
        return true;
      }
    }

    return false;
  }

  const checkVictory = (board, lastMove) => {
    const args = [board, lastMove];
    return _checkRows(...args) || _checkColumns(...args) || _checkDiagonals(...args);
  }

  const startGame = () => {
    _player1.resetScore();
    scoreboardController.playerOneScore = _player1.score;

    _player2.resetScore();
    scoreboardController.playerTwoScore = _player2.score;

    _turn = _player1.sign;
    scoreboardController.round = _round;

    gameBoard.clear();
    displayController.clear();
  }

  const _finishGame = () => {

  }

  const finishRound = () => {
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
  }

  const changeTurn = () => _turn = _turn === space.cross ? space.nought : space.cross;

  const obj = {
    startGame,
    changeTurn,
    checkVictory,
    finishRound
  }

  Object.defineProperty(obj, 'turn', {get: _getTurn});

  return obj;
})();


const scoreboardController = (() => {
  const _playerOneScore = document.getElementById('player-one-score');
  const _playerTwoScore = document.getElementById('player-two-score');
  const _roundCounter = document.getElementById('current-round');

  const _setPlayerOneScore = score => _playerOneScore.innerText = score;   
  const _setPlayerTwoScore = score => _playerTwoScore.innerText = score;   

  const _setRound = round => _roundCounter.innerText = round;

  const obj = {}

  Object.defineProperty(obj, 'playerOneScore', {set: _setPlayerOneScore});
  Object.defineProperty(obj, 'playerTwoScore', {set: _setPlayerTwoScore});
  Object.defineProperty(obj, 'round', {set: _setRound});

  return obj;
})();


const displayController = (() => {
  const _cross_class = 'ph-x-bold';
  const _nought_class = 'ph-circle-bold';

  const _fields = document.querySelectorAll('#gameboard .field');
  _fields.forEach((field, index) => field.addEventListener('click', gameBoard.addMark.bind(null, index)));

  const addMark = place => {
    const turn = gameController.turn;
    if (turn === space.cross) {
      _fields[place].classList.add(_cross_class);
    }
    else if (turn === space.nought) {
      _fields[place].classList.add(_nought_class);
    }
  }

  const clear = () => {
    _fields.forEach(field => field.classList.remove(_cross_class, _nought_class));
  }

  const highlight = (...args) => {
    for (let i = 0; i < args.length; i++)  {
      _fields[args[i]].style.color = 'lightgreen';
    }
  }

  const finishRound = () => {
       
  }

  return {
    addMark,
    clear,
    highlight,
    finishRound
  }
})();

document.addEventListener('DOMContentLoaded', gameController.startGame());

