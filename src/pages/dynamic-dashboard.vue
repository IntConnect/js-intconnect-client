<script setup>
import { GridItem, GridLayout } from 'grid-layout-plus'
import { computed, onMounted, ref } from 'vue'
import VueApexCharts from 'vue3-apexcharts'

// Props
const props = defineProps({
  machineId: {
    type: [String, Number],
    default: 1,
  },
})

// Dummy parameters data with baseline information
const parameters = ref([
  { 
    id: 1, 
    name: 'Temperature Inlet', 
    unit: '°C', 
    code: 'TEMP_IN',
    is_watch: true,
    baseline: {
      type: 'range', // range, threshold, limit
      normal: { min: -0.5, max: 0.5 },
      warning: { min: -1, max: 1 },
      alarm: { min: -Infinity, max: -1, label: '> ±1°C in 15 min' },
    },
  },
  { 
    id: 2, 
    name: 'Temperature Outlet', 
    unit: '°C', 
    code: 'TEMP_OUT',
    is_watch: true,
    baseline: {
      type: 'range',
      good: { min: 4, max: 6 },
      warning: { min: 6, max: Infinity, label: '> 6°C' },
    },
  },
  { 
    id: 3, 
    name: 'Pressure', 
    unit: 'Bar', 
    code: 'PRESSURE',
    is_watch: true,
    baseline: {
      type: 'threshold',
      good: { min: 5.5, label: '> 5.5' },
      warning: { min: 4.5, max: 5.5, label: '4.5 - 5.5' },
      alarm: { max: 4.5, label: '< 4.5' },
    },
  },
  { 
    id: 4, 
    name: 'Flow Rate', 
    unit: 'L/min', 
    code: 'FLOW',
    is_watch: true,
    baseline: {
      type: 'threshold',
      normal: { min: 2.0, max: 3.5 },
      warning: { min: 3.5, max: 4.2 },
      alarm: { min: 4.2, max: Infinity },
    },
  },
  { 
    id: 5, 
    name: 'Power Consumption', 
    unit: 'kW', 
    code: 'POWER',
    is_watch: true,
    baseline: {
      type: 'limit',
      limit: 1000,
      period: 'month',
      label: '1000 kW/month',
    },
  },
  { 
    id: 6, 
    name: 'Vibration', 
    unit: 'mm/s', 
    code: 'VIBRATION',
    is_watch: true,
    baseline: {
      type: 'threshold',
      normal: { max: 85 },
      warning: { min: 85, max: 95 },
      alarm: { min: 95, max: Infinity },
    },
  },
  { 
    id: 7, 
    name: 'Humidity', 
    unit: '%', 
    code: 'HUMIDITY',
    is_watch: false,
    baseline: null,
  },
  { 
    id: 8, 
    name: 'Speed', 
    unit: 'RPM', 
    code: 'SPEED',
    is_watch: false,
    baseline: null,
  },
  {
    id: 9,
    name: 'Energy Cost',
    unit: 'IDR',
    code: 'COST',
    is_watch: true,
    baseline: {
      type: 'limit',
      limit: 30000000,
      period: 'month',
      label: 'Rp 30.000.000/month',
    },
  },
  {
    id: 10,
    name: 'Bearing Temperature',
    unit: '°C',
    code: 'BEARING_TEMP',
    is_watch: true,
    baseline: {
      type: 'threshold',
      normal: { min: 15, max: 35 },
      warning: { min: 35, max: 45 },
      alarm: { min: 45, max: Infinity },
    },
  },
])

// Helper function to get parameter status based on value and baseline
const getParameterStatus = (value, baseline) => {
  if (!baseline) return { status: 'normal', color: '#94a3b8', label: 'No Baseline' }

  if (baseline.type === 'limit') {
    // For limit type (accumulated values)
    const percentage = (value / baseline.limit) * 100
    if (percentage < 70) return { status: 'good', color: '#10b981', label: 'Normal', percentage }
    if (percentage < 90) return { status: 'warning', color: '#f59e0b', label: 'Warning', percentage }
    
    return { status: 'alarm', color: '#ef4444', label: 'Critical', percentage }
  }

  if (baseline.type === 'threshold') {
    // Check alarm first
    if (baseline.alarm) {
      if (baseline.alarm.min !== undefined && value >= baseline.alarm.min) {
        return { status: 'alarm', color: '#ef4444', label: 'Alarm' }
      }
      if (baseline.alarm.max !== undefined && value <= baseline.alarm.max) {
        return { status: 'alarm', color: '#ef4444', label: 'Alarm' }
      }
    }

    // Check warning
    if (baseline.warning) {
      if (baseline.warning.min !== undefined && baseline.warning.max !== undefined) {
        if (value >= baseline.warning.min && value <= baseline.warning.max) {
          return { status: 'warning', color: '#f59e0b', label: 'Warning' }
        }
      } else if (baseline.warning.min !== undefined && value >= baseline.warning.min) {
        return { status: 'warning', color: '#f59e0b', label: 'Warning' }
      } else if (baseline.warning.max !== undefined && value <= baseline.warning.max) {
        return { status: 'warning', color: '#f59e0b', label: 'Warning' }
      }
    }

    // Check good/normal
    if (baseline.good) {
      if (baseline.good.min !== undefined && baseline.good.max !== undefined) {
        if (value >= baseline.good.min && value <= baseline.good.max) {
          return { status: 'good', color: '#10b981', label: 'Good' }
        }
      } else if (baseline.good.min !== undefined && value >= baseline.good.min) {
        return { status: 'good', color: '#10b981', label: 'Good' }
      }
    }

    if (baseline.normal) {
      if (baseline.normal.min !== undefined && baseline.normal.max !== undefined) {
        if (value >= baseline.normal.min && value <= baseline.normal.max) {
          return { status: 'normal', color: '#10b981', label: 'Normal' }
        }
      }
    }

    return { status: 'unknown', color: '#94a3b8', label: 'Unknown' }
  }

  if (baseline.type === 'range') {
    // Similar to threshold but with different naming
    if (baseline.alarm) {
      const absValue = Math.abs(value)
      if (baseline.alarm.max !== undefined && absValue >= Math.abs(baseline.alarm.max)) {
        return { status: 'alarm', color: '#ef4444', label: 'Alarm' }
      }
    }

    if (baseline.warning) {
      const absValue = Math.abs(value)
      if (baseline.warning.min !== undefined && baseline.warning.max !== undefined) {
        if (absValue >= Math.abs(baseline.warning.min) && absValue <= Math.abs(baseline.warning.max)) {
          return { status: 'warning', color: '#f59e0b', label: 'Warning' }
        }
      }
    }

    if (baseline.normal || baseline.good) {
      const target = baseline.normal || baseline.good
      if (target.min !== undefined && target.max !== undefined) {
        if (value >= target.min && value <= target.max) {
          return { status: 'normal', color: '#10b981', label: 'Normal' }
        }
      }
    }

    return { status: 'warning', color: '#f59e0b', label: 'Out of Range' }
  }

  return { status: 'normal', color: '#94a3b8', label: 'N/A' }
}

