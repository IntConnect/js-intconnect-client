import mqtt from 'mqtt'
import { computed, reactive, ref } from 'vue'

// Berapa lama (ms) tanpa update sebelum parameter dianggap offline
const OFFLINE_THRESHOLD_MS = 5000

export function useMqttConnection() {
  // ==========================================
  // STATE
  // ==========================================
  const mqttData   = reactive({})
  const lastUpdate = ref(null)
  const mqttClient = ref(null)
  const mqttStatus = ref('disconnected')
  const parametersList = ref([])

  /**
   * Menyimpan timestamp terakhir tiap parameter diupdate.
   * key  : parameter.code  (string)
   * value: Date (ms)
   */
  const parameterLastSeen = reactive({})

  /**
   * Status online/offline per parameter (computed reaktif).
   * key  : parameter.code
   * value: 'online' | 'offline' | 'error'
   *
   * Di-trigger ulang setiap kali `_tick` berubah (setiap detik).
   */
  const _tick = ref(0)
  let _tickInterval = null

  const parameterStatus = computed(() => {
    void _tick.value // daftarkan dependency ke interval

    const now = Date.now()
    const result = {}

    parametersList.value.forEach(p => {
      const seen = parameterLastSeen[p.code]
      if (seen === undefined) {
        result[p.code] = 'error'
      } else {
        result[p.code] = (now - seen) <= OFFLINE_THRESHOLD_MS ? 'online' : 'offline'
      }
    })

    return result
  })

  /** Helper: ambil status satu parameter by code */
  const getParameterOnlineStatus = code => parameterStatus.value[code] ?? 'error'

  /** Helper: ambil status satu parameter by ID */
  const getParameterOnlineStatusById = parameterId => {
    const p = getParameterById(parameterId)
    if (!p) return 'error'
    return getParameterOnlineStatus(p.code)
  }

  // ==========================================
  // COMPUTED
  // ==========================================
  const isConnected  = computed(() => mqttStatus.value === 'connected')
  const isConnecting = computed(() => mqttStatus.value === 'connecting')
  const hasError     = computed(() => mqttStatus.value === 'error' || mqttStatus.value === 'failed')

  // ==========================================
  // MQTT CONNECTION
  // ==========================================
  function connectMQTT(machineConfig) {
    if (!machineConfig?.mqtt_topic?.mqtt_broker) {
      console.warn('No MQTT broker configuration found')
      return false
    }

    const broker = machineConfig.mqtt_topic.mqtt_broker
    const topic  = machineConfig.mqtt_topic.name

    parametersList.value = machineConfig['mqtt_topic']['parameters'] || []

    // Reset lastSeen untuk semua parameter
    parametersList.value.forEach(p => {
      delete parameterLastSeen[p.code]
    })

    if (!broker.host_name || !broker.ws_port) {
      console.error('Invalid broker configuration')
      return false
    }

    const url = `ws://${broker.host_name}:${broker.ws_port}/ws`

    try {
      mqttClient.value = mqtt.connect(url, {
        username:        broker.username || undefined,
        password:        broker.password || undefined,
        reconnectPeriod: 5000,
        connectTimeout:  10000,
        clean:           true,
        clientId:        `machine_${Math.random().toString(16).slice(2, 10)}`,
      })

      mqttStatus.value = 'connecting'

      mqttClient.value.on('connect', () => {
        mqttStatus.value = 'connected'
        mqttClient.value.subscribe(topic, { qos: 0 }, err => {
          if (err) {
            console.error(`Failed to subscribe to ${topic}:`, err)
            mqttStatus.value = 'error'
          }
        })
      })

      mqttClient.value.on('message', (receivedTopic, payload) => {
        if (receivedTopic !== topic) return
        try {
          const data = JSON.parse(payload.toString())
          handleMqttMessage(data, machineConfig.mqtt_topic.parameters)
        } catch (err) {
          console.error('Failed to parse JSON:', err)
        }
      })

      mqttClient.value.on('error',     err => { mqttStatus.value = 'error' })
      mqttClient.value.on('offline',   ()  => { mqttStatus.value = 'offline' })
      mqttClient.value.on('reconnect', ()  => { mqttStatus.value = 'reconnecting' })

      // Mulai tick interval (1x per detik)
      _tickInterval = setInterval(() => { _tick.value++ }, 1000)

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
    if (!data || typeof data !== 'object') return

    const { d: dataValues, ts: timestamp } = data
    if (!dataValues || typeof dataValues !== 'object') return

    const now = Date.now()

    parameters.forEach(parameter => {
      const paramCode = parameter.code
      if (!(paramCode in dataValues)) return

      const rawValue = dataValues[paramCode]
      const value    = Array.isArray(rawValue) ? rawValue[0] : rawValue

      mqttData[paramCode] = {
        name:      parameter.name,
        code:      paramCode,
        value,
        unit:      parameter.unit || '',
        timestamp: timestamp || new Date().toISOString(),
        type:      typeof value,
      }

      // ← Update lastSeen untuk parameter ini
      parameterLastSeen[paramCode] = now
    })

    lastUpdate.value = new Date()
  }

  // ==========================================
  // DISCONNECT
  // ==========================================
  function disconnectMQTT() {
    if (mqttClient.value) {
      mqttClient.value.end(true)
      mqttClient.value = null
      mqttStatus.value = 'disconnected'
    }
    if (_tickInterval) {
      clearInterval(_tickInterval)
      _tickInterval = null
    }
  }

  // ==========================================
  // GETTERS (tidak berubah)
  // ==========================================
  const getParameterById = parameterId =>
    parametersList.value?.find(p => p.id === parameterId)

  const getValueByParameterId = parameterId => {
    const parameter = getParameterById(parameterId)
    if (!parameter) return null
    return mqttData[parameter.code] || null
  }

  const getFormattedValueById = parameterId => {
    const mqttValue = getValueByParameterId(parameterId)
    if (!mqttValue) return { value: '-', unit: '' }
    return { value: mqttValue.value, unit: mqttValue.unit || '' }
  }

  function getValue(paramCode) {
    const param = mqttData[paramCode]
    if (!param) return null
    const { value, type } = param
    if (type === 'boolean') return value ? 'ON' : 'OFF'
    if (type === 'number')  return Math.round(value * 100) / 100
    return value?.toString() || null
  }

  function getFormattedValue(paramCode) {
    const param = mqttData[paramCode]
    if (!param) return '-'
    const { value, unit, type } = param
    if (type === 'boolean') return value ? 'ON' : 'OFF'
    if (type === 'number') {
      const rounded = Math.round(value * 100) / 100
      return unit ? `${rounded} ${unit}` : rounded.toString()
    }
    return value?.toString() || '-'
  }

  function getRawValue(paramCode)   { return mqttData[paramCode]?.value ?? null }
  function getParameter(paramCode)  { return mqttData[paramCode] || null }
  function getAllParameters()       { return { ...mqttData } }

  function filterParametersByKeys(allowedKeys = []) {
    return Object.entries(mqttData)
      .filter(([key]) => allowedKeys.includes(key))
      .map(([, data]) => ({ ...data }))
  }

  function getParametersByPattern(pattern) {
    const regex = new RegExp(pattern)
    return Object.entries(mqttData)
      .filter(([key]) => regex.test(key))
      .map(([, data]) => ({ ...data }))
  }

  function calculateDelta(param1Code, param2Code) {
    const v1 = getValue(param1Code)
    const v2 = getValue(param2Code)
    if (v1 === null || v2 === null) return null
    if (typeof v1 !== 'number' || typeof v2 !== 'number') return null
    return Math.round((v1 - v2) * 100) / 100
  }

  function calculateRatio(param1Code, param2Code) {
    const v1 = getValue(param1Code)
    const v2 = getValue(param2Code)
    if (v1 === null || v2 === null || v2 === 0) return null
    return Math.round((v1 / v2) * 100) / 100
  }

  // ==========================================
  // RETURN
  // ==========================================
  return {
    // State
    mqttData,
    lastUpdate,
    mqttStatus,

    // Per-parameter online state  ← BARU
    parameterStatus,               // reactive object { [code]: 'online'|'offline'|'error' }
    parameterLastSeen,             // reactive object { [code]: timestamp ms }
    getParameterOnlineStatus,      // (code)       => 'online'|'offline'|'error'
    getParameterOnlineStatusById,  // (parameterId) => 'online'|'offline'|'error'

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
    getParameterById,
    getValueByParameterId,
    getFormattedValueById,

    // Filters
    filterParametersByKeys,
    getParametersByPattern,

    // Calculations
    calculateDelta,
    calculateRatio,
  }
}
