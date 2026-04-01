import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchDelegationDataSortByDate,
  fetchDelegation_DoneDataSortByDate,
  insertDelegationDoneAndUpdate,
} from "../api/delegationApi";

export const delegationData = createAsyncThunk(
  "delegation/fetchPending",
  async ({ startDate = "", endDate = "" } = {}) => {
    return await fetchDelegationDataSortByDate(startDate, endDate);
  }
);

export const delegationDoneData = createAsyncThunk(
  "delegation/fetchDone",
  async ({ search = "", startDate = "", endDate = "", name = 'all', division = 'all', departmentFilter = 'all' } = {}) => {
    return await fetchDelegation_DoneDataSortByDate(search, startDate, endDate, name, division, departmentFilter);
  }
);

export const submitDelegation = createAsyncThunk(
  "delegation/submit",
  async (payload) => {
    return await insertDelegationDoneAndUpdate(payload);
  }
);

const delegationSlice = createSlice({
  name: "delegation",
  initialState: {
    delegation: [],
    delegation_done: [],
    delegationTotalCount: 0,
    delegationApprovedCount: 0,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Pending
      .addCase(delegationData.pending, (state) => {
        state.loading = true;
      })
      .addCase(delegationData.fulfilled, (state, action) => {
        state.loading = false;
        state.delegation = action.payload;
      })
      .addCase(delegationData.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to fetch delegation";
      })

      // Fetch Done
      .addCase(delegationDoneData.pending, (state) => {
        state.loading = true;
      })
      .addCase(delegationDoneData.fulfilled, (state, action) => {
        state.loading = false;
        state.delegation_done = action.payload.data;
        state.delegationTotalCount = parseInt(action.payload.totalCount) || 0;
        state.delegationApprovedCount = parseInt(action.payload.approvedCount) || 0;
      })
      .addCase(delegationDoneData.rejected, (state) => {
        state.loading = false;
        state.error = "Failed to fetch done delegation";
      })

      // Submit
      .addCase(submitDelegation.pending, (state) => {
        state.loading = true;
      })
      .addCase(submitDelegation.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(submitDelegation.rejected, (state) => {
        state.loading = false;
        state.error = "Submission failed";
      });
  },
});

export default delegationSlice.reducer;
