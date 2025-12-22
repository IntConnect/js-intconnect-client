<script setup>
import ThreeViewer from "@/components/ThreeViewer.vue"
import CoefficientOfPerformance from "@/components/dashboard/CoefficientOfPerformance.vue"
import LoadChillerWidget from "@/components/dashboard/LoadChillerWidget.vue"
import PowerChart from "@/components/dashboard/PowerChart.vue"
import ProductionChart from "@/components/dashboard/ProductionChart.vue"
import SystemEfficiencyChart from "@/components/dashboard/SystemEfficiencyChart.vue"

const {
  systemSetting,
  fetchSystemSetting,
} = useManageSystemSetting()

const {
  facilities,
  fetchFacilities,
} = useManageFacility()


const selectedMachineIds = ref([])
const selectedParameterIds = ref([])
const parameterId = ref([])
const interval = ref(0)
const formErrors = ref({})


const modelConfigurationReady = computed(() => {
  return Boolean(systemSetting.value) && Boolean(facilities.value)
})

onMounted(async () => {
  fetchSystemSetting({ isMinimal: true, key: "DASHBOARD_SETTINGS" })
  await fetchFacilities({ isMinimal: true })
  await nextTick()
})
</script>

<template>
  <div>
    <VRow class="match-height">
      <!-- 3D Viewer -->
      <VCol
        class="d-flex"
        cols="8"
        lg="8"
        md="8"
      >
        <ThreeViewer
          v-if="modelConfigurationReady"
          :facilities="facilities"
          :model-configuration="systemSetting"
          class="flex-grow-1"
        />
      </VCol>

      <!-- Widgets -->
      <VCol
        cols="4"
        lg="4"
        md="4"
      >
        <VRow class="match-height">
          <VCol
            cols="6"
            md="6"
            sm="12"
          >
            <LoadChillerWidget />
          </VCol>

          <VCol
            cols="6"
            md="6"
            sm="12"
          >
            <EnergyConsumptionWidget />
          </VCol>
        </VRow>
        <VRow class="match-height">
          <VCol
            cols="12"
            md="12"
            sm="12"
          >
            <RealtimeStats />
          </VCol>
        </VRow>
      </VCol>
    </VRow>
    <VRow class="match-height">
      <VCol
        cols="12"
        lg="6"
        md="6"
      >
        <VCard>
          <VCardItem class="d-flex flex-wrap justify-space-between gap-4">
            <VCardTitle>Power (kW/hr)</VCardTitle>
          </VCardItem>

          <VCardText>
            <PowerChart />
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        lg="6"
        md="6"
      >
        <VCard>
          <VCardItem class="d-flex flex-wrap justify-space-between gap-4">
            <VCardTitle>Production (kW/hr)</VCardTitle>
          </VCardItem>

          <VCardText>
            <ProductionChart />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <VRow class="match-height">
      <VCol
        class="d-flex"
        cols="4"
        lg="4"
        md="4"
      >
        <VCard class="flex-grow-1">
          <VCardItem class="d-flex flex-wrap justify-space-between gap-4">
            <VCardTitle>System Efficiency (kW/hr)</VCardTitle>
            <VCardSubtitle>Hourly efficiency metrics for system performance analysis</VCardSubtitle>

            <template #append>
              <div class="d-flex align-center">
                <VChip
                  color="success"
                  label
                >
                  <VIcon
                    icon="tabler-arrow-up"
                    size="15"
                    start
                  />
                  <span>22</span>
                </VChip>
              </div>
            </template>
          </VCardItem>

          <VCardText>
            <SystemEfficiencyChart />
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        cols="12"
        lg="8"
        md="8"
      >
        <VCard class="fill-height">
          <VCardItem class="d-flex flex-wrap justify-space-between gap-4">
            <VCardTitle>COP vs ENERGY</VCardTitle>
            <VCardSubtitle>Performance insights based on COP and energy usage</VCardSubtitle>
          </VCardItem>

          <VCardText>
            <VRow class="h-100">
              <VCol
                cols="12"
                lg="8"
                md="8"
              >
                <EnergyLineChart />
              </VCol>

              <VCol
                class="d-flex align-center justify-center h-100 mt-15"
                cols="12"
                lg="4"
                md="4"
              >
                <CoefficientOfPerformance />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
    <VRow>
      <VCol
        cols="12"
        lg="12"
        md="12"
      >
        <VCard class="fill-height">
          <VCardItem class="d-flex flex-wrap justify-space-between gap-4">
            <VCardTitle>Filter Machine & Parameter</VCardTitle>
            <VCardSubtitle>Performance insights based on COP and energy usage</VCardSubtitle>
          </VCardItem>

          <VCardText>
            <VRow class="h-100">
              <VCol
                class="d-flex flex-row gap-4 align-end"
                cols="12"
                lg="12"
                md="12"
              >
                <AppSelect
                  v-model="selectedMachineIds"
                  :error="!!formErrors.selected_machine_ids"
                  :error-messages="formErrors.selected_machine_ids || []"
                  :items="[]"
                  :rules="[requiredValidator]"
                  label="Machine"
                  placeholder="Select machine"
                />
                <AppSelect
                  v-model="selectedParameterIds"
                  :error="!!formErrors.selected_parameter_ids"
                  :error-messages="formErrors.selected_parameter_ids || []"
                  :items="[]"
                  :rules="[requiredValidator]"
                  label="Parameter"
                  placeholder="Select parameter"
                />
                <AppTextField
                  v-model="interval"
                  label="Interval (Minutes)"
                  placeholder="60"
                />
                <VBtn
                  color="error"
                  type="submit"
                >
                  Stop
                </VBtn>
                <VBtn type="submit">
                  Submit
                </VBtn>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
    <VRow class="match-height">
      <VCol
        cols="12"
        lg="12"
        md="12"
      >
        <VCard class="fill-height">
          <VCardItem class="d-flex flex-wrap justify-space-between gap-4">
            <VCardTitle>Realtime Chart</VCardTitle>
            <VCardSubtitle>Performance insights based on COP and energy usage</VCardSubtitle>
          </VCardItem>

          <VCardText>
            <VRow class="h-100">
              <VCol
                cols="12"
                lg="12"
                md="12"
              >
                <EnergyLineChart />
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
    <VRow class="match-height">
      <VCol
        class="d-flex"
        cols="6"
        lg="6"
        md="6"
      >
        <VCard class="flex-grow-1">
          <VCardItem class="d-flex flex-wrap justify-space-between gap-4">
            <VCardTitle>Monthly Average (kW/hr)</VCardTitle>
            <VCardSubtitle>Hourly efficiency metrics for system performance analysis</VCardSubtitle>

            <template #append>
              <div class="d-flex align-center">
                <VChip
                  color="success"
                  label
                >
                  <VIcon
                    icon="tabler-arrow-up"
                    size="15"
                    start
                  />
                  <span>22</span>
                </VChip>
              </div>
            </template>
          </VCardItem>

          <VCardText>
            <SystemEfficiencyChart />
          </VCardText>
        </VCard>
      </VCol>
      <VCol
        class="d-flex"
        cols="6"
        lg="6"
        md="6"
      >
        <VCard class="flex-grow-1">
          <VCardItem class="d-flex flex-wrap justify-space-between gap-4">
            <VCardTitle>Weekly Average (kW/hr)</VCardTitle>
            <VCardSubtitle>Hourly efficiency metrics for system performance analysis</VCardSubtitle>

            <template #append>
              <div class="d-flex align-center">
                <VChip
                  color="success"
                  label
                >
                  <VIcon
                    icon="tabler-arrow-up"
                    size="15"
                    start
                  />
                  <span>22</span>
                </VChip>
              </div>
            </template>
          </VCardItem>

          <VCardText>
            <SystemEfficiencyChart />
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>


<style lang="scss">
@use "@core/scss/template/libs/apex-chart.scss";

.first-section {
  display: grid;
  grid-auto-flow: column;
  min-height: 600px; /* sesuaikan */
}

.first-section > .v-col {
  display: flex;
}
</style>

