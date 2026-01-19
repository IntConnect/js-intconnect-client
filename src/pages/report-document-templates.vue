<script setup>
import ManageReportDocumentTemplateDrawer from "@/components/drawer/ManageReportDocumentTemplateDrawer.vue"
import AlertDialog from "@/components/general/AlertDialog.vue"
import DeleteDialog from "@/components/general/DeleteDialog.vue"
import { useManageReportDocumentTemplate } from "@/composables/useManageReportDocumentTemplate"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import TablePagination from "@core/components/TablePagination.vue"
import { onMounted, ref, watch } from 'vue'

// ==========================================
// Composable
// ==========================================
const {
  reportDocumentTemplates,
  loading,
  actionLoading,
  fetchReportDocumentTemplatesPagination,
  saveReportDocumentTemplate,
  deleteReportDocumentTemplate,
  totalItems,
  totalPages,
  error,
  formErrors,
  clearFormErrors,
  clearErrors,
  currentPage: page, pageSize: itemsPerPage,
} = useManageReportDocumentTemplate()

// ==========================================
// Constants
// ==========================================
const TABLE_HEADERS = [
  { title: 'Id', key: 'id', sortable: true },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Code', key: 'code', sortable: true },
  { title: 'Document Version', key: 'document_version', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]


// ==========================================
// Reactive States
// ==========================================
const searchQuery = ref("")
const sortBy = ref("id")
const sortOrder = ref("asc")

// UI States
const isManageReportDocumentTemplateVisible = ref(false)
const showDeleteDialog = ref(false)
const selectedReportDocumentTemplate = ref(null)
const showAlertDialog = ref(false)
const titleAlert = ref('')
const bodyAlert = ref('')
const alertType = ref('info')


// ==========================================
// Methods
// ==========================================

/**
 * Load reportDocumentTemplates from API
 */
const loadReportDocumentTemplates = async () => {
  await fetchReportDocumentTemplatesPagination({
    page: page.value,
    size: itemsPerPage.value,
    query: searchQuery.value,
    sort: sortBy.value,
    order: sortOrder.value,
  })
}

/**
 * Open drawer for adding new reportDocumentTemplate
 */
const openManageReportDocumentTemplateDrawer = () => {
  selectedReportDocumentTemplate.value = null
  clearFormErrors()
  isManageReportDocumentTemplateVisible.value = true
}

/**
 * Close add/edit drawer
 */
const closeManageReportDocumentTemplateDrawer = () => {
  isManageReportDocumentTemplateVisible.value = false
  selectedReportDocumentTemplate.value = null
  clearFormErrors()
}

/**
 * Open drawer for editing reportDocumentTemplate
 */
const handleEdit = reportDocumentTemplate => {
  selectedReportDocumentTemplate.value = { ...reportDocumentTemplate }
  clearFormErrors()
  isManageReportDocumentTemplateVisible.value = true
}

/**
 * Open delete confirmation dialog
 */
const openDeleteDialog = reportDocumentTemplate => {
  selectedReportDocumentTemplate.value = reportDocumentTemplate
  showDeleteDialog.value = true
}

/**
 * Close delete dialog
 */
const closeDeleteDialog = () => {
  showDeleteDialog.value = false
  selectedReportDocumentTemplate.value = null
}

/**
 * Handle save reportDocumentTemplate (create or update)
 */
const handleSaveReportDocumentTemplate = async reportDocumentTemplateData => {

  const result = await saveReportDocumentTemplate(reportDocumentTemplateData)

  if (result.success) {
    closeManageReportDocumentTemplateDrawer()
    await nextTick()

    showAlertDialog.value = true
    alertMessage.value = 'Success manage Report Document Templates'
    bodyAlert.value = 'Report Document Templates has been managed'
  } else {
    console.error('Failed to save reportDocumentTemplate:', result.error || result.errors)
  }
}

/**
 * Handle delete reportDocumentTemplate
 */
const handleDeleteReportDocumentTemplate = async formData => {
  if (!selectedReportDocumentTemplate.value?.id) {
    console.warn('No Report Document Templates selected for deletion')

    return
  }


  const result = await deleteReportDocumentTemplate(selectedReportDocumentTemplate.value.id, formData)

  if (result.success) {
    closeDeleteDialog()
    showAlertDialog.value = true
    alertMessage.value = 'Success delete Report Document Templates'

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
  loadReportDocumentTemplates()
})


watch([page, itemsPerPage], loadReportDocumentTemplates)

// ==========================================
// Lifecycle
// ==========================================
onMounted(() => {
  loadReportDocumentTemplates()
})
</script>

<template>
  <section>
    <VCol cols="12">
      <h4 class="text-h4 mb-1">
        All Report Document Templates
      </h4>
      <p class="text-body-1 mb-0">
        Find all of your company’s administrator accounts and their associate roles.
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
            @click="openManageReportDocumentTemplateDrawer"
          >
            New Report Document Templates
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
        :key="reportDocumentTemplates.length"
        :headers="TABLE_HEADERS"
        :items="reportDocumentTemplates"
        :items-per-page="itemsPerPage"
        :loading="loading"
        class="text-no-wrap"
        hide-default-footer
        no-data-text="No Report Document Templates found"
      >
        <!-- ID Column -->
        <template #item.id="{ index }">
          {{ (page - 1) * itemsPerPage + index + 1 }}
        </template>

        <!-- Role Column -->
        <template #item.role="{ item }">
          <VChip
            color="primary"
            size="small"
          >
            {{ item.role?.name || 'N/A' }}
          </VChip>
        </template>

        <!-- Actions Column -->
        <template #item.actions="{ item }">
          <div class="d-flex gap-2">
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
      title="Delete Report Document Templates"
      @submit="handleDeleteReportDocumentTemplate"
    />

    <!-- Add/Edit ReportDocumentTemplate Drawer -->
    <ManageReportDocumentTemplateDrawer
      v-model:is-drawer-open="isManageReportDocumentTemplateVisible"
      :form-errors="formErrors"
      :loading="actionLoading"
      :report-document-template-data="selectedReportDocumentTemplate"
      @close="closeManageReportDocumentTemplateDrawer"
      @report-document-template-data="handleSaveReportDocumentTemplate"
    />
  </section>
  <AlertDialog v-model:is-dialog-visible="showAlertDialog" :body-alert="bodyAlert" :title-alert="titleAlert"
    :type="alertType" />
</template>
