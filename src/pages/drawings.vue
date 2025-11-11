<script setup>
import { computed, onMounted, ref } from 'vue'
import { useVueFlow, VueFlow } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { Background } from '@vue-flow/background'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'


import SpecialNode from "@/components/flow/SpecialNode.vue"
import MqttInModal from "@/components/flow/nodes/MqttInModal.vue"
import MqttOutModal from "@/components/flow/nodes/MqttOutModal.vue"
import DatabaseModal from "@/components/flow/nodes/DatabaseModal.vue"
import ManagePipelineDialog from "@/components/dialogs/ManagePipelineDialog.vue"

definePage({ meta: { layout: 'blank', public: true } })

// --- Vue Flow store ---
const {
  nodes: storedNodes,
  edges: storedEdges,
  addEdges,
  setNodes,
  setEdges,
  applyNodeChanges,
  applyEdgeChanges,
} = useVueFlow()


// --- nodes & edges ---
const nodes = shallowRef([])
const edges = shallowRef([])
const activePipeline = ref({})

// --- sidebar collapsible ---
// Collapsible sidebars
const leftCollapsed = ref(false)
const rightCollapsed = ref(false)

// --- tabs ---
const currentTab = ref(0)
const totalTabs = ref(3)

// --- modal ---
const modalOpen = ref(false)
const pipelineModalOpen = ref(false)
const selectedPipeline = ref({})
const selectedNode = ref(null)
const modalComponents = { MqttInModal, MqttOutModal, DatabaseModal }

const ModalContent = computed(() => {
  console.log(selectedNode.value?.data.modal)
  console.log(modalComponents[selectedNode.value?.data.modal])
  if (!selectedNode.value) return null
  const modalName = selectedNode.value.data.modal

  return modalComponents[modalName] || null
})

// --- handlers ---
function onNodesChange(changes) {
  setNodes(nds => applyNodeChanges(changes, nds))
}

function onEdgesChange(changes) {
  setEdges(eds => applyEdgeChanges(changes, eds))
}

function onConnect(params) {
  addEdges([params])
}

function handleNodeDoubleClick(event) {
  console.log(event)
  selectedNode.value = event.node
  modalOpen.value = true
}

function handlePipelineClick(event) {
  console.log(event)
  pipelineModalOpen.value = true
}

function addNode(id, type, label, backgroundColor, icon, modal, defaultConfig) {
  const uniqueId = `${id}-${Date.now()}`

  setNodes(current => [
    ...current,
    {
      id: uniqueId,
      type: 'custom',
      position: { x: Math.random() * 250, y: Math.random() * 250 }, // biar ga tumpuk
      data: {
        label,
        color: backgroundColor,
        icon,
        modal,
        nodeType: type,
        nodeId: id,
      },
      config: defaultConfig,
      appearance: {
        background_color: backgroundColor,
        icon,
      },
    },
  ])
}


// --- fetch available nodes ---
const availableNodes = ref({})
const availableProtocolConfigurations = ref([])
const availableDatabaseConnections = ref([])
const availablePipelines = ref([])
const loadingNodes = ref(true)
const openedPanels = ref([])
const items = ref(5)

async function fetchAvailableNodes() {
  loadingNodes.value = true
  try {
    const res = await $api('/nodes')


    availableNodes.value = res.data.reduce((acc, curr) => {
      const key = curr.type

      // kalau belum ada array untuk type ini, buat baru
      if (!acc[key]) {
        acc[key] = []
      }

      // masukkan elemen ke array yang sesuai type
      acc[key].push(curr)

      return acc
    }, {})
    await nextTick()
    console.log(availableNodes)

  } catch (err) {
    toast.error(err.message || 'Failed to fetch nodes')
  } finally {
    loadingNodes.value = false
  }
}


async function fetchAvailableProtocolConfigurations() {
  loadingNodes.value = true
  try {
    const res = await $api('/protocol-configurations')

    availableProtocolConfigurations.value = res.data ?? []
  } catch (err) {
    toast.error(err.message || 'Failed to fetch nodes')
  } finally {
    loadingNodes.value = false
  }
}

