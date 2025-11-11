<script setup>


import AppSelect from "@core/components/app-form-elements/AppSelect.vue"
import AppTextField from "@core/components/app-form-elements/AppTextField.vue"

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  node: {
    type: Object,
    default: () => ({}),
  },
  databaseConnections: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['update:open', 'config'])

const actionOptions = [
  { label: 'Subscriber to single topic', value: 'single_sub' },
  { label: 'Dynamic subscription', value: 'dynamic_sub' },
]

watch(() => (props.protocolConfigurations), () => {
  console.log(props.protocolConfigurations)
}, { immediate: true })

const outputOptions = [
  { label: 'auto-detect (parsed JSON Object, string or buffer)', value: 'auto_detect_1' },
  { label: 'auto-detect (string or buffer)', value: 'auto_detect_2' },
  { label: 'a Buffer', value: 'buffer' },
  { label: 'a String', value: 'string' },
  { label: 'a Parsed JSON Object', value: 'parsed_json_object' },
  { label: 'a Base64 encoded string ', value: 'base64_encoded_string' },
]

const dialogVisibleUpdate = val => {
  emit('update:open', val)
}

const currentTab = ref(0)

const config = ref()

watch(props.node, () => {
  if (props.node.config) {
    config.value = {
      database_connection_id: '',
      action: '',
      topic: '',
      output: '',
      name: '',
      qos: 0,
      retain: false,
    }
  } else {
    config.value = {
      database_connection_id: '',
      action: '',
      topic: '',
      output: '',
      name: '',
      qos: 0,
      retain: false,
    }
  }
}, { immediate: true })

const submitConfig = () => {
  emit('config', { ...config.value, node_id: props.node.id })
  emit('update:open', false)
}

const resetConfig = () => {
  config.value = {
    broker: props.node.config.broker,
    port: props.node.config.port,
    topic: props.node.config.topic,
    username: '',
    password: '',
    qos: 0,
    retained: false,
  }
}
</script>

<template>
  <VDialog
    :model-value="props.open"
    :width="$vuetify.display.smAndDown ? 'auto' : 900"
    @update:model-value="dialogVisibleUpdate"
  >
    <!-- 👉 Dialog close btn -->
    <DialogCloseBtn @click="$emit('update:open', false)"/>

    <VCard class="share-project-dialog pa-2 pa-sm-10">
      <VCardText>
        <h4 class="text-h4 text-center mb-2">
          Database Sink Configuration
        </h4>
        <p class="text-body-1 text-center mb-6">
          Manage sink configuration
        </p>
        <div class="w-full flex justify-center mb-5">
          <VTabs
            v-model="currentTab"
            class="v-tabs-pill "
          >
            <VTab>Information</VTab>
            <VTab>Description</VTab>
            <VTab>Appearance</VTab>
          </VTabs>
        </div>
        <VForm @submit.prevent="submitConfig">
          <VRow>

            <!-- 👉 QoS -->
            <VCol cols="12">
              <VRow no-gutters>
                <VCol
                  cols="12"
                  md="3"
                  class="d-flex align-items-center"
                >
                  <label
                    class="v-label text-body-2 text-high-emphasis"
                    for="protocol_configurations"
                  >Database Connections</label>
                </VCol>
                <VCol
                  cols="12"
                  md="9"
                >
                  <VSelect
                    id="protocol_configurations"
                    v-model="config.database_connection_id"
                    :items="databaseConnections"
                    item-title="name"
                    item-value="id"
                    label="Select Database Connections"
                    prepend-inner-icon="tabler-protocol"
                  />
                </VCol>
              </VRow>
            </VCol>


            <!-- 👉 Topic -->
            <VCol cols="12">

              <VRow no-gutters>

                <VCol
                  cols="12"
                  md="3"
                  class="d-flex align-items-center"
                >
                  <label
                    class="v-label text-body-2 text-high-emphasis"
                    for="mqttTopic"
                  >Topic</label>
                </VCol>
                <VCol
                  cols="12"
                  md="9"
                >
                  <AppTextField
                    id="mqttTopic"
                    v-model="config.topic"
                    prepend-inner-icon="tabler-hash"
                    placeholder="sensor/data"
                    persistent-placeholder
                  />
                </VCol>
              </VRow>
            </VCol>


            <VCol cols="12">
              <VRow no-gutters>
                <VCol
                  cols="12"
                  md="3"
                  class="d-flex align-items-center"
                >
                  <label
                    class="v-label text-body-2 text-high-emphasis"
                    for="output"
                  >Output</label>
                </VCol>
                <VCol
                  cols="12"
                  md="9"
                >
                  <VSelect
                    id="output"
                    v-model="config.output"
                    :items="outputOptions"
                    label="Select Output"
                    prepend-inner-icon="tabler-map"
                    item-title="label"
                    item-value="id"

                  />
                </VCol>
              </VRow>
            </VCol>
            <VCol cols="12">

              <VRow no-gutters>

                <VCol
                  cols="12"
                  md="3"
                  class="d-flex align-items-center"
                >
                  <label
                    class="v-label text-body-2 text-high-emphasis"
                    for="mqttTopic"
                  >Name</label>
                </VCol>
                <VCol
                  cols="12"
                  md="9"
                >
                  <AppTextField
                    id="mqttTopic"
                    v-model="config.name"
                    prepend-inner-icon="tabler-hash"
                    placeholder="MQTT 1"
                    persistent-placeholder
                  />
                </VCol>
              </VRow>
            </VCol>


            <!-- 👉 Submit & Reset -->
            <VCol cols="12">
              <VRow no-gutters>
                <VCol
                  cols="12"
                  md="3"
                />
                <VCol
                  cols="12"
                  md="9"
                >
                  <VBtn
                    type="submit"
                    class="me-4"
                  >
                    Save
                  </VBtn>
                  <VBtn
                    color="secondary"
                    variant="tonal"
                    type="reset"
                    @click="resetConfig"
                  >
                    Reset
                  </VBtn>
                </VCol>
              </VRow>
            </VCol>
          </VRow>
        </VForm>
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style lang="scss">
.share-project-dialog {
  .card-list {
    --v-card-list-gap: 1rem;
  }
}
</style>
