<script setup>
import { ref, toRaw, watch } from 'vue'

const props = defineProps({
  parameter: {
    type: Object,
    required: false,
    default: () => ({
      id: null,
      operations: [],
    }),
  },
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['submit', 'update:isDialogVisible'])

// Local working state
const parameter = ref(structuredClone(toRaw(props.parameter)))
const originalOps = ref([])                // untuk cek perubahan
const deletedOperationIds = ref([])        // list id terhapus

// Watch props untuk reset dialog
watch(
  () => props.parameter,
  newVal => {
    if (!newVal) return
    parameter.value = structuredClone(toRaw(newVal))
    originalOps.value = structuredClone(toRaw(newVal.operations || []))
  },
  { immediate: true, deep: true },
)

const availableOps = [
  { title: 'Add (+)', value: 'ADDITION' },
  { title: 'Subtract (-)', value: 'SUBTRACTION' },
  { title: 'Multiply (×)', value: 'MULTIPLICATION' },
  { title: 'Divide (÷)', value: 'DIVISION' },
]

// Add new operation
function addOperation() {
  parameter.value.operations.push({
    id: null,
    type: 'ADDITION',
    value: 0,
  })
}

// Remove operation
function removeOperation(index) {
  const op = parameter.value.operations[index]

  // jika punya id, masuk list deleted
  if (op && op.id) {
    deletedOperationIds.value.push(op.id)
  }

  parameter.value.operations.splice(index, 1)
}

// Submit
function formSubmit() {
  // step 1 — regenerate sequence
  const arranged = parameter.value.operations.map((op, i) => ({
    ...op,
    sequence: i + 1,
  }))

  // step 2 — detect created
  const created = arranged.filter(op => !op.id)

  // step 3 — detect updated (field berubah)
  const updated = arranged.filter(op => {
    if (!op.id) return false
    const original = originalOps.value.find(o => o.id === op.id)
    if (!original) return false
    
    return (
      original.type !== op.type ||
      original.value !== op.value ||
      original.sequence !== op.sequence
    )
  })

  emit('submit', {
    created,
    updated,
    deleted: deletedOperationIds.value,
  })

  emit('update:isDialogVisible', false)
}

// Close dialog
function dialogModelValueUpdate() {
  emit('update:isDialogVisible', false)
}
</script>

<template>
  <VDialog
    :model-value="props.isDialogVisible"
    :width="$vuetify.display.smAndDown ? 'auto' : 600"
    @update:model-value="dialogModelValueUpdate"
  >
    <DialogCloseBtn @click="dialogModelValueUpdate(false)" />

    <VCard class="pa-4 pa-sm-8">
      <VCardItem class="text-center">
        <h3>Manage Parameter Operations</h3>
        <p>Define sequential math operations applied to parameter</p>
      </VCardItem>

      <VCardText>
        <VRow
          v-for="(op, i) in parameter.operations"
          :key="i"
          class="align-center mb-4"
        >
          <VCol cols="5">
            <VSelect
              v-model="op.type"
              :items="availableOps"
              label="Operation Type"
              density="comfortable"
            />
          </VCol>

          <VCol cols="5">
            <VTextField
              v-model.number="op.value"
              type="number"
              label="Value"
              density="comfortable"
            />
          </VCol>

          <VCol
            cols="2"
            class="text-center"
          >
            <VBtn
              icon
              size="small"
              color="error"
              @click="removeOperation(i)"
            >
              <VIcon
                icon="tabler-trash"
                size="20"
              />
            </VBtn>
          </VCol>
        </VRow>

        <VBtn
          block
          color="primary"
          variant="tonal"
          @click="addOperation"
        >
          Add Operation
        </VBtn>

        <div class="text-center mt-6">
          <VBtn
            color="primary"
            class="me-3"
            @click="formSubmit"
          >
            Save
          </VBtn>
          <VBtn
            variant="tonal"
            color="secondary"
            @click="dialogModelValueUpdate"
          >
            Cancel
          </VBtn>
        </div>
      </VCardText>
    </VCard>
  </VDialog>
</template>
