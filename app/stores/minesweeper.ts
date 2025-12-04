import { defineStore } from 'pinia'

interface Cell {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
}

interface BoardState {
  boardData: Cell[][];
  gameOver: boolean;
  won: boolean;
  lost: boolean;
  minesLeft: number;
  cols: number;
  rows: number;
  mines: number;
}

export const useMinesweeperStore = defineStore('minesweeper', {
  state: (): BoardState => ({
    boardData: [],
    gameOver: false,
    won: false,
    lost: false,
    minesLeft: 0,
    cols: 0,
    rows: 0,
    mines: 0,
  }),
  actions: {
    initializeBoard(rows: number, cols: number, mines: number) {
      this.rows = rows;
      this.cols = cols;
      this.mines = mines;
      this.minesLeft = mines;
      this.gameOver = false;
      this.won = false;
      this.lost = false;

      const grid: Cell[][] = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0,
        }))
      );

      // Place mines
      let minesPlaced = 0;
      while (minesPlaced < mines) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        if (!grid[r][c].isMine) {
          grid[r][c].isMine = true;
          minesPlaced++;
        }
      }

      // Calculate adjacent mines
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!grid[r][c].isMine) {
            let adjacentMines = 0;
            for (let dr = -1; dr <= 1; dr++) {
              for (let dc = -1; dc <= 1; dc++) {
                if (dr === 0 && dc === 0) continue;
                const nr = r + dr;
                const nc = c + dc;
                if (
                  nr >= 0 &&
                  nr < rows &&
                  nc >= 0 &&
                  nc < cols &&
                  grid[nr][nc].isMine
                ) {
                  adjacentMines++;
                }
              }
            }
            grid[r][c].adjacentMines = adjacentMines;
          }
        }
      }
      this.boardData = grid;
      this.saveState();
    },

    revealCell(rowIndex: number, colIndex: number) {
      if (this.gameOver) return;

      const cell = this.boardData[rowIndex][colIndex];
      if (!cell || cell.isRevealed || cell.isFlagged) return;

      cell.isRevealed = true;

      if (cell.isMine) {
        this.gameOver = true;
        this.lost = true;
        // Reveal all mines on loss
        for (let r = 0; r < this.rows; r++) {
          for (let c = 0; c < this.cols; c++) {
            if (this.boardData[r][c].isMine) this.boardData[r][c].isRevealed = true;
          }
        }
        return;
      }

      if (cell.adjacentMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = rowIndex + dr;
            const nc = colIndex + dc;
            this.revealCell(nr, nc); // Recursive call
          }
        }
      }
      this.checkWin();
      this.saveState();
    },

    handleCellFlagged(rowIndex: number, colIndex: number) {
      if (this.gameOver) return;

      const cell = this.boardData[rowIndex][colIndex];
      if (cell.isRevealed) return;

      cell.isFlagged = !cell.isFlagged;
      this.minesLeft += cell.isFlagged ? -1 : 1;
      this.checkWin();
      this.saveState();
    },

    checkWin() {
      let allNonMinesRevealed = true;
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const cell = this.boardData[r][c];
          if (!cell.isMine && !cell.isRevealed) {
            allNonMinesRevealed = false;
            break;
          }
        }
        if (!allNonMinesRevealed) break;
      }

      if (allNonMinesRevealed) {
        this.gameOver = true;
        this.won = true;
      }
      this.saveState();
    },
    
    // This action will be called directly from the component to start a new game
    startNewGame(rows: number = 10, cols: number = 10, mines: number = 15) {
      this.initializeBoard(rows, cols, mines);
      this.saveState(); // Save state after starting a new game
    },

    saveState() {
      if (process.client) {
        localStorage.setItem('minesweeper', JSON.stringify({
          boardData: this.boardData,
          gameOver: this.gameOver,
          won: this.won,
          lost: this.lost,
          minesLeft: this.minesLeft,
          cols: this.cols,
          rows: this.rows,
          mines: this.mines,
        }));
      }
    },

    loadState() {
      if (process.client) {
        const savedState = localStorage.getItem('minesweeper');
        if (savedState) {
          const parsedState = JSON.parse(savedState);
          this.boardData = parsedState.boardData;
          this.gameOver = parsedState.gameOver;
          this.won = parsedState.won;
          this.lost = parsedState.lost;
          this.minesLeft = parsedState.minesLeft;
          this.cols = parsedState.cols;
          this.rows = parsedState.rows;
          this.mines = parsedState.mines;
        }
      }
    }
  },
})
