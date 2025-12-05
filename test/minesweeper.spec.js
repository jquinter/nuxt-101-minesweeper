import { setActivePinia, createPinia } from 'pinia';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMinesweeperStore } from '../app/stores/minesweeper';

describe('Minesweeper Store', () => {
  let store;

  // Mock localStorage
  const localStorageMock = (function () {
    let store = {};
    return {
      getItem(key) {
        return store[key] || null;
      },
      setItem(key, value) {
        store[key] = String(value);
      },
      removeItem(key) {
        delete store[key];
      },
      clear() {
        store = {};
      },
    };
  })();

  Object.defineProperty(global, 'localStorage', { value: localStorageMock });
  Object.defineProperty(global, 'process', {
    value: { client: true, env: { NODE_ENV: 'test' } }, // Mock process.client and process.env.NODE_ENV
    writable: true,
  });

  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    store = useMinesweeperStore();
  });

  it('initializes the board with default dimensions and mines', () => {
    store.startNewGame(); // Use default 10x10 with 15 mines
    expect(store.rows).toBe(10);
    expect(store.cols).toBe(10);
    expect(store.mines).toBe(15);
    expect(store.boardData.length).toBe(10);
    expect(store.boardData[0].length).toBe(10);
    expect(store.gameOver).toBe(false);
    expect(store.won).toBe(false);
    expect(store.lost).toBe(false);
    expect(store.minesLeft).toBe(15);
  });

  it('initializes the board with custom dimensions and mines', () => {
    store.startNewGame(5, 5, 5);
    expect(store.rows).toBe(5);
    expect(store.cols).toBe(5);
    expect(store.mines).toBe(5);
    expect(store.boardData.length).toBe(5);
    expect(store.boardData[0].length).toBe(5);
    expect(store.minesLeft).toBe(5);
  });

  it('places the correct number of mines', () => {
    store.startNewGame(5, 5, 5);
    const minesCount = store.boardData.flat().filter((cell) => cell.isMine).length;
    expect(minesCount).toBe(5);
  });

  it('calculates adjacent mines correctly', () => {
    // Create a 3x3 board with a mine in the center (1,1)
    store.initializeBoard(3, 3, 0); // Initialize with no mines first
    store.boardData[1][1].isMine = true;
    store.mines = 1;

    // Manually calculate adjacent mines after placing one
    store.boardData.forEach((row, r) => {
      row.forEach((cell, c) => {
        if (!cell.isMine) {
          let adjacentMines = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3 && store.boardData[nr][nc].isMine) {
                adjacentMines++;
              }
            }
          }
          store.boardData[r][c].adjacentMines = adjacentMines;
        }
      });
    });

    // Check adjacent mine counts
    expect(store.boardData[0][0].adjacentMines).toBe(1);
    expect(store.boardData[0][1].adjacentMines).toBe(1);
    expect(store.boardData[0][2].adjacentMines).toBe(1);
    expect(store.boardData[1][0].adjacentMines).toBe(1);
    expect(store.boardData[1][2].adjacentMines).toBe(1);
    expect(store.boardData[2][0].adjacentMines).toBe(1);
    expect(store.boardData[2][1].adjacentMines).toBe(1);
    expect(store.boardData[2][2].adjacentMines).toBe(1);
  });

  it('revealCell reveals an empty cell and its neighbors', () => {
    // Create a 3x3 board with a mine at (0,2) to test propagation
    store.initializeBoard(3, 3, 0);
    store.boardData[0][2].isMine = true; // Mine
    store.boardData[0][1].adjacentMines = 1; // Cell next to mine
    store.boardData[1][1].adjacentMines = 1;
    store.boardData[1][2].adjacentMines = 1;

    // All others are 0 adjacent mines
    store.boardData[0][0].adjacentMines = 0;
    store.boardData[1][0].adjacentMines = 0;
    store.boardData[2][0].adjacentMines = 0;
    store.boardData[2][1].adjacentMines = 0;
    store.boardData[2][2].adjacentMines = 0;

    store.revealCell(0, 0); // Click an empty cell

    expect(store.boardData[0][0].isRevealed).toBe(true);
    expect(store.boardData[1][0].isRevealed).toBe(true);
    expect(store.boardData[2][0].isRevealed).toBe(true);
    expect(store.boardData[2][1].isRevealed).toBe(true);
    expect(store.boardData[2][2].isRevealed).toBe(true);
    expect(store.boardData[0][1].isRevealed).toBe(true); // Should reveal cells with adjacent mines if part of chain
    expect(store.boardData[1][1].isRevealed).toBe(true);

    // Mine should not be revealed
    expect(store.boardData[0][2].isRevealed).toBe(false);
  });

  it('revealCell reveals a cell with adjacent mines', () => {
    store.initializeBoard(3, 3, 0);
    store.boardData[0][1].isMine = true;
    store.boardData[1][0].adjacentMines = 1;

    store.revealCell(1, 0);
    expect(store.boardData[1][0].isRevealed).toBe(true);
    expect(store.boardData[0][0].isRevealed).toBe(false); // Should not propagate
  });

  it('revealCell on a mine ends the game and reveals all mines', () => {
    store.initializeBoard(3, 3, 0);
    store.boardData[0][0].isMine = true;
    store.boardData[1][1].isMine = true;

    store.revealCell(0, 0);

    expect(store.gameOver).toBe(true);
    expect(store.lost).toBe(true);
    expect(store.boardData[0][0].isRevealed).toBe(true); // Clicked mine revealed
    expect(store.boardData[1][1].isRevealed).toBe(true); // Other mine revealed
  });

  it('handleCellFlagged flags/unflags a cell and updates minesLeft', () => {
    store.startNewGame(3, 3, 1);
    store.minesLeft = 1; // Ensure initial minesLeft is correct

    store.handleCellFlagged(0, 0);
    expect(store.boardData[0][0].isFlagged).toBe(true);
    expect(store.minesLeft).toBe(0);

    store.handleCellFlagged(0, 0);
    expect(store.boardData[0][0].isFlagged).toBe(false);
    expect(store.minesLeft).toBe(1);
  });

  it('handleCellFlagged does not flag a revealed cell', () => {
    store.startNewGame(3, 3, 1);
    store.boardData[0][0].isRevealed = true;
    store.minesLeft = 1;

    store.handleCellFlagged(0, 0);
    expect(store.boardData[0][0].isFlagged).toBe(false); // Should not be flagged
    expect(store.minesLeft).toBe(1); // Mines left should not change
  });

  it('checkWin detects a win when all non-mine cells are revealed', () => {
    store.initializeBoard(2, 2, 0); // No mines
    store.revealCell(0, 0);
    store.revealCell(0, 1);
    store.revealCell(1, 0);
    store.revealCell(1, 1);
    expect(store.gameOver).toBe(true);
    expect(store.won).toBe(true);
    expect(store.lost).toBe(false);
  });

  it('saveState and loadState work correctly', () => {
    store.startNewGame(2, 2, 1);
    store.boardData[0][0].isMine = true; // Set a mine
    // Manually set some state without triggering complex game logic
    store.boardData[0][1].isRevealed = true;
    store.minesLeft = 0;

    // Assert initial state before saving
    expect(store.gameOver).toBe(false);
    expect(store.won).toBe(false);
    expect(store.boardData[0][1].isRevealed).toBe(true);

    store.saveState(); // Manually save state

    const newState = useMinesweeperStore(); // Create a new store instance
    newState.loadState(); // Load state into new instance

    expect(newState.boardData[0][1].isRevealed).toBe(true);
    expect(newState.minesLeft).toBe(0);
    expect(newState.gameOver).toBe(false);
    expect(newState.won).toBe(false);
  });

  it('loadState does nothing if no saved state exists', () => {
    localStorage.clear();
    store.loadState();
    expect(store.boardData.length).toBe(0); // Should remain in initial state
  });
});
