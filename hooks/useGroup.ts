import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { clearError, clearSuccess, resetGroupState } from '@/api/groupsApi/groupSlice';


export const useGroup = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  const groupState = useSelector((state: RootState) => state.group);
  
  return {
    // State
    groups: groupState.groups,
    currentGroup: groupState.currentGroup,
    loading: groupState.loading,
    error: groupState.error,
    success: groupState.success,
    total: groupState.total,
    page: groupState.page,
    limit: groupState.limit,
    totalPages: groupState.totalPages,
    
    // Dispatcher
    dispatch,
    
    // Actions
    resetGroupState: () => dispatch(resetGroupState()),
    clearError: () => dispatch(clearError()),
    clearSuccess: () => dispatch(clearSuccess()),
  };
};