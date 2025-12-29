<script setup>
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import DialogCloseBtn from "@core/components/DialogCloseBtn.vue"

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  action: { type: String, default: 'approve' }, // 'approve' or 'reject'
})

const emit = defineEmits(['update:modelValue', 'submit'])

const note = ref('')
const isFormValid = ref(false)

const isApprove = computed(() => props.action === 'approve')

const dialogConfig = computed(() => {
  if (isApprove.value) {
    return {
      title: 'Approve Check Sheet',
      message: 'Please provide a note for approval',
      icon: 'tabler-check',
      iconColor: 'success',
      btnColor: 'success',
      btnText: 'Approve',
    }
  }
  
  return {
    title: 'Reject Check Sheet',
    message: 'Please provide a reason for rejection',
    icon: 'tabler-x',
    iconColor: 'error',
    btnColor: 'error',
    btnText: 'Reject',
  }
})

const closeDialog = () => {
  emit("update:modelValue", false)
}

const handleSubmit = () => {
  if (!note.value.trim()) return
  
  emit("submit", {
    note: note.value,
    action: props.action,
  })
  closeDialog()
}

watch(() => props.modelValue, val => {
  if (!val) {
    note.value = ''
  }
})
</script>

<template>
  <VDialog
    :width="$vuetify.display.smAndDown ? 'auto' : 500"
    :model-value="props.modelValue"
    persistent
    @update:model-value="val => emit('update:modelValue', val)"
  >
    <DialogCloseBtn @click="closeDialog" />

    <VCard class="pa-4">
      <!-- Icon -->
      <VCardItem class="text-center pb-4">
        <VAvatar
          :color="dialogConfig.iconColor"
          size="56"
          variant="tonal"
          class="mb-4"
        >
          <VIcon
            :icon="dialogConfig.icon"
            size="32"
          />
        </VAvatar>
        
        <VCardTitle class="mb-2">
          <h4 class="text-h4">
            {{ dialogConfig.title }}
          </h4>
        </VCardTitle>
        
        <p class="text-body-1 mb-0">
          {{ dialogConfig.message }}
        </p>
      </VCardItem>

      <VCardText class="pt-2">
        <VForm
          v-model="isFormValid"
          @submit.prevent="handleSubmit"
        >
          <VRow>
            <VCol cols="12">
              <AppTextField
                v-model="note"
                label="Note"
                placeholder="Type your note here..."
                rows="3"
                auto-grow
              />
            </VCol>

            <!-- Actions -->
            <VCol
              cols="12"
              class="d-flex gap-3 justify-center"
            >
              <VBtn
                :color="dialogConfig.btnColor"
                type="submit"
                :disabled="!note.trim()"
              >
                <VIcon
                  :icon="dialogConfig.icon"
                  start
                />
                {{ dialogConfig.btnText }}
              </VBtn>
              <VBtn
                color="secondary"
                variant="tonal"
                @click="closeDialog"
              >
                Cancel
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>
</template>
