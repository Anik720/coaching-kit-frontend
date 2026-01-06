import { useDispatch, useSelector } from 'react-redux';
import { useCallback } from 'react';
import { RootState, AppDispatch } from '@/store/store';
import { 
  fetchStudents, 
  fetchStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  makePayment,
  fetchStatistics,
  fetchMyStudents,
  fetchMyStatsSummary,
  fetchClasses,
  fetchBatchesByClass,
  resetStudentState,
  setError,
  clearError,
  clearSuccess,
  setCurrentStudent,
  clearDropdownData,
} from '@/api/studentApi/studentSlice';

export const useStudent = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  const students = useSelector((state: RootState) => state.student.students);
  const currentStudent = useSelector((state: RootState) => state.student.currentStudent);
  const loading = useSelector((state: RootState) => state.student.loading);
  const error = useSelector((state: RootState) => state.student.error);
  const success = useSelector((state: RootState) => state.student.success);
  const total = useSelector((state: RootState) => state.student.total);
  const page = useSelector((state: RootState) => state.student.page);
  const limit = useSelector((state: RootState) => state.student.limit);
  const totalPages = useSelector((state: RootState) => state.student.totalPages);
  const classes = useSelector((state: RootState) => state.student.classes || []);
  const batches = useSelector((state: RootState) => state.student.batches || []);
  const dropdownLoaded = useSelector((state: RootState) => state.student.dropdownLoaded);

  // Safe version: only fetch classes if not already loaded
  const loadClassesIfNeeded = useCallback(() => {
    if (!dropdownLoaded && classes.length === 0) {
      dispatch(fetchClasses());
    }
  }, [dispatch, dropdownLoaded, classes.length]);

  // Normal fetchClasses (for manual refresh if needed)
  const fetchClassesForce = useCallback(() => {
    dispatch(fetchClasses());
  }, [dispatch]);

  // Memoized actions
  const actions = {
    fetchStudents: useCallback((params?: any) => dispatch(fetchStudents(params)), [dispatch]),
    fetchStudentById: useCallback((id: string) => dispatch(fetchStudentById(id)), [dispatch]),
    createStudent: useCallback((data: any) => dispatch(createStudent(data)), [dispatch]),
    updateStudent: useCallback((id: string, data: any) => 
      dispatch(updateStudent({ id, studentData: data })), [dispatch]),
    deleteStudent: useCallback((id: string) => dispatch(deleteStudent(id)), [dispatch]),
    makePayment: useCallback((id: string, paymentData: any) => 
      dispatch(makePayment({ id, paymentData })), [dispatch]),
    fetchStatistics: useCallback(() => dispatch(fetchStatistics()), [dispatch]),
    fetchMyStudents: useCallback((params?: any) => dispatch(fetchMyStudents(params)), [dispatch]),
    fetchMyStatsSummary: useCallback(() => dispatch(fetchMyStatsSummary()), [dispatch]),
    fetchBatchesByClass: useCallback((classId: string) => 
      dispatch(fetchBatchesByClass(classId)), [dispatch]),
    resetStudentState: useCallback(() => dispatch(resetStudentState()), [dispatch]),
    setError: useCallback((error: string | null) => dispatch(setError(error)), [dispatch]),
    clearError: useCallback(() => dispatch(clearError()), [dispatch]),
    clearSuccess: useCallback(() => dispatch(clearSuccess()), [dispatch]),
    setCurrentStudent: useCallback((student: any | null) => 
      dispatch(setCurrentStudent(student)), [dispatch]),
    clearDropdownData: useCallback(() => dispatch(clearDropdownData()), [dispatch]),
  };

  return {
    // State
    students,
    currentStudent,
    loading,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
    classes,
    batches,
    dropdownLoaded,

    // Actions
    ...actions,

    // Special safe loaders
    loadClassesIfNeeded,     // Use this in useEffect() — prevents repeated calls
    fetchClasses: fetchClassesForce, // Use only if you want to force refresh
  };
};