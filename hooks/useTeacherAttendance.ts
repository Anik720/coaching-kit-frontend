import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';
import {
  fetchTeacherAttendances,
  fetchTeacherAttendanceById,
  fetchAttendanceByTeacherDate,
  createTeacherAttendance,
  updateTeacherAttendance,
  deleteTeacherAttendance,
  approveTeacherAttendance,
  fetchMonthlyReport,
  fetchPendingAttendances,
  clearError,
  clearSuccess,
  clearMonthlyReport,
  setCurrentRecord,
  TeacherAttendanceFilters,
  TeacherAttendanceRecord,
} from '../api/teacherAttendanceApi/teacherAttendanceSlice';

const useAppDispatch: () => AppDispatch = useDispatch;
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const useTeacherAttendance = () => {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.teacherAttendance);

  return {
    ...state,
    dispatch,
    fetchAll: (params?: TeacherAttendanceFilters) =>
      dispatch(fetchTeacherAttendances(params || {})),
    fetchById: (id: string) =>
      dispatch(fetchTeacherAttendanceById(id)),
    fetchByTeacherDate: (teacherId: string, date: string) =>
      dispatch(fetchAttendanceByTeacherDate({ teacherId, date })),
    create: (data: any) =>
      dispatch(createTeacherAttendance(data)),
    update: (id: string, data: any) =>
      dispatch(updateTeacherAttendance({ id, data })),
    remove: (id: string) =>
      dispatch(deleteTeacherAttendance(id)),
    approve: (id: string, approvalStatus: string, remarks?: string) =>
      dispatch(approveTeacherAttendance({ id, approvalStatus, remarks })),
    fetchMonthlyReport: (teacherId: string, month: number, year: number) =>
      dispatch(fetchMonthlyReport({ teacherId, month, year })),
    fetchPending: () =>
      dispatch(fetchPendingAttendances()),
    clearError: () => dispatch(clearError()),
    clearSuccess: () => dispatch(clearSuccess()),
    clearMonthlyReport: () => dispatch(clearMonthlyReport()),
    setCurrentRecord: (record: TeacherAttendanceRecord | null) =>
      dispatch(setCurrentRecord(record)),
  };
};
