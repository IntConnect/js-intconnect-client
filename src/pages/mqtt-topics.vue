<script setup>
import ManageMqttTopicDrawer from "@/components/drawer/ManageMqttTopicDrawer.vue"
import AlertDialog from "@/components/general/AlertDialog.vue"
import DeleteDialog from "@/components/general/DeleteDialog.vue"
import { useManageMqttTopic } from "@/composables/useManageMqttTopic"
import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"
import TablePagination from "@core/components/TablePagination.vue"
import { onMounted, ref, watch } from 'vue'

// ==========================================
// Composable
// ==========================================
const {
  mqttTopics,
  mqttTopicDependency,
  loading,
  actionLoading,
  fetchMqttTopics,
  fetchMqttTopicDependency,
  saveMqttTopic,
  deleteMqttTopic,
  totalItems,
  totalPages,
  error,
  formErrors,
  clearFormErrors,
  clearErrors,
  currentPage: page, pageSize: itemsPerPage,
} = useManageMqttTopic()

// ==========================================
// Constants
// ==========================================
const TABLE_HEADERS = [
  { title: 'Id', key: 'id', sortable: true },
  { title: 'Machine', key: 'machine', sortable: true },
  { title: 'Mqtt Broker', key: 'mqtt_broker', sortable: true },
  { title: 'Name', key: 'name', sortable: true },
  { title: 'QoS', key: 'qos', sortable: false },
  { title: 'Actions', key: 'actions', sortable: false },
]

// ==========================================
// Reactive States
// ==========================================
const searchQuery = ref("")
const sortBy = ref("id")
const sortOrder = ref("asc")

// UI States
const isManageMqttTopic = ref(false)
const showDeleteDialog = ref(false)
const selectedMqttTopic = ref(null)
const showAlertDialog = ref(false)
const alertMessage = ref('')


// ==========================================
// Methods
// ==========================================

/**
 * Load mqttTopics from API
 */
const loadMqttTopic = async () => {
  await fetchMqttTopics({
    page: page.value,
    size: itemsPerPage.value,
    query: searchQuery.value,
    sort: sortBy.value,
    order: sortOrder.value,
  })
}

/**
 * Open drawer for adding new mqttTopic
 */
const openManageMqttTopic = () => {
  selectedMqttTopic.value = null
  clearFormErrors()
  isManageMqttTopic.value = true
}

/**
 * Close add/edit drawer
 */
const closeManageMqttTopic = () => {
  isManageMqttTopic.value = false
  selectedMqttTopic.value = null
  clearFormErrors()
}

/**
 * Open drawer for editing mqttTopic
 */
const handleEdit = mqttTopic => {
  selectedMqttTopic.value = { ...mqttTopic }
  clearFormErrors()
  isManageMqttTopic.value = true
}

/**
 * Open delete confirmation dialog
 */
const openDeleteDialog = mqttTopic => {
  selectedMqttTopic.value = mqttTopic
  showDeleteDialog.value = true
}

/**
 * Close delete dialog
 */
const closeDeleteDialog = () => {
  showDeleteDialog.value = false
  selectedMqttTopic.value = null
}

/**
 * Handle save mqttTopic (create or update)
 */
const handleSaveMqttTopic = async mqttTopicData => {

  const result = await saveMqttTopic(mqttTopicData)

  if (result.success) {
    closeManageMqttTopic()
    await nextTick()

    showAlertDialog.value = true
    alertMessage.value = 'Success manage MQTT Topic'
  } else {
    console.error('Failed to save mqttTopic:', result.error || result.errors)
  }
}

/**
 * Handle delete mqttTopic
 */
const handleDeleteMqttTopic = async formData => {
  if (!selectedMqttTopic.value?.id) {
    console.warn('No MQTT Topic selected for deletion')

    return
  }


  const result = await deleteMqttTopic(selectedMqttTopic.value.id, formData)

  if (result.success) {
    closeDeleteDialog()
    showAlertDialog.value = true
    alertMessage.value = 'Success delete MQTT Topic'

  } else {
    console.error('Failed to delete MQTT Topic:', result.error)

    // Optional: Show error notification
  }
}

// ==========================================
// Watchers
// ==========================================

// Reset to page 1 when search query changes
watch(searchQuery, () => {
  page.value = 1
  loadMqttTopic()
})


watch([page, itemsPerPage], loadMqttTopic)

// ==========================================
// Lifecycle
// ==========================================
onMounted(() => {
  loadMqttTopic()
  fetchMqttTopicDependency()
})
</script>

<template>
  <section>
    <VCol cols="12">
      <h4 class="text-h4 mb-1">
        All MQTT Topics
      </h4>
      <p class="text-body-1 mb-0">
        Find all of your company’s administrator accounts and their associate roles.
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
            @click="openManageMqttTopic"
          >
            New MQTT Topic
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
        :key="mqttTopics.length"
        :headers="TABLE_HEADERS"
        :items="mqttTopics"
        :items-per-page="itemsPerPage"
        :loading="loading"
        class="text-no-wrap"
        hide-default-footer
        no-data-text="No MQTT Topics found"
      >
        <!-- ID Column -->
        <template #item.id="{ index }">
          {{ (page - 1) * itemsPerPage + index + 1 }}
        </template>


        <template #item.machine="{ item }">
          <div class="d-flex align-center gap-x-4">
            {{ item.machine.name }}
          </div>
        </template>

        <template #item.mqtt_broker="{ item }">
          <div class="d-flex align-center gap-x-4">
            {{ item.mqtt_broker.host_name }}
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
              <VTooltip
                activator="parent"
                location="top"
              >
                <span>Edit</span>
              </VTooltip>
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
              <VTooltip
                activator="parent"
                location="top"
              >
                <span>Delete</span>
              </VTooltip>
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
      :form-errors="formErrors"
      :loading="actionLoading"
      message="Please provide a reason for deletion"
      title="Delete MQTT Topic"
      @submit="handleDeleteMqttTopic"
    />

    <!-- Add/Edit MqttTopic Drawer -->
    <ManageMqttTopicDrawer
      v-model:is-drawer-open="isManageMqttTopic"
      :form-errors="formErrors"
      :loading="actionLoading"
      :mqtt-topic-data="selectedMqttTopic"
      :mqtt-topic-dependency="mqttTopicDependency"
      @close="closeManageMqttTopic"
      @mqtt-topic-data="handleSaveMqttTopic"
    />
  </section>
  <AlertDialog
    v-model:is-dialog-visible="showAlertDialog"
    :title-alert="alertMessage"
  />
</template>
