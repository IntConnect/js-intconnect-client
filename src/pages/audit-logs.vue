<script setup>
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import { format } from 'date-fns'
import { onMounted, ref, watch } from 'vue'

const {
  auditLogs,
  totalItems,
  currentPage,
  pageSize,
  totalPages,
  actionLoading,
  errorMessage,

  fetchAuditLogs,
  clearErrors,
  currentPage: page, pageSize: itemsPerPage,
} = useFetchAuditLog()


const searchQuery = ref("")
const sortBy = ref("id")
const sortOrder = ref("asc")

const loadAuditLogs = async () => {
  await fetchAuditLogs({
    page: page.value,
    size: itemsPerPage.value,
    query: searchQuery.value,
    sort: sortBy.value,
    order: sortOrder.value,
  })
}


onMounted(() => {
  loadAuditLogs()
})

// Reset ke halaman 1 saat search
watch(searchQuery, () => {
  page.value = 1
  loadAuditLogs()
})

// Load data saat page atau itemsPerPage berubah
watch([page, itemsPerPage], () => {
  loadAuditLogs()
})

// Header table
const headers = [
  { title: '', key: 'data-table-expand' },
  { title: 'ID', key: 'id', sortable: true },
  { title: 'Feature', key: 'feature', sortable: false },
  { title: 'Action', key: 'action', sortable: false },
  { title: 'Description', key: 'description', sortable: false },
  { title: 'IP Address', key: 'ip_address', sortable: false },
  { title: 'User Agent', key: 'user_agent', sortable: false },
  { title: 'Username', key: 'created_by', sortable: false },
  { title: 'Created At', key: 'created_at', sortable: true },
]

const normalizeCompareData = item => {
  const before = item.before ?? {}
  const after = item.after ?? {}

  const keys = new Set([
    ...Object.keys(before),
    ...Object.keys(after),
  ])

  return Array.from(keys).map(key => ({
    field: key,
    before: before[key] ?? '—',
    after: after[key] ?? '—',
  }))
}

</script>


<template>
  <section>
    <VCol cols="12">
      <h4 class="text-h4 mb-1">
        All Audit Logs
      </h4>
      <p class="text-body-1 mb-0">
        Review and view audit logs in system
      </p>
    </VCol>
    <VCard>
      <VCardText class="d-flex flex-wrap gap-4 justify-space-between align-center">
        <!-- Items per page selector -->
        <div class="d-flex gap-2 align-center">
          <span class="text-body-1">Show</span>
          <AppSelect v-model="itemsPerPage" :items="ITEMS_PER_PAGE_OPTIONS" style="inline-size: 5.5rem;" />
        </div>

        <!-- Right side controls -->
        <div class="d-flex gap-2 align-center flex-wrap">
          <AppTextField v-model="searchQuery" clearable placeholder="Search something..."
            style="inline-size: 15.625rem;" />
        </div>
      </VCardText>

      <VDivider />

      <!-- Error Alert -->
      <VAlert v-if="errorMessage" class="mx-4 mt-4" closable type="error" @click:close="clearErrors">
        {{ errorMessage }}
      </VAlert>

      <!-- Data Table -->
      <VDataTable :key="auditLogs.length" :headers="headers" :items="auditLogs" :items-per-page="itemsPerPage"
        :loading="actionLoading" class="text-no-wrap" hide-default-footer no-data-text="No audit logs found"
        expand-on-click>
        <!-- ID Column -->
        <template #item.id="{ index }">
          {{ (page - 1) * itemsPerPage + index + 1 }}
        </template>
        <template #expanded-row="{ item }">
          <tr class="v-data-table__tr">
            <td :colspan="headers.length" class="pa-4">
              <VTable density="compact">
                <thead>
                  <tr>
                    <th>Field</th>
                    <th class="text-error">Before</th>
                    <th class="text-success">After</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in normalizeCompareData(item)" :key="row.field">
                    <td class="font-weight-medium">
                      {{ row.field }}
                    </td>
                    <td>
                      {{ row.before }}
                    </td>
                    <td>
                      {{ row.after }}
                    </td>
                  </tr>
                </tbody>
              </VTable>
            </td>
          </tr>
        </template>


        <template #item.created_at="{ item }">
          {{ format(new Date(item.auditable.created_at), 'dd MMM yyyy HH:mm:ss') }}
        </template>

        <template #item.user_agent="{ item }">
          <div class="clamp-text text-wrap">
            {{ item.user_agent }}
          </div>
        </template>

        <template #item.created_by="{ item }">
          <div class="clamp-text text-wrap">
            {{ item.auditable.created_by }}
          </div>
        </template>

        <template #bottom>
          <TablePagination v-model:page="page" :items-per-page="itemsPerPage" :total-items="totalItems" />
        </template>
      </VDataTable>
    </VCard>
  </section>
</template>
