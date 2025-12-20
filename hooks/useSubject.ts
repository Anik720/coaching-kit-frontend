import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { clearError, clearSuccess, resetSubjectState } from '@/api/subjectApi/subjectSlice';

export const useSubject = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  const subjectState = useSelector((state: RootState) => state.subject);
  
  return {
    // State
    subjects: subjectState.subjects,
    currentSubject: subjectState.currentSubject,
    loading: subjectState.loading,
    error: subjectState.error,
    success: subjectState.success,
    total: subjectState.total,
    page: subjectState.page,
    limit: subjectState.limit,
    totalPages: subjectState.totalPages,
    
    // Dispatcher
    dispatch,
    
    // Export actions if needed
    resetSubjectState: () => dispatch(resetSubjectState()),
    clearError: () => dispatch(clearError()),
    clearSuccess: () => dispatch(clearSuccess()),
  };
};