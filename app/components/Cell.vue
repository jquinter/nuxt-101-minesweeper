<template>
  <div
    class="cell"
    :class="{
      'revealed': cellData.isRevealed,
      'flagged': cellData.isFlagged,
      'mine': cellData.isMine
    }"
    @click="handleClick"
    @contextmenu.prevent="handleRightClick"
  >
    <span v-if="cellData.isRevealed && cellData.isMine">💣</span>
    <span v-if="cellData.isRevealed && cellData.adjacentMines > 0">{{ cellData.adjacentMines }}</span>
    <span v-if="cellData.isFlagged">🚩</span>
  </div>
</template>

<script>
export default {
  props: {
    cellData: {
      type: Object,
      required: true
    },
    rowIndex: {
      type: Number,
      required: true
    },
    colIndex: {
      type: Number,
      required: true
    }
  },
  methods: {
    handleClick() {
      this.$emit('cell-clicked', this.rowIndex, this.colIndex);
    },
    handleRightClick() {
      this.$emit('cell-flagged', this.rowIndex, this.colIndex);
    }
  }
}
</script>

<style scoped>
.cell {
  width: var(--cell-size, 16px);
  height: var(--cell-size, 16px);
  border: 1px solid black;
  text-align: center;
  font-size: 0.8em;
}
.revealed {
  background-color: lightgray;
}
.flagged {
  background-color: yellow;
}
.mine {
  background-color: red;
}
</style>