async function fetchAvailableDatabaseConnections() {
  loadingNodes.value = true
  try {
    const res = await $api('/database-connections')
    console.log(res.data)
    availableDatabaseConnections.value = res.data ?? []
  } catch (err) {
    toast.error(err.message || 'Failed to fetch nodes')
  } finally {
    loadingNodes.value = false
  }
}

async function fetchAvailablePipelines() {
  loadingNodes.value = true
  try {
    const res = await $api('/pipelines')

    availablePipelines.value = res.data?.map(val => {
      return {
        id: val.id,
        name: val.name,
      }
    }) ?? []

  } catch (err) {
    toast.error(err.message || 'Failed to fetch nodes')
  } finally {
    loadingNodes.value = false
  }
}

async function fetchDetailPipeline(pipelineId) {
  loadingNodes.value = true
  try {
    const res = await $api(`/pipelines/${pipelineId}`)

    console.log(res.data)

    const { nodes, edges } = constructPipelineFromResponse(res.data)

    activePipeline.value = res.data
    setNodes(nodes)
    setEdges(edges)
  } catch (err) {
    toast.error(err.message || 'Failed to fetch nodes')
  } finally {
    loadingNodes.value = false
  }
}

function addNewTab() {
  // Buat pipeline baru lokal tanpa ID
  const newPipeline = {
    id: null,
    name: "New Pipeline",
    description: "",
    config: {},
    nodes: [],
    edges: [],
  }

  // Tambahkan ke daftar pipeline
  availablePipelines.value.push(newPipeline)

  // Set pipeline aktif ke pipeline baru ini
  activePipeline.value = newPipeline

  // Reset Vue Flow (hapus node & edge sebelumnya)
  setNodes([])
  setEdges([])

  // Pindahkan tab ke pipeline baru (opsional)
  currentTab.value = availablePipelines.value.length - 1
}

onMounted(() => {
  fetchAvailableNodes()
  fetchAvailablePipelines()
  fetchAvailableProtocolConfigurations()
  fetchAvailableDatabaseConnections()
})

watch(availablePipelines, availablePipelines => {
  if (availablePipelines.length > 0) {
    fetchDetailPipeline((availablePipelines)[0].id)
  }
})

function constructPipelineFromResponse(pipelineData) {
  // Ambil nodes dari pipeline_node
  const nodes = pipelineData.pipeline_node?.map(node => ({
    id: String(node.id), // penting: jadikan string biar cocok dengan Vue Flow
    type: 'custom', // atau bisa `node.type` kalau kamu punya variasi node
    position: {
      x: node.position_x,
      y: node.position_y,
    },
    data: {
      label: node.label,
      nodeType: node.type,
      nodeId: node.node_id,
      color: node.appearance?.background_color || '#ccc',
      icon: node.appearance?.icon || 'tabler-database-heart',
      modal: node.node_response.component_name || null,
      config: node.config,
    },
  }))

  // Ambil edges dari pipeline_edge
  const edges = pipelineData.pipeline_edge?.map(edge => ({
    id: String(edge.id),
    source: String(edge.source_node_id), // sesuai node.id di atas
    target: String(edge.target_node_id),
    data: edge.data || {},
  }))

  activePipeline.value = {
    id: pipelineData.id,
    name: pipelineData.name,
    description: pipelineData.description,
  }

  return { nodes, edges }
}

async function handleDeletePipeline(pipeline) {
  console.log(pipeline)
}

