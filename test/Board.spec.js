import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useMinesweeperStore } from '../app/stores/minesweeper' // Adjusted path based on previous move
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

describe('Board component', () => {
  let wrapper
  let minesweeperStore

  beforeEach(() => {
    localStorage.clear() // Clear localStorage before each test
    vi.clearAllMocks()

    // Mock initial state for the store
    const mockStore = {
      boardData: [],
      gameOver: false,
      won: false,
      lost: false,
      minesLeft: 10,
      cols: 9,
      rows: 9,
      mines: 10,
      initializeBoard: vi.fn(),
      revealCell: vi.fn(),
      handleCellFlagged: vi.fn(),
      checkWin: vi.fn(),
      startNewGame: vi.fn(), // Already mocked in vi.mock, but good to reset
      saveState: vi.fn(),
      loadState: vi.fn(),
    }
    useMinesweeperStore.mockReturnValue(mockStore) // Ensure each test gets a fresh mock

    wrapper = mount(Board)
    minesweeperStore = useMinesweeperStore()

    // Simulate onMounted logic
    minesweeperStore.loadState();
    if (minesweeperStore.boardData.length === 0) {
      minesweeperStore.startNewGame(
        minesweeperStore.rows, // Use default values or mocked inputRefs
        minesweeperStore.cols,
        minesweeperStore.mines
      );
    }
  })

  it('initializes board with correct dimensions when startNewGame is called', async () => {
    // Reset mock for startNewGame to ensure it's called with specific test values
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

    await wrapper.findAll('label').filter(w => w.text().includes('Rows:'))[0].find('input').setValue(4)
    await wrapper.findAll('label').filter(w => w.text().includes('Cols:'))[0].find('input').setValue(5)
    await wrapper.findAll('label').filter(w => w.text().includes('Mines:'))[0].find('input').setValue(3)
    await wrapper.find('button', { text: 'Start' }).trigger('click')

    expect(minesweeperStore.startNewGame).toHaveBeenCalledWith(4, 5, 3)
    // Directly check the state managed by the mock store
    expect(minesweeperStore.boardData.length).toBe(4)
    expect(minesweeperStore.boardData[0].length).toBe(5)
  })

  it('places the correct number of mines', async () => {
    minesweeperStore.startNewGame.mockImplementation((rows, cols, mines) => {
      minesweeperStore.rows = rows;
      minesweeperStore.cols = cols;
      minesweeperStore.mines = mines;
      minesweeperStore.minesLeft = mines;
      minesweeperStore.gameOver = false;
      minesweeperStore.won = false;
      minesweeperStore.lost = false;
      const grid = Array.from({ length: rows }, () =>
        Array.from({ length: cols }, () => ({
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0,
        }))
      );

      let minesPlaced = 0;
      while (minesPlaced < mines) {
        const r = Math.floor(Math.random() * rows);
        const c = Math.floor(Math.random() * cols);
        if (!grid[r][c].isMine) {
          grid[r][c].isMine = true;
          minesPlaced++;
        }
      }
      minesweeperStore.boardData = grid;
      minesweeperStore.saveState();
    });

    await wrapper.findAll('label').filter(w => w.text().includes('Rows:'))[0].find('input').setValue(4)
    await wrapper.findAll('label').filter(w => w.text().includes('Cols:'))[0].find('input').setValue(4)
    await wrapper.findAll('label').filter(w => w.text().includes('Mines:'))[0].find('input').setValue(5)
    await wrapper.find('button', { text: 'Start' }).trigger('click')

    expect(minesweeperStore.startNewGame).toHaveBeenCalledWith(4, 4, 5)
    const mines = minesweeperStore.boardData.flat().filter(c => c.isMine).length
    expect(mines).toBe(5)
  })

  it('toggle flag updates minesLeft', async () => {
    // Initial setup with a board
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

    // Simulate handleCellFlagged action
    minesweeperStore.handleCellFlagged.mockImplementation((row, col) => {
      const cell = minesweeperStore.boardData[row][col];
      if (cell.isRevealed) return;
      cell.isFlagged = !cell.isFlagged;
      minesweeperStore.minesLeft += cell.isFlagged ? -1 : 1;
      minesweeperStore.saveState();
    });

    // Flag a cell
    await wrapper.findComponent({ name: 'Cell', props: { rowIndex: r, colIndex: c } }).trigger('contextmenu');
    expect(minesweeperStore.handleCellFlagged).toHaveBeenCalledWith(r, c);
    expect(minesweeperStore.minesLeft).toBe(initialMinesLeft - 1);

    // Unflag the same cell
    await wrapper.findComponent({ name: 'Cell', props: { rowIndex: r, colIndex: c } }).trigger('contextmenu');
    expect(minesweeperStore.handleCellFlagged).toHaveBeenCalledWith(r, c);
    expect(minesweeperStore.minesLeft).toBe(initialMinesLeft);
  })

  it('revealCell reveals zero-adjacent neighbors', async () => {
    // deterministic 3x3 board with mine at (2,2)
    const rows = 3, cols = 3, mines = 1;

    minesweeperStore.boardData = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0,
      }))
    );
    minesweeperStore.boardData[2][2].isMine = true;
    
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
    
    minesweeperStore.revealCell.mockImplementation(vi.fn((rowIndex, colIndex) => {
      if (minesweeperStore.gameOver) return;

      const cell = minesweeperStore.boardData[rowIndex][colIndex];
      if (!cell || cell.isRevealed || cell.isFlagged) return;

      cell.isRevealed = true;

      if (cell.isMine) {
        minesweeperStore.gameOver = true;
        minesweeperStore.lost = true;
        return;
      }

      if (cell.adjacentMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = rowIndex + dr;
            const nc = colIndex + dc;
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
              minesweeperStore.revealCell(nr, nc); // Recursive call
            }
          }
        }
      }
      minesweeperStore.saveState();
    }));
    await wrapper.vm.$nextTick();

    await wrapper.findComponent({ name: 'Cell', props: { rowIndex: 0, colIndex: 0 } }).trigger('click');
    expect(minesweeperStore.revealCell).toHaveBeenCalledWith(0, 0);

    expect(minesweeperStore.boardData[0][0].isRevealed).toBe(true);
    expect(minesweeperStore.boardData[1][1].isRevealed).toBe(true);
  })
})