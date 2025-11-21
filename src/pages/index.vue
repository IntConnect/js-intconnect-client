<script setup>
import ThreeViewer from "@/components/ThreeViewer.vue"
import ApexChartBalance from "@/components/dashboard/ApexChartBalance.vue"
import ApexChartDataScience from "@/components/dashboard/ApexChartDataScience.vue"
import AnalyticsAverageDailySales from "@/components/dashboard/AnalyticsAverageDailySales.vue"
import EcommerceExpensesRadialBarCharts from "@/components/dashboard/EcommerceExpensesRadialBarCharts.vue"
</script>

<template>
  <div>
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
            <VCardSubtitle>Commercial networks &amp; enterprises</VCardSubtitle>

            <template #append>
              <div class="d-flex align-center">
                <h6 class="text-h6 me-3">
                  $221,267
                </h6>
                <VChip
                  color="success"
                  label
                >
                  <VIcon
                    icon="tabler-arrow-up"
                    size="15"
                    start
                  />
                  <span>22%</span>
                </VChip>
              </div>
            </template>
          </VCardItem>

          <VCardText>
            <ApexChartBalance />
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
            <VCardTitle>Area Chart</VCardTitle>
            <VCardSubtitle>Commercial networks</VCardSubtitle>
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
        <VRow
          class="fill-height"
          no-gutters
        >
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
            <VCardTitle>Data Science</VCardTitle>
          </VCardItem>

          <VCardText>
            <ApexChartDataScience />
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
            <VCardTitle>Data Science</VCardTitle>
          </VCardItem>

          <VCardText>
            <ApexChartDataScience />
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

