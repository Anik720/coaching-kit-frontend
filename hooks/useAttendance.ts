// src/hooks/useAttendance.ts
import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';
import {
  fetchAttendanceRecords,
  fetchAttendanceStats,
  fetchStudentsByClassBatch,
  submitAttendance,
  updateAttendance,
  deleteAttendance,
  clearError,
  clearSuccess,
  setFilters,
  clearFilters,
  AttendanceFilters,
  AttendanceFormData,
} from '../api/attendanceApi/attendanceSlice';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useAttendance = () => {
  const dispatch = useAppDispatch();
  const {
    attendanceRecords,
    currentAttendance,
    attendanceStats,
    loading,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
    filters,
  } = useAppSelector((state) => state.attendance);

  const attendanceState = {
    attendanceRecords,
    currentAttendance,
    attendanceStats,
    loading,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
    filters,
  };

  return {
    ...attendanceState,
    dispatch,
    // Actions
    fetchAttendanceRecords: (filters: AttendanceFilters) => 
      dispatch(fetchAttendanceRecords(filters)),
    fetchAttendanceStats: (filters: AttendanceFilters) => 
      dispatch(fetchAttendanceStats(filters)),
    fetchStudentsByClassBatch: (classId: string, batchId: string) => 
      dispatch(fetchStudentsByClassBatch({ classId, batchId })),
    submitAttendance: (attendanceData: AttendanceFormData) => 
      dispatch(submitAttendance(attendanceData)),
    updateAttendance: (id: string, attendanceData: Partial<AttendanceFormData>) => 
      dispatch(updateAttendance({ id, attendanceData })),
    deleteAttendance: (id: string) => 
      dispatch(deleteAttendance(id)),
    clearError: () => dispatch(clearError()),
    clearSuccess: () => dispatch(clearSuccess()),
    setFilters: (filters: AttendanceFilters) => dispatch(setFilters(filters)),
    clearFilters: () => dispatch(clearFilters()),
  };
};