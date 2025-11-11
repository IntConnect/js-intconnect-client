<script setup>
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"

const props = defineProps({
  pipeline: {
    type: Object,
    required: false,
    default: () => ({
      id: '',
      name: '',
      description: '',
    }),
  },
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits([
  'submit',
  'update:isDialogVisible',
])
const pipeline = ref(structuredClone(toRaw(props.pipeline)))

// 🔹 watch khusus untuk props.pipeline
watch(
  () => props.pipeline,
  (newVal) => {
    if (newVal) {
      pipeline.value = structuredClone(toRaw(newVal))
    }
  },
  { immediate: true, deep: true },
)
const formSubmit = () => {
  emit('submit', pipeline.value)
  emit('update:isDialogVisible', false)
}

const dialogModelValueUpdate = () => {
  emit('update:isDialogVisible', false)
}
</script>

<template>
  <VDialog
    :width="$vuetify.display.smAndDown ? 'auto' : 600"
    :model-value="props.isDialogVisible"
    @update:model-value="dialogModelValueUpdate"
  >
    <!-- Dialog close btn -->
    <DialogCloseBtn @click="dialogModelValueUpdate(false)"/>

    <VCard class="pa-2 pa-sm-10">
      <!-- 👉 Title -->
      <VCardItem class="text-center">
        <VCardTitle>
          <h4 class="text-h4 mb-2">
            {{ props.pipeline.name ? 'Edit Pipeline' : 'Add New Pipeline' }}
          </h4>
        </VCardTitle>
        <p class="text-body-1 mb-0">
          {{ props.pipeline.name ? 'Edit your saved card details' : 'Add card for future billing' }}
        </p>
      </VCardItem>

      <VCardText class="pt-6">
        <VForm @submit.prevent="() => {}">
          <VRow>

            <!-- 👉 Card Name -->
            <VCol
              cols="12"
              md="12"
            >
              <AppTextField
                v-model="pipeline.name"
                label="Name"
                placeholder="John Doe"
              />
            </VCol>

            <!-- 👉 Card Expiry -->


            <!-- 👉 Card CVV -->
            <VCol
              cols="12"
              md="12"
            >
              <AppTextField
                v-model="pipeline.description"
                label="Description"
                placeholder="654"
              />
            </VCol>

            <!-- 👉 Card Primary Set -->

            <!-- 👉 Card actions -->
            <VCol
              cols="12"
              class="text-center"
            >
              <VBtn
                class="me-4"
                type="submit"
                @click="formSubmit"
              >
                Submit
              </VBtn>
              <VBtn
                color="secondary"
                variant="tonal"
                @click="$emit('update:isDialogVisible', false)"
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
