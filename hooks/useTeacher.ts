// src/hooks/useTeacher.ts


import {
  fetchTeachers,
  fetchTeacherById,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  toggleTeacherActive,
  verifyTeacherEmail,
  verifyTeacherPhone,
  fetchStatistics,
  fetchMyStatsSummary,
  resetTeacherState,
  clearError,
  clearSuccess,
} from '@/api/teacherApi/teacherSlice';
import { useAppDispatch, useAppSelector } from './useBatch';

export const useTeacher = () => {
  const dispatch = useAppDispatch();
  const {
    teachers,
    currentTeacher,
    loading,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
  } = useAppSelector((State) => State.teacher);

  const teacherState = {
    teachers,
    currentTeacher,
    loading,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
  };

  return {
    ...teacherState,
    dispatch,
    fetchTeachers: (params?: any) => dispatch(fetchTeachers(params)),
    fetchTeacherById: (id: string) => dispatch(fetchTeacherById(id)),
    createTeacher: (data: any) => dispatch(createTeacher(data)),
    updateTeacher: (id: string, data: any) => dispatch(updateTeacher({ id, teacherData: data })),
    deleteTeacher: (id: string) => dispatch(deleteTeacher(id)),
    toggleTeacherActive: (id: string, isActive: boolean) => 
      dispatch(toggleTeacherActive({ id, isActive })),
    verifyTeacherEmail: (id: string) => dispatch(verifyTeacherEmail(id)),
    verifyTeacherPhone: (id: string) => dispatch(verifyTeacherPhone(id)),
    fetchStatistics: () => dispatch(fetchStatistics()),
    fetchMyStatsSummary: () => dispatch(fetchMyStatsSummary()),
    resetTeacherState: () => dispatch(resetTeacherState()),
    clearError: () => dispatch(clearError()),
    clearSuccess: () => dispatch(clearSuccess()),
  };
};