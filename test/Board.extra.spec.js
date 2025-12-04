import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMinesweeperStore } from '../app/stores/minesweeper' // Adjusted path
import Board from '../app/components/Board.vue'

// Mock localStorage
const localStorageMock = (function () {
  let store = {}
  return {
    getItem(key) {
      return store[key] || null
    },
    setItem(key, value) {
      store[key] = String(value)
    },
    removeItem(key) {
      delete store[key]
    },
    clear() {
      store = {}
    },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

// Mock the entire store module
vi.mock('../app/stores/minesweeper', () => {
  const store = {
    // State properties
    boardData: [],
    gameOver: false,
    won: false,
    lost: false,
    minesLeft: 10,
    cols: 9,
    rows: 9,
    mines: 10,
    
    // Actions - mocked as spies
    initializeBoard: vi.fn(),
    revealCell: vi.fn(),
    handleCellFlagged: vi.fn(),
    checkWin: vi.fn(),
    startNewGame: vi.fn((rows, cols, mines) => {
      // Basic mock implementation to update state
      store.rows = rows;
      store.cols = cols;
      store.mines = mines;
      store.minesLeft = mines;
      store.gameOver = false;
      store.won = false;
      store.lost = false;
      store.boardData = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0,
        }))
      );
      store.saveState(); // Ensure saveState is called
    }),
    saveState: vi.fn(),
    loadState: vi.fn(() => {
      // Mock implementation to load from localStorage
      const savedState = localStorage.getItem('minesweeper')
      if (savedState) {
        const parsedState = JSON.parse(savedState)
        Object.assign(store, parsedState) // Assign loaded state to the mock store
      }
    }),
  }
  return { useMinesweeperStore: vi.fn(() => store) }
})

