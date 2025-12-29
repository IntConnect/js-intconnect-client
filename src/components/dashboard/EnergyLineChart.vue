<script setup>
import { useTheme } from 'vuetify'

const props = defineProps({
 
  realtimeData: {
    type: Array,
    required: true,
  },
  xCategories: {
    type: Array,
    required: true,
  },
  
})

const chartRef = ref(null)

const colorVariables = themeColors => {
  const themeSecondaryTextColor = `rgba(${hexToRgb(themeColors.colors['on-surface'])},${themeColors.variables['medium-emphasis-opacity']})`
  const themeDisabledTextColor = `rgba(${hexToRgb(themeColors.colors['on-surface'])},${themeColors.variables['disabled-opacity']})`
  const themeBorderColor = `rgba(${hexToRgb(String(themeColors.variables['border-color']))},${themeColors.variables['border-opacity']})`
  const themePrimaryTextColor = `rgba(${hexToRgb(themeColors.colors['on-surface'])},${themeColors.variables['high-emphasis-opacity']})`
  
  return { themeSecondaryTextColor, themeDisabledTextColor, themeBorderColor, themePrimaryTextColor }
}

const vuetifyTheme = useTheme()

const chartOptions = computed(() => {
  const categories = props.xCategories
  
  return getLineChartSimpleConfig(categories)
},
)

watch(
  () => props.xCategories,
  categories => {
    if (!chartRef.value || !categories.length) return

    chartRef.value.updateOptions({
      xaxis: {
        categories: [...categories],
      },
    }, false, false) // false = no redraw animation, true = update axis
  },
  { deep: true },
)

watch(
  () => props.realtimeData,
  series => {
    if (!chartRef.value) return

    chartRef.value.updateSeries(
      series.map(s => ({
        ...s,
        data: [...s.data],
      })),
      true, // <-- ANIMASI AKTIF
    )
  },
  { deep: true },
)



const getLineChartSimpleConfig = categories => {
  const {
    themeSecondaryTextColor,
    themeDisabledTextColor,
    themeBorderColor,
    themePrimaryTextColor,
  } = colorVariables(vuetifyTheme.current.value)

  return {
    chart: {
      parentHeightOffset: 0,
      zoom: { enabled: false },
      toolbar: { show: false },

      animations: {
        enabled: true,
        easing: 'linear',
        dynamicAnimation: {
          speed: 300,
        },
      },
    },

    colors: ['#ff9f43', '#28c76f'], // ✔ beda warna tiap line

    stroke: {
      curve: 'straight',
      width: 2,
    },

    dataLabels: { enabled: false },

    markers: {
      strokeWidth: 6,
      strokeOpacity: 1,
      strokeColors: '#fff',
    },

    grid: {
      padding: { top: -10 },
      borderColor: themeBorderColor,
    },

    legend: {
      labels: {
        colors: themeSecondaryTextColor,
      },
    },

   

    yaxis: {
      labels: {
        style: {
          colors: themePrimaryTextColor,
          fontSize: '0.8125rem',
        },
      },
    },

    xaxis: {
      categories: categories,
      axisBorder: { show: false },
      axisTicks: { color: themeBorderColor },
      labels: {
        style: {
          colors: Array(20).fill(themeSecondaryTextColor), // ✔ FIX HITAM
          fontSize: '0.8125rem',
        },
      },
      crosshairs: {
        stroke: { color: themeBorderColor },
      },
    },
  }
}
</script>

<template>
  <VueApexCharts
    ref="chartRef"

    :options="chartOptions"
    :series="realtimeData"
    height="400"
    type="line"
  />
</template>
