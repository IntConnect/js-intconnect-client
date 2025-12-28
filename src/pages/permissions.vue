<script setup>
import { useFetchPermission } from '@/composables/useFetchPermission'
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import { format } from 'date-fns'
import { onMounted, ref, watch } from 'vue'

const {
  permissions,
  fetchPermissionsPagination,
  totalItems,
  totalPages,
  loading,
  error,
  currentPage: page, pageSize: itemsPerPage,

} = useFetchPermission()


const searchQuery = ref("")
const sortBy = ref("id")
const sortOrder = ref("asc")

const loadPermissions = async () => {
  await fetchPermissionsPagination({
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

// Reset to page 1 when search query changes
watch(searchQuery, () => {
  page.value = 1
  loadPermissions()
})


watch([page, itemsPerPage], loadPermissions)

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
  <section>
    <VCol cols="12">
      <h4 class="text-h4 mb-1">
        All Permissions
      </h4>
      <p class="text-body-1 mb-0">
        Manage user access rights and permissions across system
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
        :key="permissions.length"
        :headers="headers"
        :items="permissions"
        :items-per-page="itemsPerPage"
        :loading="loading"
        class="text-no-wrap"
        hide-default-footer
        no-data-text="No Permissions found"
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
  </section>
</template>
