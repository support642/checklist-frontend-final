// loginSlice.js
// import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
// import { createDepartmentApi, createUserApi, deleteUserByIdApi, fetchDepartmentDataApi, fetchUserDetailsApi, updateDepartmentDataApi, updateUserDataApi } from '../api/settingApi';
// loginSlice.js - Fix the imports
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  createDepartmentApi,
  createUserApi,
  deleteUserByIdApi,
  fetchDepartmentDataApi,
  fetchUserDetailsApi,
  updateDepartmentDataApi,
  updateUserDataApi,
  fetchDepartmentsOnlyApi,
  fetchGivenByDataApi,
  fetchMachinesApi,
  createMachineApi,
  updateMachineApi,
  deleteMachineApi
} from '../api/settingApi';


export const userDetails = createAsyncThunk(
  'fetch/user',
  async () => {
    const user = await fetchUserDetailsApi();

    return user;
  }
);

export const departmentOnlyDetails = createAsyncThunk(
  'fetch/departments-only',
  async () => {
    const departments = await fetchDepartmentsOnlyApi();
    return departments;
  }
);

export const givenByDetails = createAsyncThunk(
  'fetch/given-by',
  async () => {
    const givenBy = await fetchGivenByDataApi();
    return givenBy;
  }
);

export const departmentDetails = createAsyncThunk(
  'fetch/department',
  async () => {
    const department = await fetchDepartmentDataApi();

    return department;
  }
);

export const createUser = createAsyncThunk(
  'post/users',
  async (newUser) => {
    const user = await createUserApi(newUser);

    return user;
  }
);

export const updateUser = createAsyncThunk('update/users', async ({ id, updatedUser }) => {
  const user = await updateUserDataApi({ id, updatedUser });

  return user;
}
);

export const createDepartment = createAsyncThunk(
  'post/department',
  async (newDept) => {
    const department = await createDepartmentApi(newDept);

    return department;
  }
);

export const updateDepartment = createAsyncThunk('update/department', async ({ id, updatedDept }) => {
  console.log(updatedDept);

  const department = await updateDepartmentDataApi({ id, updatedDept });


  return department;
}
);

export const deleteUser = createAsyncThunk(
  'delete/user',
  async (id) => {
    const deletedId = await deleteUserByIdApi(id);
    return deletedId;
  }
);

export const machineDetails = createAsyncThunk(
  'fetch/machines',
  async () => {
    const machines = await fetchMachinesApi();
    return machines;
  }
);

export const createMachineThunk = createAsyncThunk(
  'post/machine',
  async (newMachine) => {
    const machine = await createMachineApi(newMachine);
    return machine;
  }
);

export const updateMachineThunk = createAsyncThunk(
  'update/machine',
  async ({ id, updatedMachine }) => {
    const machine = await updateMachineApi({ id, updatedMachine });
    return machine;
  }
);

export const deleteMachineThunk = createAsyncThunk(
  'delete/machine',
  async (id) => {
    await deleteMachineApi(id);
    return id;
  }
);



const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    userData: [],
    department: [],
    departmentsOnly: [],
    givenBy: [],
    machines: [],
    error: null,
    loading: false,
    isLoggedIn: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(userDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(userDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.userData = action.payload;

      })
      .addCase(userDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(departmentDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(departmentDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.department = action.payload;

      })
      .addCase(departmentDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;

      })
      .addCase(createUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.loading = false;
        state.userData.push(action.payload);

      })
      .addCase(departmentOnlyDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(departmentOnlyDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.departmentsOnly = action.payload;
      })
      .addCase(departmentOnlyDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(givenByDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(givenByDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.givenBy = action.payload;
      })
      .addCase(givenByDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;

      })
      .addCase(updateUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.userData.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.userData[index] = action.payload;
        }
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;

      })
      .addCase(createDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDepartment.fulfilled, (state, action) => {
        state.loading = false;
        state.department.push(action.payload);

      })
      .addCase(createDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;

      })
      .addCase(updateDepartment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDepartment.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.department.findIndex(dept => dept.id === action.payload.id);
        if (index !== -1) {
          state.department[index] = action.payload;
        } else {
          // If for some reason it's not found (id mismatch), we might need to re-fetch
          // or at least not corrupt the state. For now, let's just push or ignore.
          // But since we are using users table as department storage, re-fetching is safest.
          state.department.push(action.payload);
        }
      })
      .addCase(updateDepartment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;

      })
      .addCase(deleteUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.loading = false;
        state.userData = state.userData.filter((user) => user.id !== action.payload);
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // MACHINES
      .addCase(machineDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(machineDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.machines = action.payload;
      })
      .addCase(machineDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createMachineThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMachineThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.machines.push(action.payload);
      })
      .addCase(createMachineThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateMachineThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMachineThunk.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.machines.findIndex(m => m.id === action.payload?.id);
        if (idx !== -1) state.machines[idx] = action.payload;
      })
      .addCase(updateMachineThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteMachineThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteMachineThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.machines = state.machines.filter(m => m.id !== action.payload);
      })
      .addCase(deleteMachineThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

  },
});

export default settingsSlice.reducer;
