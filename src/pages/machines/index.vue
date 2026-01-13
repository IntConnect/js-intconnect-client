<script setup>
import AlertDialog from "@/components/general/AlertDialog.vue"
import DeleteDialog from "@/components/general/DeleteDialog.vue"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import TablePagination from "@core/components/TablePagination.vue"
import { format } from "date-fns"
import { ref } from 'vue'

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
  pageSize: itemsPerPage,

} = useManageMachine()

const page = ref(1)

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


// --- UI States
const showDeleteDialog = ref(false)
const selectedMachine = ref(null)
const showAlertDialog = ref(false)
const titleAlert = ref('')
const bodyAlert = ref('')
const alertType = ref('info')



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
    titleAlert.value = 'Action success'
    bodyAlert.value = 'Machine has been deleted'

  } else {
    showAlertDialog.value = true
    titleAlert.value = 'Action failed'
    bodyAlert.value = 'Machine failed to deleted'
    alertType.value = 'error'

  }
}

const closeDeleteDialog = () => {
  showDeleteDialog.value = false
  selectedMachine.value = null
}

// ==========================================
// Watchers
// ==========================================

// Reset to page 1 when search query changes
watch(searchQuery, () => {
  page.value = 1
  loadMachines()
})


watch([page, itemsPerPage], loadMachines)
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
              <AppSelect :items="ITEMS_PER_PAGE_OPTIONS" :model-value="itemsPerPage" style="inline-size: 5.5rem;"
                @update:model-value="itemsPerPage = parseInt($event, 10)" />
            </div>

            <!-- Right side controls -->
            <div class="d-flex gap-2 align-center flex-wrap">
              <AppTextField v-model="searchQuery" clearable placeholder="Search something..."
                style="inline-size: 15.625rem;" />
              <VBtn color="primary" :to="{ name: 'machine-create' }">
                New Machine
              </VBtn>
            </div>
          </VCardText>

          <VDivider />

          <!-- Data Table -->
          <VDataTable :headers="TABLE_HEADERS" :items="machines" :items-per-page="itemsPerPage" :loading="actionLoading"
            class="text-no-wrap" no-data-text="No machines found">
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
                <VBtn color="success" icon size="small" variant="text"
                  :to="{ name: 'machines-manage-id', params: { id: item.id } }">
                  <VIcon icon="tabler-eye" size="20" />
                </VBtn>
                <VBtn color="warning" icon size="small" variant="text"
                  :to="{ name: 'machines-dashboard-id', params: { id: item.id } }">
                  <VIcon icon="tabler-dashboard" size="20" />
                </VBtn>
                <VBtn color="info" icon size="small" variant="text"
                  :to="{ name: 'machine-edit', params: { id: item.id } }">
                  <VIcon icon="tabler-pencil" size="20" />
                </VBtn>
                <VBtn color="error" icon size="small" variant="text" @click="openDeleteDialog(item)">
                  <VIcon icon="tabler-trash" size="20" />
                </VBtn>
              </div>
            </template>

            <!-- Bottom Pagination -->
            <template #bottom>
              <TablePagination v-model:page="page" :items-per-page="itemsPerPage" :total-items="totalItems" />
            </template>
          </VDataTable>
        </VCard>

        <!-- Delete Dialog -->
        <DeleteDialog v-model="showDeleteDialog" 
        :fields="[{
          key: 'reason',
          label: 'Reason',
          placeholder: 'Type your reason...',
          type: 'text',
        }]" 
        :form-errors="formErrors"
         message="Please provide a reason for deletion" title="Delete Machine" @submit="handleDeleteMachine" />
      </section>
    </VCol>
  </VRow>
  <AlertDialog v-model:is-dialog-visible="showAlertDialog" :body-alert="bodyAlert" :title-alert="titleAlert"
    :type="alertType" />
</template>
