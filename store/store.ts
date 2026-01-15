import { configureStore } from '@reduxjs/toolkit';
import classReducer from '../api/classApi/classSlice'
import subjectReducer from '../api/subjectApi/subjectSlice'
import groupReducer from '../api/groupsApi/groupSlice';
import batchReducer from '../api/batchApi/batchSlice';
import admissionReducer from '../api/admissionApi/admissionSlice';
import teacherReducer from '@/api/teacherApi/teacherSlice';
import studentReducer from '../api/studentApi/studentSlice';
import examCategoryReducer from '../api/result-management/exam-category/examCategorySlice';
import examReducer from '../api/result-management/create-exam/examSlice';

export const store = configureStore({
  reducer: {
    class: classReducer,
    teacher: teacherReducer,
    subject: subjectReducer,
    group: groupReducer,
    batch: batchReducer,
    admission: admissionReducer,
    student: studentReducer,
    examCategory: examCategoryReducer,
    exam: examReducer,
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