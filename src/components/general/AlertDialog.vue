<script setup>
import DialogCloseBtn from "@core/components/DialogCloseBtn.vue"

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    default: false,
  },
  titleAlert: {
    type: String,
    default: "Title Alert",
  },
})

const emit = defineEmits([
  'update:isDialogVisible',
])

const closeDialog = () => {
  emit('update:isDialogVisible', false)
}
</script>

<template>
  <VDialog
    :model-value="props.isDialogVisible"
    width="500"
    @update:model-value="emit('update:isDialogVisible', false)"
  >
    <!-- Dialog close btn -->
    <DialogCloseBtn @click="closeDialog" />

    <!-- Dialog Content -->
    <VCard :title="props.titleAlert">
      <VCardText />

      <VCardText class="d-flex justify-end">
        <VBtn @click="closeDialog">
          Continue
        </VBtn>
      </VCardText>
    </VCard>
  </VDialog>
</template>
