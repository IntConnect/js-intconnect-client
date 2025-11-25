<script setup>
import { ref, computed, watch } from 'vue'
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import TablePagination from "@core/components/TablePagination.vue"
import DeleteDialog from "@/components/general/DeleteDialog.vue"
import { format } from "date-fns"

// ==========================================
// Composable
// ==========================================
const {
  machines,
  loading,
  actionLoading,
  fetchMachines,
  saveMachine,
  deleteMachine,
  totalItems,
  totalPages,
  error,
  formErrors,
  clearFormErrors,
  clearErrors,
} = useManageMachine()


// --- Constants
const TABLE_HEADERS = [
  { title: 'Id', key: 'id', sortable: true },
  { title: 'Code', key: 'code', sortable: true },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Location', key: 'location', sortable: true },
  { title: 'Status', key: 'status', sortable: true },
  { title: 'Created At', key: 'created_at', sortable: true },
  { title: 'Updated At', key: 'updated_at', sortable: true },
  { title: 'Actions', key: 'actions', sortable: false },
]

// --- Reactive States
const page = ref(1)
const itemsPerPage = ref(10)
const searchQuery = ref('')
const sortBy = ref('id')
const sortOrder = ref("asc")

// --- UI States
const showDeleteDialog = ref(false)
const selectedUser = ref(null)


// --- Edit user
function handleEdit(row) {
  selectedUser.value = { ...row }
}

// --- Delete dialog
const openDeleteDialog = user => {
  selectedUser.value = user
  showDeleteDialog.value = true
}


const loadMachines = async () => {
  await fetchMachines({
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
</script>

<template>
  <VRow>
    <VCol cols="12">
      <h4 class="text-h4 mb-1 mt-2">
        Machines
      </h4>
      <p class="text-body-1 mb-0">
        Find all of your company’s administrator accounts and their associate roles.
      </p>
    </VCol>

    <VCol cols="12">
      <!-- 👉 User List  -->


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
              <RouterLink :to="{ name: 'machines-create' }">
                <VBtn color="primary">
                  New Machine
                </VBtn>
              </RouterLink>
            </div>
          </VCardText>

          <VDivider/>

          <!-- Data Table -->
          <VDataTable
            v-model:page="page"
            :headers="TABLE_HEADERS"
            :items="machines"
            :items-per-page="itemsPerPage"
            :loading="loading"
            class="text-no-wrap"
            no-data-text="No machines found"
          >
            <!-- ID Column -->
            <template #item.id="{ index }">
              {{ (page - 1) * itemsPerPage + index + 1 }}
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
                <VBtn
                  icon
                  size="small"
                  variant="tonal"
                >
                  <RouterLink :to="{ name: 'machines-mapping-id', params: { id: item.id } }">
                    <VBtn
                      color="success"
                      icon
                      size="small"
                      variant="text"
                      @click="openDeleteDialog(item)"
                    >
                      <VIcon
                        icon="tabler-flag-3"
                        size="20"
                      />
                    </VBtn>
                  </RouterLink>
                  <VTooltip
                    activator="parent"
                    location="end"
                  >
                    Mapping Parameter
                  </VTooltip>
                </VBtn>
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
              <VCardText class="pt-2">
                <div class="d-flex flex-wrap justify-space-between gap-4 align-center">
                  <!-- Pagination Info -->
                  <div class="text-body-2">
                    Showing {{ ((page - 1) * itemsPerPage) + 1 }}
                    to {{ Math.min(page * itemsPerPage, totalItems) }}
                    of {{ totalItems }} entries
                  </div>

                  <!-- Pagination Controls -->
                  <VPagination
                    v-model="page"
                    :disabled="loading"
                    :length="totalPages"
                    :total-visible="5"
                  />
                </div>
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
          title="Delete User"
          @submit="deleteMachine"
        />
      </section>
    </VCol>
  </VRow>
</template>
