<script setup>
import { computed } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import { useTheme } from 'vuetify'

/**
 * PROPS
 * value  : nilai COP (contoh: 5.20)
 * height : tinggi chart
 */
const props = defineProps({
  value: {
    type: Number,
    required: true,
    default: 5.2,
  },
  height: {
    type: Number,
    default: 420,
  },
})

/**
 * SERIES
 * Apex radialBar hanya butuh 1 nilai
 */
const series = computed(() => [props.value])
const vuetifyTheme = useTheme()
const { themeSecondaryTextColor, themePrimaryTextColor } = colorVariables(vuetifyTheme.current.value)

/**
 * GAUGE CONFIG
 */
const chartOptions = computed(() => ({
  chart: {
    type: 'radialBar',
    sparkline: {
      enabled: true,
    },
  },

  plotOptions: {
    radialBar: {
      startAngle: -90,
      endAngle: 90,
      hollow: {
        size: '65%',
      },
      track: {
        background: '#e0e0e0',
        strokeWidth: '100%',
      },
      dataLabels: {
        name: {
          show: true,
          offsetY: 36,
          fontSize: '14px',
          fontWeight: 500,
        },
        value: {
          show: true,
          offsetY: -8,
          fontSize: '36px',
          fontWeight: 600,
          color: themeSecondaryTextColor,
          formatter: val => Number(val).toFixed(2),
        },
      },
    },
  },

  fill: {
    type: 'gradient',
    gradient: {
      shade: 'light',
      type: 'horizontal',
      shadeIntensity: 0.6,
      gradientToColors: ['#1e88e5'],
      colorStops: [
        { offset: 0, color: '#c62828' },   // merah
        { offset: 35, color: '#f9a825' },  // kuning
        { offset: 65, color: '#2e7d32' },  // hijau
        { offset: 100, color: '#1e88e5' }, // biru
      ],
    },
  },

  stroke: {
    lineCap: 'round',
  },

  labels: ['COP'],
}))
</script>

<template>
  <VueApexCharts
    type="radialBar"
    :options="chartOptions"
    :series="series"
    :height="height"
  />
</template>
