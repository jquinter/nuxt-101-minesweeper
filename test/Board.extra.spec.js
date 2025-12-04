import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import Board from '../app/components/Board.vue'

describe('Board extra behavior', () => {
  let wrapper
  beforeEach(() => {
    wrapper = mount(Board)
    wrapper.vm.startNewBoard()
  })

  it('detects win when all non-mine cells are revealed', () => {
    // small deterministic board: make 2x2 with 1 mine
    wrapper.vm.rows = 2
    wrapper.vm.cols = 2
    wrapper.vm.boardData = []
    for (let r = 0; r < 2; r++) {
      wrapper.vm.boardData[r] = []
      for (let c = 0; c < 2; c++) {
        wrapper.vm.boardData[r][c] = { isMine: false, isRevealed: false, isFlagged: false, adjacentMines: 0 }
      }
    }
    wrapper.vm.boardData[0][0].isMine = true
    // compute adjacent
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        if (!wrapper.vm.boardData[r][c].isMine) {
          let adj = 0
          for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
            const nr = r + i, nc = c + j
            if (nr >= 0 && nr < 2 && nc >= 0 && nc < 2 && wrapper.vm.boardData[nr][nc].isMine) adj++
          }
          wrapper.vm.boardData[r][c].adjacentMines = adj
        }
      }
    }
    // reveal all non-mine cells
    wrapper.vm.revealCell(0,1)
    wrapper.vm.revealCell(1,0)
    wrapper.vm.revealCell(1,1)
    expect(wrapper.vm.checkWin()).toBe(true)
    expect(wrapper.vm.gameOver).toBe(true)
  })

  it('restart resets gameOver and unreveals cells', () => {
    wrapper.vm.revealCell(0,0)
    wrapper.vm.gameOver = true
    wrapper.vm.restart()
    expect(wrapper.vm.gameOver).toBe(false)
    // no revealed cell
    const anyRevealed = wrapper.vm.boardData.flat().some(c => c.isRevealed)
    expect(anyRevealed).toBe(false)
  })

  it('clicking a mine sets gameOver', () => {
    // place a mine at 0,0
    wrapper.vm.rows = 2
    wrapper.vm.cols = 2
    wrapper.vm.boardData = []
    for (let r = 0; r < 2; r++) {
      wrapper.vm.boardData[r] = []
      for (let c = 0; c < 2; c++) {
        wrapper.vm.boardData[r][c] = { isMine: false, isRevealed: false, isFlagged: false, adjacentMines: 0 }
      }
    }
    wrapper.vm.boardData[0][0].isMine = true
    wrapper.vm.handleCellClicked(0,0)
    expect(wrapper.vm.gameOver).toBe(true)
  })

  it('flags prevent reveal and adjust minesLeft', () => {
    wrapper.vm.startNewBoard()
    const before = wrapper.vm.minesLeft
    // flag cell (0,0)
    wrapper.vm.handleCellFlagged(0,0)
    expect(wrapper.vm.minesLeft).toBe(before - 1)
    // try to reveal flagged cell
    wrapper.vm.handleCellClicked(0,0)
    expect(wrapper.vm.boardData[0][0].isRevealed).toBe(false)
  })
})
