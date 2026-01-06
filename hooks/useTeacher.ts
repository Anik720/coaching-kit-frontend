// src/hooks/useTeacher.ts

import { useCallback } from 'react';
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
  } = useAppSelector((state) => state.teacher);

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

  // Memoize all dispatched functions to prevent recreation on every render
  const memoizedFetchTeachers = useCallback(
    (params?: any) => dispatch(fetchTeachers(params)),
    [dispatch]
  );

  const memoizedFetchTeacherById = useCallback(
    (id: string) => dispatch(fetchTeacherById(id)),
    [dispatch]
  );

  const memoizedCreateTeacher = useCallback(
    (data: any) => dispatch(createTeacher(data)),
    [dispatch]
  );

  const memoizedUpdateTeacher = useCallback(
    (id: string, data: any) =>
      dispatch(updateTeacher({ id, teacherData: data })),
    [dispatch]
  );

  const memoizedDeleteTeacher = useCallback(
    (id: string) => dispatch(deleteTeacher(id)),
    [dispatch]
  );

  const memoizedToggleTeacherActive = useCallback(
    (id: string, isActive: boolean) =>
      dispatch(toggleTeacherActive({ id, isActive })),
    [dispatch]
  );

  const memoizedVerifyTeacherEmail = useCallback(
    (id: string) => dispatch(verifyTeacherEmail(id)),
    [dispatch]
  );

  const memoizedVerifyTeacherPhone = useCallback(
    (id: string) => dispatch(verifyTeacherPhone(id)),
    [dispatch]
  );

  const memoizedFetchMyStatsSummary = useCallback(
    () => dispatch(fetchMyStatsSummary()),
    [dispatch]
  );

  return {
    ...teacherState,
    dispatch,
    fetchTeachers: memoizedFetchTeachers,
    fetchTeacherById: memoizedFetchTeacherById,
    createTeacher: memoizedCreateTeacher,
    updateTeacher: memoizedUpdateTeacher,
    deleteTeacher: memoizedDeleteTeacher,
    toggleTeacherActive: memoizedToggleTeacherActive,
    verifyTeacherEmail: memoizedVerifyTeacherEmail,
    verifyTeacherPhone: memoizedVerifyTeacherPhone,
    fetchStatistics: () => dispatch(fetchStatistics()),
    fetchMyStatsSummary: memoizedFetchMyStatsSummary,
    resetTeacherState: () => dispatch(resetTeacherState()),
    clearError: () => dispatch(clearError()),
    clearSuccess: () => dispatch(clearSuccess()),
  };
};