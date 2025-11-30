<script setup>
const props = defineProps({

  color: {
    type: String,
    required: false,
    default: "primary",
  },
  icon: {
    type: String,
    required: false,
    default: "tabler-egg-cracked",
  },
  description: {
    type: String,
    required: false,
    default: "",
  },
})
</script>

<template>
  <VAlert
    :color="props.color"
    :icon="props.icon"
  >
    {{ props.description }}
  </VAlert>
</template>


