<script setup>
import { ref, watch, onMounted } from 'vue'
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import TablePagination from "@core/components/TablePagination.vue"
import DeleteDialog from "@/components/general/DeleteDialog.vue"
import { format } from "date-fns"
import ManageUserDrawer from "@/components/drawer/ManageUserDrawer.vue"
import { useManageUser } from "@/composables/useManageUser"

// ==========================================
// Composable
// ==========================================
const {
  users,
  loading,
  actionLoading,
  fetchUsers,
  saveUser,
  deleteUser,
  totalItems,
  totalPages,
  error,
  formErrors,
  clearFormErrors,
  clearErrors,
} = useManageUser()

// ==========================================
// Constants
// ==========================================
const TABLE_HEADERS = [
  { title: 'Id', key: 'id', sortable: true },
  { title: 'Username', key: 'username', sortable: true },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Role', key: 'role', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

const ITEMS_PER_PAGE_OPTIONS = [5, 10, 20, 50, 100]

// ==========================================
// Reactive States
// ==========================================
const page = ref(1)
const itemsPerPage = ref(10)
const searchQuery = ref("")
const sortBy = ref("id")
const sortOrder = ref("asc")

// UI States
const isAddNewUserDrawerVisible = ref(false)
const showDeleteDialog = ref(false)
const selectedUser = ref(null)
const showAlertDialog = ref(false)
const alertMessage = ref('')


// ==========================================
// Methods
// ==========================================

/**
 * Load users from API
 */
const loadUsers = async () => {
  await fetchUsers({
    page: page.value,
    size: itemsPerPage.value,
    query: searchQuery.value,
    sort: sortBy.value,
    order: sortOrder.value,
  })
}

/**
 * Open drawer for adding new user
 */
const openAddUserDrawer = () => {
  selectedUser.value = null
  clearFormErrors()
  isAddNewUserDrawerVisible.value = true
}

/**
 * Close add/edit drawer
 */
const closeAddUserDrawer = () => {
  isAddNewUserDrawerVisible.value = false
  selectedUser.value = null
  clearFormErrors()
}

/**
 * Open drawer for editing user
 */
const handleEdit = user => {
  selectedUser.value = { ...user }
  clearFormErrors()
  isAddNewUserDrawerVisible.value = true
}

/**
 * Open delete confirmation dialog
 */
const openDeleteDialog = user => {
  selectedUser.value = user
  showDeleteDialog.value = true
}

/**
 * Close delete dialog
 */
const closeDeleteDialog = () => {
  showDeleteDialog.value = false
  selectedUser.value = null
}

/**
 * Handle save user (create or update)
 */
const handleSaveUser = async userData => {
  const result = await saveUser(userData)

  if (result.success) {
    closeAddUserDrawer()
    showAlertDialog.value = true
    alertMessage.value = 'Success'
  } else {
    console.error('Failed to save user:', result.error || result.errors)
  }
}

/**
 * Handle delete user
 */
const handleDeleteUser = async formData => {
  if (!selectedUser.value?.id) {
    console.warn('No user selected for deletion')

    return
  }


  const result = await deleteUser(selectedUser.value.id, formData)

  if (result.success) {
    closeDeleteDialog()
    showAlertDialog.value = true

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
  loadUsers()
})

// Reload data when page or itemsPerPage changes
watch([page, itemsPerPage], () => {
  loadUsers()
})

// ==========================================
// Lifecycle
// ==========================================
onMounted(() => {
  loadUsers()
})
</script>

<template>
  <section>
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
            @click="openAddUserDrawer"
          >
            + New User
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
        :headers="TABLE_HEADERS"
        :items="users"
        :items-per-page="itemsPerPage"
        :loading="loading"
        class="text-no-wrap"
        hide-default-footer
        no-data-text="No users found"
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
      title="Delete User"
      @submit="handleDeleteUser"
    />

    <!-- Add/Edit User Drawer -->
    <ManageUserDrawer
      v-model:is-drawer-open="isAddNewUserDrawerVisible"
      :form-errors="formErrors"
      :loading="actionLoading"
      :user-data="selectedUser"
      @close="closeAddUserDrawer"
      @user-data="handleSaveUser"
    />
  </section>
  <AlertDialog
    v-model:is-dialog-visible="showAlertDialog"
    :title-alert="alertMessage"
  />
</template>
