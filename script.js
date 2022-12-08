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
  const getSign = () => _sign;
  return {getSign};
}


const gameBoard = (() => {
  const _board = new Array(9);

  const addMark = place => {
    if (_board[place] != space.empty)
      return;

    _board[place] = gameController.getTurn();
    displayController.addMark(place);
    gameController.changeTurn();
  };

  const clear = () => _board.fill(space.empty);
  const getBoard = () => _board;

  return {addMark, clear, getBoard};
})();


const gameController = (() => {
  let _player1;
  let _player2;
  let _turn;

  const startGame = () => {
    _player1 = Player(space.cross);
    _player2 = Player(space.nought);
    _turn = space.cross;
    gameBoard.clear();
    displayController.clear();
  }

  const getTurn = () => _turn;

  const changeTurn = () => _turn = _turn === space.cross ? space.nought : space.cross;

  return {
    startGame,
    getTurn,
    changeTurn
  }
})();


const displayController = (() => {
  const _cross_class = 'ph-x-bold';
  const _nought_class = 'ph-circle-bold';

  const _fields = document.querySelectorAll('#gameboard .field');
  _fields.forEach((field, index) => field.addEventListener('click', gameBoard.addMark.bind(this, index)));

  const addMark = place => {
    const turn = gameController.getTurn();
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

  return {
    addMark,
    clear
  }
})();

document.addEventListener('DOMContentLoaded', gameController.startGame());

