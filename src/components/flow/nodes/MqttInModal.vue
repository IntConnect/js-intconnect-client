<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { toast } from 'vue3-toastify'
import 'vue3-toastify/dist/index.css'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { addDays, format } from 'date-fns'

import { ofetch } from 'ofetch'

// Props
defineProps({
  open: Boolean,
  data: Object,
  selectedDevice: Object,
})
defineEmits(['update:open'])

// --- States ---
const isOpen = ref(false)
const startDate = ref(new Date())
const endDate = ref(addDays(new Date(), 15))
const startDateRange = ref(new Date())
const endDateRange = ref(addDays(new Date(), 45))

const devices = ref([])
const smtpServerData = reactive({})
const loading = ref(true)
const errors = ref([])

// --- Methods ---
async function fetchDevices() {
  try {
    const res = await ofetch('/smtp-servers')
    const devicesList = res ?? ['No Devices']
    devices.value = devicesList

    if (!props.data && devicesList.length > 0) {
      smtpServerData.device_id = devicesList[0].id
    }
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function fetchSmtpServers() {
  try {
    const res = await ofetch('/smtp-servers')
    Object.assign(smtpServerData, res[0])
  } catch (err) {
  }
}

onMounted(async () => {
  try {
    await Promise.all([fetchDevices(), fetchSmtpServers()])
  } catch (err) {
    console.error(err)
  } finally {
    loading.value = false
  }
})

function onChange(e) {
  smtpServerData[e.target.name] = e.target.value
}

function closeModal() {
  isOpen.value = false
  emit('update:open', false)
}

function formatDate(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

async function onSubmit() {
  try {
    const res = await ofetch('/log-histories/export', {
      method: 'POST',
      body: {
        start_date: startDate.value,
        end_date: endDate.value,
      },
    })

    toast.success('Data berhasil diatur')
    const doc = new jsPDF()
    const tableColumn = ['ID', 'Created At', 'O₂ (%)', 'RH (%)', 'Temperature (°C)', 'Device Name']
    const tableRows = []

    res.data.forEach(item => {
      const row = [
        item.id,
        item.created_at,
        item.o2.toFixed(2),
        item.rh,
        item.temperature,
        props.selectedDevice?.name,
      ]
      tableRows.push(row)
    })

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 10 },
    })

    const fileName = `data-${formatDate(startDate.value)}-${formatDate(endDate.value)}.pdf`
    doc.save(fileName)
    closeModal()
  } catch (err) {
    console.error(err)
    errors.value = err?.response?.data?.error ?? []
    toast.error('Data gagal diatur')
  }
}
</script>

<template>
  <div v-if="open" class="fixed inset-0 flex items-center justify-center z-50">
    <div class="absolute inset-0 bg-black opacity-30" @click="closeModal"></div>
    <div class="bg-white w-full max-w-2xl p-6 relative rounded-lg z-10">
      <DialogCloseButton @click="closeModal"/>

      <h2 class="text-center text-2xl font-bold mb-2">Export Data</h2>
      <p class="text-center mb-4">Pick range data</p>

      <PickersRange
        v-model:startDate="startDate"
        v-model:endDate="endDate"
        v-model:startDateRange="startDateRange"
        v-model:endDateRange="endDateRange"
      />

      <div class="flex justify-center gap-4 mt-6">
        <button class="px-4 py-2 bg-blue-600 text-white rounded" @click="onSubmit">
          {{ data ? 'Update' : 'Submit' }}
        </button>
        <button class="px-4 py-2 bg-gray-400 text-white rounded" @click="closeModal">
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* contoh styling modal */
</style>
