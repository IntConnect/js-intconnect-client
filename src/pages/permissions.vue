<script setup>
import { ref, onMounted, watch } from 'vue'
import AppCardActions from "@core/components/cards/AppCardActions.vue"
import { format } from 'date-fns'
import { useFetchPermission } from '@/composables/useFetchPermission'
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"

const {
  permissions,
  fetchPermissions,
  totalItems,
  totalPages,
  loading,
  error,
} = useFetchPermission()

const page = ref(1)
const itemsPerPage = ref(10)
const searchQuery = ref("")
const sortBy = ref("id")
const sortOrder = ref("asc")

const loadPermissions = async () => {
  await fetchPermissions({
    page: page.value,
    size: itemsPerPage.value,
    query: searchQuery.value,
    sort: sortBy.value,
    order: sortOrder.value,
  })
}

onMounted(() => {
  loadPermissions()
})

// Reset ke halaman 1 saat search
watch(searchQuery, () => {
  page.value = 1
  loadPermissions()
})

// Load data saat page atau itemsPerPage berubah
watch([page, itemsPerPage], () => {
  loadPermissions()
})

// Header table
const headers = [
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'Code', key: 'code', sortable: true },
  { title: 'Category', key: 'category', sortable: true },
  { title: 'Description', key: 'description', sortable: false },
  { title: 'Created At', key: 'created_at', sortable: true },
  { title: 'Updated At', key: 'updated_at', sortable: true },
]

const formatDate = dateString => {
  try {
    return format(new Date(dateString), 'dd MMM yyyy HH:mm:ss')
  } catch {
    return '-'
  }
}
</script>

<template>
  <VCard>
    <AppCardActions
      no-actions
      title="Permissions"
    >
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
        </div>
      </VCardText>

      <!-- Error State -->
      <VAlert
        v-if="error"
        class="mx-4"
        type="error"
      >
        {{ error }}
      </VAlert>

      <!-- Data Table -->
      <VDataTable
        :headers="headers"
        :items="permissions"
        :items-per-page="itemsPerPage"
        :loading="loading"
        hide-default-footer
      >
        <!-- Created At Column -->
        <template #item.created_at="{ item }">
          <div class="d-flex align-center gap-x-4">
            {{ formatDate(item.auditable_response?.created_at) }}
          </div>
        </template>

        <!-- Updated At Column -->
        <template #item.updated_at="{ item }">
          <div class="d-flex align-center gap-x-4">
            {{ formatDate(item.auditable_response?.updated_at) }}
          </div>
        </template>

        <!-- Description Column - Truncate long text -->
        <template #item.description="{ item }">
          <div
            class="text-truncate"
            style="max-width: 300px;"
          >
            {{ item.description }}
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
    </AppCardActions>
  </VCard>
</template>
