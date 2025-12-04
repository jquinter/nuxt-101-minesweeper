<template>
  <div class="board-container">
    <div class="controls">
      <label>Rows: <input type="number" min="2" v-model.number="inputRows" /></label>
      <label>Cols: <input type="number" min="2" v-model.number="inputCols" /></label>
      <label>Mines: <input type="number" min="1" v-model.number="inputMines" /></label>
      <button @click="startNewBoard">Start</button>
      <button @click="restart">Restart</button>
    </div>

    <div class="board" :style="{ '--cell-size': cellSize + 'px', '--cols': cols }">
      <Cell
        v-for="item in cellsList"
        :key="item.row + '-' + item.col"
        :cellData="item.cell"
        :rowIndex="item.row"
        :colIndex="item.col"
        :showMines="debugMode"
        @cell-clicked="handleCellClicked"
        @cell-flagged="handleCellFlagged"
      />
    </div>

    <div class="status">Mines left: {{ minesLeft }}</div>

    <div v-if="won || lost" class="overlay" :class="{ win: won, lose: lost }">
      <div class="overlay-content">
        <h2>{{ won ? 'You Win!' : 'You Lose' }}</h2>
        <button @click="restart">Play Again</button>
      </div>
    </div>
  </div>
</template>

<script>
import Cell from './Cell.vue';

export default {
  name: 'Board',
  components: { Cell },
  data() {
    const defaultRows = 9;
    const defaultCols = 9;
    const defaultMines = 10;

    return {
      inputRows: defaultRows,
      inputCols: defaultCols,
      inputMines: defaultMines,
      rows: defaultRows,
      cols: defaultCols,
      mineCount: defaultMines,
      boardData: [],
      minesLeft: defaultMines,
      gameOver: false,
      won: false,
      lost: false,
      debugMode: false,
      cellSize: 24
    };
  },
  mounted() {
    this.startNewBoard();
    this.updateCellSize();
    window.addEventListener('resize', this.updateCellSize);
    try {
      const params = new URLSearchParams(window.location.search);
      this.debugMode = params.has('DEBUG');
    } catch (e) {
      this.debugMode = false;
    }
  },
  unmounted() {
    window.removeEventListener('resize', this.updateCellSize);
  },
  computed: {
    cellsList() {
      const list = [];
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const cell = (this.boardData[r] && this.boardData[r][c])
            ? this.boardData[r][c]
            : { isRevealed: false, isMine: false, isFlagged: false, adjacentMines: 0 };
          list.push({ row: r, col: c, cell });
        }
      }
      return list;
    }
  },
  methods: {
    initializeBoard() {
      const grid = [];
      for (let r = 0; r < this.rows; r++) {
        const row = [];
        for (let c = 0; c < this.cols; c++) {
          row.push({ isMine: false, isRevealed: false, isFlagged: false, adjacentMines: 0 });
        }
        grid.push(row);
      }
      let placed = 0;
      while (placed < this.mineCount) {
        const r = Math.floor(Math.random() * this.rows);
        const c = Math.floor(Math.random() * this.cols);
        if (!grid[r][c].isMine) {
          grid[r][c].isMine = true;
          placed++;
        }
      }
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (grid[r][c].isMine) continue;
          let count = 0;
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr;
              const nc = c + dc;
              if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                if (grid[nr][nc].isMine) count++;
              }
            }
          }
          grid[r][c].adjacentMines = count;
        }
      }
      this.boardData = grid;
      this.minesLeft = this.mineCount;
      this.gameOver = false;
      this.won = false;
      this.lost = false;
    },
    handleCellClicked(rowIndex, colIndex) {
      if (this.gameOver) return;
      const cell = this.boardData[rowIndex][colIndex];
      if (cell.isFlagged) return;
      if (cell.isMine) {
        this.gameOver = true;
        this.lost = true;
        this.won = false;
        for (let r = 0; r < this.rows; r++) {
          for (let c = 0; c < this.cols; c++) {
            if (this.boardData[r][c].isMine) this.boardData[r][c].isRevealed = true;
          }
        }
      } else {
        this.revealCell(rowIndex, colIndex);
        if (this.checkWin()) {
          this.won = true;
          this.lost = false;
        }
      }
    },
    handleCellFlagged(rowIndex, colIndex) {
      if (this.gameOver) return;
      const cell = this.boardData[rowIndex][colIndex];
      if (cell.isRevealed) return;
      cell.isFlagged = !cell.isFlagged;
      this.minesLeft += cell.isFlagged ? -1 : 1;
    },
    revealCell(rowIndex, colIndex) {
      if (this.gameOver) return;
      const cell = this.boardData[rowIndex][colIndex];
      if (!cell || cell.isRevealed || cell.isFlagged) return;
      cell.isRevealed = true;
      if (cell.adjacentMines === 0) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = rowIndex + dr;
            const nc = colIndex + dc;
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
              this.revealCell(nr, nc);
            }
          }
        }
      }
    },
    checkWin() {
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const cell = this.boardData[r][c];
          if (!cell.isMine && !cell.isRevealed) return false;
        }
      }
      this.gameOver = true;
      this.won = true;
      this.lost = false;
      return true;
    },
    restart() {
      this.gameOver = false;
      this.won = false;
      this.lost = false;
      this.initializeBoard();
      this.updateCellSize();
    },
    startNewBoard() {
      this.rows = Math.max(2, Math.floor(this.inputRows));
      this.cols = Math.max(2, Math.floor(this.inputCols));
      const maxMines = Math.max(1, this.rows * this.cols - 1);
      this.mineCount = Math.min(Math.max(1, Math.floor(this.inputMines)), maxMines);
      this.initializeBoard();
      this.updateCellSize();
    },
    updateCellSize() {
      try {
        const vw = Math.min(window.innerWidth, 800);
        const usable = Math.max(120, vw - 48);
        const size = Math.floor(usable / this.cols);
        this.cellSize = Math.max(12, Math.min(40, size));
      } catch (e) {
        this.cellSize = 24;
      }
    }
  }
};
</script>

<style scoped>
.board-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
}
.controls {
  margin-bottom: 8px;
  display: flex;
  gap: 8px;
  align-items: center;
}
.controls label { font-size: 0.9rem; }
.controls input { width: 60px; }
.controls button {
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background: #f8fafc;
  cursor: pointer;
}
.board {
  display: grid;
  grid-template-columns: repeat(var(--cols), var(--cell-size));
  gap: 0;
  border: 1px solid #e5e7eb;
  background: #fff;
  padding: 8px;
}
.status { margin-top: 8px; font-size: 0.9rem; }
.overlay {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.4);
}
.overlay-content {
  background: white;
  padding: 20px 28px;
  border-radius: 8px;
  text-align: center;
}
.overlay.win .overlay-content { border: 3px solid #16a34a; }
.overlay.lose .overlay-content { border: 3px solid #dc2626; }
</style>