// State
const isEditing = ref(false)
const showAddWidget = ref(false)
const showEditWidget = ref(false)
const selectedWidget = ref(null)
const fileInput = ref(null)

// Widget form
const widgetForm = ref({
  type: 'line',
  title: '',
  dataSourceIds: [], // Array of parameter IDs
  interval: 5, // minutes
  w: 6,
  h: 4,
  color: '#3b82f6',
  showLegend: true,
  showGrid: true,
  enableAnimation: true,
  yAxisLabel: '',
  xAxisLabel: 'Time',
  aggregation: 'avg', // avg, sum, min, max
})

// Chart types
const chartTypes = [
  { 
    value: 'line', 
    label: 'Line Chart', 
    icon: 'tabler-chart-line',
    color: 'primary',
    description: 'Show trends over time',
  },
  { 
    value: 'area', 
    label: 'Area Chart', 
    icon: 'tabler-chart-area',
    color: 'success',
    description: 'Filled line chart',
  },
  { 
    value: 'bar', 
    label: 'Bar Chart', 
    icon: 'tabler-chart-bar',
    color: 'info',
    description: 'Compare discrete values',
  },
  { 
    value: 'column', 
    label: 'Column Chart', 
    icon: 'tabler-chart-histogram',
    color: 'warning',
    description: 'Vertical bar chart',
  },
  { 
    value: 'scatter', 
    label: 'Scatter Plot', 
    icon: 'tabler-chart-dots',
    color: 'secondary',
    description: 'Show data distribution',
  },
  { 
    value: 'radar', 
    label: 'Radar Chart', 
    icon: 'tabler-chart-radar',
    color: 'error',
    description: 'Multi-dimensional data',
  },
  { 
    value: 'pie', 
    label: 'Pie Chart', 
    icon: 'tabler-chart-pie',
    color: 'primary',
    description: 'Show proportions',
  },
  { 
    value: 'donut', 
    label: 'Donut Chart', 
    icon: 'tabler-chart-donut',
    color: 'success',
    description: 'Ring-shaped pie chart',
  },
  { 
    value: 'heatmap', 
    label: 'Heatmap', 
    icon: 'tabler-baseline',
    color: 'warning',
    description: 'Show data density',
  },
  { 
    value: 'gauge', 
    label: 'Gauge Chart', 
    icon: 'tabler-gauge',
    color: 'info',
    description: 'Show current value',
  },
  { 
    value: 'metric', 
    label: 'Metric Card', 
    icon: 'tabler-numbers',
    color: 'secondary',
    description: 'Display key numbers',
  },
]

// Aggregation options
const aggregationOptions = [
  { value: 'avg', label: 'Average', icon: 'tabler-chart-line' },
  { value: 'sum', label: 'Sum', icon: 'tabler-sum' },
  { value: 'min', label: 'Minimum', icon: 'tabler-arrow-down' },
  { value: 'max', label: 'Maximum', icon: 'tabler-arrow-up' },
  { value: 'last', label: 'Last Value', icon: 'tabler-clock' },
]

// Color presets
const colorPresets = [
  { value: '#3b82f6', label: 'Blue' },
  { value: '#10b981', label: 'Green' },
  { value: '#f59e0b', label: 'Orange' },
  { value: '#ef4444', label: 'Red' },
  { value: '#8b5cf6', label: 'Purple' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#ec4899', label: 'Pink' },
  { value: '#6366f1', label: 'Indigo' },
]

// Layout - use localStorage for persistence
const STORAGE_KEY = `dashboard_layout_machine_${props.machineId}`
const layout = ref([])

// Load from localStorage on mount
const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      layout.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('Failed to load from storage:', error)
  }
}

// Save to localStorage
const saveToStorage = () => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout.value))
  } catch (error) {
    console.error('Failed to save to storage:', error)
  }
}

// Computed
const availableParameters = computed(() => {
  return parameters.value || []
})

const isAddMode = computed(() => !selectedWidget.value)

// Initialize
onMounted(() => {
  loadFromStorage()
  
  // Load default layout if empty
  if (layout.value.length === 0) {
    loadDefaultLayout()
  }
})

// Load default layout with example widgets
const loadDefaultLayout = () => {
  layout.value = [
    {
      i: 'widget_1',
      x: 0,
      y: 0,
      w: 6,
      h: 5,
      type: 'line',
      title: 'Temperature Monitoring',
      dataSourceIds: [1, 2],
      interval: 5,
      color: '#3b82f6',
      colors: ['#3b82f6', '#10b981'],
      showLegend: true,
      showGrid: true,
      enableAnimation: true,
      yAxisLabel: 'Temperature (°C)',
      xAxisLabel: 'Time',
      aggregation: 'avg',
    },
    {
      i: 'widget_2',
      x: 6,
      y: 0,
      w: 6,
      h: 5,
      type: 'area',
      title: 'Power Consumption',
      dataSourceIds: [5],
      interval: 5,
      color: '#8b5cf6',
      colors: ['#8b5cf6'],
      showLegend: true,
      showGrid: true,
      enableAnimation: true,
      yAxisLabel: 'Power (kW)',
      xAxisLabel: 'Time',
      aggregation: 'avg',
    },
    {
      i: 'widget_3',
      x: 0,
      y: 5,
      w: 4,
      h: 4,
      type: 'gauge',
      title: 'Current Pressure',
      dataSourceIds: [3],
      interval: 1,
      color: '#f59e0b',
      colors: ['#f59e0b'],
      showLegend: false,
      showGrid: false,
      enableAnimation: true,
      yAxisLabel: '',
      xAxisLabel: '',
      aggregation: 'last',
    },
    {
      i: 'widget_4',
      x: 4,
      y: 5,
      w: 8,
      h: 4,
      type: 'metric',
      title: 'Key Metrics',
      dataSourceIds: [1, 3, 4, 5],
      interval: 5,
      color: '#3b82f6',
      colors: ['#3b82f6'],
      showLegend: false,
      showGrid: false,
      enableAnimation: true,
      yAxisLabel: '',
      xAxisLabel: '',
      aggregation: 'last',
    },
  ]
  saveToStorage()
}

