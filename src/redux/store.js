import { configureStore } from "@reduxjs/toolkit";
import loginSliceReducer from "./slice/loginSlice";
import assignTaskReducer from './slice/assignTaskSlice';
import quickTaskReducer from './slice/quickTaskSlice';
import delegationReducer from "./slice/delegationSlice";
import checkListReducer from "./slice/checklistSlice";
import dashboardReducer from "./slice/dashboardSlice";
import settingReducer from './slice/settingSlice'
import userProfileReducer from './slice/userProfileSlice'
import maintenanceReducer from './slice/maintenanceSlice'
import { productApi } from './asset-redux/slices/productApi';

const store = configureStore({
    reducer: {
        login: loginSliceReducer,
        assignTask: assignTaskReducer,
        quickTask: quickTaskReducer,
        delegation: delegationReducer,
        checkList: checkListReducer,
        dashBoard: dashboardReducer,
        setting: settingReducer,
        userProfile: userProfileReducer,
        maintenance: maintenanceReducer,
        [productApi.reducerPath]: productApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                warnAfter: 128,
            },
        }).concat(productApi.middleware),
})

export default store;