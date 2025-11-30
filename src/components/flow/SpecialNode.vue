<script setup>
import { Handle, Position } from '@vue-flow/core'

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <div
    :style="{ backgroundColor: props.data.color || 'white' }"
    class="px-4 py-2 shadow-md rounded-lg cursor-pointer select-none"
  >
    <div class="flex items-center">
      <div class="rounded-full w-12 h-12 flex justify-center items-center bg-gray-100">
        <VIcon
          :icon="props.data.icon"
          color="white"
          size="30"
        />
      </div>
      <div class="ml-2">
        <div class="text-lg font-bold text-white dark:text-white">
          {{ props.data.label }}
        </div>
        <div class="text-white capitalize">
          {{ props.data.nodeType }}
        </div>
      </div>
    </div>

    <!-- Handle kiri untuk input dari node lain -->
    <Handle
      v-if="props.data.nodeType === 'output' || props.data.nodeType === 'processor'"
      :position="Position.Left"
      type="target"
    />
    <!-- Handle kanan untuk output ke node lain -->
    <Handle
      v-if="props.data.nodeType === 'input' || props.data.nodeType === 'processor'"
      :position="Position.Right"
      class="h-12 w-12 rounded-xs !bg-teal-500"
      type="source"
    />
  </div>
</template>

<style scoped>
.vue-flow__handle {
  width: 8px;
  height: 8px;
}
</style>
