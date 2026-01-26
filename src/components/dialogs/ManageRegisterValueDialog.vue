<script setup>

const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
  register: {
    type: Object,
    required: false,
    default: {}
  },
  formErrors: {
    type: Object,
    required: false,
    default: {}
  }
})

const emit = defineEmits(['update:isDialogVisible', 'submit:value'])
const value = ref(0)

const dialogVisibleUpdate = val => {
  emit('update:isDialogVisible', val)
}

</script>

<template>
  <VDialog
    :model-value="props.isDialogVisible"
    :width="$vuetify.display.smAndDown ? 'auto' : 900"
    @update:model-value="dialogVisibleUpdate"
  >
    <!-- 👉 Dialog close btn -->
    <DialogCloseBtn @click="$emit('update:isDialogVisible', false)" />

    <VCard class="share-project-dialog pa-2 pa-sm-10">
      <VCardText>
        <h4 class="text-h4 text-center mb-2">
          Manage Register Value 
        </h4>
        <p class="text-body-1 text-center mb-6">
          {{`Manage Register ${props.register.name} Value`}} 
        </p>

       
        <VForm @submit.prevent="() => {
          console.log(value)
          emit('submit:value', value)
        }">
           <VCol cols="12">
                    <AppTextField 
                      v-model.number="value" 
                      :error="!!formErrors.value" 
                      :error-messages="formErrors.value"
                      label="Value" 
                      placeholder="20" 
                      required 
                    />
                  </VCol>

        <div class="d-flex align-center justify-center justify-sm-space-between flex-wrap gap-3 mt-6">
          <h6 class="text-h6 font-weight-medium d-flex align-start">
            <VIcon
              icon="tabler-alert-triangle"
              class="me-2"
              size="20"
            />
            <div>Manage With Caution</div>
          </h6>

          <VBtn
            class="text-capitalize"
            append-icon="tabler-send"
            type="submit"
          >
            Send
          </VBtn>
        </div>
        </VForm>

      </VCardText>
    </VCard>
  </VDialog>
</template>

<style lang="scss">
.share-project-dialog {
  .card-list {
    --v-card-list-gap: 1rem;
  }
}
</style>
