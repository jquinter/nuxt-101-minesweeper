import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import App from '../app/app.vue';

describe('App.vue', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('mounts and renders the Board component', () => {
    const wrapper = mount(App);
    expect(wrapper.exists()).toBe(true);
    // You might want to assert that the Board component is rendered
    // This assumes Board is directly rendered by App.vue and detectable
    expect(wrapper.findComponent({ name: 'Board' }).exists()).toBe(true);
  });
});