// Get chart options based on type and widget config
const getChartOptions = widget => {
  const isDark = false // You can make this reactive based on theme
  
  const baseOptions = {
    chart: {
      toolbar: { 
        show: widget.showToolbar ?? true,
        tools: {
          download: true,
          zoom: true,
          pan: true,
        },
      },
      animations: { 
        enabled: widget.enableAnimation ?? true,
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150,
        },
      },
      background: 'transparent',
      foreColor: isDark ? '#fff' : '#373d3f',
    },
    theme: {
      mode: isDark ? 'dark' : 'light',
    },
    grid: {
      show: widget.showGrid ?? true,
      borderColor: isDark ? '#404040' : '#e0e0e0',
      strokeDashArray: 4,
      xaxis: {
        lines: { show: widget.showGrid ?? true },
      },
      yaxis: {
        lines: { show: widget.showGrid ?? true },
      },
      padding: {
        top: 10,
        right: 20,
        bottom: 10,
        left: 10,
      },
    },
    legend: {
      show: widget.showLegend ?? true,
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '13px',
      fontWeight: 500,
      markers: {
        width: 12,
        height: 12,
        radius: 12,
      },
      itemMargin: {
        horizontal: 12,
        vertical: 8,
      },
    },
    tooltip: {
      enabled: true,
      theme: isDark ? 'dark' : 'light',
      style: {
        fontSize: '12px',
      },
      y: {
        formatter: val => {
          if (val === null || val === undefined) return 'N/A'
          
          return typeof val === 'number' ? val.toFixed(2) : val
        },
      },
    },
    dataLabels: { 
      enabled: false, 
    },
  }

  switch (widget.type) {
  case 'line':
  case 'area':
    return {
      ...baseOptions,
      chart: {
        ...baseOptions.chart,
        type: widget.type,
        zoom: {
          enabled: true,
          type: 'x',
          autoScaleYaxis: true,
        },
      },
      stroke: {
        curve: 'smooth',
        width: widget.type === 'line' ? 3 : 2,
        lineCap: 'round',
      },
      fill: widget.type === 'area' ? {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.6,
          opacityTo: 0.1,
          stops: [0, 90, 100],
        },
      } : {},
      xaxis: {
        type: 'datetime',
        labels: {
          datetimeUTC: false,
          style: {
            fontSize: '12px',
          },
        },
        title: {
          text: widget.xAxisLabel || 'Time',
          style: {
            fontSize: '13px',
            fontWeight: 600,
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '12px',
          },
          formatter: val => val?.toFixed(2) || '0',
        },
        title: {
          text: widget.yAxisLabel || '',
          style: {
            fontSize: '13px',
            fontWeight: 600,
          },
        },
      },
      markers: {
        size: 4,
        strokeWidth: 2,
        hover: {
          size: 6,
        },
      },
      colors: widget.colors || [widget.color || '#3b82f6'],
    }

  case 'bar':
  case 'column':
    return {
      ...baseOptions,
      chart: {
        ...baseOptions.chart,
        type: 'bar',
        horizontal: widget.type === 'bar',
      },
      plotOptions: {
        bar: {
          borderRadius: 8,
          columnWidth: '60%',
          barHeight: '60%',
          distributed: widget.dataSourceIds?.length === 1,
          dataLabels: {
            position: widget.type === 'bar' ? 'top' : 'center',
          },
        },
      },
      xaxis: {
        type: 'datetime',
        labels: {
          style: {
            fontSize: '12px',
          },
        },
        title: {
          text: widget.xAxisLabel || 'Time',
          style: {
            fontSize: '13px',
            fontWeight: 600,
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '12px',
          },
          formatter: val => val?.toFixed(2) || '0',
        },
        title: {
          text: widget.yAxisLabel || '',
          style: {
            fontSize: '13px',
            fontWeight: 600,
          },
        },
      },
      colors: widget.colors || [widget.color || '#3b82f6'],
    }

  case 'scatter':
    return {
      ...baseOptions,
      chart: {
        ...baseOptions.chart,
        type: 'scatter',
        zoom: {
          enabled: true,
          type: 'xy',
        },
      },
      xaxis: {
        type: 'datetime',
        labels: {
          style: {
            fontSize: '12px',
          },
        },
        title: {
          text: widget.xAxisLabel || 'Time',
          style: {
            fontSize: '13px',
            fontWeight: 600,
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            fontSize: '12px',
          },
        },
        title: {
          text: widget.yAxisLabel || '',
          style: {
            fontSize: '13px',
            fontWeight: 600,
          },
        },
      },
      markers: {
        size: 6,
        strokeWidth: 2,
        hover: {
          size: 8,
        },
      },
      colors: widget.colors || [widget.color || '#3b82f6'],
    }

  case 'radar':
    return {
      ...baseOptions,
      chart: {
        ...baseOptions.chart,
        type: 'radar',
        dropShadow: {
          enabled: true,
          blur: 1,
          left: 1,
          top: 1,
          opacity: 0.2,
        },
      },
      xaxis: {
        categories: widget.dataSourceIds?.map(id => {
          const param = availableParameters.value.find(p => p.id === id)
          
          return param?.name || `Parameter ${id}`
        }) || [],
      },
      stroke: {
        width: 2,
      },
      fill: {
        opacity: 0.2,
      },
      markers: {
        size: 4,
        hover: {
          size: 6,
        },
      },
      colors: widget.colors || [widget.color || '#3b82f6'],
    }

  case 'pie':
  case 'donut':
    return {
      ...baseOptions,
      chart: {
        ...baseOptions.chart,
        type: widget.type,
      },
      labels: widget.dataSourceIds?.map(id => {
        const param = availableParameters.value.find(p => p.id === id)
        
        return param?.name || `Parameter ${id}`
      }) || [],
      plotOptions: {
        pie: {
          donut: widget.type === 'donut' ? {
            size: '65%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '18px',
                fontWeight: 600,
                offsetY: -10,
              },
              value: {
                show: true,
                fontSize: '28px',
                fontWeight: 700,
                offsetY: 10,
                formatter: val => typeof val === 'number' ? val.toFixed(2) : val,
              },
              total: {
                show: true,
                label: 'Total',
                fontSize: '16px',
                fontWeight: 600,
                formatter: () => 'Average',
              },
            },
          } : {},
        },
      },
      stroke: {
        width: 2,
        colors: [isDark ? '#1e1e1e' : '#fff'],
      },
      colors: widget.colors || colorPresets.map(c => c.value).slice(0, widget.dataSourceIds?.length || 5),
    }

  case 'heatmap':
    return {
      ...baseOptions,
      chart: {
        ...baseOptions.chart,
        type: 'heatmap',
      },
      plotOptions: {
        heatmap: {
          radius: 2,
          enableShades: true,
          shadeIntensity: 0.5,
          colorScale: {
            ranges: [
              { from: 0, to: 25, color: '#10b981', name: 'Low' },
              { from: 26, to: 50, color: '#f59e0b', name: 'Medium' },
              { from: 51, to: 75, color: '#ef4444', name: 'High' },
              { from: 76, to: 100, color: '#7c3aed', name: 'Very High' },
            ],
          },
        },
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '11px',
          fontWeight: 600,
        },
      },
      xaxis: {
        type: 'category',
      },
    }

  case 'gauge':
    return {
      ...baseOptions,
      chart: {
        ...baseOptions.chart,
        type: 'radialBar',
        sparkline: {
          enabled: false,
        },
      },
      plotOptions: {
        radialBar: {
          startAngle: -135,
          endAngle: 135,
          hollow: {
            size: '65%',
            background: 'transparent',
          },
          track: {
            background: isDark ? '#404040' : '#f3f4f6',
            strokeWidth: '100%',
            margin: 12,
          },
          dataLabels: {
            show: true,
            name: {
              show: true,
              fontSize: '16px',
              fontWeight: 600,
              offsetY: -10,
            },
            value: {
              fontSize: '36px',
              fontWeight: 700,
              offsetY: 5,
              formatter: val => `${val.toFixed(1)}`,
            },
          },
        },
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'dark',
          type: 'horizontal',
          shadeIntensity: 0.5,
          gradientToColors: [widget.color || '#3b82f6'],
          inverseColors: true,
          opacityFrom: 1,
          opacityTo: 1,
          stops: [0, 100],
        },
      },
      stroke: {
        lineCap: 'round',
      },
      colors: [widget.color || '#3b82f6'],
    }

  default:
    return baseOptions
  }
}

