// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import classReducer from '../api/classApi/classSlice';
import teacherReducer from '../api/teacherApi/teacherSlice';
import subjectReducer from '../api/subjectApi/subjectSlice';
import groupReducer from '../api/groupApi/groupSlice';
import batchReducer from '../api/batchApi/batchSlice';
import admissionReducer from '../api/admissionApi/admissionSlice';
import studentReducer from '../api/studentApi/studentSlice';
import attendanceReducer from '../api/attendanceApi/attendanceSlice'; // ADD THIS IMPORT

export const store = configureStore({
  reducer: {
    class: classReducer,
    teacher: teacherReducer,
    subject: subjectReducer,
    group: groupReducer,
    batch: batchReducer,
    admission: admissionReducer,
    student: studentReducer,
    attendance: attendanceReducer, // ADD THIS LINE
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;