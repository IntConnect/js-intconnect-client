
import mqtt from 'mqtt'
import { computed, reactive, ref } from 'vue'

export function useMqttConnection() {
  // ==========================================
  // STATE
  // ==========================================
  const mqttData = reactive({})
  const lastUpdate = ref(null)
  const mqttClient = ref(null)
  const mqttStatus = ref('disconnected')

  // ==========================================
  // COMPUTED
  // ==========================================
  const isConnected = computed(() => mqttStatus.value === 'connected')
  const isConnecting = computed(() => mqttStatus.value === 'connecting')
  const hasError = computed(() => mqttStatus.value === 'error' || mqttStatus.value === 'failed')

  // ==========================================
  // MQTT CONNECTION
  // ==========================================
  function connectMQTT(machineConfig) {
    if (!machineConfig?.mqtt_topic?.mqtt_broker) {
      console.warn('No MQTT broker configuration found')
      
      return false
    }

    const broker = machineConfig.mqtt_topic.mqtt_broker
    const topic = machineConfig.mqtt_topic.name

    if (!broker.host_name || !broker.ws_port) {
      console.error('Invalid broker configuration')
      
      return false
    }

    const url = `ws://${broker.host_name}:${broker.ws_port}/ws`

    console.log(`🔌 Connecting to MQTT broker: ${url}`)
    console.log(`📡 Topic: ${topic}`)

    try {
      mqttClient.value = mqtt.connect(url, {
        username: broker.username || undefined,
        password: broker.password || undefined,
        reconnectPeriod: 5000,
        connectTimeout: 10000,
        clean: true,
        clientId: `machine_${Math.random().toString(16).slice(2, 10)}`,
      })

      mqttStatus.value = 'connecting'

      mqttClient.value.on('connect', () => {
        console.log(`✅ MQTT Connected`)
        mqttStatus.value = 'connected'

        // Subscribe to topic
        mqttClient.value.subscribe(topic, { qos: 0 }, err => {
          if (err) {
            console.error(`Failed to subscribe to ${topic}:`, err)
            mqttStatus.value = 'error'
          } else {
            console.log(`📡 Subscribed to: ${topic}`)
          }
        })
      })

      mqttClient.value.on('message', (receivedTopic, payload) => {
        if (receivedTopic !== topic) return

        const message = payload.toString()

        try {
          const data = JSON.parse(message)

          handleMqttMessage(data, machineConfig.mqtt_topic.parameters)
        } catch (err) {
          console.error('❌ Failed to parse JSON:', err)
          console.error('Raw payload:', message)
        }
      })

      mqttClient.value.on('error', err => {
        console.error(`❌ MQTT error:`, err.message)
        mqttStatus.value = 'error'
      })

      mqttClient.value.on('offline', () => {
        console.warn(`⚠️ MQTT offline`)
        mqttStatus.value = 'offline'
      })

      mqttClient.value.on('reconnect', () => {
        console.log(`🔄 MQTT reconnecting`)
        mqttStatus.value = 'reconnecting'
      })

      return true
    } catch (err) {
      console.error('Failed to create MQTT client:', err)
      mqttStatus.value = 'failed'
      
      return false
    }
  }

  // ==========================================
  // MESSAGE HANDLER
  // ==========================================
  function handleMqttMessage(data, parameters = []) {
    console.log('📩 Received MQTT message:', data)

    if (!data || typeof data !== 'object') {
      console.warn('Invalid data structure')
      
      return
    }

    const { d: dataValues, ts: timestamp } = data

    if (!dataValues || typeof dataValues !== 'object') {
      console.warn('Missing "d" field in data')
      
      return
    }

    console.log('Processing MQTT data...')

    let updatedCount = 0

    parameters.forEach(parameter => {
      const paramCode = parameter.code

      if (paramCode in dataValues) {
        const rawValue = dataValues[paramCode]
        const value = Array.isArray(rawValue) ? rawValue[0] : rawValue

        mqttData[paramCode] = {
          name: parameter.name,
          code: paramCode,
          value: value,
          unit: parameter.unit || '',
          timestamp: timestamp || new Date().toISOString(),
          type: typeof value,
        }

        updatedCount++
      }
    })

    lastUpdate.value = timestamp || new Date().toISOString()
    console.log(`✅ Updated ${updatedCount}/${parameters.length} parameters`)
  }

  // ==========================================
  // DISCONNECT
  // ==========================================
  function disconnectMQTT() {
    if (mqttClient.value) {
      console.log('🔌 Disconnecting MQTT...')
      mqttClient.value.end(true)
      mqttClient.value = null
      mqttStatus.value = 'disconnected'
    }
  }

  // ==========================================
  // GETTERS
  // ==========================================
  function getValue(paramCode) {
    const param = mqttData[paramCode]
    if (!param) return null

    const { value, type } = param

    if (type === 'boolean') {
      return value ? 'ON' : 'OFF'
    }

    if (type === 'number') {
      return Math.round(value * 100) / 100
    }

    return value?.toString() || null
  }

  function getFormattedValue(paramCode) {
    const param = mqttData[paramCode]
    if (!param) return '-'

    const { value, unit, type } = param

    if (type === 'boolean') {
      return value ? 'ON' : 'OFF'
    }

    if (type === 'number') {
      const rounded = Math.round(value * 100) / 100
      
      return unit ? `${rounded} ${unit}` : rounded.toString()
    }

    return value?.toString() || '-'
  }

  function getRawValue(paramCode) {
    const param = mqttData[paramCode]
    
    return param?.value ?? null
  }

  function getParameter(paramCode) {
    return mqttData[paramCode] || null
  }

  function getAllParameters() {
    return { ...mqttData }
  }

  // ==========================================
  // STATUS CHECKER
  // ==========================================
  function getParameterStatus(paramCode) {
    const param = mqttData[paramCode]
    if (!param) return 'unknown'

    const { value, type } = param

    if (type === 'boolean') {
      return value ? 'active' : 'inactive'
    }

    // Custom thresholds - can be extended
    if (paramCode === '1_Chiller_COP' && value < 5) {
      return 'warning'
    }

    return 'normal'
  }

  function hasParameter(paramCode) {
    return paramCode in mqttData
  }

  // ==========================================
  // FILTER HELPERS
  // ==========================================
  function filterParametersByKeys(allowedKeys = []) {
    return Object.entries(mqttData)
      .filter(([key]) => allowedKeys.includes(key))
      .map(([key, data]) => ({
        code: data.code,
        name: data.name,
        value: data.value,
        unit: data.unit,
        type: data.type,
        timestamp: data.timestamp,
      }))
  }

  function getParametersByPattern(pattern) {
    const regex = new RegExp(pattern)
    
    return Object.entries(mqttData)
      .filter(([key]) => regex.test(key))
      .map(([key, data]) => ({
        code: data.code,
        name: data.name,
        value: data.value,
        unit: data.unit,
        type: data.type,
        timestamp: data.timestamp,
      }))
  }

  // ==========================================
  // CALCULATIONS
  // ==========================================
  function calculateDelta(param1Code, param2Code) {
    const value1 = getValue(param1Code)
    const value2 = getValue(param2Code)

    if (value1 === null || value2 === null) return null
    if (typeof value1 !== 'number' || typeof value2 !== 'number') return null

    return Math.round((value1 - value2) * 100) / 100
  }

  function calculateRatio(param1Code, param2Code) {
    const value1 = getValue(param1Code)
    const value2 = getValue(param2Code)

    if (value1 === null || value2 === null) return null
    if (typeof value1 !== 'number' || typeof value2 !== 'number') return null
    if (value2 === 0) return null

    return Math.round((value1 / value2) * 100) / 100
  }

  // ==========================================
  // RETURN
  // ==========================================
  return {
    // State
    mqttData,
    lastUpdate,
    mqttStatus,

    // Computed
    isConnected,
    isConnecting,
    hasError,

    // Connection
    connectMQTT,
    disconnectMQTT,

    // Getters
    getValue,
    getFormattedValue,
    getRawValue,
    getParameter,
    getAllParameters,

    // Status
    getParameterStatus,
    hasParameter,

    // Filters
    filterParametersByKeys,
    getParametersByPattern,

    // Calculations
    calculateDelta,
    calculateRatio,
  }
}
