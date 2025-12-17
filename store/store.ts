import { configureStore } from '@reduxjs/toolkit';
import classReducer from '../api/classApi/classSlice'

export const store = configureStore({
  reducer: {
    class: classReducer,
    // Add other reducers here
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['class/createClass/fulfilled', 'class/updateClass/fulfilled'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;