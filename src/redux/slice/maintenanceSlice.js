import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
    fetchMaintenanceDataForHistory,
    fetchMaintenanceDataSortByDate,
    postMaintenanceAdminDoneAPI,
    updateMaintenanceData,
    fetchUniqueMaintenanceData,
    deleteUniqueMaintenanceTasksApi,
    updateUniqueMaintenanceTaskApi,
    fetchMachineParts
} from "../api/maintenanceApi";

// ============================================================
// 1️⃣ FETCH PENDING MAINTENANCE TASKS
// ============================================================
export const maintenanceData = createAsyncThunk(
    "fetch/maintenance",
    async ({ page = 1, search = '' } = {}) => {
        const { data, totalCount } = await fetchMaintenanceDataSortByDate(page, search);
        return { data, totalCount, page, search };
    }
);

// ============================================================
// 2️⃣ FETCH HISTORY MAINTENANCE TASKS
// ============================================================
export const maintenanceHistoryData = createAsyncThunk(
    "fetch/maintenanceHistory",
    async (search = "") => {
        const { data, totalCount, approvedCount } = await fetchMaintenanceDataForHistory(search);
        return { data, totalCount, approvedCount };
    }
);

// ============================================================
// 3️⃣ UPDATE MAINTENANCE TASKS (USER SUBMISSION)
// ============================================================
export const updateMaintenance = createAsyncThunk(
    "update/maintenance",
    async (submissionData) => {
        const updated = await updateMaintenanceData(submissionData);
        return updated;
    }
);

// ============================================================
// 4️⃣ ADMIN DONE
// ============================================================
export const maintenanceAdminDone = createAsyncThunk(
    "insert/maintenance_admin_done",
    async (items) => {
        const admin_done = await postMaintenanceAdminDoneAPI(items);
        return admin_done;
    }
);

// ============================================================
// 5️⃣ FETCH UNIQUE MAINTENANCE TASKS (QUICKTASK)
// ============================================================
export const uniqueMaintenanceTaskData = createAsyncThunk(
    "fetch/uniqueMaintenanceTask",
    async ({ page = 0, pageSize = 50, nameFilter = "", append = false }) => {
        const result = await fetchUniqueMaintenanceData(page, pageSize, nameFilter);
        return { ...result, append };
    }
);