async function submitPipeline() {
  try {


    // Ambil snapshot dari Vue Flow

    // 💡 Payload sesuai DTO Go:
    const payload = {
      id: activePipeline.value.id,
      name: activePipeline.value.name,
      description: activePipeline.value.description,
      config: activePipeline.value.config,
      nodes: storedNodes.value.map(node => ({
        temp_id: node.id, // 🔹 id dari Vue Flow (sementara)
        node_id: node.data?.nodeId, // referensi ke master Node, kalau ada
        type: node.data?.nodeType || 'custom',
        label: node.data?.label,
        position_x: node.position.x,
        position_y: node.position.y,
        config: node.config || {},
        description: node.data?.description || null,
        appearance: node.appearance,
      })),
      edges: storedEdges.value.map(edge => ({
        source_node_temp_id: edge.source, // 🔹 pakai Vue Flow id sementara
        target_node_temp_id: edge.target,
        data: edge.data || {},
      })),
    }


    let activeMethod = 'POST'
    if (activePipeline.value.id) {
      activeMethod = 'PUT'
    }
    console.log(payload, activeMethod, activePipeline)

    console.log('🚀 Sending pipeline payload:', payload)

    const res = await $api('/pipelines', {
      method: activeMethod,
      body: payload,
    })

    toast.success('✅ Pipeline saved successfully!')
  } catch (err) {
    console.error('❌ Failed to submit pipeline:', err)
    toast.error(err.message || 'Failed to submit pipeline')
  }
}

async function runPipeline() {
  loadingNodes.value = true
  try {
    const res = await $api(`/pipelines/run/${activePipeline.value.id}`)
  } catch (err) {
    toast.error(err.message || 'Failed to fetch nodes')
  } finally {
    loadingNodes.value = false
  }
}

async function onSubmitConfig(data) {
  console.log('Config emitted:', data)

  // cari index node yang sesuai dengan node_id dari data
  const index = storedNodes.value.findIndex(node => node.id === data.node_id)

  if (index !== -1) {
    // update config node itu
    storedNodes.value[index] = {
      ...storedNodes.value[index],
      config: {
        ...storedNodes.value[index].config,
        ...data, // merge data baru ke config
      },
    }

    console.log('Node updated:', storedNodes.value[index])
  } else {
    console.warn('Node not found for id:', data.node_id)
  }
}

async function onSubmitPipeline(data) {
  console.log(data)
  activePipeline.value.id = data.id
  activePipeline.value.name = data.name
  activePipeline.value.description = data.description
  activePipeline.value.config = data.config
}
</script>