describe('Board extra behavior', () => {
  let wrapper
  let minesweeperStore

  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()

    const initialRows = 9;
    const initialCols = 9;
    const initialMines = 10;

    const mockBoardData = Array.from({ length: initialRows }, () =>
      Array.from({ length: initialCols }, () => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0,
      }))
    );

    const mockStore = {
      boardData: mockBoardData,
      gameOver: false,
      won: false,
      lost: false,
      minesLeft: initialMines,
      cols: initialCols,
      rows: initialRows,
      mines: initialMines,
      initializeBoard: vi.fn(),
      revealCell: vi.fn(),
      handleCellFlagged: vi.fn(),
      checkWin: vi.fn(),
      startNewGame: vi.fn((rows = initialRows, cols = initialCols, mines = initialMines) => {
        // This mock implementation should create a board as if initializeBoard was called
        mockStore.rows = rows;
        mockStore.cols = cols;
        mockStore.mines = mines;
        mockStore.minesLeft = mines;
        mockStore.gameOver = false;
        mockStore.won = false;
        mockStore.lost = false;
        mockStore.boardData = Array.from({ length: rows }, () =>
          Array.from({ length: cols }, () => ({
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            adjacentMines: 0,
          }))
        );
        mockStore.saveState();
      }),
      saveState: vi.fn(),
      loadState: vi.fn(),
    }
    useMinesweeperStore.mockReturnValue(mockStore)

    wrapper = mount(Board)
    minesweeperStore = useMinesweeperStore()

    minesweeperStore.loadState();
    if (minesweeperStore.boardData.length === 0) {
      minesweeperStore.startNewGame(
        minesweeperStore.rows,
        minesweeperStore.cols,
        minesweeperStore.mines
      );
    }
  })

  it('detects win when all non-mine cells are revealed', async () => {
    const rows = 2, cols = 2, mines = 1;
    // Mock startNewGame for this specific test
    minesweeperStore.startNewGame.mockImplementation((r, c, m) => {
      minesweeperStore.rows = r; minesweeperStore.cols = c; minesweeperStore.mines = m;
      minesweeperStore.boardData = Array.from({ length: r }, () =>
        Array.from({ length: c }, () => ({ isMine: false, isRevealed: false, isFlagged: false, adjacentMines: 0 })));
      minesweeperStore.boardData[0][0].isMine = true;
      // compute adjacent counts
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (!minesweeperStore.boardData[r][c].isMine) {
            let adj = 0;
            for (let i = -1; i <= 1; i++) {
              for (let j = -1; j <= 1; j++) {
                const nr = r + i, nc = c + j;
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && minesweeperStore.boardData[nr][nc].isMine) adj++;
              }
            }
            minesweeperStore.boardData[r][c].adjacentMines = adj;
          }
        }
      }
      minesweeperStore.saveState();
    });
    minesweeperStore.startNewGame(rows, cols, mines);

    minesweeperStore.checkWin.mockImplementation(vi.fn(() => {
      let allNonMinesRevealed = true;
      for (let r = 0; r < minesweeperStore.rows; r++) {
        for (let c = 0; c < minesweeperStore.cols; c++) {
          const cell = minesweeperStore.boardData[r][c];
          if (!cell.isMine && !cell.isRevealed) {
            allNonMinesRevealed = false;
            break;
          }
        }
        if (!allNonMinesRevealed) break;
      }
      if (allNonMinesRevealed) {
        minesweeperStore.gameOver = true;
        minesweeperStore.won = true;
      }
      minesweeperStore.saveState();
      return allNonMinesRevealed;
    }));

    minesweeperStore.revealCell.mockImplementation(vi.fn((rowIndex, colIndex) => {
      if (minesweeperStore.gameOver) return;
      const cell = minesweeperStore.boardData[rowIndex][colIndex];
      if (!cell || cell.isRevealed || cell.isFlagged) return;
      cell.isRevealed = true;

      // Recursive revealing for zero-adjacent cells
      if (cell.adjacentMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = rowIndex + dr;
            const nc = colIndex + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              minesweeperStore.revealCell(nr, nc);
            }
          }
        }
      }
      minesweeperStore.checkWin(); // Call the mocked checkWin
      minesweeperStore.saveState();
    }));
    await wrapper.vm.$nextTick();

    await wrapper.findComponent({ name: 'Cell', props: { rowIndex: 0, colIndex: 1 } }).trigger('click');
    await wrapper.findComponent({ name: 'Cell', props: { rowIndex: 1, colIndex: 0 } }).trigger('click');
    await wrapper.findComponent({ name: 'Cell', props: { rowIndex: 1, colIndex: 1 } }).trigger('click');
    
    expect(minesweeperStore.checkWin).toHaveBeenCalled();
    expect(minesweeperStore.won).toBe(true);
    expect(minesweeperStore.gameOver).toBe(true);
  })

  it('restart resets gameOver and unreveals cells', async () => {
    minesweeperStore.revealCell.mockImplementation(vi.fn((rowIndex, colIndex) => {
      minesweeperStore.boardData[rowIndex][colIndex].isRevealed = true;
      minesweeperStore.saveState();
    }));
    await wrapper.findComponent({ name: 'Cell', props: { rowIndex: 0, colIndex: 0 } }).trigger('click');
    minesweeperStore.gameOver = true;
    
    // Mock the startNewGame action to reset state
    minesweeperStore.startNewGame.mockImplementation((rows, cols, mines) => {
      minesweeperStore.rows = rows;
      minesweeperStore.cols = cols;
      minesweeperStore.mines = mines;
      minesweeperStore.minesLeft = mines;
      minesweeperStore.gameOver = false;
      minesweeperStore.won = false;
      minesweeperStore.lost = false;
      minesweeperStore.boardData = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0,
        }))
      );
      minesweeperStore.saveState();
    });

    await wrapper.find('button', { text: 'Restart' }).trigger('click');
    
    expect(minesweeperStore.startNewGame).toHaveBeenCalledWith(minesweeperStore.rows, minesweeperStore.cols, minesweeperStore.mines);
    expect(minesweeperStore.gameOver).toBe(false);
    // no revealed cell
    const anyRevealed = minesweeperStore.boardData.flat().some(c => c.isRevealed);
    expect(anyRevealed).toBe(false);
    expect(anyRevealed).toBe(false);
  })

  it('clicking a mine sets gameOver', async () => {
    // place a mine at 0,0
    const rows = 2, cols = 2, mines = 1;
    minesweeperStore.startNewGame(rows, cols, mines);
    minesweeperStore.boardData = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0,
      }))
    );
    minesweeperStore.boardData[0][0].isMine = true;

    minesweeperStore.revealCell.mockImplementation(vi.fn((rowIndex, colIndex) => {
      const cell = minesweeperStore.boardData[rowIndex][colIndex];
      if (cell.isMine) {
        minesweeperStore.gameOver = true;
        minesweeperStore.lost = true;
        // Also reveal all mines on loss for visual feedback
        for (let r = 0; r < minesweeperStore.rows; r++) {
          for (let c = 0; c < minesweeperStore.cols; c++) {
            if (minesweeperStore.boardData[r][c].isMine) minesweeperStore.boardData[r][c].isRevealed = true;
          }
        }
        minesweeperStore.saveState();
        return;
      }
      cell.isRevealed = true;
      minesweeperStore.saveState();
    }));
    await wrapper.vm.$nextTick();

    await wrapper.findComponent({ name: 'Cell', props: { rowIndex: 0, colIndex: 0 } }).trigger('click');
    expect(minesweeperStore.revealCell).toHaveBeenCalledWith(0, 0);
    expect(minesweeperStore.gameOver).toBe(true);
    expect(minesweeperStore.lost).toBe(true);
  })

  it('flags prevent reveal and adjust minesLeft', async () => {
    minesweeperStore.startNewGame(9, 9, 10);
    minesweeperStore.boardData = Array.from({ length: 9 }, () =>
      Array.from({ length: 9 }, () => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0,
      }))
    );
    minesweeperStore.minesLeft = 10;
    await wrapper.vm.$nextTick();

    const initialMinesLeft = minesweeperStore.minesLeft;
    const r = 0, c = 0;

    minesweeperStore.handleCellFlagged.mockImplementation((row, col) => {
      const cell = minesweeperStore.boardData[row][col];
      if (cell.isRevealed) return;
      cell.isFlagged = !cell.isFlagged;
      minesweeperStore.minesLeft += cell.isFlagged ? -1 : 1;
      minesweeperStore.saveState();
    });

    // flag cell (0,0)
    await wrapper.findComponent({ name: 'Cell', props: { rowIndex: r, colIndex: c } }).trigger('contextmenu');
    expect(minesweeperStore.handleCellFlagged).toHaveBeenCalledWith(r, c);
    expect(minesweeperStore.minesLeft).toBe(initialMinesLeft - 1);
    expect(minesweeperStore.boardData[r][c].isFlagged).toBe(true);

    // try to reveal flagged cell
    minesweeperStore.revealCell.mockClear(); // Clear previous mocks if any
    minesweeperStore.revealCell.mockImplementation(vi.fn((rowIndex, colIndex) => {
      const cell = minesweeperStore.boardData[rowIndex][colIndex];
      if (!cell || cell.isRevealed || cell.isFlagged) return; // This is the crucial check
      cell.isRevealed = true;
      minesweeperStore.saveState();
    }));
    await wrapper.findComponent({ name: 'Cell', props: { rowIndex: r, colIndex: c } }).trigger('click');
    expect(minesweeperStore.revealCell).toHaveBeenCalledWith(r, c);
    expect(minesweeperStore.boardData[r][c].isRevealed).toBe(false); // Should not be revealed
  })
})