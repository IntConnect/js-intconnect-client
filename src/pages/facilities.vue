<script setup>
import { ref, watch, onMounted } from 'vue'
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import TablePagination from "@core/components/TablePagination.vue"
import DeleteDialog from "@/components/general/DeleteDialog.vue"
import { format } from "date-fns"
import { useManageFacility } from "@/composables/useManageFacility"
import AlertDialog from "@/components/general/AlertDialog.vue"

// ==========================================
// Composable
// ==========================================
const {
  facilities,
  loading,
  actionLoading,
  fetchFacilitiesPagination,
  saveFacility,
  deleteFacility,
  totalItems,
  totalPages,
  error,
  formErrors,
  clearFormErrors,
  clearErrors,
  currentPage: page, pageSize: itemsPerPage,
} = useManageFacility()

// ==========================================
// Constants
// ==========================================
const TABLE_HEADERS = [
  { title: 'Id', key: 'id', sortable: true },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Code', key: 'code', sortable: true },
  { title: 'Description', key: 'description', sortable: true },
  { title: 'Location', key: 'location', sortable: true },
  { title: 'Status', key: 'status', sortable: false },
  { title: 'Thumbnail', key: 'thumbnail', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]


// ==========================================
// Reactive States
// ==========================================
const searchQuery = ref("")
const sortBy = ref("id")
const sortOrder = ref("asc")

// UI States
const isManageFacilityVisible = ref(false)
const showDeleteDialog = ref(false)
const selectedFacility = ref(null)
const showAlertDialog = ref(false)
const alertBody = ref('')


// ==========================================
// Methods
// ==========================================

/**
 * Load facilities from API
 */
const loadFacilities = async () => {
  await fetchFacilitiesPagination({
    page: page.value,
    size: itemsPerPage.value,
    query: searchQuery.value,
    sort: sortBy.value,
    order: sortOrder.value,
  })
}

/**
 * Open drawer for adding new facilitie
 */
const openManageFacilityDrawer = () => {
  selectedFacility.value = null
  clearFormErrors()
  isManageFacilityVisible.value = true
}

/**
 * Close add/edit drawer
 */
const closeManageFacilityDrawer = () => {
  isManageFacilityVisible.value = false
  selectedFacility.value = null
  clearFormErrors()
}

/**
 * Open drawer for editing facilities
 */
const handleEdit = facility => {
  selectedFacility.value = { ...facility }
  clearFormErrors()
  isManageFacilityVisible.value = true
}

/**
 * Open delete confirmation dialog
 */
const openDeleteDialog = facility => {
  selectedFacility.value = facility
  showDeleteDialog.value = true
}

/**
 * Close delete dialog
 */
const closeDeleteDialog = () => {
  showDeleteDialog.value = false
  selectedFacility.value = null
}

/**
 * Handle save facility (create or update)
 */
const handleSaveFacility = async facilityData => {

  const result = await saveFacility(facilityData)

  if (result.success) {
    closeManageFacilityDrawer()
    await nextTick()

    showAlertDialog.value = true
    alertBody.value = "Data has been managed successfully."

  } else {
    console.error('Failed to save facilities:', result.error || result.errors)
  }
}

/**
 * Handle delete facilities
 */
const handleDeleteFacility = async formData => {
  if (!selectedFacility.value?.id) {
    console.warn('No Facility selected for deletion')

    return
  }

  const result = await deleteFacility(selectedFacility.value.id, formData)

  if (result.success) {
    closeDeleteDialog()
    showAlertDialog.value = true
    alertBody.value = "Data has been deleted successfully."
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
  loadFacilities()
})


watch([page, itemsPerPage], loadFacilities)

// ==========================================
// Lifecycle
// ==========================================
onMounted(() => {
  loadFacilities()
})
</script>

<template>
  <section>
    <VCol cols="12">
      <h4 class="text-h4 mb-1">
        All Facility
      </h4>
      <p class="text-body-1 mb-0">
        View a complete list of company facilities along with their key information and status.
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
            @click="openManageFacilityDrawer"
          >
            New Facility
          </VBtn>
        </div>
      </VCardText>

      <VDivider/>

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
        :key="facilities.length"
        :headers="TABLE_HEADERS"
        :items="facilities"
        :items-per-page="itemsPerPage"
        :loading="loading"
        class="text-no-wrap"
        hide-default-footer
        no-data-text="No Facility found"
      >
        <!-- ID Column -->
        <template #item.id="{ index }">
          {{ (page - 1) * itemsPerPage + index + 1 }}
        </template>


        <template #item.thumbnail="{ item }">
          <template v-if="item.thumbnail_path !== ''">
            <a
              :href="useStaticFile(item.thumbnail_path)"
              target="_blank"
            >
              <VBtn
                color="success"
                icon="tabler-photo-scan"
                rounded
                variant="tonal"
              />
            </a>
          </template>
          <template v-else>
            <div class="pa-2 me-3">
              <VAlert
                color="error"
                icon="tabler-alert-triangle"
                variant="tonal"
              >
                There is no thumbnail
              </VAlert>
            </div>
          </template>
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
      title="Delete Facility"
      @submit="handleDeleteFacility"
    />

    <!-- Add/Edit Facility Drawer -->
    <ManageFacilityDrawer
      v-model:is-drawer-open="isManageFacilityVisible"
      :facility-data="selectedFacility"
      :form-errors="formErrors"
      :loading="actionLoading"
      @close="closeManageFacilityDrawer"
      @facility-data="handleSaveFacility"
    />
  </section>
  <AlertDialog
    v-model:is-dialog-visible="showAlertDialog"
    :body-alert="alertBody"
  />
</template>
