<script setup>
import { ref } from 'vue'

const tableSchema = ref({
  tableName: '',
  columns: [
    { name: '', type: '', length: '', nullable: true, default: '', primary: false, auto_increment: false },
  ],
})

const dataTypes = ['INT', 'FLOAT', 'VARCHAR', 'TEXT', 'BOOLEAN', 'TIMESTAMP']

function addColumn() {
  tableSchema.value.columns.push({
    name: '',
    type: '',
    length: '',
    nullable: true,
    default: '',
    primary: false,
    auto_increment: false,
  })
}

function removeColumn(index) {
  tableSchema.value.columns.splice(index, 1)
}

function submitSchema() {
}
</script>

<template>
  <h1>Manage Schema</h1>
  <VCard class="px-4 space-y-4 pt-5">
    <VTextField
      v-model="tableSchema.tableName"
      label="Table Name"
      placeholder="e.g., sensor_data"
    />

    <VTable class="border border-gray-200 rounded-lg mt-2">
      <thead>
        <tr class="bg-gray-100">
          <th class="px-3 py-2">
            Column Name
          </th>
          <th class="px-3 py-2">
            Type
          </th>
          <th class="px-3 py-2">
            Length
          </th>
          <th class="px-3 py-2">
            Nullable
          </th>
          <th class="px-3 py-2">
            Default
          </th>
          <th class="px-3 py-2">
            Primary
          </th>
          <th class="px-3 py-2">
            Auto Inc
          </th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(col, i) in tableSchema.columns"
          :key="i"
        >
          <td>
            <VTextField
              v-model="col.name"
              placeholder="value"
            />
          </td>
          <td>
            <VSelect
              v-model="col.type"
              :items="dataTypes"
              placeholder="Select Type"
            />
          </td>
          <td>
            <VTextField
              v-model="col.length"
              type="number"
            />
          </td>
          <td>
            <VCheckbox v-model="col.nullable" />
          </td>
          <td>
            <VTextField
              v-model="col.default"
              placeholder="Default"
            />
          </td>
          <td>
            <VCheckbox v-model="col.primary" />
          </td>
          <td>
            <VCheckbox v-model="col.auto_increment" />
          </td>
          <td>
            <VBtn
              color="error"
              icon
              variant="text"
              @click="removeColumn(i)"
            >
              <VIcon icon="tabler-trash" />
            </VBtn>
          </td>
        </tr>
      </tbody>
    </VTable>

    <div class="flex justify-between items-center mt-3 pb-4">
      <VBtn
        color="secondary"
        @click="addColumn"
      >
        <VIcon
          icon="tabler-plus"
          start
        />
        Add Column
      </VBtn>

      <VBtn
        color="primary"
        @click="submitSchema"
      >
        <VIcon
          icon="tabler-database-export"
          start
        />
        Generate Schema
      </VBtn>
    </div>
  </VCard>
</template>
