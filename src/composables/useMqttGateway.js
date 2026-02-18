import { ref, reactive, computed, watch, onBeforeUnmount } from "vue"

const OFFLINE_THRESHOLD_MS = 5000

export function useMqttGateway() {
  // ==========================================
  // STATE (sama persis dengan useMqttConnection)
  // ==========================================
  const ws          = ref(null)
  const status      = ref("disconnected")
  const lastError   = ref(null)
  const lastUpdate  = ref(null)

  /**
   * mqttData: reactive object per parameter code
   * { [code]: { name, code, value, unit, timestamp, type } }
   * Diisi dari parsing messages yang masuk dari gateway.
   */
  const mqttData       = reactive({})
  const parametersList = ref([])        // disimpan saat connectGateway dipanggil
  const parameterLastSeen = reactive({})

  const pendingSubscribes = []

  // ── Tick untuk computed parameterStatus ──────────────────────────────────
  const _tick = ref(0)
  let _tickInterval = null

  const parameterStatus = computed(() => {
    void _tick.value
    const now = Date.now()
    const result = {}
    parametersList.value.forEach(p => {
      const seen = parameterLastSeen[p.code]
      result[p.code] = seen === undefined
        ? 'error'
        : (now - seen) <= OFFLINE_THRESHOLD_MS ? 'online' : 'offline'
    })
    return result
  })

  const getParameterOnlineStatus     = code        => parameterStatus.value[code] ?? 'error'
  const getParameterOnlineStatusById = parameterId => {
    const p = getParameterById(parameterId)
    if (!p) return 'error'
    return getParameterOnlineStatus(p.code)
  }

  // ── Computed status helpers (kompatibel dengan useMqttConnection) ─────────
  const isConnected  = computed(() => status.value === 'connected')
  const isConnecting = computed(() => status.value === 'connecting')
  const hasError     = computed(() => status.value === 'error')
  const mqttStatus   = status // alias agar template lama tetap jalan

  // ==========================================
  // CONNECT
  // ==========================================
  /**
   * @param {object} options
   * @param {string} options.url        - URL WebSocket gateway, contoh:
   *                                      "ws://localhost:8080/api/public/mqtt-brokers/gateway"
   *                                      "wss://ems.sinergibisnis.id/api/public/mqtt-brokers/gateway"
   * @param {object} options.broker     - Info broker untuk diteruskan ke gateway
   * @param {Array}  options.parameters - Array parameter dari machineConfig
   *                                      (untuk mengisi parametersList & parsing payload)
   * @param {string} options.topic      - MQTT topic yang akan di-subscribe
   */
  function connectGateway({ url, broker, parameters = [], topic = null }) {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }

    // Simpan parameters agar getter bisa resolve by id/code
    parametersList.value = parameters
    parameters.forEach(p => { delete parameterLastSeen[p.code] })

    status.value = "connecting"

    ws.value = new WebSocket(url)

    ws.value.onopen = () => {
      // Kirim perintah connect ke broker
      ws.value.send(JSON.stringify({
        type: "connect",
        broker_info: broker,
      }))
      console.log(broker)
    }

    ws.value.onmessage = e => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === "connected") {
          status.value = "connected"

          // Kirim pending subscribes
          pendingSubscribes.forEach(t => {
            ws.value.send(JSON.stringify({ type: "subscribe", topic: t }))
          })
          pendingSubscribes.length = 0

          // Subscribe ke topic jika diberikan saat connect
          if (topic) {
            ws.value.send(JSON.stringify({ type: "subscribe", topic }))
          }
        }

        else if (msg.type === "message") {
          console.log(msg)
          _handleIncomingMessage(msg)
        }

        else if (msg.type === "error") {
          lastError.value = msg.error
          status.value = "error"
        }

      } catch (err) {
        console.error("[useMqttGateway] invalid ws message", err)
      }
    }

    ws.value.onclose = () => {
      status.value = "disconnected"
    }

    ws.value.onerror = () => {
      status.value = "error"
    }

    // Mulai tick interval
    if (!_tickInterval) {
      _tickInterval = setInterval(() => { _tick.value++ }, 1000)
    }
  }

  /**
   * connectMQTT: wrapper kompatibel dengan useMqttConnection.
   * Menerima machineConfig yang sama persis, lalu delegate ke connectGateway.
   *
   * @param {object} machineConfig
   * @param {string} gatewayUrl    - Base URL gateway. Default: ambil dari env.
   */
  function connectMQTT(machineConfig, gatewayUrl) {
    if (!machineConfig?.mqtt_topic) {
      console.warn('[useMqttGateway] No mqtt_topic in machineConfig')
      return false
    }

    const broker     = machineConfig.mqtt_topic.mqtt_broker
    const topic      = machineConfig.mqtt_topic.name
    const parameters = machineConfig.mqtt_topic.parameters || []

    const baseUrl = gatewayUrl
      || import.meta.env?.VITE_API_BASE_URL
      || `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`
console.log(broker)
    const url = `${baseUrl}/public/mqtt-brokers/gateway`
console.log(url)
    connectGateway({
      url,
      broker: {
        host_name: broker.host_name,
        mqtt_port: broker.mqtt_port,
        username: broker.username || '',
        password: broker.password || '',
      },
      parameters,
      topic,
    })

    return true
  }

  // ==========================================
  // MESSAGE HANDLER
  // ==========================================
  /**
   * Parse pesan masuk dari gateway.
   * Gateway mengirim: { type: "message", topic: "...", payload: "<JSON string>" }
   *
   * Format payload MQTT yang diharapkan (sama dengan useMqttConnection):
   * { d: { [paramCode]: value }, ts: "ISO timestamp" }
   */
  function _handleIncomingMessage(msg) {
    // msg.payload bisa berupa string JSON atau sudah object
    let data
    try {
      data = typeof msg.payload === 'string' ? JSON.parse(msg.payload) : msg.payload
    } catch {
      console.error('[useMqttGateway] Failed to parse payload:', msg.payload)
      return
    }

    if (!data || typeof data !== 'object') return

    const { d: dataValues, ts: timestamp } = data
    if (!dataValues || typeof dataValues !== 'object') return

    const now = Date.now()

    parametersList.value.forEach(parameter => {
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

      parameterLastSeen[paramCode] = now
    })

    lastUpdate.value = new Date()
  }

  // ==========================================
  // SUBSCRIBE / PUBLISH / DISCONNECT
  // ==========================================
  function subscribe(topic) {
    if (!ws.value || status.value !== "connected") {
      pendingSubscribes.push(topic)
      return
    }
    ws.value.send(JSON.stringify({ type: "subscribe", topic }))
  }

  function publish(topic, payload) {
    if (!ws.value || status.value !== "connected") return
    ws.value.send(JSON.stringify({ type: "publish", topic, payload }))
  }

  function disconnect() {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
    if (_tickInterval) {
      clearInterval(_tickInterval)
      _tickInterval = null
    }
    status.value = "disconnected"
  }

  // Alias untuk kompatibilitas dengan useMqttConnection
  const disconnectMQTT = disconnect

  onBeforeUnmount(() => { disconnect() })

  // ==========================================
  // GETTERS (identik dengan useMqttConnection)
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

  function getRawValue(paramCode)  { return mqttData[paramCode]?.value ?? null }
  function getParameter(paramCode) { return mqttData[paramCode] || null }
  function getAllParameters()      { return { ...mqttData } }

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
    mqttStatus,      // alias → status
    status,

    // Per-parameter online state
    parameterStatus,
    parameterLastSeen,
    getParameterOnlineStatus,
    getParameterOnlineStatusById,

    // Computed
    isConnected,
    isConnecting,
    hasError,

    // Connection
    connectGateway,   // API baru
    connectMQTT,      // kompatibel dengan useMqttConnection lama
    disconnect,
    disconnectMQTT,   // alias → disconnect

    // Subscribe / Publish (API baru)
    subscribe,
    publish,

    // Getters (identik)
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

    // Raw ws messages (opsional, kalau komponen butuh akses langsung)
    lastError,
  }
}