// Generate dummy data for chart (simulated real-time data)
const generateChartData = widget => {
  if (!widget.dataSourceIds || widget.dataSourceIds.length === 0) {
    return []
  }

  // For metric cards
  if (widget.type === 'metric') {
    return widget.dataSourceIds.map(paramId => {
      const param = availableParameters.value.find(p => p.id === paramId)
      const baseValue = 50 + Math.random() * 50
      const change = (Math.random() * 20 - 10)
      
      // Get status based on baseline
      const status = param?.baseline ? getParameterStatus(baseValue, param.baseline) : null
      
      return {
        id: paramId,
        name: param?.name || `Parameter ${paramId}`,
        value: baseValue,
        unit: param?.unit || '',
        change: change.toFixed(1),
        trend: change >= 0 ? 'up' : 'down',
        min: baseValue * 0.8,
        max: baseValue * 1.2,
        avg: baseValue,
        isWatch: param?.is_watch || false,
        baseline: param?.baseline || null,
        status: status,
      }
    })
  }

  // For gauge
  if (widget.type === 'gauge') {
    const paramId = widget.dataSourceIds[0]
    const param = availableParameters.value.find(p => p.id === paramId)
    const value = 45 + Math.random() * 30
    
    return [{
      series: [value],
      label: param?.name || `Parameter ${paramId}`,
    }]
  }

  // For pie/donut
  if (widget.type === 'pie' || widget.type === 'donut') {
    return widget.dataSourceIds.map(() => 50 + Math.random() * 50)
  }

  // For radar
  if (widget.type === 'radar') {
    return [{
      name: 'Current',
      data: widget.dataSourceIds.map(() => 50 + Math.random() * 50),
    }]
  }

  // For heatmap
  if (widget.type === 'heatmap') {
    return widget.dataSourceIds.map(paramId => {
      const param = availableParameters.value.find(p => p.id === paramId)
      
      return {
        name: param?.name || `Parameter ${paramId}`,
        data: Array.from({ length: 10 }, (_, i) => ({
          x: `T${i}`,
          y: 50 + Math.random() * 50,
        })),
      }
    })
  }

  // For time-series charts (line, area, bar, column, scatter)
  const now = Date.now()
  const pointsPerHour = 60 / widget.interval
  const totalPoints = 24 * pointsPerHour

  return widget.dataSourceIds.map(paramId => {
    const param = availableParameters.value.find(p => p.id === paramId)
    const data = []
    const baseValue = 50 + (paramId * 5)
    
    for (let i = totalPoints; i >= 0; i--) {
      const timestamp = now - (i * widget.interval * 60 * 1000)
      const noise = Math.random() * 10 - 5
      const trend = Math.sin((totalPoints - i) / 50) * 15
      const value = baseValue + noise + trend
      
      data.push({
        x: timestamp,
        y: parseFloat(Math.max(0, value).toFixed(2)),
      })
    }

    return {
      name: param?.name || `Parameter ${paramId}`,
      data: data,
    }
  })
}

// Handle add/edit widget
const handleOpenDialog = (widget = null) => {
  if (widget) {
    // Edit mode
    selectedWidget.value = widget
    widgetForm.value = { ...widget }
    showEditWidget.value = true
  } else {
    // Add mode
    selectedWidget.value = null
    widgetForm.value = {
      type: 'line',
      title: '',
      dataSourceIds: [],
      interval: 5,
      w: 6,
      h: 4,
      color: '#3b82f6',
      showLegend: true,
      showGrid: true,
      enableAnimation: true,
      yAxisLabel: '',
      xAxisLabel: 'Time',
      aggregation: 'avg',
    }
    showAddWidget.value = true
  }
}

