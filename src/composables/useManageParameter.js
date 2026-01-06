import { useApi } from '@/composables/useApi';
import { ref } from 'vue';

export const useManageParameter = () => {
  // --------------------
  // State
  // --------------------
  const parameters = ref([]);
  const parameter = ref({});
  const parameterDependency = ref({});
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

  const fetchParametersPagination = async ({
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
        createUrl("/parameters/pagination", {
          query: { page, size, query, sort, order },
        })
      )
        .get()
        .json();

      const result = handleApiError(apiError, { formErrors, errorMessage });
      if (!result.success) return result;
      applyPaginationResponse(
        {
          entries: parameters,
          totalItems,
          currentPage,
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

  const fetchParameters = async ({ isAutomatic = null }) => {
    clearErrors();
    actionLoading.value = true;

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl("/parameters", {
          query: { is_automatic: isAutomatic },
        })
      )
        .get()
        .json();

      const result = handleApiError(apiError, { formErrors, errorMessage });
      if (!result.success) return result;
      parameters.value = response.value;

      return {
        success: true,
      };
    } catch (_) {
      return { success: false, error: "Unknown error" };
    } finally {
      actionLoading.value = false;
    }
  };

  const fetchParameter = async (id) => {
    clearErrors();
    actionLoading.value = true;

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl(`/parameters/${id}`, {})
      )
        .get()
        .json();

      const result = handleApiError(apiError, { formErrors, errorMessage });

      if (!result.success) return result;
      parameter.value = response.value;

      return {
        success: true,
      };
    } catch (_) {
      return { success: false, error: "Unknown error" };
    } finally {
      actionLoading.value = false;
    }
  };

  const fetchParameterDependency = async () => {
    clearErrors();
    actionLoading.value = true;

    try {
      const { data: response, error: apiError } = await useApi(
        createUrl("/parameters/create", {})
      )
        .get()
        .json();

      const result = handleApiError(apiError, { formErrors, errorMessage });
      if (!result.success) return result;
      parameterDependency.value = response.value;
    } catch (_) {
      return { success: false, error: "Unknown error" };
    } finally {
      actionLoading.value = false;
    }
  };

  const createParameter = async (parameterData) => {
    actionLoading.value = true;
    clearFormErrors();

    try {
      const { data: response, error: apiError } = await useApi("/parameters")
        .post(parameterData)
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

  const updateParameter = async (parameterId, parameterData) => {
    actionLoading.value = true;
    clearFormErrors();

    try {
      const { data: response, error: apiError } = await useApi(
        `/parameters/${parameterId}`
      )
        .put(parameterData)
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

  const manageParameterOperation = async (
    parameterId,
    parameterOperationData
  ) => {
    actionLoading.value = true;
    clearFormErrors();

    try {
      const { data: response, error: apiError } = await useApi(
        `/parameters/operation/${parameterId}`
      )
        .put(parameterOperationData)
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

  const deleteParameter = async (parameterId, reason = "") => {
    actionLoading.value = true;
    clearFormErrors();

    try {
      const { data: response, error: apiError } = await useApi(
        `/parameters/${parameterId}`
      )
        .delete({ reason })
        .json();

      const result = handleApiError(apiError, { formErrors, errorMessage });
      if (!result.success) return result;

      applyPaginationResponse(
        {
          entries: parameters,
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

  const saveParameter = async (parameterData) => {
    if (parameterData.id) {
      const { id, ...payload } = parameterData;

      return updateParameter(id, payload);
    }

    return createParameter(parameterData);
  };

  const getParameterById = (parameterId) => {
    return parameters.value.find((parameter) => parameter.id === parameterId);
  };

  return {
    parameter,
    parameters,
    parameterDependency,
    totalItems,
    currentPage,
    pageSize,
    totalPages,
    actionLoading,
    errorMessage,
    formErrors,

    fetchParameters,
    fetchParameter,
    fetchParametersPagination,
    fetchParameterDependency,
    createParameter,
    updateParameter,
    manageParameterOperation,
    deleteParameter,
    saveParameter,
    clearFormErrors,
    clearErrors,
    getParameterById,
  };
};