// ============================================================
// 6️⃣ DELETE UNIQUE MAINTENANCE TASKS (QUICKTASK)
// ============================================================
export const deleteUniqueMaintenanceTask = createAsyncThunk(
    "delete/uniqueMaintenanceTask",
    async (tasks, { rejectWithValue }) => {
        try {
            await deleteUniqueMaintenanceTasksApi(tasks);
            // We return tasks so we know which ones to filter out of the UI
            return tasks;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// ============================================================
// 7️⃣ UPDATE UNIQUE MAINTENANCE TASKS (QUICKTASK)
// ============================================================
export const updateUniqueMaintenanceTask = createAsyncThunk(
    "update/uniqueMaintenanceTask",
    async ({ updatedTask, originalTask }, { rejectWithValue }) => {
        try {
            const result = await updateUniqueMaintenanceTaskApi(updatedTask, originalTask);
            return result;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// ============================================================
// 8️⃣ FETCH MACHINE PARTS (master table)
// ============================================================
export const fetchMachinePartsData = createAsyncThunk(
    "fetch/machineParts",
    async () => {
        const data = await fetchMachineParts();
        return data;
    }
);

// ============================================================
// 8️⃣ SLICE
// ============================================================
const maintenanceSlice = createSlice({
    name: "maintenance",
    initialState: {
        maintenance: [],
        history: [],
        uniqueMaintenanceTasks: [], // For QuickTask view
        machineParts: [],           // Master machine_parts data
        loading: false,
        error: null,
        hasMore: true,
        currentPage: 1,
        historyTotalCount: 0,
        historyApprovedCount: 0,
        uniqueMaintenancePage: 0,
        uniqueMaintenanceTotal: 0,
        uniqueMaintenanceHasMore: true,
    },

    reducers: {
        resetUniqueMaintenancePagination: (state) => {
            state.uniqueMaintenanceTasks = [];
            state.uniqueMaintenancePage = 0;
            state.uniqueMaintenanceHasMore = true;
        }
    },

    extraReducers: (builder) => {
        builder

            // -----------------------------
            // FETCH PENDING MAINTENANCE
            // -----------------------------
            .addCase(maintenanceData.pending, (state) => {
                state.loading = true;
            })

            .addCase(maintenanceData.fulfilled, (state, action) => {
                state.loading = false;

                if (action.payload.page === 1) {
                    state.maintenance = action.payload.data;
                } else {
                    state.maintenance = [...state.maintenance, ...action.payload.data];
                }

                state.currentPage = action.payload.page;

                // Determine pagination
                state.hasMore = state.maintenance.length < action.payload.totalCount;
            })

            .addCase(maintenanceData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error?.message || "Failed fetching maintenance tasks";
            })

            // -----------------------------
            // FETCH HISTORY
            // -----------------------------
            .addCase(maintenanceHistoryData.pending, (state) => {
                state.loading = true;
            })

            .addCase(maintenanceHistoryData.fulfilled, (state, action) => {
                state.loading = false;
                state.history = action.payload.data;
                state.historyTotalCount = parseInt(action.payload.totalCount) || 0;
                state.historyApprovedCount = parseInt(action.payload.approvedCount) || 0;
            })

            .addCase(maintenanceHistoryData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error?.message || "Failed fetching maintenance history";
            })

            // -----------------------------
            // UPDATE TASKS (USER SUBMIT)
            // -----------------------------
            .addCase(updateMaintenance.pending, (state) => {
                state.loading = true;
            })

            .addCase(updateMaintenance.fulfilled, (state) => {
                state.loading = false;
            })

            .addCase(updateMaintenance.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error?.message || "Failed updating maintenance tasks";
            })

            // -----------------------------
            // ADMIN DONE
            // -----------------------------
            .addCase(maintenanceAdminDone.pending, (state) => {
                state.loading = true;
            })
            .addCase(maintenanceAdminDone.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(maintenanceAdminDone.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error?.message || "Admin update failed for maintenance";
            })

            // -----------------------------
            // FETCH UNIQUE MAINTENANCE
            // -----------------------------
            .addCase(uniqueMaintenanceTaskData.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(uniqueMaintenanceTaskData.fulfilled, (state, action) => {
                state.loading = false;

                // Fallbacks in case the backend returns an error object without data/total
                const data = action.payload?.data || [];
                const total = action.payload?.total || 0;
                const append = action.payload?.append || false;

                if (append) {
                    state.uniqueMaintenanceTasks = [...state.uniqueMaintenanceTasks, ...data];
                    state.uniqueMaintenancePage += 1;
                } else {
                    state.uniqueMaintenanceTasks = data;
                    state.uniqueMaintenancePage = 1;
                }

                state.uniqueMaintenanceTotal = total;
                state.uniqueMaintenanceHasMore = state.uniqueMaintenanceTasks.length < total;
            })
            .addCase(uniqueMaintenanceTaskData.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // -----------------------------
            // DELETE UNIQUE MAINTENANCE
            // -----------------------------
            .addCase(deleteUniqueMaintenanceTask.pending, (state) => {
                state.loading = true;
            })
            .addCase(deleteUniqueMaintenanceTask.fulfilled, (state, action) => {
                state.loading = false;
                const tasksToDelete = action.payload;
                // Filter out tasks that match the deleted name and description
                state.uniqueMaintenanceTasks = state.uniqueMaintenanceTasks.filter(
                    task => !tasksToDelete.some(t => t.name === task.name && t.task_description === task.task_description)
                );
            })
            .addCase(deleteUniqueMaintenanceTask.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // -----------------------------
            // UPDATE UNIQUE MAINTENANCE
            // -----------------------------
            .addCase(updateUniqueMaintenanceTask.pending, (state) => {
                state.loading = true;
            })
            .addCase(updateUniqueMaintenanceTask.fulfilled, (state, action) => {
                state.loading = false;
                const updatedTask = action.payload; // Backend returns the single updated record map

                // If backend returns an object that has task_id
                if (updatedTask && updatedTask.task_id) {
                    const index = state.uniqueMaintenanceTasks.findIndex(task => task.task_id === updatedTask.task_id);
                    if (index !== -1) {
                        state.uniqueMaintenanceTasks[index] = updatedTask;
                    }
                }
            })
            .addCase(updateUniqueMaintenanceTask.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })

            // -----------------------------
            // FETCH MACHINE PARTS
            // -----------------------------
            .addCase(fetchMachinePartsData.pending, (state) => {
                // Don't set loading=true here to avoid interfering with task loading
            })
            .addCase(fetchMachinePartsData.fulfilled, (state, action) => {
                state.machineParts = action.payload || [];
            })
            .addCase(fetchMachinePartsData.rejected, (state, action) => {
                state.error = action.error?.message || "Failed fetching machine parts";
            });
    },
});

export const { resetUniqueMaintenancePagination } = maintenanceSlice.actions;

export default maintenanceSlice.reducer;
