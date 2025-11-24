<script setup>
import { useTheme } from 'vuetify'

const vuetifyTheme = useTheme()

const balanceChartConfig = computed(() => {
  const themeColors = vuetifyTheme.current.value
  const { themeBorderColor, themeDisabledTextColor } = colorVariables(themeColors)

  return {
    chart: {
      parentHeightOffset: 0,
      zoom: { enabled: false },
      toolbar: { show: false },
    },
    colors: ['#ff9f43'],
    stroke: { curve: 'straight' },
    dataLabels: { enabled: false },
    markers: {
      strokeWidth: 7,
      strokeOpacity: 1,
      colors: ['#ff9f43'],
      strokeColors: ['#fff'],
    },
    grid: {
      padding: { top: -10 },
      borderColor: themeBorderColor,
      xaxis: {
        lines: { show: true },
      },
    },
    tooltip: {
      custom(data) {
        return `<div class="bar-chart pa-2">
          <span>${data.series[data.seriesIndex][data.dataPointIndex]}%</span>
        </div>`
      },
    },
    yaxis: {
      labels: {
        style: { colors: themeDisabledTextColor, fontSize: '0.8125rem' },
      },
    },
    xaxis: {
      axisBorder: { show: false },
      axisTicks: { color: themeBorderColor },
      crosshairs: {
        stroke: { color: themeBorderColor },
      },
      labels: {
        style: { colors: themeDisabledTextColor, fontSize: '0.8125rem' },
      },
      categories: [
        '5',
        '10',
        '15',
        '30',
        '45',
        '60',
      ],
    },
  }
})

const series = [{
  data: [
    1000,
    0.800,
    0.600,
    0.400,
    0.200,
    0.000,
  ],
}]
</script>

<template>
  <VueApexCharts
    :options="balanceChartConfig"
    :series="series"
    height="325"
    type="line"
  />
</template>
