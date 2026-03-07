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
        maintenance: maintenanceReducer
    }
})

export default store;