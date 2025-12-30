<script setup>
import AlertDialog from "@/components/general/AlertDialog.vue"
import DeleteDialog from "@/components/general/DeleteDialog.vue"
import { useManageCheckSheet } from "@/composables/useManageCheckSheet.js"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import TablePagination from "@core/components/TablePagination.vue"
import { format } from 'date-fns'
import { onMounted, ref, watch } from 'vue'

// ==========================================
// Composable
// ==========================================
const {
  checkSheets,
  loading,
  actionLoading,
  fetchCheckSheetsPagination,
  saveCheckSheet,
  deleteCheckSheet,
  totalItems,
  totalPages,
  error,
  formErrors,
  clearFormErrors,
  clearErrors,
  currentPage: page, pageSize: itemsPerPage,
} = useManageCheckSheet()


// ==========================================
// Constants
// ==========================================
const TABLE_HEADERS = [
  { title: 'Id', key: 'id', sortable: true },
  { title: 'Document Name', key: 'name', sortable: true },
  { title: 'Document No', key: 'no', sortable: true },
  { title: 'Reported By', key: 'reported_by', sortable: true },
  { title: 'Date', key: 'timestamp', sortable: true },
  { title: 'Status', key: 'status' },
  { title: 'Note', key: 'note' },
  { title: 'Actions', key: 'actions', sortable: false },
]


// ==========================================
// Reactive States
// ==========================================
const searchQuery = ref("")
const sortBy = ref("id")
const sortOrder = ref("asc")

// UI States
const showDeleteDialog = ref(false)
const selectedCheckSheet = ref(null)
const showAlertDialog = ref(false)
const alertMessage = ref('')


// ==========================================
// Methods
// ==========================================

/**
 * Load checksheet from API
 */
const loadCheckSheets = async () => {
  await fetchCheckSheetsPagination({
    page: page.value,
    size: itemsPerPage.value,
    query: searchQuery.value,
    sort: sortBy.value,
    order: sortOrder.value,
  })
}


const resolveColorStatus = status => {
  switch (status) {
  case "Draft":
    return "secondary"
  case "Approved":
    return "success"
  case "Rejected":
    return "error"
    break
  }
}


/**
 * Open delete confirmation dialog
 */
const openDeleteDialog = report => {
  selectedCheckSheet.value = report
  showDeleteDialog.value = true
}

/**
 * Close delete dialog
 */
const closeDeleteDialog = () => {
  showDeleteDialog.value = false
  selectedCheckSheet.value = null
}


/**
 * Handle delete report
 */
const handleDeleteCheckSheet = async formData => {
  if (!selectedCheckSheet.value?.id) {
    console.warn('No Check Sheet selected for deletion')

    return
  }


  const result = await deleteCheckSheet(selectedCheckSheet.value.id, formData)

  if (result.success) {
    closeDeleteDialog()
    showAlertDialog.value = true
    alertMessage.value = 'Success delete Check Sheet'

  } else {
    console.error('Failed to delete user:', result.error)

    // Optional: Show error notification
  }
}

// ==========================================
// Watchers
// ==========================================

// Reset to page 1 when search query changes
watch(searchQuery, () => {
  page.value = 1
  loadCheckSheets()
})


watch([page, itemsPerPage], loadCheckSheets)

// ==========================================
// Lifecycle
// ==========================================
onMounted(() => {
  loadCheckSheets()
})
</script>

<template>
  <section>
    <VCol cols="12">
      <h4 class="text-h4 mb-1">
        All Check Sheet
      </h4>
      <p class="text-body-1 mb-0">
        Access, review, and maintain all check sheet templates used across your facilities.
      </p>
    </VCol>
    <VCard>
      <VCardText class="d-flex flex-wrap gap-4 justify-space-between align-center">
        <!-- Items per page selector -->
        <div class="d-flex gap-2 align-center">
          <span class="text-body-1">Show</span>
          <AppSelect
            v-model="itemsPerPage"
            :items="ITEMS_PER_PAGE_OPTIONS"
            style="inline-size: 5.5rem;"
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
          <VBtn
            :loading="actionLoading"
            color="primary"
            :to="{ name: 'check-sheets-manage-id', params: { id: 'new' } }"
          >
            New Check Sheet
          </VBtn>
        </div>
      </VCardText>

      <VDivider />

      <!-- Error Alert -->
      <VAlert
        v-if="error"
        class="mx-4 mt-4"
        closable
        type="error"
        @click:close="clearErrors"
      >
        {{ error }}
      </VAlert>

      <!-- Data Table -->
      <VDataTable
        :key="checkSheets.length"
        :headers="TABLE_HEADERS"
        :items="checkSheets"
        :items-per-page="itemsPerPage"
        :loading="loading"
        class="text-no-wrap"
        hide-default-footer
        no-data-text="No Check Sheet found"
      >
        <!-- ID Column -->
        <template #item.id="{ index }">
          {{ (page - 1) * itemsPerPage + index + 1 }}
        </template>

        <template #item.name="{ item }">
          <div class="d-flex align-center gap-x-4">
            {{ item.check_sheet_document_template.name }}
          </div>
        </template>

        <template #item.no="{ item }">
          <div class="d-flex align-center gap-x-4">
            {{ item.check_sheet_document_template.no }}
          </div>
        </template>

        <template #item.status="{ item }">
          <div class="d-flex align-center gap-x-4">
            <VChip
              label
              :color="resolveColorStatus(item.status)"
            >
              {{ item.status }}
            </VChip>
          </div>
        </template>

        <!-- Created At Column -->
        <template #item.timestamp="{ item }">
          {{ format(new Date(item.timestamp), 'dd MMM yyyy HH:mm:ss') }}
        </template>
        <template #item.reported_by="{ item }">
          <div class="d-flex align-center gap-x-4">
            {{ item.reported_by_user.name }}
          </div>
        </template>
        <!-- Actions Column -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-2">
            <VBtn
              v-if="item.status !== 'Approved' && item.status !== 'Rejected'" 
              color="success"
              icon
              size="small"
              variant="text"
              :to="{ name: 'check-sheets-approval-id', params: { id: item.id } }"
            >
              <VIcon
                icon="tabler-check"
                size="20"
              />
            </VBtn>
            <VBtn
              color="info"
              icon
              size="small"
              variant="text"
              :to="{ name: 'check-sheets-manage-id', params: { id: item.id } }"
            >
              <VIcon
                icon="tabler-pencil"
                size="20"
              />
            </VBtn>
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
          <TablePagination
            v-model:page="page"
            :items-per-page="itemsPerPage"
            :total-items="totalItems"
          />
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
      :loading="actionLoading"
      message="Please provide a reason for deletion"
      title="Delete Check Sheet"
      @submit="handleDeleteCheckSheet"
    />
  </section>
  <AlertDialog
    v-model:is-dialog-visible="showAlertDialog"
    :body-alert="alertMessage"
  />
</template>
