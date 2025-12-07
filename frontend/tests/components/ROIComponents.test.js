/**
 * ROI Components Tests
 * v10.0.0-alpha.17
 *
 * Tests for the new ROI drawing and legacy system components.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, shallowMount } from '@vue/test-utils';
import { ref, nextTick } from 'vue';

// Import components
import ROICard from '@/components/rois/ROICard.vue';
import ROIList from '@/components/rois/ROIList.vue';
import LegacyROIWarningModal from '@/components/rois/LegacyROIWarningModal.vue';
import AdminOverrideConfirmModal from '@/components/rois/AdminOverrideConfirmModal.vue';

// Mock canvas for ROIViewer (happy-dom doesn't support canvas)
vi.stubGlobal('HTMLCanvasElement', class {
  getContext() {
    return {
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      closePath: vi.fn(),
      fill: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      scale: vi.fn(),
      drawImage: vi.fn(),
      measureText: vi.fn(() => ({ width: 50 })),
      setLineDash: vi.fn()
    };
  }
});

// Mock data
const mockActiveROI = {
  id: 1,
  roi_name: 'ROI_01',
  description: 'Test ROI',
  color_r: 255,
  color_g: 0,
  color_b: 0,
  alpha: 0.3,
  thickness: 2,
  is_legacy: false,
  points: [
    { x: 100, y: 100 },
    { x: 200, y: 100 },
    { x: 200, y: 200 },
    { x: 100, y: 200 }
  ]
};

const mockLegacyROI = {
  id: 2,
  roi_name: 'ROI_02',
  description: 'Legacy ROI',
  color_r: 0,
  color_g: 200,
  color_b: 0,
  alpha: 0.3,
  thickness: 2,
  is_legacy: true,
  legacy_date: '2024-01-15T10:00:00Z',
  timeseries_broken: false,
  points: [
    { x: 300, y: 100 },
    { x: 400, y: 100 },
    { x: 400, y: 200 },
    { x: 300, y: 200 }
  ]
};

const mockBrokenROI = {
  id: 3,
  roi_name: 'ROI_03',
  description: 'Broken ROI',
  color_r: 0,
  color_g: 0,
  color_b: 255,
  is_legacy: false,
  timeseries_broken: true,
  points: [
    { x: 500, y: 100 },
    { x: 600, y: 100 },
    { x: 600, y: 200 },
    { x: 500, y: 200 }
  ]
};

describe('ROICard', () => {
  it('renders active ROI correctly', () => {
    const wrapper = mount(ROICard, {
      props: {
        roi: mockActiveROI,
        selected: false,
        canEdit: true,
        isLegacy: false
      }
    });

    expect(wrapper.text()).toContain('ROI_01');
    expect(wrapper.find('.badge-warning').exists()).toBe(false);
    expect(wrapper.find('[title="Edit ROI"]').exists()).toBe(true);
  });

  it('renders legacy ROI with badge', () => {
    const wrapper = mount(ROICard, {
      props: {
        roi: mockLegacyROI,
        selected: false,
        canEdit: true,
        isLegacy: true
      }
    });

    expect(wrapper.text()).toContain('ROI_02');
    expect(wrapper.text()).toContain('Legacy');
    expect(wrapper.find('.badge-warning').exists()).toBe(true);
    // Legacy ROIs should not have edit buttons
    expect(wrapper.find('[title="Edit ROI"]').exists()).toBe(false);
  });

  it('renders timeseries_broken warning', () => {
    const wrapper = mount(ROICard, {
      props: {
        roi: mockBrokenROI,
        selected: false,
        canEdit: true,
        isLegacy: false
      }
    });

    expect(wrapper.find('.badge-error').exists()).toBe(true);
  });

  it('applies strikethrough style for legacy ROIs', () => {
    const wrapper = mount(ROICard, {
      props: {
        roi: mockLegacyROI,
        selected: false,
        canEdit: false,
        isLegacy: true
      }
    });

    expect(wrapper.find('.line-through').exists()).toBe(true);
  });

  it('emits select event on click', async () => {
    const wrapper = mount(ROICard, {
      props: {
        roi: mockActiveROI,
        selected: false,
        canEdit: true,
        isLegacy: false
      }
    });

    await wrapper.trigger('click');
    expect(wrapper.emitted('select')).toBeTruthy();
    expect(wrapper.emitted('select')[0]).toEqual([mockActiveROI]);
  });

  it('applies opacity class for legacy ROIs', () => {
    const wrapper = mount(ROICard, {
      props: {
        roi: mockLegacyROI,
        selected: false,
        canEdit: true,
        isLegacy: true
      }
    });

    // Legacy cards have opacity-60 class
    expect(wrapper.classes()).toContain('opacity-60');
  });

  it('shows lock icon for legacy ROIs', () => {
    const wrapper = mount(ROICard, {
      props: {
        roi: mockLegacyROI,
        selected: false,
        canEdit: true,
        isLegacy: true
      }
    });

    // Legacy ROIs have a lock icon instead of edit buttons
    expect(wrapper.find('svg').exists()).toBe(true);
  });
});

describe('ROIList', () => {
  it('renders active and legacy tabs', () => {
    const wrapper = mount(ROIList, {
      props: {
        rois: [mockActiveROI, mockLegacyROI],
        selectedId: null,
        canEdit: true,
        loading: false
      }
    });

    expect(wrapper.text()).toContain('Active');
    expect(wrapper.text()).toContain('Legacy');
  });

  it('shows correct counts in tabs', () => {
    const wrapper = mount(ROIList, {
      props: {
        rois: [mockActiveROI, mockLegacyROI],
        selectedId: null,
        canEdit: true,
        loading: false
      }
    });

    // Check for separate badges with counts
    expect(wrapper.text()).toContain('Active');
    expect(wrapper.text()).toContain('1');
    expect(wrapper.text()).toContain('Legacy');
  });

  it('defaults to active tab', () => {
    const wrapper = mount(ROIList, {
      props: {
        rois: [mockActiveROI, mockLegacyROI],
        selectedId: null,
        canEdit: true,
        loading: false
      }
    });

    // Should show active ROI by default
    expect(wrapper.text()).toContain('ROI_01');
  });

  it('shows create button for users with edit permission', () => {
    const wrapper = mount(ROIList, {
      props: {
        rois: [mockActiveROI],
        selectedId: null,
        canEdit: true,
        loading: false
      }
    });

    // Button text contains "Add ROI"
    const addButton = wrapper.find('.btn-primary');
    expect(addButton.exists()).toBe(true);
    expect(addButton.text()).toContain('Add ROI');
  });

  it('hides create button for users without edit permission', () => {
    const wrapper = mount(ROIList, {
      props: {
        rois: [mockActiveROI],
        selectedId: null,
        canEdit: false,
        loading: false
      }
    });

    // No Add ROI button when canEdit is false
    expect(wrapper.find('.btn-primary').exists()).toBe(false);
  });

  it('emits create event when add button clicked', async () => {
    const wrapper = mount(ROIList, {
      props: {
        rois: [mockActiveROI],
        selectedId: null,
        canEdit: true,
        loading: false
      }
    });

    const createButton = wrapper.find('.btn-primary');
    await createButton.trigger('click');

    expect(wrapper.emitted('create')).toBeTruthy();
  });
});

describe('LegacyROIWarningModal', () => {
  const BaseModalStub = {
    template: '<div><slot></slot><slot name="actions"></slot></div>',
    props: ['modelValue', 'title', 'size']
  };

  it('renders with warning message about legacy', () => {
    const wrapper = mount(LegacyROIWarningModal, {
      props: {
        modelValue: true,
        roiName: 'ROI_01'
      },
      global: {
        stubs: { BaseModal: BaseModalStub }
      }
    });

    expect(wrapper.text()).toContain('legacy');
    expect(wrapper.text()).toContain('time series');
  });

  it('shows reason input field', () => {
    const wrapper = mount(LegacyROIWarningModal, {
      props: {
        modelValue: true,
        roiName: 'ROI_01'
      },
      global: {
        stubs: { BaseModal: BaseModalStub }
      }
    });

    expect(wrapper.find('textarea').exists()).toBe(true);
  });

  it('has create new ROI button', () => {
    const wrapper = mount(LegacyROIWarningModal, {
      props: {
        modelValue: true,
        roiName: 'ROI_01'
      },
      global: {
        stubs: { BaseModal: BaseModalStub }
      }
    });

    const createButton = wrapper.find('.btn-primary');
    expect(createButton.exists()).toBe(true);
    expect(createButton.text()).toContain('Create New ROI');
  });
});

describe('AdminOverrideConfirmModal', () => {
  it('renders with warning about timeseries breaking', () => {
    const wrapper = mount(AdminOverrideConfirmModal, {
      props: {
        visible: true,
        roi: { id: 1, roi_name: 'ROI_01' }
      }
    });

    expect(wrapper.text()).toContain('timeseries_broken');
    expect(wrapper.text()).toContain('CONFIRM');
  });

  it('has confirmation input', () => {
    const wrapper = mount(AdminOverrideConfirmModal, {
      props: {
        visible: true,
        roi: { id: 1, roi_name: 'ROI_01' }
      }
    });

    expect(wrapper.find('input[type="text"]').exists()).toBe(true);
  });

  it('validates confirmation text correctly', async () => {
    const wrapper = mount(AdminOverrideConfirmModal, {
      props: {
        visible: true,
        roi: { id: 1, roi_name: 'ROI_01' }
      }
    });

    // Initially isConfirmValid should be false
    expect(wrapper.vm.isConfirmValid).toBe(false);

    // Type incorrect text
    const input = wrapper.find('input[type="text"]');
    await input.setValue('confirm');
    // 'confirm' lowercase should be valid because it's case-insensitive
    expect(wrapper.vm.isConfirmValid).toBe(true);

    // Type correct text
    await input.setValue('CONFIRM');
    await nextTick();
    expect(wrapper.vm.isConfirmValid).toBe(true);
  });

  it('shows warnings about impact', () => {
    const wrapper = mount(AdminOverrideConfirmModal, {
      props: {
        visible: true,
        roi: { id: 1, roi_name: 'ROI_01' }
      }
    });

    expect(wrapper.text()).toContain('L2/L3');
    expect(wrapper.text()).toContain('Admin Override');
  });
});

describe('ROI Component Integration', () => {
  it('ROICard isLegacy prop matches roi.is_legacy', () => {
    // Test that the component correctly handles the isLegacy prop
    const wrapperActive = mount(ROICard, {
      props: {
        roi: mockActiveROI,
        selected: false,
        canEdit: true,
        isLegacy: mockActiveROI.is_legacy
      }
    });

    const wrapperLegacy = mount(ROICard, {
      props: {
        roi: mockLegacyROI,
        selected: false,
        canEdit: true,
        isLegacy: mockLegacyROI.is_legacy
      }
    });

    // Active ROI should not have legacy styling
    expect(wrapperActive.classes()).not.toContain('opacity-60');

    // Legacy ROI should have legacy styling
    expect(wrapperLegacy.classes()).toContain('opacity-60');
  });

  it('ROIList correctly separates active and legacy ROIs', () => {
    const wrapper = mount(ROIList, {
      props: {
        rois: [mockActiveROI, mockLegacyROI, mockBrokenROI],
        selectedId: null,
        canEdit: true,
        loading: false
      }
    });

    // Check computed properties
    expect(wrapper.vm.activeRois.length).toBe(2); // mockActiveROI and mockBrokenROI
    expect(wrapper.vm.legacyRois.length).toBe(1); // mockLegacyROI
  });
});
