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
const { getNodes, getEdges, addEdges, setNodes, setEdges } = useVueFlow()

// --- nodes & edges ---
const nodes = ref([
  { id: 'n1', type: 'custom', position: { x: 50, y: 50 }, data: { label: 'Node 1' } },
  { id: 'n2', type: 'custom', position: { x: 200, y: 200 }, data: { label: 'Node 2' } },
])

const edges = ref([{ id: 'n1-n2', source: 'n1', target: 'n2' }])
const nodeTypes = { custom: SpecialNode }

// --- sidebar collapsible ---
// Collapsible sidebars
const leftCollapsed = ref(false)
const rightCollapsed = ref(false)

// --- tabs ---
const currentTab = ref(0)
const totalTabs = 3

// --- modal ---
const modalOpen = ref(false)
const selectedNode = ref(null)
const modalComponents = { MqttInModal }

const ModalContent = computed(() => {
  if (!selectedNode.value) return null
  const modalName = selectedNode.value.data.modal

  return modalComponents[modalName] || null
})

// --- handlers ---
function onNodesChange(changes) {
  setNodes(currentNodes =>
    currentNodes.map(node => {
      const change = changes.find(c => c.id === node.id)

      return change ? { ...node, ...change } : node
    }),
  )
}

function onEdgesChange(changes) {
  setEdges(currentEdges =>
    currentEdges.map(edge => {
      const change = changes.find(c => c.id === edge.id)

      return change ? { ...edge, ...change } : edge
    }),
  )
}

function onConnect(params) {
  addEdges([params])
}

function handleNodeClick(node) {
  selectedNode.value = node
  modalOpen.value = true
}

function addNode(id, type, label, backgroundColor, icon, modal) {
  setNodes([...getNodes(), {
    id: id.toString(),
    type: 'custom',
    position: { x: 0, y: 0 },
    data: { label, color: backgroundColor, icon, type, modal },
  }])
}

// --- fetch available nodes ---
const availableNodes = ref([])
const loadingNodes = ref(true)

async function fetchAvailableNodes() {
  loadingNodes.value = true
  try {
    const res = await ofetch('/nodes')

    availableNodes.value = res.data ?? []
  } catch (err) {
    toast.error(err.message || 'Failed to fetch nodes')
  } finally {
    loadingNodes.value = false
  }
}

onMounted(() => fetchAvailableNodes())
</script>


<template>
  <div class="mx-3 my-3">
    <div class="w-full flex justify-between">
      <VBtn color="secondary">
        <VIcon
          start
          icon="tabler-circle-arrow-left-filled"
          size="26"
        />
        Dashboard
      </VBtn>
      <VTabs
        v-model="currentTab"
        class="v-tabs-pill mb-1 flex justify-center"
      >
        <VTab
          v-for="n in totalTabs"
          :key="n"
        >
          {{ 'Tab ' + (n) }}
        </VTab>
      </VTabs>
      <VBtn>
        Submit
        <VIcon
          end
          icon="tabler-send-2"
          size="26"
        />
      </VBtn>
    </div>
    <div class="grid grid-cols-24 gap-4  overflow-hidden transition-all">
      <div
        class="h-full bg-white shadow rounded-lg overflow-hidden transition-all duration-300 ease-in-out"
        :class="[
          leftCollapsed ? 'col-span-2' : 'col-span-4',
        ]"
      >
        <VCard class="h-full flex flex-col">
          <VCardTitle
            class="!flex !justify-between items-center transition-all duration-300 ease-in-out overflow-hidden"
          >
  <span v-show="!leftCollapsed" class="transition-all duration-300">
    All Nodes
  </span>
            <VBtn
              icon
              :class="['transition-all duration-300 ease-in-out', { 'mx-auto': leftCollapsed }]"
              @click="leftCollapsed = !leftCollapsed"
            >
              <VIcon>
                {{ leftCollapsed ? 'tabler-chevron-right' : 'tabler-chevron-left' }}
              </VIcon>
            </VBtn>
          </VCardTitle>

          <VCardText
            v-show="!leftCollapsed"
            class="flex-1 overflow-y-auto"
          >
            <div v-if="loadingNodes">
              Loading nodes...
            </div>
            <div
              v-else
              class="flex flex-col gap-2"
            >
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

      <!-- Main Flow Area -->
      <div
        class="h-full bg-gray-50 rounded-lg overflow-hidden transition-all duration-300 ease-in-out"
        :class="[
          leftCollapsed && rightCollapsed
            ? 'col-span-20'
            : leftCollapsed || rightCollapsed
              ? 'col-span-18'
              : 'col-span-16',
        ]"
      >
        <div
          v-if="currentTab === 0"
          class="w-screen h-screen"
        >
          <VueFlow
            :nodes="nodes"
            :edges="edges"
            :node-types="nodeTypes"
            fit-view
            style="width: 100%; height: 100%;"
            @nodes-change="onNodesChange"
            @edges-change="onEdgesChange"
            @connect="onConnect"
            @node-click="handleNodeClick"
          >
            <Controls/>
            <MiniMap/>
            <Background/>
          </VueFlow>

          <component
            :is="ModalContent"
            v-if="ModalContent"
            v-model:open="modalOpen"
            :node="selectedNode"
          />
        </div>

        <div
          v-else
          class="flex items-center justify-center h-full"
        >
          <p class="text-gray-500">
            Content for Tab {{ currentTab + 1 }}
          </p>
        </div>
      </div>

      <!-- Right Sidebar -->
      <div
        class="h-full bg-white shadow rounded-lg overflow-hidden transition-all duration-300 ease-in-out"
        :class="[
          rightCollapsed ? 'col-span-2' : 'col-span-4',
        ]"
      >
        <VCard class="h-full flex flex-col">
          <VCardTitle class="flex items-center">
            Right
            <VBtn
              icon
              class="ms-auto"
              @click="rightCollapsed = !rightCollapsed"
            >
              <VIcon>
                {{ rightCollapsed ? 'tabler-chevron-left' : 'tabler-chevron-right' }}
              </VIcon>
            </VBtn>
          </VCardTitle>

          <VCardText
            v-show="!rightCollapsed"
            class="flex-1 overflow-y-auto"
          >
            <p>Extra config or node properties here</p>
          </VCardText>
        </VCard>
      </div>
    </div>
  </div>
</template>


<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
</style>
