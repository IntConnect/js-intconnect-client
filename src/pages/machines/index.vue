<script setup>
import { ref, computed, watch } from 'vue'
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import TablePagination from "@core/components/TablePagination.vue"
import DeleteDialog from "@/components/general/DeleteDialog.vue"
import { format } from "date-fns"
import AlertDialog from "@/components/general/AlertDialog.vue"

// ==========================================
// Composable
// ==========================================
const {
  machines,
  actionLoading,
  fetchMachines,
  fetchMachinesPagination,
  saveMachine,
  deleteMachine,
  totalItems,
  totalPages,
  error,
  formErrors,
  clearFormErrors,
  clearErrors,
  currentPage: page, pageSize: itemsPerPage,

} = useManageMachine()


// --- Constants
const TABLE_HEADERS = [
  { title: 'Id', key: 'id', sortable: true },
  { title: 'Code', key: 'code', sortable: true },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Description', key: 'description', sortable: true },
  { title: 'Facility Name', key: 'facility_name', sortable: true },
  { title: 'Created At', key: 'created_at', sortable: true },
  { title: 'Updated At', key: 'updated_at', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]


// ==========================================
// Reactive States
// ==========================================
const searchQuery = ref("")
const sortBy = ref("id")
const sortOrder = ref("asc")
const currentStep = ref(0)


// --- UI States
const showDeleteDialog = ref(false)
const selectedMachine = ref(null)
const showAlertDialog = ref(false)
const alertMessage = ref('')

// --- Edit user
function handleEdit(row) {
  selectedMachine.value = { ...row }
}

// --- Delete dialog
const openDeleteDialog = user => {
  selectedMachine.value = user
  showDeleteDialog.value = true
}


const loadMachines = async () => {
  await fetchMachinesPagination({
    page: page.value,
    size: itemsPerPage.value,
    query: searchQuery.value,
    sort: sortBy.value,
    order: sortOrder.value,
  })
}

onMounted(() => {
  loadMachines()
})

const handleDeleteMachine = async formData => {
  if (!selectedMachine.value?.id) {
    console.warn('No machine selected for deletion')

    return
  }


  const result = await deleteMachine(selectedMachine.value.id, formData)

  if (result.success) {
    closeDeleteDialog()
    showAlertDialog.value = true
    alertMessage.value = 'Success delete machine'

  } else {
    console.error('Failed to delete machine:', result.error)

    // Optional: Show error notification
  }
}

const closeDeleteDialog = () => {
  showDeleteDialog.value = false
  selectedMachine.value = null
}
</script>

<template>
  <VRow>
    <VCol cols="12">
      <h4 class="text-h4 mb-1 mt-2">
        Machines
      </h4>
      <p class="text-body-1 mb-0">
        Explore the complete list of machines and manage their information in one place.
      </p>
    </VCol>

    <VCol cols="12">
      <!-- 👉 Machine List  -->


      <section>
        <VCard>
          <VCardText class="d-flex flex-wrap gap-4 justify-space-between align-center">
            <!-- Items per page selector -->
            <div class="d-flex gap-2 align-center">
              <span class="text-body-1">Show</span>
              <AppSelect
                :items="ITEMS_PER_PAGE_OPTIONS"
                :model-value="itemsPerPage"
                style="inline-size: 5.5rem;"
                @update:model-value="itemsPerPage = parseInt($event, 10)"
              />
            </div>

            <!-- Right side controls -->
            <div class="d-flex gap-2 align-center flex-wrap">
              <AppTextField
                v-model="searchQuery"
                clearable
                placeholder="Search something..."
                style="inline-size: 15.625rem;"
              />
              <RouterLink :to="{ name: 'machines-manage-id', params: { id: 'new' } }">
                <VBtn color="primary">
                  New Machine
                </VBtn>
              </RouterLink>
            </div>
          </VCardText>

          <VDivider />

          <!-- Data Table -->
          <VDataTable
            v-model:page="page"
            :headers="TABLE_HEADERS"
            :items="machines"
            :items-per-page="itemsPerPage"
            :loading="actionLoading"
            class="text-no-wrap"
            no-data-text="No machines found"
          >
            <!-- ID Column -->
            <template #item.id="{ index }">
              {{ (page - 1) * itemsPerPage + index + 1 }}
            </template>

            <template #item.facility_name="{ item }">
              <div class="d-flex align-center gap-x-4 py-2">
                {{ item.facility.name }}
              </div>
            </template>


            <!-- Created At Column -->
            <template #item.created_at="{ item }">
              {{ format(new Date(item.auditable.created_at), 'dd MMM yyyy HH:mm:ss') }}
            </template>

            <!-- Updated At Column -->
            <template #item.updated_at="{ item }">
              {{ format(new Date(item.auditable.updated_at), 'dd MMM yyyy HH:mm:ss') }}
            </template>

            <!-- Actions Column -->
            <template #item.actions="{ item }">
              <div class="d-flex gap-2">
                <RouterLink :to="{ name: 'machines-manage-id', params: { id: item.id } }">
                  <VBtn
                    color="info"
                    icon
                    size="small"
                    variant="text"
                    @click="handleEdit(item)"
                  >
                    <VIcon
                      icon="tabler-pencil"
                      size="20"
                    />
                  </VBtn>
                </RouterLink>
                <VBtn
                  color="error"
                  icon
                  size="small"
                  variant="text"
                  @click="openDeleteDialog(item)"
                >
                  <VIcon
                    icon="tabler-trash"
                    size="20"
                  />
                </VBtn>
              </div>
            </template>

            <!-- Bottom Pagination -->
            <template #bottom>
              <VCardText class="pt-2">
                <!-- Pagination Controls -->
                <TablePagination
                  v-model:page="page"
                  :items-per-page="itemsPerPage"
                  :total-items="totalItems"
                />
              </VCardText>
            </template>
          </VDataTable>
        </VCard>

        <!-- Delete Dialog -->
        <DeleteDialog
          v-model="showDeleteDialog"
          :fields="[{
            key: 'reason',
            label: 'Reason',
            placeholder: 'Type your reason...',
            type: 'text'
          }]"
          message="Please provide a reason for deletion"
          title="Delete Machine"
          @submit="handleDeleteMachine"
        />
      </section>
    </VCol>
  </VRow>
  <AlertDialog
    v-model:is-dialog-visible="showAlertDialog"
    :title-alert="alertMessage"
  />
</template>
