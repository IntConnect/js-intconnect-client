<script setup>
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import DialogCloseBtn from "@core/components/DialogCloseBtn.vue"

const props = defineProps({
  title: { type: String, default: "Dialog" },
  message: { type: String, default: "" },
  modelValue: { type: Boolean, required: true }, // v-model untuk visible
  fields: {
    type: Array,
    default: () => [],

    // contoh:
    // [{ key: 'reason', label: 'Alasan', placeholder: 'Masukkan alasan', type: 'text' }]
  },
})

const emit = defineEmits(['update:modelValue', 'submit'])

const description = ref('')


const closeDialog = () => emit("update:modelValue", false)

const handleSubmit = () => {
  emit("submit", description.value)
}
</script>

<template>
  <VDialog
    :width="$vuetify.display.smAndDown ? 'auto' : 500"
    :model-value="props.modelValue"
  >
    <DialogCloseBtn @click="closeDialog" />

    <VCard class="pa-4">
      <!-- 👉 Title -->
      <VCardItem class="text-center">
        <VCardTitle>
          <h4 class="text-h4 mb-2">
            {{ props.title }}
          </h4>
        </VCardTitle>
        <p
          v-if="props.message"
          class="text-body-1 mb-0"
        >
          {{ props.message }}
        </p>
      </VCardItem>

      <VCardText class="pt-6">
        <VForm @submit.prevent="handleSubmit">
          <VRow>
            <VCol
              v-for="field in props.fields"
              :key="field.key"
              cols="12"
            >
              <AppTextField
                v-model="description"
                :label="field.label"
                :error="field.formErrors[field.key]"
                :error-messages="field.formErrors[field.key]"
                :placeholder="field.placeholder"
                :type="field.type || 'text'"
              />
            </VCol>

            <!-- 👉 Actions -->
            <VCol
              cols="12"
              class="text-center"
            >
              <VBtn
                class="me-4"
                type="submit"
              >
                Submit
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
