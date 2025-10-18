<script setup>
const props = defineProps({
  isDialogVisible: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['update:isDialogVisible'])

const dialogVisibleUpdate = val => {
  emit('update:isDialogVisible', val)
}
const currentTab = ref(0)


const config = ref({
  host: '',
  port: 1883,
  topic: '',
  username: '',
  password: '',
  qos: 0,
  retained: false,
})

const submitConfig = () => {
  emit('config', { ...config.value })
  emit('update:isDialogVisible', false)
}

const resetConfig = () => {
  config.value = {
    host: '',
    port: 1883,
    topic: '',
    username: '',
    password: '',
    qos: 0,
    retained: false,
  }
}

</script>

<template>
  <VDialog
    :model-value="props.isDialogVisible"
    :width="$vuetify.display.smAndDown ? 'auto' : 900"
    @update:model-value="dialogVisibleUpdate"
  >
    <!-- 👉 Dialog close btn -->
    <DialogCloseBtn @click="$emit('update:isDialogVisible', false)"/>

    <VCard class="share-project-dialog pa-2 pa-sm-10">
      <VCardText>
        <h4 class="text-h4 text-center mb-2">
          Mqtt Input
        </h4>
        <p class="text-body-1 text-center mb-6">
          Edit MQTT Config Node
        </p>
        <div class="w-full flex justify-center mb-2">
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
            <!-- 👉 Host -->
            <VCol cols="12">
              <VRow no-gutters>
                <VCol cols="12" md="3" class="d-flex align-items-center">
                  <label class="v-label text-body-2 text-high-emphasis" for="mqttHost">Host</label>
                </VCol>
                <VCol cols="12" md="9">
                  <AppTextField
                    id="mqttHost"
                    v-model="config.host"
                    prepend-inner-icon="tabler-server"
                    placeholder="broker.example.com"
                    persistent-placeholder
                  />
                </VCol>
              </VRow>
            </VCol>

            <!-- 👉 Port -->
            <VCol cols="12">
              <VRow no-gutters>
                <VCol cols="12" md="3" class="d-flex align-items-center">
                  <label class="v-label text-body-2 text-high-emphasis" for="mqttPort">Port</label>
                </VCol>
                <VCol cols="12" md="9">
                  <AppTextField
                    id="mqttPort"
                    v-model="config.port"
                    type="number"
                    prepend-inner-icon="tabler-plug"
                    placeholder="1883"
                    persistent-placeholder
                  />
                </VCol>
              </VRow>
            </VCol>

            <!-- 👉 Topic -->
            <VCol cols="12">
              <VRow no-gutters>
                <VCol cols="12" md="3" class="d-flex align-items-center">
                  <label class="v-label text-body-2 text-high-emphasis" for="mqttTopic">Topic</label>
                </VCol>
                <VCol cols="12" md="9">
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

            <!-- 👉 Username -->
            <VCol cols="12">
              <VRow no-gutters>
                <VCol cols="12" md="3" class="d-flex align-items-center">
                  <label class="v-label text-body-2 text-high-emphasis" for="mqttUser">Username</label>
                </VCol>
                <VCol cols="12" md="9">
                  <AppTextField
                    id="mqttUser"
                    v-model="config.username"
                    prepend-inner-icon="tabler-user"
                    placeholder="mqtt_user"
                    persistent-placeholder
                  />
                </VCol>
              </VRow>
            </VCol>

            <!-- 👉 Password -->
            <VCol cols="12">
              <VRow no-gutters>
                <VCol cols="12" md="3" class="d-flex align-items-center">
                  <label class="v-label text-body-2 text-high-emphasis" for="mqttPass">Password</label>
                </VCol>
                <VCol cols="12" md="9">
                  <AppTextField
                    id="mqttPass"
                    v-model="config.password"
                    type="password"
                    prepend-inner-icon="tabler-lock"
                    placeholder="••••••••"
                    persistent-placeholder
                  />
                </VCol>
              </VRow>
            </VCol>

            <!-- 👉 QoS -->
            <VCol cols="12">
              <VRow no-gutters>
                <VCol cols="12" md="3" class="d-flex align-items-center">
                  <label class="v-label text-body-2 text-high-emphasis" for="mqttQos">QoS</label>
                </VCol>
                <VCol cols="12" md="9">
                  <VSelect
                    id="mqttQos"
                    v-model="config.qos"
                    :items="[0, 1, 2]"
                    label="Select QoS"
                    prepend-inner-icon="tabler-signal"
                  />
                </VCol>
              </VRow>
            </VCol>

            <!-- 👉 Retained -->
            <VCol cols="12">
              <VRow no-gutters>
                <VCol cols="12" md="3" class="d-flex align-items-center">
                  <label class="v-label text-body-2 text-high-emphasis">Retained</label>
                </VCol>
                <VCol cols="12" md="9">
                  <VSwitch
                    v-model="config.retained"
                    inset
                    color="primary"
                    label="Retain message"
                  />
                </VCol>
              </VRow>
            </VCol>

            <!-- 👉 Submit & Reset -->
            <VCol cols="12">
              <VRow no-gutters>
                <VCol cols="12" md="3"/>
                <VCol cols="12" md="9">
                  <VBtn type="submit" class="me-4">Save</VBtn>
                  <VBtn color="secondary" variant="tonal" type="reset" @click="resetConfig">Reset</VBtn>
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
