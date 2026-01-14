import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { 
  clearError,
  clearSuccess,
  setError,
  setCurrentTeacher,
  resetTeacherState
} from '@/api/teacherApi/teacherSlice';

export const useTeacher = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  const teachers = useSelector((state: RootState) => state.teacher.teachers);
  const currentTeacher = useSelector((state: RootState) => state.teacher.currentTeacher);
  const loading = useSelector((state: RootState) => state.teacher.loading);
  const error = useSelector((state: RootState) => state.teacher.error);
  const success = useSelector((state: RootState) => state.teacher.success);
  const total = useSelector((state: RootState) => state.teacher.total);
  const page = useSelector((state: RootState) => state.teacher.page);
  const limit = useSelector((state: RootState) => state.teacher.limit);
  const totalPages = useSelector((state: RootState) => state.teacher.totalPages);
  const statistics = useSelector((state: RootState) => state.teacher.statistics);

  return {
    // State
    teachers,
    currentTeacher,
    loading,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
    statistics,
    
    // Dispatcher
    dispatch,
    
    // Actions
    clearError: () => dispatch(clearError()),
    clearSuccess: () => dispatch(clearSuccess()),
    setError: (error: string | null) => dispatch(setError(error)),
    setCurrentTeacher: (teacher: any) => dispatch(setCurrentTeacher(teacher)),
    resetTeacherState: () => dispatch(resetTeacherState()),
  };
};