const handleSaveWidget = () => {
  if (!widgetForm.value.title.trim()) {
    alert('Please enter widget title')
    
    return
  }

  if (widgetForm.value.dataSourceIds.length === 0) {
    alert('Please select at least one parameter')
    
    return
  }

  if (isAddMode.value) {
    // Add new widget
    const newWidget = {
      ...widgetForm.value,
      i: `widget_${Date.now()}`,
      x: (layout.value.length * 6) % 12,
      y: Math.floor(layout.value.length / 2) * 4,
      colors: widgetForm.value.dataSourceIds.map((_, idx) => 
        colorPresets[idx % colorPresets.length].value,
      ),
    }

    layout.value.push(newWidget)
  } else {
    // Update existing widget
    const index = layout.value.findIndex(w => w.i === selectedWidget.value.i)
    if (index !== -1) {
      layout.value[index] = {
        ...layout.value[index],
        ...widgetForm.value,
        colors: widgetForm.value.dataSourceIds.map((_, idx) => 
          colorPresets[idx % colorPresets.length].value,
        ),
      }
    }
  }

  showAddWidget.value = false
  showEditWidget.value = false
  selectedWidget.value = null
}

// Handle remove widget
const handleRemoveWidget = widgetId => {
  if (confirm('Are you sure you want to remove this widget?')) {
    layout.value = layout.value.filter(w => w.i !== widgetId)
  }
}

// Handle save dashboard
const handleSaveDashboard = () => {
  try {
    saveToStorage()
    alert('Dashboard saved successfully!')
    isEditing.value = false
  } catch (error) {
    console.error('Failed to save dashboard:', error)
    alert('Failed to save dashboard')
  }
}

