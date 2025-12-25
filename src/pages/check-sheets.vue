<script setup>
import ManageCheckSheetDocumentTemplateDrawer from "@/components/drawer/ManageCheckSheetDocumentTemplateDrawer.vue"
import AlertDialog from "@/components/general/AlertDialog.vue"
import DeleteDialog from "@/components/general/DeleteDialog.vue"
import { useManageCheckSheetDocumentTemplate } from "@/composables/useManageCheckSheetDocumentTemplate.js"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import TablePagination from "@core/components/TablePagination.vue"
import { onMounted, ref, watch } from 'vue'

// ==========================================
// Composable
// ==========================================
const {
  checksheetDocumentTemplates,
  loading,
  actionLoading,
  fetchChecksheetDocumentTemplatesPagination,
  saveChecksheetDocumentTemplate,
  deleteChecksheetDocumentTemplate,
  totalItems,
  totalPages,
  error,
  formErrors,
  clearFormErrors,
  clearErrors,
  currentPage: page, pageSize: itemsPerPage,
} = useManageCheckSheetDocumentTemplate()


// ==========================================
// Constants
// ==========================================
const TABLE_HEADERS = [
  { title: 'Id', key: 'id', sortable: true },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'No', key: 'no', sortable: true },
  { title: 'Description', key: 'description', sortable: true },
  { title: 'Category', key: 'category', sortable: true },
  { title: 'Rotation', key: 'rotation', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]


// ==========================================
// Reactive States
// ==========================================
const searchQuery = ref("")
const sortBy = ref("id")
const sortOrder = ref("asc")

// UI States
const isManageChecksheetDocumentTemplateVisible = ref(false)
const showDeleteDialog = ref(false)
const selectedChecksheetDocumentTemplate = ref(null)
const showAlertDialog = ref(false)
const alertMessage = ref('')


// ==========================================
// Methods
// ==========================================

/**
 * Load checksheetDocumentTemplate from API
 */
const loadChecksheetDocumentTemplates = async () => {
  await fetchChecksheetDocumentTemplatesPagination({
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
const openManageChecksheetDocumentTemplateDrawer = () => {
  selectedChecksheetDocumentTemplate.value = null
  clearFormErrors()
  isManageChecksheetDocumentTemplateVisible.value = true
}

/**
 * Close add/edit drawer
 */
const closeManageChecksheetDocumentTemplateDrawer = () => {
  isManageChecksheetDocumentTemplateVisible.value = false
  selectedChecksheetDocumentTemplate.value = null
  clearFormErrors()
}

/**
 * Open drawer for editing reportDocumentTemplate
 */
const handleEdit = reportDocumentTemplate => {
  selectedChecksheetDocumentTemplate.value = { ...reportDocumentTemplate }
  clearFormErrors()
  isManageChecksheetDocumentTemplateVisible.value = true
}

/**
 * Open delete confirmation dialog
 */
const openDeleteDialog = reportDocumentTemplate => {
  selectedChecksheetDocumentTemplate.value = reportDocumentTemplate
  showDeleteDialog.value = true
}

/**
 * Close delete dialog
 */
const closeDeleteDialog = () => {
  showDeleteDialog.value = false
  selectedChecksheetDocumentTemplate.value = null
}

/**
 * Handle save reportDocumentTemplate (create or update)
 */
const handleSaveChecksheetDocumentTemplate = async reportDocumentTemplateData => {

  const result = await saveChecksheetDocumentTemplate(reportDocumentTemplateData)

  if (result.success) {
    closeManageChecksheetDocumentTemplateDrawer()
    await nextTick()

    showAlertDialog.value = true
    alertMessage.value = 'Success manage Checksheet Document Template'
  } else {
    console.error('Failed to save reportDocumentTemplate:', result.error || result.errors)
  }
}

/**
 * Handle delete reportDocumentTemplate
 */
const handleDeleteChecksheetDocumentTemplate = async formData => {
  if (!selectedChecksheetDocumentTemplate.value?.id) {
    console.warn('No Checksheet Document Template selected for deletion')

    return
  }


  const result = await deleteChecksheetDocumentTemplate(selectedChecksheetDocumentTemplate.value.id, formData)

  if (result.success) {
    closeDeleteDialog()
    showAlertDialog.value = true
    alertMessage.value = 'Success delete Checksheet Document Template'

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
  loadChecksheetDocumentTemplates()
})


watch([page, itemsPerPage], loadChecksheetDocumentTemplates)

// ==========================================
// Lifecycle
// ==========================================
onMounted(() => {
  loadChecksheetDocumentTemplates()
})
</script>

<template>
  <section>
    <VCol cols="12">
      <h4 class="text-h4 mb-1">
        All Check Sheet Document Template
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
            @click="openManageChecksheetDocumentTemplateDrawer"
          >
            New Checksheet Document Template
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
        :key="checksheetDocumentTemplates.length"
        :headers="TABLE_HEADERS"
        :items="checksheetDocumentTemplates"
        :items-per-page="itemsPerPage"
        :loading="loading"
        class="text-no-wrap"
        hide-default-footer
        no-data-text="No Checksheet Document Template found"
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
      title="Delete Checksheet Document Template"
      @submit="handleDeleteChecksheetDocumentTemplate"
    />

    <!-- Add/Edit ChecksheetDocumentTemplate Drawer -->
    <ManageCheckSheetDocumentTemplateDrawer
      v-model:is-drawer-open="isManageChecksheetDocumentTemplateVisible"
      :checksheet-document-template-data="selectedChecksheetDocumentTemplate"
      :form-errors="formErrors"
      :loading="actionLoading"
      @close="closeManageChecksheetDocumentTemplateDrawer"
      @checksheet-document-template-data="handleSaveChecksheetDocumentTemplate"
    />
  </section>
  <AlertDialog
    v-model:is-dialog-visible="showAlertDialog"
    :body-alert="alertMessage"
  />
</template>
