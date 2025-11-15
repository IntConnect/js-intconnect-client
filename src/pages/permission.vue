<script setup lang="ts">
import {ref, onMounted} from 'vue'
import {$api} from '@/utils/api' // pastikan sudah ada ofetch instance
import AppCardActions from "@core/components/cards/AppCardActions.vue"
import {parseISO, format} from 'date-fns'

interface Permission {
  id: number
  name: string
  label: string
  created_at: string
  updated_at: string
}

// reactive permissionResponses table
const permissionResponses = ref<Permission[]>([])

// header table
const headers = [
  {title: 'ID', key: 'id'},
  {title: 'Name', key: 'name'},
  {title: 'Label', key: 'label'},
  {title: 'Feature', key: 'feature'},
  {title: 'Created At', key: 'created_at'},
  {title: 'Updated At', key: 'updated_at'},
]

// fetch permissions
async function fetchPermissions() {
  try {
    const response = await $api('/permissions', {
      method: 'GET',
    }) // sesuaikan endpoint
    permissionResponses.value = response.permissions.map(p => ({
      ...p,
      checked: false, // tambahkan flag default
    }))
  } catch (err) {
    console.error('Failed to fetch permissions:', err)
  }
}

// panggil saat mounted, mirip useEffect
onMounted(() => {
  fetchPermissions()
})
</script>

<template>
  <VCard>
    <AppCardActions title="Permissions" no-actions>
      <VDataTable
        :headers="headers"
        :items="permissionResponses"
        :items-per-page="50"
      >
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
      </VDataTable>

    </AppCardActions>
  </VCard>
</template>
