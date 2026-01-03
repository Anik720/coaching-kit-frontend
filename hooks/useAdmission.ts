import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import { 
  fetchAdmissions, 
  fetchAdmissionByRegistrationId,
  createAdmission,
  updateAdmission,
  deleteAdmission,
  fetchAdmissionStatistics,
  fetchActiveBatches,
  fetchClasses,
  fetchGroups,
  fetchSubjects,
  updateAdmissionStatus,
  updateAdmissionPayment,
  generateRegistrationId,
  resetAdmissionState,
  setError,
  clearError,
  clearSuccess,
  setCurrentAdmission,
  clearDropdownData,
  fetchBatchesByClass,
} from '@/api/admissionApi/admissionSlice';

export const useAdmission = () => {
  const dispatch = useDispatch<AppDispatch>();
  
  const admissions = useSelector((state: RootState) => state.admission.admissions);
  const currentAdmission = useSelector((state: RootState) => state.admission.currentAdmission);
  const loading = useSelector((state: RootState) => state.admission.loading);
  const error = useSelector((state: RootState) => state.admission.error);
  const success = useSelector((state: RootState) => state.admission.success);
  const total = useSelector((state: RootState) => state.admission.total);
  const page = useSelector((state: RootState) => state.admission.page);
  const limit = useSelector((state: RootState) => state.admission.limit);
  const totalPages = useSelector((state: RootState) => state.admission.totalPages);
  const statistics = useSelector((state: RootState) => state.admission.statistics);
  const batches = useSelector((state: RootState) => state.admission.batches);
  const classes = useSelector((state: RootState) => state.admission.classes);
  const groups = useSelector((state: RootState) => state.admission.groups);
  const subjects = useSelector((state: RootState) => state.admission.subjects);

  return {
    // State
    admissions,
    currentAdmission,
    loading,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
    statistics,
    batches,
    classes,
    groups,
    subjects,
    
    // Actions
    dispatch,
    fetchAdmissions: (params?: any) => dispatch(fetchAdmissions(params)),
    fetchAdmissionByRegistrationId: (registrationId: string) => 
      dispatch(fetchAdmissionByRegistrationId(registrationId)),
    createAdmission: (data: any) => dispatch(createAdmission(data)),
    updateAdmission: (registrationId: string, data: any) => 
      dispatch(updateAdmission({ registrationId, admissionData: data })),
    deleteAdmission: (registrationId: string) => dispatch(deleteAdmission(registrationId)),
    fetchAdmissionStatistics: () => dispatch(fetchAdmissionStatistics()),
    fetchActiveBatches: () => dispatch(fetchActiveBatches()),
    fetchClasses: () => dispatch(fetchClasses()),
    fetchGroups: () => dispatch(fetchGroups()),
    fetchSubjects: () => dispatch(fetchSubjects()),
    updateAdmissionStatus: (registrationId: string, status: string) => 
      dispatch(updateAdmissionStatus({ registrationId, status: status as any })),
    updateAdmissionPayment: (registrationId: string, paidAmount: number) => 
      dispatch(updateAdmissionPayment({ registrationId, paidAmount })),
    generateRegistrationId: () => dispatch(generateRegistrationId()),
    resetAdmissionState: () => dispatch(resetAdmissionState()),
    setError: (error: string | null) => dispatch(setError(error)),
    clearError: () => dispatch(clearError()),
    clearSuccess: () => dispatch(clearSuccess()),
    fetchBatchesByClass: (classId: string) => 
    dispatch(fetchBatchesByClass(classId)),
    setCurrentAdmission: (admission: any | null) => dispatch(setCurrentAdmission(admission)),
    clearDropdownData: () => dispatch(clearDropdownData()),
  };
};