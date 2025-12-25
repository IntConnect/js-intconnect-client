import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useManageDashboard = defineStore('manageDashboard', () => {
  // State
  const dashboardConfig = ref(null)
  const dashboardConfigs = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Fetch dashboard configuration by machine ID
  const fetchDashboardConfig = async (params = {}) => {
    loading.value = true
    error.value = null

    try {
      const { machineId, isMinimal = false } = params

      const response = await $api(`/api/dashboard-configs/${machineId}`, {
        method: 'GET',
        params: { isMinimal },
      })

      dashboardConfig.value = response.data

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch dashboard configuration'
      console.error('Fetch dashboard config error:', err)
      
      // Return empty config if not found
      if (err.response?.status === 404) {
        dashboardConfig.value = {
          machineId: params.machineId,
          layout: [],
        }
        
        return dashboardConfig.value
      }

      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch all dashboard configurations
  const fetchDashboardConfigs = async (params = {}) => {
    loading.value = true
    error.value = null

    try {
      const response = await $api('/api/dashboard-configs', {
        method: 'GET',
        params,
      })

      dashboardConfigs.value = response.data

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch dashboard configurations'
      console.error('Fetch dashboard configs error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Save/Create dashboard configuration
  const saveDashboardConfig = async payload => {
    loading.value = true
    error.value = null

    try {
      const { machineId, layout, ...rest } = payload

      const response = await $api(`/api/dashboard-configs/${machineId}`, {
        method: 'POST',
        body: {
          machine_id: machineId,
          layout: JSON.stringify(layout),
          ...rest,
        },
      })

      dashboardConfig.value = response.data

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to save dashboard configuration'
      console.error('Save dashboard config error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update dashboard configuration
  const updateDashboardConfig = async payload => {
    loading.value = true
    error.value = null

    try {
      const { machineId, layout, ...rest } = payload

      const response = await $api(`/api/dashboard-configs/${machineId}`, {
        method: 'PUT',
        body: {
          layout: JSON.stringify(layout),
          ...rest,
        },
      })

      dashboardConfig.value = response.data

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to update dashboard configuration'
      console.error('Update dashboard config error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete dashboard configuration
  const deleteDashboardConfig = async machineId => {
    loading.value = true
    error.value = null

    try {
      await $api(`/api/dashboard-configs/${machineId}`, {
        method: 'DELETE',
      })

      // Clear current config if it matches deleted machine
      if (dashboardConfig.value?.machineId === machineId) {
        dashboardConfig.value = null
      }

      // Remove from list
      dashboardConfigs.value = dashboardConfigs.value.filter(
        config => config.machineId !== machineId,
      )

      return true
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to delete dashboard configuration'
      console.error('Delete dashboard config error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch parameter data for charts (real-time data)
  const fetchParameterData = async (params = {}) => {
    loading.value = true
    error.value = null

    try {
      const { 
        parameterIds = [], 
        interval = 5, 
        aggregation = 'avg',
        startTime,
        endTime,
        limit = 100,
      } = params

      // Convert parameter IDs to comma-separated string
      const parameterIdsStr = Array.isArray(parameterIds) 
        ? parameterIds.join(',') 
        : parameterIds

      const response = await $api('/api/parameter-data', {
        method: 'GET',
        params: {
          parameter_ids: parameterIdsStr,
          interval,
          aggregation,
          start_time: startTime,
          end_time: endTime,
          limit,
        },
      })

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch parameter data'
      console.error('Fetch parameter data error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Fetch latest parameter values (for metric cards and gauge)
  const fetchLatestParameterValues = async (parameterIds = []) => {
    loading.value = true
    error.value = null

    try {
      const parameterIdsStr = Array.isArray(parameterIds) 
        ? parameterIds.join(',') 
        : parameterIds

      const response = await $api('/api/parameter-data/latest', {
        method: 'GET',
        params: {
          parameter_ids: parameterIdsStr,
        },
      })

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch latest parameter values'
      console.error('Fetch latest parameter values error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Duplicate dashboard configuration to another machine
  const duplicateDashboardConfig = async payload => {
    loading.value = true
    error.value = null

    try {
      const { sourceMachineId, targetMachineId } = payload

      const response = await $api('/api/dashboard-configs/duplicate', {
        method: 'POST',
        body: {
          source_machine_id: sourceMachineId,
          target_machine_id: targetMachineId,
        },
      })

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to duplicate dashboard configuration'
      console.error('Duplicate dashboard config error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Export dashboard configuration
  const exportDashboardConfig = async machineId => {
    try {
      const config = await fetchDashboardConfig({ machineId })
      
      const exportData = {
        version: '1.0',
        machineId,
        layout: config.layout,
        exportedAt: new Date().toISOString(),
        exportedBy: 'user', // You can get from auth store
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const blob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = `dashboard_machine_${machineId}_${Date.now()}.json`
      link.click()
      URL.revokeObjectURL(url)

      return true
    } catch (err) {
      error.value = 'Failed to export dashboard configuration'
      console.error('Export dashboard config error:', err)
      throw err
    }
  }

  // Import dashboard configuration
  const importDashboardConfig = async payload => {
    loading.value = true
    error.value = null

    try {
      const { machineId, configData } = payload

      // Validate imported data
      if (!configData.layout || !Array.isArray(configData.layout)) {
        throw new Error('Invalid dashboard configuration format')
      }

      // Save imported configuration
      return await saveDashboardConfig({
        machineId,
        layout: configData.layout,
      })
    } catch (err) {
      error.value = err.message || 'Failed to import dashboard configuration'
      console.error('Import dashboard config error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get dashboard statistics
  const fetchDashboardStats = async machineId => {
    loading.value = true
    error.value = null

    try {
      const response = await $api(`/api/dashboard-configs/${machineId}/stats`, {
        method: 'GET',
      })

      return response.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Failed to fetch dashboard statistics'
      console.error('Fetch dashboard stats error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Reset state
  const resetState = () => {
    dashboardConfig.value = null
    dashboardConfigs.value = []
    loading.value = false
    error.value = null
  }

  return {
    // State
    dashboardConfig,
    dashboardConfigs,
    loading,
    error,

    // Actions
    fetchDashboardConfig,
    fetchDashboardConfigs,
    saveDashboardConfig,
    updateDashboardConfig,
    deleteDashboardConfig,
    fetchParameterData,
    fetchLatestParameterValues,
    duplicateDashboardConfig,
    exportDashboardConfig,
    importDashboardConfig,
    fetchDashboardStats,
    resetState,
  }
})

// Helper function to format chart data from API response
export const formatChartData = (apiData, widgetType) => {
  if (!apiData || !Array.isArray(apiData)) return []

  switch (widgetType) {
  case 'line':
  case 'area':
  case 'bar':
  case 'column':
  case 'scatter':
    // Time-series data format
    return apiData.map(series => ({
      name: series.parameter_name || series.name,
      data: (series.data || []).map(point => ({
        x: new Date(point.timestamp).getTime(),
        y: parseFloat(point.value) || 0,
      })),
    }))

  case 'pie':
  case 'donut':
    // Aggregate values for pie/donut
    return apiData.map(series => {
      const total = (series.data || []).reduce((sum, point) => sum + (parseFloat(point.value) || 0), 0)
      
      return total / (series.data?.length || 1)
    })

  case 'radar':
    // Latest value for each parameter
    return [{
      name: 'Current',
      data: apiData.map(series => {
        const latestPoint = series.data?.[series.data.length - 1]
        
        return parseFloat(latestPoint?.value) || 0
      }),
    }]

  case 'heatmap':
    // Group data by time intervals
    return apiData.map(series => ({
      name: series.parameter_name || series.name,
      data: (series.data || []).map(point => ({
        x: new Date(point.timestamp).toLocaleTimeString(),
        y: parseFloat(point.value) || 0,
      })),
    }))

  case 'gauge':
    // Single value (average)
    if (apiData.length > 0 && apiData[0].data) {
      const values = apiData[0].data.map(point => parseFloat(point.value) || 0)
      const average = values.reduce((sum, val) => sum + val, 0) / values.length
      
      return [average]
    }
    
    return [0]

  case 'metric':
    // Latest values with statistics
    return apiData.map(series => {
      const values = (series.data || []).map(point => parseFloat(point.value) || 0)
      const latest = values[values.length - 1] || 0
      const previous = values[values.length - 2] || latest
      const change = previous !== 0 ? ((latest - previous) / previous) * 100 : 0

      return {
        id: series.parameter_id,
        name: series.parameter_name || series.name,
        value: latest,
        unit: series.unit || '',
        change: change.toFixed(1),
        trend: change >= 0 ? 'up' : 'down',
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((sum, val) => sum + val, 0) / values.length,
      }
    })

  default:
    return apiData
  }
}

// Helper function to calculate aggregation
export const calculateAggregation = (data, aggregationType) => {
  if (!data || data.length === 0) return 0

  const values = data.map(d => parseFloat(d.value) || 0)

  switch (aggregationType) {
  case 'sum':
    return values.reduce((sum, val) => sum + val, 0)
    
  case 'avg':
    return values.reduce((sum, val) => sum + val, 0) / values.length
    
  case 'min':
    return Math.min(...values)
    
  case 'max':
    return Math.max(...values)
    
  case 'last':
    return values[values.length - 1] || 0
    
  default:
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }
}
