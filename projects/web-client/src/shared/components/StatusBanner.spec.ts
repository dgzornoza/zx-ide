// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import StatusBanner from './StatusBanner.vue';

describe('StatusBanner', () => {
  it('renders nothing without a status', () => {
    const wrapper = mount(StatusBanner, { props: { status: undefined } });

    expect(wrapper.text()).toBe('');
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
  });

  it('renders a success status with the success color', () => {
    const wrapper = mount(StatusBanner, { props: { status: { type: 'success', text: 'Files sent' } } });

    const banner = wrapper.get('[role="status"]');
    expect(banner.text()).toBe('Files sent');
    expect(banner.classes()).toContain('text-[color:var(--success-ink)]');
  });

  it('renders an error status with the error color', () => {
    const wrapper = mount(StatusBanner, { props: { status: { type: 'error', text: 'EACCES' } } });

    const banner = wrapper.get('[role="status"]');
    expect(banner.text()).toBe('EACCES');
    expect(banner.classes()).toContain('text-[color:var(--error-ink)]');
  });
});
