<template>
  <div
    class="cell"
    :class="{
      'revealed': cellData.isRevealed,
      'flagged': cellData.isFlagged,
      'mine': cellData.isMine && (cellData.isRevealed || showMines)
    }"
    @click="handleClick"
    @contextmenu.prevent="handleRightClick"
    @touchstart.passive="onTouchStart"
    @touchend.prevent="onTouchEnd"
    @touchcancel.prevent="onTouchCancel"
  >
    <span v-if="(cellData.isRevealed || showMines) && cellData.isMine">💣</span>
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
    showMines: {
      type: Boolean,
      default: false
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
    ,
    onTouchStart(e) {
      // start long-press timer to toggle flag on long press
      this._longPress = false;
      if (this._pressTimer) clearTimeout(this._pressTimer);
      this._pressTimer = setTimeout(() => {
        this._longPress = true;
        this.handleRightClick();
      }, 600);
    },
    onTouchEnd(e) {
      if (this._pressTimer) {
        clearTimeout(this._pressTimer);
        this._pressTimer = null;
      }
      // if it was a long press we already handled flagging
      if (this._longPress) {
        this._longPress = false;
        return;
      }
      // treat as a normal tap
      this.handleClick();
    },
    onTouchCancel(e) {
      if (this._pressTimer) {
        clearTimeout(this._pressTimer);
        this._pressTimer = null;
      }
      this._longPress = false;
    }
  }
}
</script>

<style scoped>
.cell {
  width: var(--cell-size, 16px);
  height: var(--cell-size, 16px);
  border: 1px solid #444;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  font-size: calc(var(--cell-size) * 0.55);
  line-height: 1;
  user-select: none;
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