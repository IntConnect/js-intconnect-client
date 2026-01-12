import { useApi } from "@/composables/useApi";
import { ref } from "vue";

export const useManageMachine = () => {
  // --------------------
  // State
  // --------------------
  const machines = ref([]);
  const machine = ref({});
  const totalItems = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(10);
  const totalPages = ref(0);

  const errorMessage = ref(null);
  const formErrors = ref({});
  const actionLoading = ref(false);

  const clearFormErrors = () => (formErrors.value = {});

  const clearErrors = () => {
    errorMessage.value = null;
    formErrors.value = {};
  };

  // --------------------
  // Main API Methods
  // --------------------

  const fetchMachinesPagination = async ({
    page = 1,
    size = 10,
    query = "",
    sort = "id",
    order = "asc",
  }) => {
    clearErrors();
    actionLoading.value = true;

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl("/machines/pagination", {
          query: { page, size, query, sort, order },
        })
      )
        .get()
        .json();

      const result = handleApiError(apiError, { formErrors, errorMessage });
      if (!result.success) return result;
      applyPaginationResponse(
        {
          entries: machines,
          totalItems,
          pageSize,
          totalPages,
        },
        response.value
      );
    } catch (_) {
      return { success: false, error: "Unknown error" };
    } finally {
      actionLoading.value = false;
    }
  };

  const fetchMachines = async () => {
    clearErrors();
    actionLoading.value = true;

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl("/machines", {})
      )
        .get()
        .json();

      const result = handleApiError(apiError, { formErrors, errorMessage });
      if (!result.success) return result;
      machines.value = response.value;

      return {
        success: true,
      };
    } catch (_) {
      return { success: false, error: "Unknown error" };
    } finally {
      actionLoading.value = false;
    }
  };

  const fetchMachinesByFacilityId = async (id) => {
    clearErrors();
    actionLoading.value = true;

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl(`/machines/facilities/${id}`, {})
      )
        .get()
        .json();

      const result = handleApiError(apiError, { formErrors, errorMessage });
      if (!result.success) return result;
      machines.value = response.value;

      return {
        success: true,
      };
    } catch (_) {
      return { success: false, error: "Unknown error" };
    } finally {
      actionLoading.value = false;
    }
  };

  const fetchMachine = async (machineId) => {
    clearErrors();
    actionLoading.value = true;

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl(`/machines/${machineId}`, {})
      )
        .get()
        .json();

      const result = handleApiError(apiError, { formErrors, errorMessage });
      if (!result.success) return result;

      machine.value = response.value;

      return {
        success: true,
      };
    } catch (_) {
      return { success: false, error: "Unknown error" };
    } finally {
      actionLoading.value = false;
    }
  };

  const createMachine = async (machineData) => {
    actionLoading.value = true;
    clearFormErrors();
    try {
      const formData = jsonToFormData(machineData);

     
      // Don't set Content-Type header - let the browser set it automatically with boundary
      const { data: response, error: apiError } = await useApi("/machines", {})
        .post(formData)
        .json();

      const result = handleApiError(apiError, { formErrors, errorMessage });
      if (!result.success) return result;

      return { success: true };
    } catch (err) {
      console.error(err);

      return { success: false, error: "Unknown error" };
    } finally {
      actionLoading.value = false;
    }
  };

  const updateMachine = async (machineId, machineData) => {
    actionLoading.value = true;
    clearFormErrors();
    try {
      const formData = jsonToFormData(machineData);

      // Don't set Content-Type header - let the browser set it automatically with boundary
      const { data: response, error: apiError } = await useApi(
        `/machines/${machineId}`,
        {
          headers: {
            // Remove any default Content-Type headers
          },
        }
      )
        .put(formData)
        .json();

      const result = handleApiError(apiError, { formErrors, errorMessage });
      if (!result.success) return result;

      return { success: true };
    } catch (_) {
      return { success: false, error: "Unknown error" };
    } finally {
      actionLoading.value = false;
    }
  };

  const deleteMachine = async (machineId, reason = "") => {
    actionLoading.value = true;
    clearFormErrors();
    try {
      const { data: response, error: apiError } = await useApi(
        `/machines/${machineId}`
      )
        .delete({ reason })
        .json();

      const result = handleApiError(apiError, { formErrors, errorMessage });
      if (!result.success) return result;

      applyPaginationResponse(
        {
          entries: machines,
          totalItems,
          currentPage,
          pageSize,
          totalPages,
        },
        response.value
      );

      return { success: true };
    } catch (_) {
      return { success: false, error: "Unknown error" };
    } finally {
      actionLoading.value = false;
    }
  };

  const saveMachine = async (machineData) => {
    if (machineData.id) {
      const { id, ...payload } = machineData;

      return updateMachine(id, payload);
    }

    return createMachine(machineData);
  };

  return {
    machines,
    machine,
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    actionLoading,
    errorMessage,
    formErrors,

    fetchMachinesPagination,
    fetchMachinesByFacilityId,
    fetchMachines,
    fetchMachine,
    createMachine,
    updateMachine,
    deleteMachine,
    saveMachine,
    clearFormErrors,
    clearErrors,
  };
};
