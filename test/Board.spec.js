import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach } from 'vitest'
import Board from '../app/components/Board.vue'

describe('Board component', () => {
  let wrapper

  beforeEach(() => {
    wrapper = mount(Board)
  })

  it('initializes board with correct dimensions when startNewBoard is called', () => {
    wrapper.vm.inputRows = 4
    wrapper.vm.inputCols = 5
    wrapper.vm.inputMines = 3
    wrapper.vm.startNewBoard()
    expect(wrapper.vm.boardData.length).toBe(4)
    expect(wrapper.vm.boardData[0].length).toBe(5)
  })

  it('places the correct number of mines', () => {
    wrapper.vm.inputRows = 4
    wrapper.vm.inputCols = 4
    wrapper.vm.inputMines = 5
    wrapper.vm.startNewBoard()
    const mines = wrapper.vm.boardData.flat().filter(c => c.isMine).length
    expect(mines).toBe(wrapper.vm.mineCount)
  })

  it('toggle flag updates minesLeft', () => {
    wrapper.vm.startNewBoard()
    const r = 0, c = 0
    const before = wrapper.vm.minesLeft
    wrapper.vm.handleCellFlagged(r, c)
    expect(wrapper.vm.minesLeft).toBe(before - 1)
    wrapper.vm.handleCellFlagged(r, c)
    expect(wrapper.vm.minesLeft).toBe(before)
  })

  it('revealCell reveals zero-adjacent neighbors', () => {
    // deterministic 3x3 board with mine at (2,2)
    wrapper.vm.rows = 3
    wrapper.vm.cols = 3
    wrapper.vm.boardData = []
    for (let r = 0; r < 3; r++) {
      wrapper.vm.boardData[r] = []
      for (let c = 0; c < 3; c++) {
        wrapper.vm.boardData[r][c] = { isMine: false, isRevealed: false, isFlagged: false, adjacentMines: 0 }
      }
    }
    wrapper.vm.boardData[2][2].isMine = true
    // compute adjacent counts
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (!wrapper.vm.boardData[r][c].isMine) {
          let adj = 0
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              const nr = r + i, nc = c + j
              if (nr >= 0 && nr < 3 && nc >= 0 && nc < 3 && wrapper.vm.boardData[nr][nc].isMine) adj++
            }
          }
          wrapper.vm.boardData[r][c].adjacentMines = adj
        }
      }
    }

    wrapper.vm.revealCell(0, 0)
    expect(wrapper.vm.boardData[0][0].isRevealed).toBe(true)
    expect(wrapper.vm.boardData[1][1].isRevealed).toBe(true)
  })
})
