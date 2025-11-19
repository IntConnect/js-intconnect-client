<script setup>
import { ref, computed, watch } from 'vue'
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import TablePagination from "@core/components/TablePagination.vue"
import DeleteDialog from "@/components/general/DeleteDialog.vue"
import { format } from "date-fns"
import { useApi } from "@/composables/useApi"
import AddNewUserDrawer from "@/components/user/AddNewUserDrawer.vue"

// --- Constants
const ITEMS_PER_PAGE_OPTIONS = [
  { value: 10, title: '10' },
  { value: 25, title: '25' },
  { value: 50, title: '50' },
  { value: 100, title: '100' },
  { value: -1, title: 'All' },
]

const TABLE_HEADERS = [
  { title: 'Id', key: 'id', sortable: true },
  { title: 'Username', key: 'username', sortable: true },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Email', key: 'email', sortable: true },
  { title: 'Role', key: 'role', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

// --- Reactive States
const users = ref([])
const page = ref(1)
const itemsPerPage = ref(10)
const searchQuery = ref('')
const sortBy = ref('id')
const orderBy = ref('asc')
const loading = ref(false)

// --- UI States
const isAddNewUserDrawerVisible = ref(false)
const showDeleteDialog = ref(false)
const selectedUser = ref(null)
const formErrors = ref({})

// --- Computed
const totalUsers = computed(() => users.value?.length ?? 0)

// --- Build query string
function buildQuery(params) {
  return Object.entries(params)
    .filter(([_, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
}

// --- Fetch users from API
async function fetchUsers() {
  loading.value = true
  try {
    const queryStr = buildQuery({
      query: searchQuery.value,
      page: page.value,
      size: itemsPerPage.value,
      sort: sortBy.value,
      order: orderBy.value,
    })

    const { data, error } = await useApi(`/users?${queryStr}`).get().json()

    if (error.value) {
      throw new Error(error.value.message || 'Failed to fetch users')
    }

    users.value = data.value?.users ?? []
  } catch (err) {
    console.error('Failed to fetch users:', err)
    users.value = []
  } finally {
    loading.value = false
  }
}

// --- Drawer handlers
const openAddUserDrawer = () => {
  selectedUser.value = null
  formErrors.value = {}
  isAddNewUserDrawerVisible.value = true
}

const closeAddUserDrawer = () => {
  isAddNewUserDrawerVisible.value = false
  selectedUser.value = null
  formErrors.value = {}
}

// --- Edit user
function handleEdit(row) {
  selectedUser.value = { ...row }
  isAddNewUserDrawerVisible.value = true
}

// --- Delete dialog
const openDeleteDialog = user => {
  selectedUser.value = user
  showDeleteDialog.value = true
}

const closeDeleteDialog = () => {
  showDeleteDialog.value = false
  selectedUser.value = null
}

// --- Save user (Create or Update)
async function saveUser(userData) {
  const isUpdate = Boolean(userData.id)
  const method = isUpdate ? 'put' : 'post'
  const endpoint = isUpdate ? `/users/${userData.id}` : '/users'

  console.log(userData)
  try {
    const { data, error } = await useApi(endpoint)[method](userData).json()

    if (error.value) {
      const errorData = error.value
      if (errorData.status === 422 && errorData.errors) {
        formErrors.value = errorData.errors

        return
      }
      throw new Error(errorData.message || 'Failed to save user')
    }

    closeAddUserDrawer()
    await fetchUsers()
  } catch (err) {
    console.error('Failed to save user:', err)
  }
}

// --- Delete user
async function deleteUser(description) {
  if (!selectedUser.value?.id) {
    console.warn('No user selected for deletion')

    return
  }

  try {
    const { error } = await useApi(`/users/${selectedUser.value.id}`).delete({ description }).json()

    if (error.value) {
      throw new Error(error.value.message || 'Failed to delete user')
    }

    closeDeleteDialog()
    await fetchUsers()
  } catch (err) {
    console.error('Failed to delete user:', err)
  }
}

// --- Reset pagination when search changes
const resetPage = () => {
  page.value = 1
}

// --- Watch filters to refetch
watch([searchQuery], resetPage)
watch([searchQuery, page, itemsPerPage, sortBy, orderBy], fetchUsers, { immediate: true })
</script>

<template>
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
          <VBtn
            color="primary"
            @click="openAddUserDrawer"
          >
            + New User
          </VBtn>
        </div>
      </VCardText>

      <VDivider />

      <!-- Data Table -->
      <VDataTable
        v-model:page="page"
        :headers="TABLE_HEADERS"
        :items="users"
        :items-per-page="itemsPerPage"
        :loading="loading"
        class="text-no-wrap"
        no-data-text="No users found"
      >
        <!-- ID Column -->
        <template #item.id="{ index }">
          {{ (page - 1) * itemsPerPage + index + 1 }}
        </template>


        <!-- Created At Column -->
        <template #item.created_at="{ item }">
          {{ format(new Date(item.created_at), 'dd MMM yyyy HH:mm:ss') }}
        </template>

        <!-- Updated At Column -->
        <template #item.updated_at="{ item }">
          {{ format(new Date(item.updated_at), 'dd MMM yyyy HH:mm:ss') }}
        </template>

        <!-- Actions Column -->
        <template #item.actions="{ item }">
          <template
            size="x-small"
            @click="handleEdit(item)"
          >
            <VIcon
              icon="tabler-pencil"
              size="20"
            />
          </template>
          <template
            size="x-small"
            @click="openDeleteDialog(item)"
          >
            <VIcon
              icon="tabler-trash"
              size="20"
            />
          </template>
        </template>

        <!-- Bottom Pagination -->
        <template #bottom>
          <TablePagination
            v-model:page="page"
            :items-per-page="itemsPerPage"
            :total-items="totalUsers"
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
      message="Please provide a reason for deletion"
      title="Delete User"
      @submit="deleteUser"
    />

    <!-- Add/Edit User Drawer -->
    <AddNewUserDrawer
      v-model:is-drawer-open="isAddNewUserDrawerVisible"
      :form-errors="formErrors"
      :user-data="selectedUser"
      @close="closeAddUserDrawer"
      @user-data="saveUser"
    />
  </section>
</template>

<style scoped>
/* Remove unused styles */
</style>
