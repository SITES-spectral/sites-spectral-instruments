<script setup>
/**
 * Base Modal Component
 *
 * Reusable modal using daisyUI dialog.
 * Uses Teleport to render at document body level.
 */
import { watch, ref } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  size: {
    type: String,
    default: 'md', // sm, md, lg, xl, full
    validator: (v) => ['sm', 'md', 'lg', 'xl', 'full'].includes(v)
  },
  closable: {
    type: Boolean,
    default: true
  },
  persistent: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

const dialogRef = ref(null);

// Size classes
const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4'
};

// Watch for value changes
watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    dialogRef.value?.showModal();
  } else {
    dialogRef.value?.close();
  }
});

function close() {
  if (props.closable) {
    emit('update:modelValue', false);
    emit('close');
  }
}

function handleBackdropClick(e) {
  if (!props.persistent && e.target === dialogRef.value) {
    close();
  }
}

function handleKeydown(e) {
  if (e.key === 'Escape' && props.closable && !props.persistent) {
    close();
  }
}
</script>

<template>
  <Teleport to="body">
    <dialog
      ref="dialogRef"
      class="modal"
      :class="{ 'modal-open': modelValue }"
      @click="handleBackdropClick"
      @keydown="handleKeydown"
    >
      <div class="modal-box" :class="sizeClasses[size]">
        <!-- Header -->
        <div v-if="title || closable" class="flex items-center justify-between mb-4">
          <h3 v-if="title" class="font-bold text-lg">{{ title }}</h3>
          <button
            v-if="closable"
            class="btn btn-sm btn-circle btn-ghost"
            @click="close"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="py-2">
          <slot></slot>
        </div>

        <!-- Footer -->
        <div v-if="$slots.footer" class="modal-action">
          <slot name="footer"></slot>
        </div>
      </div>

      <!-- Backdrop -->
      <form method="dialog" class="modal-backdrop">
        <button v-if="!persistent" @click="close">close</button>
      </form>
    </dialog>
  </Teleport>
</template>
