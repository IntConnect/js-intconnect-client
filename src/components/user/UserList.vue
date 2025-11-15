<script setup>
import { ref, computed, watch } from 'vue'
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import TablePagination from "@core/components/TablePagination.vue"
import { format } from "date-fns"
import DeleteDialog from "@/components/general/DeleteDialog.vue"

// --- Reactive states
const users = ref([])
const totalUsers = computed(() => users.value.length)

const searchQuery = ref('')
const selectedRole = ref('')
const selectedPlan = ref('')
const selectedStatus = ref('')

const itemsPerPage = ref(10)
const page = ref(1)
const sortBy = ref('')
const orderBy = ref('')

// --- Helper: build query string
function buildQuery(params) {
  return Object.entries(params)
    .filter(([_, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')
}

const isAddNewUserDrawerVisible = ref(false)
const formErrors = ref({})

const toggleAddNewUserDrawerVisible = () => {
  isAddNewUserDrawerVisible.value = !isAddNewUserDrawerVisible.value
}

const showDeleteDialog = ref(false)
const selectedUser = ref(null)

const openDeleteDialog = (paramSelectedUser) => {
  selectedUser.value = paramSelectedUser
  showDeleteDialog.value = true
}

// --- Fetch users
async function fetchUsers() {
  try {
    const query = buildQuery({
      q: searchQuery.value,
      role: selectedRole.value,
      plan: selectedPlan.value,
      status: selectedStatus.value,
      itemsPerPage: itemsPerPage.value,
      page: page.value,
      sortBy: sortBy.value,
      orderBy: orderBy.value,
    })

    const response = await $api(`/users?${query}`, { method: 'GET' })

    users.value = response.users
  } catch (err) {
    console.error('Failed to fetch users:', err)
  }
}

function handleEdit(row) {
  selectedUser.value = { ...row }
  isAddNewUserDrawerVisible.value = true          // buka drawer
}

const filteredUsers = computed(() => {
  let temp = users.value

  // Search filter
  if (searchQuery.value)
    temp = temp.filter(u =>
      u.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.value.toLowerCase()),
    )

  // Sorting
  if (sortBy.value) {
    temp = [...temp].sort((a, b) => {
      if (a[sortBy.value] < b[sortBy.value]) return orderBy.value === 'desc' ? 1 : -1
      if (a[sortBy.value] > b[sortBy.value]) return orderBy.value === 'desc' ? -1 : 1
      return 0
    })
  }

  return temp
})


// --- Watch filters to refetch
watch([searchQuery, selectedRole, selectedPlan, selectedStatus, itemsPerPage, page, sortBy, orderBy], fetchUsers, { immediate: true })

// --- Create user
async function addNewUser(userData) {
  let requestMethod = 'POST'
  let requestEndpoint = '/users'
  if (userData.id) {
    requestMethod = 'PUT'
    requestEndpoint = `/users/${userData.id}`
  }
  try {
    const newUser = await $api(requestEndpoint, {
      method: requestMethod,
      body: JSON.stringify(userData),
      headers: { 'Content-Type': 'application/json' },
    })

    isAddNewUserDrawerVisible.value = false // tutup drawer kalau sukses
    formErrors.value = {} // reset error

    fetchUsers()

    return newUser
  } catch (err) {
    if (err.response?.status === 422) {
      // Laravel validation errors
      formErrors.value = err.response._data.errors
    } else {
      processApiError(err, formErrors)
    }
  }
}

const hmiUserResponses = ref([])


// --- Delete user
async function deleteUser(description) {
  try {
    if (selectedUser.value.id === null) {
      toast.error('Pick a data first')
    }
    const response = await $api(`/users/${selectedUser.value.id}`, {
      method: 'DELETE',
      body: { description },
    })
    users.value = response.users

  } catch (err) {
    console.error('Failed to delete user:', err)
  }
}

// --- Table headers
const headers = [
  { title: 'Id', key: 'id' },
  { title: 'Email', key: 'email' },
  { title: 'Name', key: 'name' },
  { title: 'Role', key: 'role' },
  { title: 'HMI User', key: 'hmi_user' },
  { title: 'Username', key: 'username' },
  { title: 'Created At', key: 'created_at' },
  { title: 'Updated At', key: 'updated_at' },
  { title: 'Actions', key: 'actions', sortable: false },
]

</script>

<template>
  <section>
    <VCard>
      <VCardText class="d-flex flex-wrap gap-4">
        <div class="d-flex gap-2 align-center">
          <p class="text-body-1 mb-0">
            Show
          </p>
          <AppSelect
            :model-value="itemsPerPage"
            :items="[
              { value: 10, title: '10' },
              { value: 25, title: '25' },
              { value: 50, title: '50' },
              { value: 100, title: '100' },
              { value: -1, title: 'All' },
            ]"
            style="inline-size: 5.5rem;"
            @update:model-value="itemsPerPage = parseInt($event, 10)"
          />
        </div>

        <VSpacer/>

        <div class="d-flex align-center flex-wrap gap-4">
          <VBtn color="primary"
                @click="toggleAddNewUserDrawerVisible"
          >
            Create New User
          </VBtn>
          <!-- 👉 Search  -->
          <AppTextField
            v-model="searchQuery"
            placeholder="Search User"
            style="inline-size: 15.625rem;"
          />

          <!-- 👉 Add user button -->

        </div>
      </VCardText>

      <VDivider/>

      <!-- SECTION datatable -->
      <VDataTable
        :headers="headers"
        :items="filteredUsers"
        :items-per-page="itemsPerPage"
        v-model:page="page"
        class="text-no-wrap"
        @update:options="updateOptions"
      >
        <template #item.id="{ index }">
          <div class="d-flex align-center gap-x-4">
            {{ (page - 1) * itemsPerPage + index + 1 }}
          </div>
        </template>
        <template #item.updated_at="{ item }">
          <div class="d-flex align-center gap-x-4">
            {{ format(item.updated_at, 'dd MMM yyyy HH:mm:ss') }}
          </div>
        </template>
        <template #item.created_at="{ item }">
          <div class="d-flex align-center gap-x-4">
            {{ format(item.created_at, 'dd MMM yyyy HH:mm:ss') }}
          </div>
        </template>
        <template #item.hmi_user="{ item }">
          <div class="d-flex align-center gap-x-4">
            {{ item.hmi_user?.username }}
          </div>
        </template>

        <template #item.role="{ item }">
          <div class="d-flex align-center gap-x-4">
            {{ item.name }}
          </div>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">


          <IconBtn>
            <VIcon icon="tabler-pencil" @click="handleEdit(item)"/>
          </IconBtn>
          <IconBtn @click="openDeleteDialog(item)">
            <VIcon icon="tabler-trash"/>
          </IconBtn>


        </template>

        <template #bottom>
          <TablePagination
            v-model:page="page"
            :items-per-page="itemsPerPage"
            :total-items="totalUsers"
          />
        </template>
      </VDataTable>
      <!-- SECTION -->
    </VCard>

    <DeleteDialog
      v-model="showDeleteDialog"
      title="Delete User"
      message="Tell a reason why?"
      :fields="[{ key: 'reason', label: 'Reason', placeholder: 'Type your reason...', type: 'text' }]"
      @submit="deleteUser"
    />

    <!-- 👉 Add New User -->
    <!--    <AddNewUserDrawer-->
    <!--      v-model:is-drawer-open="isAddNewUserDrawerVisible"-->
    <!--      :user-data="selectedUser"-->
    <!--      :form-errors="formErrors"-->
    <!--      @user-data="addNewUser"-->
    <!--    />-->
  </section>
</template>

<style scoped>
.filter-list {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.filter-list > * {
  flex: 1 1 150px;
  max-width: 300px;
}
</style>
