<script setup>
import { Handle, Position } from '@vue-flow/core'

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
})

watch(props.data, () => {
  console.log(props.data)
}, { immediate: true })
</script>

<template>
  <div
    class="px-4 py-2 shadow-md rounded-lg cursor-pointer select-none"
    :style="{ backgroundColor: props.data.color || 'white' }"
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
      type="target"
      :position="Position.Left"
      class="h-12 w-5 rounded-xs !bg-teal-500"
    />

    <!-- Handle kanan untuk output ke node lain -->
    <Handle
      v-if="props.data.nodeType === 'input' || props.data.nodeType === 'processor'"
      type="source"
      :position="Position.Right"
      class="h-12 w-5 rounded-xs !bg-teal-500"
    />
  </div>
</template>

<style scoped>
.tabler-database-heart {
  font-size: 22px;
  color: #333;
}
</style>
