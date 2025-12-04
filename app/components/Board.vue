<template>
  <div class="board-container">
    <div class="controls">
      <label>Rows: <input type="number" min="2" v-model.number="inputRows" /></label>
      <label>Cols: <input type="number" min="2" v-model.number="inputCols" /></label>
      <label>Mines: <input type="number" min="1" v-model.number="inputMines" /></label>
      <button @click="startNewBoard">Start</button>
      <button @click="restart">Restart</button>
    </div>

    <div class="board" :style="{ '--cell-size': cellSize + 'px', '--cols': minesweeperStore.cols }">
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

    <div class="status">Mines left: {{ minesweeperStore.minesLeft }}</div>

    <div v-if="minesweeperStore.won || minesweeperStore.lost" class="overlay" :class="{ win: minesweeperStore.won, lose: minesweeperStore.lost }">
      <div class="overlay-content">
        <h2>{{ minesweeperStore.won ? 'You Win!' : 'You Lose' }}</h2>
        <button @click="restart">Play Again</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { useMinesweeperStore } from '../stores/minesweeper';
import Cell from './Cell.vue';

const minesweeperStore = useMinesweeperStore();

const inputRows = ref(minesweeperStore.rows || 9);
const inputCols = ref(minesweeperStore.cols || 9);
const inputMines = ref(minesweeperStore.mines || 10);
const cellSize = ref(24);
const debugMode = ref(false);

const startNewBoard = () => {
  const rows = Math.max(2, Math.floor(inputRows.value));
  const cols = Math.max(2, Math.floor(inputCols.value));
  const maxMines = Math.max(1, rows * cols - 1);
  const mines = Math.min(Math.max(1, Math.floor(inputMines.value)), maxMines);
  minesweeperStore.startNewGame(rows, cols, mines);
  updateCellSize();
};

const restart = () => {
  minesweeperStore.startNewGame(minesweeperStore.rows, minesweeperStore.cols, minesweeperStore.mines);
  updateCellSize();
};

const handleCellClicked = (rowIndex, colIndex) => {
  minesweeperStore.revealCell(rowIndex, colIndex);
};

const handleCellFlagged = (rowIndex, colIndex) => {
  minesweeperStore.handleCellFlagged(rowIndex, colIndex);
};

const cellsList = computed(() => {
  const list = [];
  const rows = minesweeperStore.rows;
  const cols = minesweeperStore.cols;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = (minesweeperStore.boardData[r] && minesweeperStore.boardData[r][c])
        ? minesweeperStore.boardData[r][c]
        : { isRevealed: false, isMine: false, isFlagged: false, adjacentMines: 0 };
      list.push({ row: r, col: c, cell });
    }
  }
  return list;
});

const updateCellSize = () => {
  try {
    const vw = Math.min(window.innerWidth, 800);
    const usable = Math.max(120, vw - 48);
    const size = Math.floor(usable / minesweeperStore.cols);
    cellSize.value = Math.max(12, Math.min(40, size));
  } catch (e) {
    cellSize.value = 24;
  }
};

onMounted(() => {
  minesweeperStore.loadState(); // Attempt to load state
  if (minesweeperStore.boardData.length === 0) { // If no state was loaded or it was empty
    minesweeperStore.startNewGame(inputRows.value, inputCols.value, inputMines.value);
  }
  updateCellSize();
  window.addEventListener('resize', updateCellSize);
  try {
    const params = new URLSearchParams(window.location.search);
    debugMode.value = params.has('DEBUG');
  } catch (e) {
    debugMode.value = false;
  }
});

onUnmounted(() => {
  window.removeEventListener('resize', updateCellSize);
});
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
