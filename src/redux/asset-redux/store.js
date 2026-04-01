import { configureStore } from '@reduxjs/toolkit';
import { productApi } from './slices/productApi';

export const store = configureStore({
    reducer: {
        // Add the generated reducer as a specific top-level slice
        [productApi.reducerPath]: productApi.reducer,
    },
    // Adding the api middleware enables caching, invalidation, polling, and other features of RTK Query
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(productApi.middleware),
});

export default store;
