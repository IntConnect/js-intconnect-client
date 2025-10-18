<script setup>
import { ref, computed, onMounted } from 'vue'
import { VueFlow, useVueFlow } from '@vue-flow/core'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import { Background } from '@vue-flow/background'
import { ofetch } from 'ofetch'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'


import SpecialNode from "@/components/flow/SpecialNode.vue"
import MqttInModal from "@/components/flow/nodes/MqttInModal.vue"

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

// --- sidebar collapsible ---
// Collapsible sidebars
const leftCollapsed = ref(false)
const rightCollapsed = ref(false)

// --- tabs ---
const currentTab = ref(0)
const totalTabs = ref(3)

// --- modal ---
const modalOpen = ref(false)
const selectedNode = ref(null)
const modalComponents = { MqttInModal }
const ModalContent = computed(() => {
  if (!selectedNode.value) return null
  const modalName = selectedNode.value.node.data.modal
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

function handleNodeDoubleClick(node) {
  selectedNode.value = node
  modalOpen.value = true
}

function addNode(id, type, label, backgroundColor, icon, modal) {
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
        nodeId: id, // simpan id asli jika perlu
      },
    },
  ])
}


// --- fetch available nodes ---
const availableNodes = ref([])
const availablePipelines = ref([])
const loadingNodes = ref(true)

async function fetchAvailableNodes() {
  loadingNodes.value = true
  try {
    const res = await $api('/nodes')

    availableNodes.value = res.data ?? []
    console.log(availableNodes)
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
    const { nodes, edges } = constructPipelineFromResponse(res.data)
    setNodes(nodes)
    setEdges(edges)
  } catch (err) {
    toast.error(err.message || 'Failed to fetch nodes')
  } finally {
    loadingNodes.value = false
  }
}

function addNewTab() {
  availablePipelines.value.push({
    id: null,
    name: "New Pipeline",
  })
}

onMounted(() => {
  fetchAvailableNodes()
  fetchAvailablePipelines()
})

watch(availablePipelines, availablePipelines => {
  console.log(availablePipelines)
  console.log(availablePipelines.length)
  if (availablePipelines.length > 0) {
    console.log((availablePipelines[0]).id)
    fetchDetailPipeline((availablePipelines)[0].id)
  }
})

function constructPipelineFromResponse(pipelineData) {
  // Ambil nodes dari pipeline_node
  console.log(pipelineData)
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
      color: node.config?.color || '#ccc',
      icon: node.config?.icon || 'tabler-database-heart',
      modal: node.config?.modal || null,
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

  return { nodes, edges }
}


async function submitPipeline() {
  try {

    // Ambil snapshot dari Vue Flow

    // 💡 Payload sesuai DTO Go:
    const payload = {
      name: `Pipeline ${currentTab.value + 1}`,
      description: `Generated from VueFlow on ${new Date().toISOString()}`,
      is_active: true,
      config: {
        nodes: storedNodes.value,
        edges: storedEdges.value,
      },
      nodes: storedNodes.value.map(node => ({
        temp_id: node.id, // 🔹 id dari Vue Flow (sementara)
        node_id: node.data?.nodeId, // referensi ke master Node, kalau ada
        type: node.data?.nodeType || 'custom',
        label: node.data?.label,
        position_x: node.position.x,
        position_y: node.position.y,
        config: node.data || {},
        description: node.data?.description || null,
      })),
      edges: storedEdges.value.map(edge => ({
        source_node_temp_id: edge.source, // 🔹 pakai Vue Flow id sementara
        target_node_temp_id: edge.target,
        data: edge.data || {},
      })),
    }

    console.log('🚀 Sending pipeline payload:', payload)

    const res = await $api('/pipelines', {
      method: 'POST',
      body: payload,
    })

    toast.success('✅ Pipeline saved successfully!')
  } catch (err) {
    console.error('❌ Failed to submit pipeline:', err)
    toast.error(err.message || 'Failed to submit pipeline')
  }
}

</script>


<template>
  <div class="px-3 py-3 w-screen h-screen overflow-hidden flex flex-col">
    <!-- Header -->
    <div class="flex justify-between items-center p-3 bg-white shadow">
      <VBtn color="secondary" class="mb-3" to="/">
        <VIcon start icon="tabler-circle-arrow-left-filled" size="26"/>
        Dashboard
      </VBtn>

      <div class="flex flex-row items-center">
        <VTabs v-model="currentTab"
               class="v-tabs-pill flex justify-center"
        >
          <VTab v-for="availablePipeline in availablePipelines" :key="availablePipeline.id">
            {{ availablePipeline.name }}
            <VBtn
              icon="tabler-x"
              color="secondary"
              size="24"
              class="shadow-md bg-white hover:scale-110 transition-transform duration-200 ml-2"
              rounded="full"
              @click=""
            />
          </VTab>
        </VTabs>

        <VBtn icon="tabler-circle-plus" rounded class="ml-2" @click="addNewTab"/>
      </div>

      <VBtn @click="submitPipeline">
        Submit
        <VIcon end icon="tabler-send-2" size="26"/>
      </VBtn>
    </div>

    <!-- Main Layout -->
    <div class="grid grid-cols-24 gap-4 flex-1 overflow-hidden bg-gray-100 p-3">
      <!-- Left Sidebar -->
      <div
        class="h-full bg-white shadow rounded-lg overflow-hidden transition-all duration-300 ease-in-out"
        :class="leftCollapsed ? 'col-span-2' : 'col-span-4'"
      >
        <VCard class="h-full flex flex-col">
          <VCardTitle
            class="!flex !justify-between items-center transition-all duration-300 ease-in-out"
          >
            <span v-show="!leftCollapsed" class="transition-all duration-300">All Nodes</span>
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
          <VCardText v-show="!leftCollapsed" class="flex-1 overflow-y-auto px-2">
            <div v-if="loadingNodes">Loading nodes...</div>
            <div v-else class="flex flex-col gap-2">
              <VBtn
                v-for="n in availableNodes"
                :key="n.id"
                color="primary"
                class="mx-0"
                @click="addNode(n.id, n.type, n.label, n.color, n.icon, n.component_name)"
              >
                <VIcon start :icon="n.icon"/>
                {{ n.label }}
              </VBtn>
            </div>
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
            :nodes="nodes"
            :edges="edges"
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

          <component
            :is="ModalContent"
            v-if="ModalContent"
            v-model:isDialogVisible="modalOpen"
            :node="selectedNode"
          />
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
          <VCardText v-show="!rightCollapsed" class="flex-1 overflow-y-auto">
            <div v-if="loadingNodes">Loading nodes...</div>
            <div v-else class="flex flex-col gap-2">
              <button
                v-for="n in availableNodes"
                :key="n.id"
                class="bg-blue-500 text-white px-4 py-2 rounded"
                @click="addNode(n.id, n.type, n.label, n.color, n.icon, n.component_name)"
              >
                {{ n.label }}
              </button>
            </div>
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
  />
</template>


<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
</style>
