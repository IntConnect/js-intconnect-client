<script setup>
import ThreeViewer from "@/components/ThreeViewer.vue"
import SystemEfficiencyChart from "@/components/dashboard/SystemEfficiencyChart.vue"
import LoadChillerWidget from "@/components/dashboard/LoadChillerWidget.vue"
import CoefficientOfPerformance from "@/components/dashboard/CoefficientOfPerformance.vue"
import PowerChart from "@/components/dashboard/PowerChart.vue"
import ProductionChart from "@/components/dashboard/ProductionChart.vue"
</script>

<template>
  <div>
    <VRow class="match-height">
      <VCol
        cols="12"
        md="3"
        sm="3"
      >
        <LoadChillerWidget />
      </VCol>
      <VCol
        cols="12"
        md="3"
        sm="3"
      >
        <EnergyConsumptionWidget />
      </VCol>
      <VCol
        cols="12"
        lg="6"
        md="6"
      >
        <AnalyticsEarningReportsWeeklyOverview />
      </VCol>
    </VRow>
    <VRow class="match-height">
      <VCol
        class="d-flex"
        cols="8"
        lg="8"
        md="8"
      >
        <ThreeViewer class="flex-grow-1" />
      </VCol>
      <VCol
        cols="12"
        lg="4"
        md="4"
      >
        <VRow class="match-height">
          <VCol
            cols="12"
            lg="12"
            md="12"
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
            lg="12"
            md="12"
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
                <ApexChartAreaChart />
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

