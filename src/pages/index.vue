<script setup>
import ThreeViewer from "@/components/ThreeViewer.vue"
import SystemEfficiencyChart from "@/components/dashboard/SystemEfficiencyChart.vue"
import AnalyticsAverageDailySales from "@/components/dashboard/AnalyticsAverageDailySales.vue"
import EcommerceExpensesRadialBarCharts from "@/components/dashboard/EcommerceExpensesRadialBarCharts.vue"
import PowerChart from "@/components/dashboard/PowerChart.vue"
import ProductionChart from "@/components/dashboard/ProductionChart.vue"
import DailyEnergyConsumptionTrendDiagramChart from "@/components/dashboard/DailyEnergyConsumptionTrendDiagramChart.vue"
import HourlyEnergyConsumptionTrendDiagramChart
  from "@/components/dashboard/HourlyEnergyConsumptionTrendDiagramChart.vue"
</script>

<template>
  <div>
    <VRow class="match-height">
      <VCol
        cols="12"
        lg="12"
        md="12"
      >
        <AnalyticsEarningReportsWeeklyOverview />
      </VCol>
    </VRow>
    <VRow class="match-height">
      <VCol
        class="d-flex"
        cols="7"
        lg="7"
        md="7"
      >
        <ThreeViewer class="flex-grow-1" />
      </VCol>
      <VCol
        class="d-flex"
        cols="5"
        lg="5"
        md="5"
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
        cols="12"
        lg="7"
        md="7"
      >
        <VCard class="fill-height">
          <VCardItem class="d-flex flex-wrap justify-space-between gap-4">
            <VCardTitle>COP vs ENERGY</VCardTitle>
            <VCardSubtitle>Performance insights based on COP and energy usage</VCardSubtitle>
          </VCardItem>

          <VCardText>
            <ApexChartAreaChart />
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        lg="5"
        md="5"
      >
        <!-- 👇 Bungkus semua dengan VRow -->
        <VRow class="fill-height">
          <VCol cols="12">
            <EcommerceExpensesRadialBarCharts />
          </VCol>
          <VCol
            cols="12"
            md="6"
            sm="6"
          >
            <AnalyticsAverageDailySales />
          </VCol>
          <VCol
            cols="12"
            md="6"
            sm="6"
          >
            <AnalyticsAverageDailySales />
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
            <VCardTitle>Daily Energy Consumption Trend Diagram</VCardTitle>
          </VCardItem>

          <VCardText>
            <DailyEnergyConsumptionTrendDiagramChart />
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
            <VCardTitle>Hourly Energy Consumption Trend Diagram</VCardTitle>
          </VCardItem>

          <VCardText>
            <HourlyEnergyConsumptionTrendDiagramChart />
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

