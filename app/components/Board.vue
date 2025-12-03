<template>
  <div class="board" :style="{ width: boardWidth + 'px', height: boardHeight + 'px' }">
    <div class="board-row" v-for="(row, rowIndex) in boardData" :key="rowIndex">
      <Cell
        v-for="(cell, colIndex) in row"
        :key="colIndex"
        :cell-data="cell"
        :row-index="rowIndex"
        :col-index="colIndex"
        @cell-clicked="handleCellClicked"
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
      boardWidth: 500,
      boardHeight: 400,
      rows: 10,
      cols: 10,
      mineCount: 15,
      boardData: [],
      minesLeft: 0,
      gameOver: false
    };
  },
  mounted() {
    this.initializeBoard();
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
      }
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
    }
  }
};
</script>

<style scoped>
.board {
  display: inline-block;
  border: 1px solid #e5e7eb;
  background: #fff;
}
.board-row {
  display: flex;
}
.status {
  margin-top: 8px;
  font-size: 0.9rem;
}
</style>