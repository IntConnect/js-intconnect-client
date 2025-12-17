<script setup>
import { ref, watch, onMounted } from 'vue'
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import TablePagination from "@core/components/TablePagination.vue"
import DeleteDialog from "@/components/general/DeleteDialog.vue"
import { format } from "date-fns"
import { useManageMqttBroker } from "@/composables/useManageMqttBroker"
import ManageMqttBrokerDrawer from "@/components/drawer/ManageMqttBrokerDrawer.vue"
import AlertDialog from "@/components/general/AlertDialog.vue"

// ==========================================
// Composable
// ==========================================
const {
  mqttBrokers,
  loading,
  actionLoading,
  fetchMqttBrokers,
  saveMqttBroker,
  deleteMqttBroker,
  totalItems,
  totalPages,
  error,
  formErrors,
  clearFormErrors,
  clearErrors,
  currentPage: page, pageSize: itemsPerPage,
} = useManageMqttBroker()

// ==========================================
// Constants
// ==========================================
const TABLE_HEADERS = [
  { title: 'Id', key: 'id', sortable: true },
  { title: 'Host Name', key: 'host_name', sortable: true },
  { title: 'MQTT Port', key: 'mqtt_port', sortable: true },
  { title: 'WS Port', key: 'ws_port', sortable: true },
  { title: 'Username', key: 'username', sortable: false },
  { title: 'Password', key: 'password', sortable: false },
  { title: 'Status', key: 'is_active', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]


// ==========================================
// Reactive States
// ==========================================
const searchQuery = ref("")
const sortBy = ref("id")
const sortOrder = ref("asc")

// UI States
const isManageMqttBrokerVisible = ref(false)
const showDeleteDialog = ref(false)
const selectedMqttBroker = ref(null)
const showAlertDialog = ref(false)
const alertMessage = ref('')


// ==========================================
// Methods
// ==========================================

/**
 * Load mqttBrokers from API
 */
const loadMqttBrokers = async () => {
  await fetchMqttBrokers({
    page: page.value,
    size: itemsPerPage.value,
    query: searchQuery.value,
    sort: sortBy.value,
    order: sortOrder.value,
  })
}

/**
 * Open drawer for adding new mqttBroker
 */
const openManageMqttBrokerDrawer = () => {
  selectedMqttBroker.value = null
  clearFormErrors()
  isManageMqttBrokerVisible.value = true
}

/**
 * Close add/edit drawer
 */
const closeManageMqttBrokerDrawer = () => {
  isManageMqttBrokerVisible.value = false
  selectedMqttBroker.value = null
  clearFormErrors()
}

/**
 * Open drawer for editing mqttBroker
 */
const handleEdit = mqttBroker => {
  selectedMqttBroker.value = { ...mqttBroker }
  clearFormErrors()
  isManageMqttBrokerVisible.value = true
}

/**
 * Open delete confirmation dialog
 */
const openDeleteDialog = mqttBroker => {
  selectedMqttBroker.value = mqttBroker
  showDeleteDialog.value = true
}

/**
 * Close delete dialog
 */
const closeDeleteDialog = () => {
  showDeleteDialog.value = false
  selectedMqttBroker.value = null
}

/**
 * Handle save mqttBroker (create or update)
 */
const handleSaveMqttBroker = async mqttBrokerData => {

  const result = await saveMqttBroker(mqttBrokerData)

  if (result.success) {
    closeManageMqttBrokerDrawer()
    await nextTick()

    showAlertDialog.value = true
    alertMessage.value = 'Success manage MQTT Broker'
  } else {
    console.error('Failed to save mqttBroker:', result.error || result.errors)
  }
}

/**
 * Handle delete mqttBroker
 */
const handleDeleteMqttBroker = async formData => {
  if (!selectedMqttBroker.value?.id) {
    console.warn('No MQTT Broker selected for deletion')

    return
  }


  const result = await deleteMqttBroker(selectedMqttBroker.value.id, formData)

  if (result.success) {
    closeDeleteDialog()
    showAlertDialog.value = true
    alertMessage.value = 'Success delete MQTT Broker'

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
  loadMqttBrokers()
})


watch([page, itemsPerPage], loadMqttBrokers)

// ==========================================
// Lifecycle
// ==========================================
onMounted(() => {
  loadMqttBrokers()
})
</script>

<template>
  <section>
    <VCol cols="12">
      <h4 class="text-h4 mb-1">
        All MQTT Brokers
      </h4>
      <p class="text-body-1 mb-0">
        View and manage all MQTT brokers connected to your company’s system.
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
            @click="openManageMqttBrokerDrawer"
          >
            New MQTT Broker
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
        :key="mqttBrokers.length"
        :headers="TABLE_HEADERS"
        :items="mqttBrokers"
        :items-per-page="itemsPerPage"
        :loading="loading"
        class="text-no-wrap"
        hide-default-footer
        no-data-text="No MQTT Brokers found"
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

        <template #item.is_active="{ item }">
          <div
            v-if="item.is_active"
            class="d-flex align-center gap-x-4"
          >
            <VChip color="primary">
              Active
            </VChip>
          </div>
          <div
            v-if="!item.is_active"
            class="d-flex align-center gap-x-4"
          >
            <VChip color="error">
              Inactive
            </VChip>
          </div>
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
      title="Delete MQTT Broker"
      @submit="handleDeleteMqttBroker"
    />

    <!-- Add/Edit MqttBroker Drawer -->
    <ManageMqttBrokerDrawer
      v-model:is-drawer-open="isManageMqttBrokerVisible"
      :form-errors="formErrors"
      :loading="actionLoading"
      :mqtt-broker-data="selectedMqttBroker"
      @close="closeManageMqttBrokerDrawer"
      @mqtt-broker-data="handleSaveMqttBroker"
    />
  </section>
  <AlertDialog
    v-model:is-dialog-visible="showAlertDialog"
    :title-alert="alertMessage"
  />
</template>
