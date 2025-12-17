// store/dashboard.js
import { defineStore } from 'pinia'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    widgets: [],
    isEditing: false,
    showAddWidget: false,
    dataSources: {
      sales: {
        series: [{
          name: 'Sales',
          data: [120, 190, 150, 220, 180, 240, 210],
        }],
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      },
      revenue: {
        series: [{
          name: 'Revenue',
          data: [5000, 7000, 6500, 8500, 7800, 9200, 8700],
        }],
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      },
      market: {
        series: [45, 30, 25],
        labels: ['Product A', 'Product B', 'Product C'],
      },
      users: {
        series: [{
          name: 'Active Users',
          data: [1200, 1500, 1800, 2100, 2400, 2800, 3100],
        }],
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      },
      metrics: {
        total_users: 15420,
        active_sessions: 892,
        conversion_rate: 3.2,
        avg_revenue: 125.50,
      },
    },
    widgetIdCounter: 0,
  }),

  getters: {
    getWidgetById: state => id => {
      return state.widgets.find(w => w.i === id)
    },

    getDataSource: state => sourceKey => {
      return state.dataSources[sourceKey] || null
    },
  },

  actions: {
    // Initialize dari localStorage atau default
    initializeDashboard() {
      const saved = localStorage.getItem('dashboard-layout')
      if (saved) {
        try {
          const data = JSON.parse(saved)

          this.widgets = data.widgets || []
          this.widgetIdCounter = data.widgetIdCounter || this.widgets.length
        } catch (e) {
          console.error('Failed to load dashboard:', e)
          this.loadDefaultLayout()
        }
      } else {
        this.loadDefaultLayout()
      }
    },

    // Load default layout
    loadDefaultLayout() {
      this.widgets = [
        {
          i: '0',
          x: 0,
          y: 0,
          w: 6,
          h: 4,
          type: 'bar',
          title: 'Sales Overview',
          dataSource: 'sales',
        },
        {
          i: '1',
          x: 6,
          y: 0,
          w: 6,
          h: 4,
          type: 'line',
          title: 'Revenue Trend',
          dataSource: 'revenue',
        },
        {
          i: '2',
          x: 0,
          y: 4,
          w: 4,
          h: 4,
          type: 'pie',
          title: 'Market Share',
          dataSource: 'market',
        },
        {
          i: '3',
          x: 4,
          y: 4,
          w: 8,
          h: 4,
          type: 'metric',
          title: 'Key Metrics',
          dataSource: 'metrics',
        },
      ]
      this.widgetIdCounter = 4
    },

    // Save ke localStorage
    saveLayout() {
      const data = {
        widgets: this.widgets,
        widgetIdCounter: this.widgetIdCounter,
        timestamp: new Date().toISOString(),
      }

      localStorage.setItem('dashboard-layout', JSON.stringify(data))
      this.isEditing = false
    },

    // Add widget
    addWidget(widget) {
      const newY = Math.max(...this.widgets.map(w => w.y + w.h), 0)

      this.widgets.push({
        i: String(this.widgetIdCounter++),
        x: 0,
        y: newY,
        w: widget.w || 6,
        h: widget.h || 4,
        type: widget.type,
        title: widget.title,
        dataSource: widget.dataSource,
      })

      this.showAddWidget = false
    },

    // Remove widget
    removeWidget(id) {
      const index = this.widgets.findIndex(w => w.i === id)
      if (index > -1) {
        this.widgets.splice(index, 1)
      }
    },

    // Update widget layout
    updateLayout(newLayout) {
      this.widgets = newLayout
    },

    // Update widget config
    updateWidget(id, updates) {
      const widget = this.widgets.find(w => w.i === id)
      if (widget) {
        Object.assign(widget, updates)
      }
    },

    // Toggle edit mode
    toggleEditMode() {
      this.isEditing = !this.isEditing
    },

    // Reset to default
    resetDashboard() {
      if (confirm('Are you sure you want to reset dashboard to default?')) {
        this.loadDefaultLayout()
        this.saveLayout()
      }
    },

    // Export dashboard config
    exportDashboard() {
      const data = {
        widgets: this.widgets,
        version: '1.0',
        exportedAt: new Date().toISOString(),
      }

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')

      a.href = url
      a.download = `dashboard-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    },

    // Import dashboard config
    importDashboard(jsonData) {
      try {
        const data = JSON.parse(jsonData)
        if (data.widgets && Array.isArray(data.widgets)) {
          this.widgets = data.widgets
          this.widgetIdCounter = Math.max(...data.widgets.map(w => parseInt(w.i)), 0) + 1
          this.saveLayout()
          
          return true
        }
      } catch (e) {
        console.error('Failed to import dashboard:', e)
      }
      
      return false
    },
  },
})