<template>
  <div class="px-3 py-3 w-screen h-screen overflow-hidden flex flex-col">
    <!-- Header -->
    <div class="grid grid-cols-24 gap-4 overflow-hidden bg-gray-100 mb-2">
      <div class="col-span-4">
        <VBtn
          color="secondary"
          to="/"
        >
          <VIcon
            start
            icon="tabler-circle-arrow-left-filled"
            size="26"
          />
          Dashboard
        </VBtn>
      </div>
      <div class="col-span-16 flex flex-row justify-center items-center">
        <VTabs
          v-model="currentTab"
          class="v-tabs-pill flex justify-center"
        >
          <VTab
            v-for="availablePipeline in availablePipelines"
            :key="availablePipeline.id"
            @click="handlePipelineClick"
          >
            {{ availablePipeline.name }}
            <VBtn
              icon="tabler-x"
              color="secondary"
              size="24"
              class="shadow-md bg-white hover:scale-110 transition-transform duration-200 ml-2"
              rounded="full"
              @click="handleDeletePipeline"
            />
          </VTab>
        </VTabs>

        <VBtn
          icon="tabler-circle-plus"
          rounded
          class="ml-2"
          @click="addNewTab"
        />
      </div>
      <div class="col-span-4 flex flex-row gap-2 justify-between">
        <VBtn @click="submitPipeline">
          Submit
          <VIcon
            end
            icon="tabler-send-2"
            size="26"
          />
        </VBtn>
        <VBtn
          color="success"
          class="flex-1"
          @click="runPipeline"
        >
          Run
        </VBtn>
      </div>
    </div>

    <!-- Main Layout -->
    <div class="grid grid-cols-24 gap-4 flex-1 overflow-hidden bg-gray-100 p-3">
      <!-- Left Sidebar -->
      <div
        class="h-full bg-white shadow rounded-lg overflow-hidden transition-all duration-300 ease-in-out"
        :class="leftCollapsed ? 'col-span-2' : 'col-span-4'"
      >
        <VCard class="h-full flex flex-col">
          <VCardTitle class="!flex !justify-between items-center transition-all duration-300 ease-in-out">
            <span
              v-show="!leftCollapsed"
              class="transition-all duration-300"
            >All Nodes</span>

            <VBtn
              icon
              class="transition-all duration-300 ease-in-out"
              :class="[{ 'mx-auto': leftCollapsed }]"
              @click="leftCollapsed = !leftCollapsed"
            >
              <VIcon>
                {{ leftCollapsed ? 'tabler-chevron-right' : 'tabler-chevron-left' }}
              </VIcon>
            </VBtn>
          </VCardTitle>

          <!-- Scrollable content -->
          <VCardText
            v-show="!leftCollapsed"
            class="flex-1 overflow-y-auto px-2"
          >


            <VExpansionPanels
              v-model="openedPanels"
              multiple
            >
              <VExpansionPanel
                v-for="(group, type) in availableNodes"
                :key="type"
              >
                <VExpansionPanelTitle>{{ type }}</VExpansionPanelTitle>
                <VExpansionPanelText>
                  <div v-if="loadingNodes">
                    Loading nodes...
                  </div>
                  <div
                    v-else
                    class="flex flex-col gap-2"
                  >
                    <VBtn
                      v-for="n in group"
                      :key="n.id"
                      color="primary"
                      class="mx-0"
                      @click="addNode(n.id, n.type, n.label, n.color, n.icon, n.component_name, n.default_config)"
                    >
                      <VIcon
                        start
                        :icon="n.icon"
                      />
                      {{ n.label }}
                    </VBtn>
                  </div>

                </VExpansionPanelText>
              </VExpansionPanel>
            </VExpansionPanels>
          </VCardText>
        </VCard>
      </div>

      <!-- Center Flow -->
      <div
        class="bg-gray-50 rounded-lg overflow-hidden transition-all duration-300 ease-in-out"
        :class="[
          leftCollapsed && rightCollapsed
            ? 'col-span-20'
            : leftCollapsed || rightCollapsed
              ? 'col-span-18'
              : 'col-span-16',
        ]"
      >
        <div class="h-full w-full">
          <VueFlow
            v-if="activePipeline && (activePipeline.id || activePipeline.name)"
            :nodes="storedNodes"
            :edges="storedEdges"
            :node-types="{ custom: markRaw(SpecialNode) }"
            fit-view
            style="width: 100%; height: 100%;"
            @nodes-change="onNodesChange"
            @edges-change="onEdgesChange"
            @connect="onConnect"
            @node-double-click="handleNodeDoubleClick"
          >
            <Controls/>
            <MiniMap/>
            <Background/>
          </VueFlow>
          <div
            v-else
            class="flex items-center justify-center w-full h-full text-gray-400 text-lg"
          >
            No pipeline selected
          </div>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div
        class="h-full bg-white shadow rounded-lg overflow-hidden transition-all duration-300 ease-in-out"
        :class="rightCollapsed ? 'col-span-2' : 'col-span-4'"
      >
        <VCard class="h-full flex flex-col">
          <VCardTitle class="!flex !justify-between items-center">
            <span v-show="!rightCollapsed">All Nodes</span>
            <VBtn
              icon
              :class="[{ 'mx-auto': rightCollapsed }]"
              @click="rightCollapsed = !rightCollapsed"
            >
              <VIcon>
                {{ rightCollapsed ? 'tabler-chevron-left' : 'tabler-chevron-right' }}
              </VIcon>
            </VBtn>
          </VCardTitle>

          <!-- Scrollable right content -->
          <VCardText
            v-show="!rightCollapsed"
            class="flex-1 overflow-y-auto"
          >
            <div v-if="loadingNodes">
              Loading nodes...
            </div>
            <div
              v-else
              class="flex flex-col gap-2"
            />
          </VCardText>
        </VCard>
      </div>
    </div>
  </div>
  <component
    :is="ModalContent"
    v-if="ModalContent"
    v-model:open="modalOpen"
    :node="selectedNode"
    :protocol-configurations="availableProtocolConfigurations"
    :database-connections="availableDatabaseConnections"
    @config="onSubmitConfig"
  />
  <ManagePipelineDialog
    v-model:is-dialog-visible="pipelineModalOpen"
    :pipeline="activePipeline"
    @submit="onSubmitPipeline"
  />
</template>


<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
</style>

