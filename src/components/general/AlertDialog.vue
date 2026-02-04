<script setup>
import DialogCloseBtn from "@core/components/DialogCloseBtn.vue"

const props = defineProps({
  isDialogVisible: Boolean,
  titleAlert: {
    type: String,
    default: "Your changes have been saved",
  },
  bodyAlert: {
    type: String,
    default: "",
  },
  type: {
    type: String,
    default: "info", // success, error, warning, info
  },
})

const emit = defineEmits(["update:isDialogVisible"])

// warna berdasarkan type
const colors = {
  success: "success",
  error: "error",
  warning: "warning",
  info: "info",
}

const icons = {
  success: "tabler-check",
  error: "tabler-alert-triangle",
  warning: "tabler-alert-circle",
  info: "tabler-info-circle",
}

const closeDialog = () => emit("update:isDialogVisible", false)
</script>

<template>
  <VDialog
    :model-value="isDialogVisible"
    width="450"
    @update:model-value="closeDialog"
    data-testid="alert-dialog"
  >
    <DialogCloseBtn @click="closeDialog" />

    <VCard>
      <VCardItem>
        <template #prepend>
          <VIcon
            :color="colors[type]"
            :icon="icons[type]"
            size="28"
          />
        </template>

        <VCardTitle>{{ titleAlert }}</VCardTitle>
      </VCardItem>

      <VCardText>
        {{ bodyAlert }}
      </VCardText>
    </VCard>
  </VDialog>
</template>
