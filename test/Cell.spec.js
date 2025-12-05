import { mount } from '@vue/test-utils';
import { describe, it, expect, vi } from 'vitest';
import Cell from '../app/components/Cell.vue';

describe('Cell.vue', () => {
  const defaultProps = {
    cellData: {
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    },
    showMines: false,
    rowIndex: 0,
    colIndex: 0,
  };

  it('renders correctly with default props', () => {
    const wrapper = mount(Cell, { props: defaultProps });
    expect(wrapper.exists()).toBe(true);
    expect(wrapper.classes('cell')).toBe(true);
    expect(wrapper.text()).toBe('');
  });

  it('emits "cell-clicked" on left click', async () => {
    const wrapper = mount(Cell, { props: defaultProps });
    await wrapper.trigger('click');
    expect(wrapper.emitted('cell-clicked')).toBeTruthy();
    expect(wrapper.emitted('cell-clicked')[0]).toEqual([0, 0]);
  });

  it('emits "cell-flagged" on right click', async () => {
    const wrapper = mount(Cell, { props: defaultProps });
    await wrapper.trigger('contextmenu');
    expect(wrapper.emitted('cell-flagged')).toBeTruthy();
    expect(wrapper.emitted('cell-flagged')[0]).toEqual([0, 0]);
  });

  it('displays mine emoji if it is a mine and revealed', () => {
    const wrapper = mount(Cell, {
      props: {
        ...defaultProps,
        cellData: { ...defaultProps.cellData, isMine: true, isRevealed: true },
      },
    });
    expect(wrapper.text()).toContain('💣');
  });

  it('displays mine emoji if it is a mine and showMines is true', () => {
    const wrapper = mount(Cell, {
      props: {
        ...defaultProps,
        cellData: { ...defaultProps.cellData, isMine: true },
        showMines: true,
      },
    });
    expect(wrapper.text()).toContain('💣');
  });

  it('displays adjacent mines count if revealed and greater than 0', () => {
    const wrapper = mount(Cell, {
      props: {
        ...defaultProps,
        cellData: { ...defaultProps.cellData, isRevealed: true, adjacentMines: 3 },
      },
    });
    expect(wrapper.text()).toContain('3');
  });

  it('displays flag emoji if flagged', () => {
    const wrapper = mount(Cell, {
      props: {
        ...defaultProps,
        cellData: { ...defaultProps.cellData, isFlagged: true },
      },
    });
    expect(wrapper.text()).toContain('🚩');
  });

  // Test touch events (long press for flagging)
  it('emits "cell-flagged" on long press (touchstart then timeout)', async () => {
    vi.useFakeTimers();
    const wrapper = mount(Cell, { props: defaultProps });
    const handleClickSpy = vi.spyOn(wrapper.vm, 'handleClick');
    
    await wrapper.trigger('touchstart');
    expect(wrapper.emitted('cell-flagged')).toBeFalsy(); // Not yet emitted
    vi.advanceTimersByTime(600); // Long press duration
    
    // Now trigger touchend, which should reset _longPress
    await wrapper.trigger('touchend');

    expect(wrapper.emitted('cell-flagged')).toBeTruthy();
    expect(wrapper.emitted('cell-flagged')[0]).toEqual([0, 0]);
    
    // Assert that _longPress is reset and handleClick is not called
    expect(wrapper.vm._longPress).toBe(false);
    expect(handleClickSpy).not.toHaveBeenCalled();
    
    vi.useRealTimers();
  });

  it('emits "cell-clicked" on short press (touchstart then touchend)', async () => {
    vi.useFakeTimers();
    const wrapper = mount(Cell, { props: defaultProps });
    
    await wrapper.trigger('touchstart');
    vi.advanceTimersByTime(50); // Less than 600ms
    await wrapper.trigger('touchend');
    
    expect(wrapper.emitted('cell-clicked')).toBeTruthy();
    expect(wrapper.emitted('cell-clicked')[0]).toEqual([0, 0]);
    expect(wrapper.emitted('cell-flagged')).toBeFalsy(); // Not flagged
    
    vi.useRealTimers();
  });

  it('clears timer on touchcancel', async () => {
    vi.useFakeTimers();
    const wrapper = mount(Cell, { props: defaultProps });
    
    await wrapper.trigger('touchstart');
    vi.advanceTimersByTime(300); // Halfway
    await wrapper.trigger('touchcancel');
    vi.advanceTimersByTime(300); // Should not trigger long press
    
    expect(wrapper.emitted('cell-flagged')).toBeFalsy();
    expect(wrapper.emitted('cell-clicked')).toBeFalsy();
    
    vi.useRealTimers();
  });
});