// Handle export
const handleExport = () => {
  const dataStr = JSON.stringify({
    machineId: props.machineId,
    layout: layout.value,
    exportedAt: new Date().toISOString(),
  }, null, 2)
  
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `dashboard_machine_${props.machineId}_${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)
}

// Handle import
const handleImportClick = () => {
  fileInput.value?.click()
}

const handleImport = event => {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()

  reader.onload = e => {
    try {
      const data = JSON.parse(e.target?.result)
      if (data.layout && Array.isArray(data.layout)) {
        layout.value = data.layout
        saveToStorage()
        alert('Dashboard imported successfully!')
      } else {
        alert('Invalid dashboard file')
      }
    } catch (error) {
      alert('Failed to import dashboard: Invalid JSON format')
    }
  }
  reader.readAsText(file)
  event.target.value = ''
}

// Handle reset
const handleReset = () => {
  if (confirm('Are you sure you want to reset the dashboard? This will remove all widgets.')) {
    layout.value = []
    saveToStorage()
  }
}

// Handle layout update
const handleLayoutUpdate = newLayout => {
  layout.value = newLayout
  saveToStorage()
}

// Real-time data update (simulate with more realistic intervals)
let dataInterval = null

onMounted(() => {
  // Simulate real-time data updates every 30 seconds
  dataInterval = setInterval(() => {
    // Force re-render to show new dummy data
    layout.value = [...layout.value]
  }, 30000)
})

onUnmounted(() => {
  if (dataInterval) {
    clearInterval(dataInterval)
  }
})
</script>

<template>
  <div class="dynamic-dashboard">
    <!-- Toolbar -->
    <VCard class="mb-6">
      <VCardText>
        <div class="d-flex align-center justify-space-between flex-wrap gap-4">
          <div>
            <h2 class="text-h4 mb-1">
              Dynamic Dashboard
            </h2>
            <p class="text-body-2 text-medium-emphasis">
              Machine ID: {{ machineId }} • Real-time monitoring and analytics
            </p>
          </div>

          <div class="d-flex align-center gap-3 flex-wrap">
            <!-- View Mode -->
            <template v-if="!isEditing">
              <VBtn
                color="primary"
                variant="tonal"
                @click="isEditing = true"
              >
                <VIcon
                  icon="tabler-edit"
                  start
                />
                Edit Dashboard
              </VBtn>
            </template>

            <!-- Edit Mode -->
            <template v-else>
              <VBtn
                color="primary"
                @click="handleOpenDialog"
              >
                <VIcon
                  icon="tabler-plus"
                  start
                />
                Add Widget
              </VBtn>

              <VBtn
                variant="outlined"
                color="secondary"
                @click="handleExport"
              >
                <VIcon
                  icon="tabler-download"
                  start
                />
                Export
              </VBtn>

              <VBtn
                variant="outlined"
                color="secondary"
                @click="handleImportClick"
              >
                <VIcon
                  icon="tabler-upload"
                  start
                />
                Import
              </VBtn>
              <input
                ref="fileInput"
                type="file"
                accept=".json"
                class="d-none"
                @change="handleImport"
              >

              <VBtn
                variant="outlined"
                color="warning"
                @click="handleReset"
              >
                <VIcon
                  icon="tabler-refresh"
                  start
                />
                Reset
              </VBtn>

              <VBtn
                color="success"
                @click="handleSaveDashboard"
              >
                <VIcon
                  icon="tabler-device-floppy"
                  start
                />
                Save
              </VBtn>

              <VBtn
                variant="outlined"
                @click="isEditing = false"
              >
                <VIcon
                  icon="tabler-x"
                  start
                />
                Cancel
              </VBtn>
            </template>
          </div>
        </div>
      </VCardText>
    </VCard>

    <!-- Add/Edit Widget Dialog -->
    <VDialog
      v-model="showAddWidget"
      max-width="900"
      persistent
    >
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between">
          <span>{{ isAddMode ? 'Add New Widget' : 'Edit Widget' }}</span>
          <VBtn
            icon
            variant="text"
            size="small"
            @click="showAddWidget = false"
          >
            <VIcon icon="tabler-x" />
          </VBtn>
        </VCardTitle>

        <VCardText>
          <VRow>
            <!-- Widget Title -->
            <VCol cols="12">
              <VTextField
                v-model="widgetForm.title"
                label="Widget Title"
                placeholder="e.g., Temperature Monitoring"
                prepend-inner-icon="tabler-text"
              />
            </VCol>

            <!-- Chart Type Selection -->
            <VCol cols="12">
              <div class="text-subtitle-2 font-weight-medium mb-3">
                Chart Type
              </div>
              <div class="d-flex flex-wrap gap-2">
                <VChip
                  v-for="type in chartTypes"
                  :key="type.value"
                  :color="widgetForm.type === type.value ? type.color : 'default'"
                  :variant="widgetForm.type === type.value ? 'elevated' : 'outlined'"
                  class="cursor-pointer"
                  @click="widgetForm.type = type.value"
                >
                  <VIcon
                    :icon="type.icon"
                    start
                    size="18"
                  />
                  {{ type.label }}
                </VChip>
              </div>
              <div class="text-caption text-medium-emphasis mt-2">
                {{ chartTypes.find(t => t.value === widgetForm.type)?.description }}
              </div>
            </VCol>

            <!-- Parameter Selection -->
            <VCol cols="12">
              <VSelect
                v-model="widgetForm.dataSourceIds"
                :items="availableParameters"
                item-title="name"
                item-value="id"
                label="Select Parameters"
                multiple
                chips
                closable-chips
                prepend-inner-icon="tabler-binary-tree-2"
              >
                <template #chip="{ item, props }">
                  <VChip
                    v-bind="props"
                    size="small"
                  >
                    <VIcon
                      v-if="item.raw.is_watch"
                      icon="tabler-eye"
                      size="14"
                      start
                    />
                    {{ item.title }}
                  </VChip>
                </template>
                <template #item="{ item, props }">
                  <VListItem
                    v-bind="props"
                    :title="item.raw.name"
                  >
                    <template #prepend>
                      <VAvatar
                        :color="item.raw.is_watch ? 'primary' : 'secondary'"
                        size="32"
                        variant="tonal"
                      >
                        <VIcon
                          :icon="item.raw.is_watch ? 'tabler-eye' : 'tabler-binary-tree-2'"
                          size="18"
                        />
                      </VAvatar>
                    </template>
                    <template #subtitle>
                      <span class="text-caption">
                        {{ item.raw.code }} • {{ item.raw.unit }}
                        <VChip
                          v-if="item.raw.baseline"
                          size="x-small"
                          color="success"
                          class="ms-2"
                        >
                          Has Baseline
                        </VChip>
                      </span>
                    </template>
                  </VListItem>
                </template>
              </VSelect>
            </VCol>

            <!-- Interval -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model.number="widgetForm.interval"
                label="Update Interval (minutes)"
                type="number"
                min="1"
                prepend-inner-icon="tabler-clock"
              />
            </VCol>

            <!-- Aggregation -->
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="widgetForm.aggregation"
                :items="aggregationOptions"
                item-title="label"
                item-value="value"
                label="Data Aggregation"
                prepend-inner-icon="tabler-chart-line"
              >
                <template #item="{ item, props }">
                  <VListItem v-bind="props">
                    <template #prepend>
                      <VIcon :icon="item.raw.icon" />
                    </template>
                  </VListItem>
                </template>
              </VSelect>
            </VCol>

            <!-- Size -->
            <VCol
              cols="6"
              md="3"
            >
              <VTextField
                v-model.number="widgetForm.w"
                label="Width (columns)"
                type="number"
                min="2"
                max="12"
                prepend-inner-icon="tabler-layout-columns"
              />
            </VCol>
            <VCol
              cols="6"
              md="3"
            >
              <VTextField
                v-model.number="widgetForm.h"
                label="Height (rows)"
                type="number"
                min="2"
                max="12"
                prepend-inner-icon="tabler-layout-rows"
              />
            </VCol>

            <!-- Axis Labels -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="widgetForm.xAxisLabel"
                label="X-Axis Label"
                placeholder="Time"
                prepend-inner-icon="tabler-axis-x"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="widgetForm.yAxisLabel"
                label="Y-Axis Label"
                placeholder="Value"
                prepend-inner-icon="tabler-axis-y"
              />
            </VCol>

            <!-- Color Selection -->
            <VCol cols="12">
              <div class="text-subtitle-2 font-weight-medium mb-3">
                Primary Color
              </div>
              <div class="d-flex flex-wrap gap-2">
                <div
                  v-for="color in colorPresets"
                  :key="color.value"
                  class="color-picker"
                  :class="{ 'active': widgetForm.color === color.value }"
                  :style="{ backgroundColor: color.value }"
                  @click="widgetForm.color = color.value"
                >
                  <VIcon
                    v-if="widgetForm.color === color.value"
                    icon="tabler-check"
                    color="white"
                    size="20"
                  />
                </div>
              </div>
            </VCol>

            <!-- Display Options -->
            <VCol cols="12">
              <div class="text-subtitle-2 font-weight-medium mb-3">
                Display Options
              </div>
              <div class="d-flex flex-wrap gap-4">
                <VCheckbox
                  v-model="widgetForm.showLegend"
                  label="Show Legend"
                  hide-details
                />
                <VCheckbox
                  v-model="widgetForm.showGrid"
                  label="Show Grid"
                  hide-details
                />
                <VCheckbox
                  v-model="widgetForm.enableAnimation"
                  label="Enable Animation"
                  hide-details
                />
              </div>
            </VCol>
          </VRow>
        </VCardText>

        <VCardActions class="justify-end gap-2">
          <VBtn
            variant="outlined"
            @click="showAddWidget = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="primary"
            @click="handleSaveWidget"
          >
            <VIcon
              icon="tabler-check"
              start
            />
            {{ isAddMode ? 'Add Widget' : 'Update Widget' }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Edit Widget Dialog (same as add but triggered differently) -->
    <VDialog
      v-model="showEditWidget"
      max-width="900"
      persistent
    >
      <VCard>
        <VCardTitle class="d-flex align-center justify-space-between">
          <span>Edit Widget</span>
          <VBtn
            icon
            variant="text"
            size="small"
            @click="showEditWidget = false"
          >
            <VIcon icon="tabler-x" />
          </VBtn>
        </VCardTitle>

        <VCardText>
          <VRow>
            <!-- Widget Title -->
            <VCol cols="12">
              <VTextField
                v-model="widgetForm.title"
                label="Widget Title"
                placeholder="e.g., Temperature Monitoring"
                prepend-inner-icon="tabler-text"
              />
            </VCol>

            <!-- Chart Type Selection -->
            <VCol cols="12">
              <div class="text-subtitle-2 font-weight-medium mb-3">
                Chart Type
              </div>
              <div class="d-flex flex-wrap gap-2">
                <VChip
                  v-for="type in chartTypes"
                  :key="type.value"
                  :color="widgetForm.type === type.value ? type.color : 'default'"
                  :variant="widgetForm.type === type.value ? 'elevated' : 'outlined'"
                  class="cursor-pointer"
                  @click="widgetForm.type = type.value"
                >
                  <VIcon
                    :icon="type.icon"
                    start
                    size="18"
                  />
                  {{ type.label }}
                </VChip>
              </div>
            </VCol>

            <!-- Parameter Selection -->
            <VCol cols="12">
              <VSelect
                v-model="widgetForm.dataSourceIds"
                :items="availableParameters"
                item-title="name"
                item-value="id"
                label="Select Parameters"
                multiple
                chips
                closable-chips
                prepend-inner-icon="tabler-binary-tree-2"
              />
            </VCol>

            <!-- Interval & Aggregation -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model.number="widgetForm.interval"
                label="Update Interval (minutes)"
                type="number"
                min="1"
                prepend-inner-icon="tabler-clock"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VSelect
                v-model="widgetForm.aggregation"
                :items="aggregationOptions"
                item-title="label"
                item-value="value"
                label="Data Aggregation"
                prepend-inner-icon="tabler-chart-line"
              />
            </VCol>

            <!-- Size -->
            <VCol
              cols="6"
              md="3"
            >
              <VTextField
                v-model.number="widgetForm.w"
                label="Width"
                type="number"
                min="2"
                max="12"
              />
            </VCol>
            <VCol
              cols="6"
              md="3"
            >
              <VTextField
                v-model.number="widgetForm.h"
                label="Height"
                type="number"
                min="2"
                max="12"
              />
            </VCol>

            <!-- Axis Labels -->
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="widgetForm.xAxisLabel"
                label="X-Axis Label"
                prepend-inner-icon="tabler-axis-x"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="widgetForm.yAxisLabel"
                label="Y-Axis Label"
                prepend-inner-icon="tabler-axis-y"
              />
            </VCol>

            <!-- Color & Options -->
            <VCol cols="12">
              <div class="text-subtitle-2 font-weight-medium mb-3">
                Primary Color
              </div>
              <div class="d-flex flex-wrap gap-2 mb-4">
                <div
                  v-for="color in colorPresets"
                  :key="color.value"
                  class="color-picker"
                  :class="{ 'active': widgetForm.color === color.value }"
                  :style="{ backgroundColor: color.value }"
                  @click="widgetForm.color = color.value"
                >
                  <VIcon
                    v-if="widgetForm.color === color.value"
                    icon="tabler-check"
                    color="white"
                    size="20"
                  />
                </div>
              </div>

              <div class="d-flex flex-wrap gap-4">
                <VCheckbox
                  v-model="widgetForm.showLegend"
                  label="Show Legend"
                  hide-details
                />
                <VCheckbox
                  v-model="widgetForm.showGrid"
                  label="Show Grid"
                  hide-details
                />
                <VCheckbox
                  v-model="widgetForm.enableAnimation"
                  label="Enable Animation"
                  hide-details
                />
              </div>
            </VCol>
          </VRow>
        </VCardText>

        <VCardActions class="justify-end gap-2">
          <VBtn
            variant="outlined"
            @click="showEditWidget = false"
          >
            Cancel
          </VBtn>
          <VBtn
            color="primary"
            @click="handleSaveWidget"
          >
            <VIcon
              icon="tabler-check"
              start
            />
            Update Widget
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Dashboard Grid -->
    <div v-if="layout.length > 0">
      <GridLayout
        v-model:layout="layout"
        :col-num="12"
        :row-height="30"
        :is-draggable="isEditing"
        :is-resizable="isEditing"
        :vertical-compact="true"
        :use-css-transforms="true"
        :margin="[16, 16]"
        @layout-updated="handleLayoutUpdate"
      >
        <GridItem
          v-for="widget in layout"
          :key="widget.i"
          :x="widget.x"
          :y="widget.y"
          :w="widget.w"
          :h="widget.h"
          :i="widget.i"
          class="grid-item-wrapper"
        >
          <VCard class="h-100 widget-card">
            <!-- Widget Header -->
            <VCardItem class="widget-header">
              <template #prepend>
                <div class="widget-indicator" />
              </template>

              <VCardTitle class="text-h6">
                {{ widget.title }}
              </VCardTitle>

              <VCardSubtitle class="text-caption">
                <VIcon
                  icon="tabler-clock"
                  size="14"
                  class="me-1"
                />
                {{ widget.interval }}min intervals • {{ widget.aggregation.toUpperCase() }}
              </VCardSubtitle>

              <template #append>
                <div class="d-flex gap-1">
                  <VBtn
                    v-if="isEditing"
                    icon
                    size="small"
                    variant="text"
                    @click="handleOpenDialog(widget)"
                  >
                    <VIcon
                      icon="tabler-edit"
                      size="20"
                    />
                  </VBtn>
                  <VBtn
                    v-if="isEditing"
                    icon
                    size="small"
                    variant="text"
                    color="error"
                    @click="handleRemoveWidget(widget.i)"
                  >
                    <VIcon
                      icon="tabler-trash"
                      size="20"
                    />
                  </VBtn>
                </div>
              </template>
            </VCardItem>

            <VDivider />

            <!-- Widget Content -->
            <VCardText class="widget-content">
              <!-- Metric Cards -->
              <div
                v-if="widget.type === 'metric'"
                class="metric-grid"
              >
                <VCard
                  v-for="metric in generateChartData(widget)"
                  :key="metric.id"
                  class="metric-card"
                  :class="{ 'has-baseline': metric.baseline, 'is-watch': metric.isWatch }"
                >
                  <!-- Card Background with Status Color -->
                  <div
                    class="metric-card-bg"
                    :style="{ 
                      background: metric.status 
                        ? `linear-gradient(135deg, ${metric.status.color} 0%, ${metric.status.color}dd 100%)` 
                        : `linear-gradient(135deg, ${widget.color} 0%, ${widget.color}dd 100%)` 
                    }"
                  >
                    <VCardText class="text-white position-relative">
                      <!-- Watch Badge -->
                      <div
                        v-if="metric.isWatch"
                        class="watch-badge"
                      >
                        <VIcon
                          icon="tabler-eye"
                          size="12"
                        />
                      </div>

                      <!-- Parameter Name -->
                      <div class="text-caption font-weight-medium opacity-90 mb-2">
                        {{ metric.name }}
                      </div>

                      <!-- Main Value -->
                      <div class="d-flex align-center justify-space-between mb-2">
                        <div>
                          <div class="text-h4 font-weight-bold">
                            {{ metric.value.toFixed(1) }}
                          </div>
                          <div class="text-caption">
                            {{ metric.unit }}
                          </div>
                        </div>
                        <VChip
                          :color="metric.trend === 'up' ? 'success' : 'error'"
                          size="small"
                          variant="elevated"
                        >
                          <VIcon
                            :icon="metric.trend === 'up' ? 'tabler-arrow-up' : 'tabler-arrow-down'"
                            start
                            size="14"
                          />
                          {{ Math.abs(metric.change) }}%
                        </VChip>
                      </div>

                      <!-- Status Indicator -->
                      <div
                        v-if="metric.status"
                        class="status-indicator mt-3"
                      >
                        <div class="d-flex align-center justify-space-between">
                          <VChip
                            size="x-small"
                            variant="flat"
                            class="text-white font-weight-bold"
                            :style="{ backgroundColor: 'rgba(255, 255, 255, 0.2)' }"
                          >
                            {{ metric.status.label }}
                          </VChip>
                          
                          <!-- For limit type, show percentage -->
                          <div
                            v-if="metric.baseline?.type === 'limit' && metric.status.percentage"
                            class="text-xs font-weight-medium"
                          >
                            {{ metric.status.percentage.toFixed(1) }}%
                          </div>
                        </div>

                        <!-- Baseline Info -->
                        <div class="baseline-info mt-2 text-xs opacity-80">
                          <VIcon
                            icon="tabler-info-circle"
                            size="12"
                            class="me-1"
                          />
                          <span v-if="metric.baseline?.type === 'threshold' && metric.baseline.normal">
                            Normal: {{ metric.baseline.normal.min }}{{ metric.unit }} - {{ metric.baseline.normal.max }}{{ metric.unit }}
                          </span>
                          <span v-else-if="metric.baseline?.type === 'limit'">
                            Limit: {{ metric.baseline.label }}
                          </span>
                          <span v-else-if="metric.baseline?.type === 'range' && metric.baseline.normal">
                            Normal: ±{{ metric.baseline.normal.max }}{{ metric.unit }}
                          </span>
                        </div>
                      </div>
                    </VCardText>
                  </div>
                </VCard>
              </div>

              <!-- Gauge Chart -->
              <div
                v-else-if="widget.type === 'gauge'"
                class="gauge-wrapper"
              >
                <VueApexCharts
                  type="radialBar"
                  :options="getChartOptions(widget)"
                  :series="generateChartData(widget)[0].series"
                  height="100%"
                />
                <div class="gauge-label text-center mt-n8">
                  <div class="text-caption text-medium-emphasis">
                    {{ generateChartData(widget)[0].label }}
                  </div>
                </div>
              </div>

              <!-- Regular Charts -->
              <div
                v-else
                class="chart-wrapper"
              >
                <VueApexCharts
                  :type="widget.type === 'donut' ? 'donut' : widget.type === 'column' ? 'bar' : widget.type"
                  :options="getChartOptions(widget)"
                  :series="generateChartData(widget)"
                  height="100%"
                />
              </div>

              <!-- Loading State (optional) -->
              <!--
                <div v-if="loading" class="loading-overlay">
                <VProgressCircular indeterminate color="primary" />
                </div> 
              -->
            </VCardText>
          </VCard>
        </GridItem>
      </GridLayout>
    </div>

    <!-- Empty State -->
    <VCard
      v-else
      class="text-center py-16"
    >
      <VCardText>
        <div class="mb-4">
          <VIcon
            icon="tabler-chart-dots"
            size="80"
            color="primary"
            class="opacity-50"
          />
        </div>
        <h3 class="text-h5 mb-2">
          No Widgets Added
        </h3>
        <p class="text-body-2 text-medium-emphasis mb-6">
          Start building your custom dashboard by adding widgets
        </p>
        <VBtn
          color="primary"
          size="large"
          @click="handleOpenDialog"
        >
          <VIcon
            icon="tabler-plus"
            start
          />
          Add Your First Widget
        </VBtn>
      </VCardText>
    </VCard>
  </div>
</template>

<style scoped lang="scss">
.dynamic-dashboard {
  min-height: calc(100vh - 200px);
}

.grid-item-wrapper {
  transition: all 0.3s ease;
  
  &:hover {
    .widget-card {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12) !important;
    }
  }
}

.widget-card {
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.3s ease;
  overflow: hidden;
}

.widget-header {
  background: linear-gradient(to right, rgba(59, 130, 246, 0.02), transparent);
  padding-block: 12px;
}

.widget-indicator {
  width: 4px;
  height: 32px;
  background: linear-gradient(to bottom, #3b82f6, #8b5cf6);
  border-radius: 4px;
  margin-inline-end: 8px;
}

.widget-content {
  height: calc(100% - 73px);
  padding: 16px;
  overflow: auto;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  height: 100%;
  align-content: start;
}

.metric-card {
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
  }

  &.is-watch {
    border: 2px solid rgba(255, 255, 255, 0.3);
  }

  &.has-baseline {
    position: relative;
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: rgba(255, 255, 255, 0.5);
    }
  }
}

.metric-card-bg {
  width: 100%;
  height: 100%;
}

.watch-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(255, 255, 255, 0.25);
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}

.status-indicator {
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.baseline-info {
  display: flex;
  align-items: center;
  line-height: 1.4;
}

.gauge-wrapper {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.gauge-label {
  margin-top: -40px;
}

.chart-wrapper {
  height: 100%;
  min-height: 200px;
}

.color-picker {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  border: 2px solid transparent;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &.active {
    border-color: white;
    box-shadow: 0 0 0 2px currentColor, 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}

/* Grid Layout Styling */
:deep(.vue-grid-item.vue-grid-placeholder) {
  background: rgba(59, 130, 246, 0.1) !important;
  border: 2px dashed rgba(59, 130, 246, 0.5) !important;
  border-radius: 8px;
  transition: all 0.2s ease;
}

:deep(.vue-grid-item.resizing) {
  opacity: 0.9;
  z-index: 100;
}

:deep(.vue-grid-item.dragging) {
  transition: none !important;
  z-index: 100;
  
  .widget-card {
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2) !important;
  }
}

:deep(.vue-resizable-handle) {
  opacity: 0;
  transition: opacity 0.2s;
}

:deep(.vue-grid-item:hover .vue-resizable-handle) {
  opacity: 1;
}

/* Scrollbar Styling */
.widget-content::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

.widget-content::-webkit-scrollbar-track {
  background: transparent;
}

.widget-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  
  &:hover {
    background: rgba(0, 0, 0, 0.3);
  }
}

/* Loading Overlay */
.loading-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  z-index: 10;
}

/* Responsive */
@media (max-width: 768px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }
  
  .widget-header {
    padding-block: 8px;
  }
  
  .widget-content {
    padding: 12px;
  }
}
</style>
