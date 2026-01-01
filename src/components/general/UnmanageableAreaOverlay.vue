
<script setup>
defineProps({
  message: {
    type: String,
    default: 'This area cannot be edited',
  },
  showLock: {
    type: Boolean,
    default: true,
  },
})
</script>

<template>
  <div class="unmanageable-wrapper">
    <slot />
    
    <!-- Overlay -->
    <div class="unmanageable-overlay">
      <div class="overlay-content">
        <VIcon
          v-if="showLock"
          icon="tabler-lock"
          size="48"
          class="lock-icon mb-3"
        />
        <div class="text-h6 font-weight-bold mb-1">
          {{ message }}
        </div>
        <div class="text-caption text-grey">
          This section is managed by the system
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.unmanageable-wrapper {
  position: relative;
  border: 2px dashed rgba(239, 68, 68, 0.3);
  border-radius: 24px;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba(239, 68, 68, 0.03) 10px,
      rgba(239, 68, 68, 0.03) 20px
    );
    pointer-events: none;
    z-index: 1;
  }
}

.unmanageable-overlay {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
  z-index: 2;
  
  .unmanageable-wrapper:hover & {
    opacity: 1;
  }
}

.overlay-content {
  text-align: center;
  color: white;
  padding: 24px;
  background: rgba(239, 68, 68, 0.1);
  border: 2px solid rgba(239, 68, 68, 0.3);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.lock-icon {
  color: #ef4444;
  filter: drop-shadow(0 0 8px rgba(239, 68, 68, 0.5));
  animation: pulse 2s ease-in-out infinite;
}

.unmanageable-overlay {
  opacity: 0.3; // Selalu terlihat dengan opacity rendah
  
  .unmanageable-wrapper:hover & {
    opacity: 0.8; // Lebih terang saat hover
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}
</style>
