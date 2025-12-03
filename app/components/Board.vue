<template>
  <div class="board-container">
    <div class="controls">
      <label>
        Rows: <input type="number" min="2" v-model.number="inputRows" />
      </label>
      <label>
        Cols: <input type="number" min="2" v-model.number="inputCols" />
      </label>
      <label>
        Mines: <input type="number" min="1" v-model.number="inputMines" />
      </label>
      <button @click="startNewBoard">Start</button>
      <button @click="restart">Restart</button>
    </div>

    <div
      class="board"
      :style="{ '--cell-size': cellSize + 'px' }"
      role="grid"
    >
      <div class="board-row" v-for="(row, rowIndex) in boardData" :key="rowIndex">
      <Cell
        v-for="(cell, colIndex) in row"
        :key="colIndex"
        :cell-data="cell"
        :row-index="rowIndex"
        :col-index="colIndex"
        @cell-clicked="handleCellClicked"
        @cell-flagged="handleCellFlagged"
      />
    </div>
    <div class="status">
      <p>Mines Left: {{ minesLeft }}</p>
      <p v-if="gameOver">Game Over! </p>
    </div>
  </div>
</template>

<script>
import Cell from './Cell.vue';

export default {
  components: { Cell },
  data() {
    return {
      // UI inputs
      inputRows: 10,
      inputCols: 10,
      inputMines: 15,

      // internal board state
      rows: 10,
      cols: 10,
      mineCount: 15,
      boardData: [],
      minesLeft: 0,
      gameOver: false,

      // responsive cell size (px)
      cellSize: 24
    };
  },
  mounted() {
    this.startNewBoard();
    this.updateCellSize();
    window.addEventListener('resize', this.updateCellSize);
  },
  unmounted() {
    window.removeEventListener('resize', this.updateCellSize);
  },
  methods: {
    initializeBoard() {
      // Phase 1: create empty board
      this.boardData = [];
      for (let r = 0; r < this.rows; r++) {
        this.boardData[r] = [];
        for (let c = 0; c < this.cols; c++) {
          this.boardData[r][c] = {
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            adjacentMines: 0
          };
        }
      }

      // Phase 2: place mines
      let minesPlaced = 0;
      while (minesPlaced < this.mineCount) {
        const row = Math.floor(Math.random() * this.rows);
        const col = Math.floor(Math.random() * this.cols);
        if (!this.boardData[row][col].isMine) {
          this.boardData[row][col].isMine = true;
          minesPlaced++;
        }
      }

      // Phase 3: compute adjacent mine counts
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          if (this.boardData[row][col].isMine) continue;
          let adjacent = 0;
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              const nr = row + i;
              const nc = col + j;
              if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                if (this.boardData[nr][nc].isMine) adjacent++;
              }
            }
          }
          this.boardData[row][col].adjacentMines = adjacent;
        }
      }

      this.minesLeft = this.mineCount;
    },
    handleCellClicked(rowIndex, colIndex) {
      if (this.gameOver) return;
      const cell = this.boardData[rowIndex][colIndex];
      if (cell.isFlagged) return;

      if (cell.isMine) {
        this.gameOver = true;
      } else {
        this.revealCell(rowIndex, colIndex);
        this.checkWin();
      }
    },
    handleCellFlagged(rowIndex, colIndex) {
      if (this.gameOver) return;
      const cell = this.boardData[rowIndex][colIndex];
      if (cell.isRevealed) return;
      cell.isFlagged = !cell.isFlagged;
      // update minesLeft: assume flags represent mines left to find
      this.minesLeft += cell.isFlagged ? -1 : 1;
    },
    revealCell(rowIndex, colIndex) {
      if (this.gameOver) return;
      const cell = this.boardData[rowIndex][colIndex];
      if (cell.isRevealed) return;
      if (cell.isFlagged) return;

      cell.isRevealed = true;

      if (cell.adjacentMines === 0) {
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            const neighborRow = rowIndex + i;
            const neighborCol = colIndex + j;
            if (
              neighborRow >= 0 &&
              neighborRow < this.rows &&
              neighborCol >= 0 &&
              neighborCol < this.cols
            ) {
              this.revealCell(neighborRow, neighborCol);
            }
          }
        }
      }
      this.checkWin();
    },
    checkWin() {
      // If every non-mine cell is revealed, player wins
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const cell = this.boardData[r][c];
          if (!cell.isMine && !cell.isRevealed) return false;
        }
      }
      this.gameOver = true;
      return true;
    },
    restart() {
      this.gameOver = false;
      this.initializeBoard();
      this.updateCellSize();
    },
    startNewBoard() {
      // sanitize inputs
      this.rows = Math.max(2, Math.floor(this.inputRows));
      this.cols = Math.max(2, Math.floor(this.inputCols));
      const maxMines = Math.max(1, this.rows * this.cols - 1);
      this.mineCount = Math.min(Math.max(1, Math.floor(this.inputMines)), maxMines);
      this.initializeBoard();
      this.updateCellSize();
    },
    updateCellSize() {
      // compute an appropriate cell size based on viewport width
      try {
        const vw = Math.min(window.innerWidth, 800);
        // leave some padding for controls and margins
        const usable = Math.max(120, vw - 48);
        const size = Math.floor(usable / this.cols);
        // clamp size between 12 and 40
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
.board {
  display: inline-block;
  border: 1px solid #e5e7eb;
  background: #fff;
  padding: 8px;
}
.board-row {
  display: flex;
}
.status {
  margin-top: 8px;
  font-size: 0.9rem;
}
</style>

<style scoped>
.controls {
  margin-bottom: 8px;
}
.controls button {
  padding: 6px 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background: #f8fafc;
  cursor: pointer;
}
</style>