<script setup>
import { useTheme } from 'vuetify'
import { getColumnChartConfig } from '@core/libs/apex-chart/apexCharConfig'

const vuetifyTheme = useTheme()

const chartConfig = computed(() => {
  const themeColors = vuetifyTheme.current.value

  const columnColors = {
    series1: '#826af9',
    bg: '#f8d3ff',
  }

  const { themeSecondaryTextColor, themeBorderColor, themeDisabledTextColor } = colorVariables(themeColors)

  return {
    chart: {
      offsetX: -10,
      stacked: true,
      parentHeightOffset: 0,
      toolbar: { show: false },
    },
    fill: { opacity: 1 },
    dataLabels: { enabled: false },
    colors: [columnColors.series1],
    legend: {
      position: 'top',
      horizontalAlign: 'left',
      fontSize: '13px',
      labels: { colors: themeSecondaryTextColor },
      markers: {
        offsetY: 1,
        offsetX: -3,
      },
      itemMargin: {
        vertical: 3,
        horizontal: 10,
      },
    },
    stroke: {
      show: true,
      colors: ['transparent'],
    },
    plotOptions: {
      bar: {
        columnWidth: '15%',
        colors: {
          backgroundBarRadius: 10,
          backgroundBarColors: [columnColors.bg, columnColors.bg, columnColors.bg, columnColors.bg, columnColors.bg],
        },
      },
    },
    grid: {
      borderColor: themeBorderColor,
      xaxis: {
        lines: { show: true },
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
      categories: ['7/12', '8/12', '9/12', '10/12', '11/12', '12/12', '13/12', '14/12', '15/12'],
      crosshairs: {
        stroke: { color: themeBorderColor },
      },
      labels: {
        style: { colors: themeDisabledTextColor, fontSize: '0.8125rem' },
      },
    },
    responsive: [
      {
        breakpoint: 600,
        options: {
          plotOptions: {
            bar: {
              columnWidth: '35%',
            },
          },
        },
      },
    ],
  }
})

const series = [{
  name: 'Series 1',
  data: [
    85,
    100,
    30,
    40,
    95,
    90,
    30,
    110,
    62,
  ],
}]
</script>

<template>
  <VueApexCharts
    :options="chartConfig"
    :series="series"
    height="400"
    type="bar"
  />
</template>
