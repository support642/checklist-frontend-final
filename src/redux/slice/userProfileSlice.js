import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchUserProfileApi } from "../api/userProfileApi";

// Thunk: fetch user profile from DB
export const fetchUserProfile = createAsyncThunk(
    "userProfile/fetch",
    async (username) => {
        return await fetchUserProfileApi(username);
    }
);

const userProfileSlice = createSlice({
    name: "userProfile",
    initialState: {
        profile: null, // { user_name, unit, division, department }
        loading: false,
        error: null,
    },
    reducers: {
        clearProfile: (state) => {
            state.profile = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUserProfile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchUserProfile.fulfilled, (state, action) => {
                state.loading = false;
                state.profile = action.payload;
            })
            .addCase(fetchUserProfile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message;
            });
    },
});

export const { clearProfile } = userProfileSlice.actions;
export default userProfileSlice.reducer;
