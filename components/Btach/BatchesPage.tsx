"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useBatch } from "@/hooks/useBatch";
import { 
  clearError, 
  clearSuccess, 
  createBatch, 
  deleteBatch, 
  fetchBatches,
  updateBatch,
  toggleBatchStatus,
  fetchClasses,
  fetchGroups,
  fetchSubjects 
} from "@/api/batchApi/batchSlice";
import { toastManager } from "@/utils/toastConfig";
import styles from './Batches.module.css';
import ConfirmationModal from "../common/ConfirmationModal";

// Debounce hook for search optimization
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export default function BatchesPage() {
  const {
    batches,
    loading,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
    classes,
    groups,
    subjects,
    dispatch,
  } = useBatch();

  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Use debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch batches and dropdown data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          dispatch(fetchBatches({
            search: debouncedSearchTerm || undefined,
            page: currentPage,
            limit: 10,
            sortBy: 'createdAt',
            sortOrder: 'desc',
          })).unwrap(),
          dispatch(fetchClasses()).unwrap(),
          dispatch(fetchGroups()).unwrap(),
          dispatch(fetchSubjects()).unwrap(),
        ]);
      } catch (error: any) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();
  }, [dispatch, debouncedSearchTerm, currentPage]);

  // Handle success/error messages
  useEffect(() => {
    if (success) {
      toastManager.showSuccess('Operation completed successfully!');
      dispatch(clearSuccess());
    }
    if (error) {
      toastManager.showError(error);
      dispatch(clearError());
    }
  }, [success, error, dispatch]);

 // In the handleCreateBatch function:
    const handleCreateBatch = useCallback(async (batchData: any) => {
    console.log('🟡 Starting create batch with data:', batchData);
    
    const toastId = toastManager.showLoading('Creating batch...');
    
    try {
        // Get current user ID
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user.id || '507f1f77bcf86cd799439014';
        
        console.log('🟡 User ID:', userId);
        
        // Prepare the data for API
        const apiData = {
        batchName: batchData.batchName,
        className: batchData.className,
        group: batchData.group,
        subject: batchData.subject,
        sessionYear: batchData.sessionYear,
        batchStartingDate: batchData.batchStartingDate,
        batchClosingDate: batchData.batchClosingDate,
        admissionFee: Number(batchData.admissionFee) || 0,
        tuitionFee: Number(batchData.tuitionFee) || 0,
        courseFee: Number(batchData.courseFee) || 0,
        maxStudents: Number(batchData.maxStudents) || 50,
        status: batchData.status || 'upcoming',
        isActive: batchData.status === 'active',
        description: batchData.description || '',
        createdBy: userId,
        };
        
        console.log('🟡 Final API data:', apiData);
        
        await dispatch(createBatch(apiData)).unwrap();
        
        console.log('🟢 Batch created successfully');
        toastManager.safeUpdateToast(toastId, 'Batch created successfully!', 'success');
        setOpen(false);
    } catch (error: any) {
        console.error('🔴 Create batch error:', error);
        console.error('🔴 Error response:', error.response?.data);
        console.error('🔴 Error message:', error.message);
        
        const errorMessage = error.response?.data?.message || error.message || 'Failed to create batch';
        toastManager.safeUpdateToast(toastId, errorMessage, 'error');
    }
    }, [dispatch]);

  const handleUpdateBatch = useCallback(async (id: string, batchData: any) => {
    const toastId = toastManager.showLoading('Updating batch...');
    
    try {
      await dispatch(updateBatch({ id, batchData })).unwrap();
      toastManager.safeUpdateToast(toastId, 'Batch updated successfully!', 'success');
    } catch (error: any) {
      console.error('Update batch error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update batch';
      toastManager.safeUpdateToast(toastId, errorMessage, 'error');
    }
  }, [dispatch]);

  const handleToggleStatus = useCallback(async (id: string) => {
    const toastId = toastManager.showLoading('Updating batch status...');
    
    try {
      await dispatch(toggleBatchStatus(id)).unwrap();
      toastManager.safeUpdateToast(toastId, 'Batch status updated!', 'success');
    } catch (error: any) {
      console.error('Toggle status error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update batch status';
      toastManager.safeUpdateToast(toastId, errorMessage, 'error');
    }
  }, [dispatch]);

  const handleDeleteClick = useCallback((id: string) => {
    setBatchToDelete(id);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!batchToDelete) return;
    
    setIsDeleting(true);
    const toastId = toastManager.showLoading('Deleting batch...');
    
    try {
      await dispatch(deleteBatch(batchToDelete)).unwrap();
      toastManager.safeUpdateToast(toastId, 'Batch deleted successfully!', 'success');
    } catch (error: any) {
      console.error('Delete batch error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete batch';
      toastManager.safeUpdateToast(toastId, errorMessage, 'error');
    } finally {
      setIsDeleting(false);
      setBatchToDelete(null);
    }
  }, [dispatch, batchToDelete]);

  const handleDeleteCancel = useCallback(() => {
    setBatchToDelete(null);
  }, []);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchTerm("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalBatches = total;
    const activeBatches = batches.filter(b => b.isActive).length;
    const upcomingBatches = batches.filter(b => b.status === 'upcoming').length;
    const completedBatches = batches.filter(b => b.status === 'completed').length;
    
    const totalRevenue = batches.reduce((sum, batch) => {
      return sum + (batch.admissionFee + batch.tuitionFee + batch.courseFee) * (batch.maxStudents || 50) * 0.7;
    }, 0);
    
    const averageFee = batches.length > 0 
      ? batches.reduce((sum, batch) => sum + (batch.admissionFee + batch.tuitionFee + batch.courseFee), 0) / batches.length
      : 0;

    return { totalBatches, activeBatches, upcomingBatches, completedBatches, totalRevenue, averageFee };
  }, [batches, total]);

  // Helper function to get display name
  const getDisplayName = (item: any, nameField: string) => {
    if (!item) return 'N/A';
    
    if (typeof item === 'object' && item[nameField]) {
      return item[nameField];
    }
    
    // Find in local data
    if (nameField === 'classname') {
      const found = classes.find(c => c._id === item);
      return found?.classname || 'N/A';
    } else if (nameField === 'groupName') {
      const found = groups.find(g => g._id === item);
      return found?.groupName || 'N/A';
    } else if (nameField === 'subjectName') {
      const found = subjects.find(s => s._id === item);
      return found?.subjectName || 'N/A';
    }
    
    return item;
  };

  // Render the component
  return (
    <div className={styles.pageContainer}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>Batch Management</h1>
            <p className={styles.pageSubtitle}>Manage and organize your academic batches</p>
            <div className={styles.searchStats}>
              {debouncedSearchTerm && (
                <span className={styles.searchResultInfo}>
                  Showing results for "{debouncedSearchTerm}"
                </span>
              )}
              {loading && (
                <span className={styles.loadingIndicator}>
                  <div className={styles.spinnerSmall}></div>
                  Loading...
                </span>
              )}
            </div>
          </div>
          <button 
            onClick={() => setOpen(true)} 
            className={styles.btnPrimary}
            disabled={loading}
            type="button"
          >
            {loading ? (
              <span className={styles.spinnerSmall}></span>
            ) : (
              <>
                <svg className={styles.btnIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Create New Batch
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            📚
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Batches</p>
            <p className={styles.statValue}>{stats.totalBatches}</p>
            <span className={styles.statSubtext}>{stats.activeBatches} active</span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            📈
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Upcoming Batches</p>
            <p className={styles.statValue}>{stats.upcomingBatches}</p>
            <span className={styles.statSubtext}>Starting soon</span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            💰
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Revenue</p>
            <p className={styles.statValue}>${stats.totalRevenue.toLocaleString()}</p>
            <span className={styles.statSubtext}>Avg: ${stats.averageFee.toFixed(2)} per batch</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            ✅
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Completed</p>
            <p className={styles.statValue}>{stats.completedBatches}</p>
            <span className={styles.statSubtext}>Finished batches</span>
          </div>
        </div>
      </div>

      {/* Batches Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>
            All Batches
            <span className={styles.tableCount}>({total} total)</span>
          </h2>
          <div className={styles.searchBox}>
            <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by batch name..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={handleSearch}
              disabled={loading}
            />
            {searchTerm && (
              <button
                onClick={handleSearchClear}
                className={styles.searchClear}
                title="Clear search"
                disabled={loading}
                type="button"
              >
                ✕
              </button>
            )}
            {loading && (
              <div className={styles.searchLoading}>
                <div className={styles.spinnerSmall}></div>
              </div>
            )}
          </div>
        </div>

        {loading && !batches.length ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinnerLarge}></div>
            <p className={styles.loadingText}>Loading batches...</p>
            <p className={styles.loadingSubtext}>Please wait while we fetch your data</p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              {batches.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📚</div>
                  <h3 className={styles.emptyTitle}>No batches found</h3>
                  <p className={styles.emptyDescription}>
                    {debouncedSearchTerm 
                      ? `No batches found for "${debouncedSearchTerm}". Try a different search term.`
                      : "You haven't created any batches yet. Get started by creating your first batch!"}
                  </p>
                  {!debouncedSearchTerm && (
                    <button 
                      onClick={() => setOpen(true)} 
                      className={styles.btnPrimary}
                      type="button"
                    >
                      Create First Batch
                    </button>
                  )}
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Batch Name</th>
                      <th>Class</th>
                      <th>Group</th>
                      <th>Subject</th>
                      <th>Session</th>
                      <th>Dates</th>
                      <th>Fees</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batches.map((batch) => (
                      <tr key={batch._id}>
                        <td>
                          <div className={styles.classNameCell}>
                            <span className={styles.classIcon}>📅</span>
                            <div>
                              <span className={styles.className}>{batch.batchName}</span>
                              <div className={styles.batchInfo}>
                                <span className={styles.maxStudents}>Max: {batch.maxStudents} students</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          {getDisplayName(batch.className, 'classname')}
                        </td>
                        <td>
                          {getDisplayName(batch.group, 'groupName')}
                        </td>
                        <td>
                          {getDisplayName(batch.subject, 'subjectName')}
                        </td>
                        <td className={styles.dateCell}>
                          {batch.sessionYear}
                        </td>
                        <td className={styles.dateCell}>
                          <div className={styles.dateRange}>
                            <div>Start: {new Date(batch.batchStartingDate).toLocaleDateString()}</div>
                            <div>End: {new Date(batch.batchClosingDate).toLocaleDateString()}</div>
                            {batch.daysRemaining !== undefined && batch.daysRemaining > 0 && (
                              <div className={styles.daysRemaining}>
                                {batch.daysRemaining} days left
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className={styles.feesCell}>
                            <div>Admission: ${batch.admissionFee}</div>
                            <div>Tuition: ${batch.tuitionFee}</div>
                            <div>Course: ${batch.courseFee}</div>
                            <div className={styles.totalFee}>Total: ${(batch.admissionFee + batch.tuitionFee + batch.courseFee).toLocaleString()}</div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.statusCell}>
                            <span className={`${styles.statusBadge} ${
                              batch.status === 'active' ? styles.active :
                              batch.status === 'upcoming' ? styles.upcoming :
                              batch.status === 'completed' ? styles.completed :
                              styles.inactive
                            }`}>
                              {batch.status.charAt(0).toUpperCase() + batch.status.slice(1)}
                            </span>
                            <button
                              onClick={() => handleToggleStatus(batch._id)}
                              className={`${styles.toggleStatusBtn} ${batch.isActive ? styles.activeToggle : styles.inactiveToggle}`}
                              title={batch.isActive ? 'Deactivate' : 'Activate'}
                              disabled={loading}
                              type="button"
                            >
                              {batch.isActive ? '✅' : '❌'}
                            </button>
                          </div>
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button
                              onClick={() => handleDeleteClick(batch._id)}
                              className={styles.btnDelete}
                              title="Delete"
                              disabled={loading}
                              type="button"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1 || loading}
                  className={styles.paginationButton}
                  type="button"
                >
                  First
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className={styles.paginationButton}
                  type="button"
                >
                  Previous
                </button>
                <div className={styles.paginationPages}>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`${styles.pageNumber} ${currentPage === pageNum ? styles.activePage : ''}`}
                        disabled={loading}
                        type="button"
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className={styles.paginationButton}
                  type="button"
                >
                  Next
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages || loading}
                  className={styles.paginationButton}
                  type="button"
                >
                  Last
                </button>
                <span className={styles.paginationInfo}>
                  Page {currentPage} of {totalPages}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Batch Modal */}
      {open && (
        <CreateBatchModal
          onClose={() => setOpen(false)}
          onCreate={handleCreateBatch}
          loading={loading}
          classes={classes}
          groups={groups}
          subjects={subjects}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!batchToDelete}
        title="Delete Batch"
        message="Are you sure you want to delete this batch? This action cannot be undone and all associated data will be permanently removed."
        confirmText="Delete Batch"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isConfirming={isDeleting}
        isDanger={true}
        icon="danger"
      />
    </div>
  );
}


// Create Batch Modal Component
function CreateBatchModal({
  onClose,
  onCreate,
  loading,
  classes,
  groups,
  subjects,
}: {
  onClose: () => void;
  onCreate: (batchData: any) => void;
  loading: boolean;
  classes: any[];
  groups: any[];
  subjects: any[];
}) {
  const [formData, setFormData] = useState({
    batchName: '',
    className: '',
    group: '',
    subject: '',
    sessionYear: '',
    batchStartingDate: '',
    batchClosingDate: '',
    admissionFee: '',
    tuitionFee: '',
    courseFee: '',
    description: '',
    maxStudents: '50',
    status: 'upcoming' as 'active' | 'inactive' | 'completed' | 'upcoming',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const validateField = (name: string, value: any) => {
    // If field hasn't been touched and form hasn't been submitted, don't show error
    if (!touched[name] && !submitAttempted) return '';
    
    switch (name) {
      case 'batchName':
        if (!value.trim()) return 'Batch name is required';
        if (value.trim().length < 2) return 'Batch name must be at least 2 characters';
        if (value.trim().length > 100) return 'Batch name must be less than 100 characters';
        break;
      
      case 'className':
        if (!value) return 'Class is required';
        break;
      
      case 'group':
        if (!value) return 'Group is required';
        break;
      
      case 'subject':
        if (!value) return 'Subject is required';
        break;
      
      case 'sessionYear':
        if (!value.trim()) return 'Session year is required';
        if (!/^\d{4}-\d{4}$/.test(value)) return 'Session year must be in format YYYY-YYYY';
        break;
      
      case 'batchStartingDate':
        if (!value) return 'Batch starting date is required';
        break;
      
      case 'batchClosingDate':
        if (!value) return 'Batch closing date is required';
        if (formData.batchStartingDate && new Date(value) <= new Date(formData.batchStartingDate)) {
          return 'Batch closing date must be after starting date';
        }
        break;
      
      case 'admissionFee':
      case 'tuitionFee':
      case 'courseFee':
        if (value && parseFloat(value) < 0) return 'Fee cannot be negative';
        break;
      
      case 'maxStudents':
        if (!value || parseInt(value) < 1) return 'Must have at least 1 student';
        if (parseInt(value) > 1000) return 'Cannot exceed 1000 students';
        break;
    }
    
    return '';
  };

  // Validate all fields
  const validateAllFields = () => {
    const newErrors: Record<string, string> = {};
    
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key as keyof typeof formData]);
      if (error) newErrors[key] = error;
    });
    
    // Additional date validation
    if (formData.batchStartingDate && formData.batchClosingDate) {
      const startDate = new Date(formData.batchStartingDate);
      const endDate = new Date(formData.batchClosingDate);
      if (startDate >= endDate && !newErrors.batchClosingDate) {
        newErrors.batchClosingDate = 'Closing date must be after starting date';
      }
    }
    
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🟡 Form submitted with data:', formData);
    
    // Mark all fields as touched and set submit attempted
    setSubmitAttempted(true);
    const allTouched = Object.keys(formData).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);
    
    // Validate all fields
    const newErrors = validateAllFields();
    setErrors(newErrors);
    
    // Check if form is valid
    const isValid = Object.keys(newErrors).length === 0;
    console.log('🟡 Form validation result:', isValid, 'Errors:', newErrors);
    
    if (isValid) {
      console.log('🟢 Form validation passed');
      
      // Convert string values to numbers
      const submitData = {
        ...formData,
        admissionFee: parseFloat(formData.admissionFee) || 0,
        tuitionFee: parseFloat(formData.tuitionFee) || 0,
        courseFee: parseFloat(formData.courseFee) || 0,
        maxStudents: parseInt(formData.maxStudents) || 50,
      };
      
      console.log('🟡 Submitting data:', submitData);
      onCreate(submitData);
    } else {
      console.log('🔴 Form validation failed:', newErrors);
      
      // Show error message for first invalid field
      const firstErrorKey = Object.keys(newErrors)[0];
      if (firstErrorKey) {
        toastManager.showError(`Please fix: ${newErrors[firstErrorKey]}`);
      }
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if ((touched[field] || submitAttempted) && errors[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, formData[field as keyof typeof formData]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Check if form is valid (for button disable state)
  const isFormValid = () => {
    // Basic validation - check if required fields are filled
    const requiredFields = ['batchName', 'className', 'group', 'subject', 'sessionYear', 'batchStartingDate', 'batchClosingDate'];
    const allRequiredFilled = requiredFields.every(field => 
      field in formData && formData[field as keyof typeof formData]?.toString().trim() !== ''
    );
    
    // Check for any validation errors
    const hasErrors = Object.keys(errors).length > 0;
    
    return allRequiredFilled && !hasErrors;
  };

  const calculateTotalFee = () => {
    const admission = parseFloat(formData.admissionFee) || 0;
    const tuition = parseFloat(formData.tuitionFee) || 0;
    const course = parseFloat(formData.courseFee) || 0;
    return admission + tuition + course;
  };

  // Auto-generate session year from start date
  useEffect(() => {
    if (formData.batchStartingDate && !formData.sessionYear) {
      const startYear = new Date(formData.batchStartingDate).getFullYear();
      handleChange('sessionYear', `${startYear}-${startYear + 1}`);
    }
  }, [formData.batchStartingDate]);

  // Add this effect to validate on mount and when form data changes
  useEffect(() => {
    if (submitAttempted) {
      const newErrors = validateAllFields();
      setErrors(newErrors);
    }
  }, [formData, submitAttempted]);

  // Update the modal overlay click handler
  const handleOverlayClick = (e: React.MouseEvent) => {
    // Only close if clicking the overlay background, not the modal content
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={handleOverlayClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Create New Batch</h2>
          <button 
            onClick={onClose} 
            className={styles.modalClose} 
            disabled={loading}
            type="button"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>
        
        {loading && (
          <div className={styles.modalLoading}>
            <div className={styles.spinnerLarge}></div>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formField}>
              <label className={styles.label} htmlFor="batchName">
                Batch Name
                <span className={styles.required}>*</span>
              </label>
              <input
                id="batchName"
                type="text"
                value={formData.batchName}
                onChange={(e) => handleChange('batchName', e.target.value)}
                onBlur={() => handleBlur('batchName')}
                placeholder="e.g., Spring 2024 Batch"
                className={`${styles.input} ${errors.batchName ? styles.inputError : ''}`}
                autoFocus
                disabled={loading}
              />
              {errors.batchName && (
                <div className={styles.errorMessage}>{errors.batchName}</div>
              )}
              {!errors.batchName && touched.batchName && formData.batchName.trim() && (
                <div className={styles.helpText}>✓ Batch name is valid</div>
              )}
            </div>

            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label className={styles.label} htmlFor="className">
                  Class
                  <span className={styles.required}>*</span>
                </label>
                <select
                  id="className"
                  value={formData.className}
                  onChange={(e) => handleChange('className', e.target.value)}
                  onBlur={() => handleBlur('className')}
                  className={`${styles.select} ${errors.className ? styles.inputError : ''}`}
                  disabled={loading || classes.length === 0}
                >
                  <option value="">Select Class</option>
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>
                      {cls.classname}
                    </option>
                  ))}
                </select>
                {errors.className && (
                  <div className={styles.errorMessage}>{errors.className}</div>
                )}
                {!errors.className && formData.className && (
                  <div className={styles.helpText}>✓ Class selected</div>
                )}
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="group">
                  Group
                  <span className={styles.required}>*</span>
                </label>
                <select
                  id="group"
                  value={formData.group}
                  onChange={(e) => handleChange('group', e.target.value)}
                  onBlur={() => handleBlur('group')}
                  className={`${styles.select} ${errors.group ? styles.inputError : ''}`}
                  disabled={loading || groups.length === 0}
                >
                  <option value="">Select Group</option>
                  {groups.map(grp => (
                    <option key={grp._id} value={grp._id}>
                      {grp.groupName}
                    </option>
                  ))}
                </select>
                {errors.group && (
                  <div className={styles.errorMessage}>{errors.group}</div>
                )}
                {!errors.group && formData.group && (
                  <div className={styles.helpText}>✓ Group selected</div>
                )}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label className={styles.label} htmlFor="subject">
                  Subject
                  <span className={styles.required}>*</span>
                </label>
                <select
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleChange('subject', e.target.value)}
                  onBlur={() => handleBlur('subject')}
                  className={`${styles.select} ${errors.subject ? styles.inputError : ''}`}
                  disabled={loading || subjects.length === 0}
                >
                  <option value="">Select Subject</option>
                  {subjects.map(sub => (
                    <option key={sub._id} value={sub._id}>
                      {sub.subjectName}
                    </option>
                  ))}
                </select>
                {errors.subject && (
                  <div className={styles.errorMessage}>{errors.subject}</div>
                )}
                {!errors.subject && formData.subject && (
                  <div className={styles.helpText}>✓ Subject selected</div>
                )}
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="sessionYear">
                  Session Year
                  <span className={styles.required}>*</span>
                </label>
                <input
                  id="sessionYear"
                  type="text"
                  value={formData.sessionYear}
                  onChange={(e) => handleChange('sessionYear', e.target.value)}
                  onBlur={() => handleBlur('sessionYear')}
                  placeholder="e.g., 2024-2025"
                  className={`${styles.input} ${errors.sessionYear ? styles.inputError : ''}`}
                  disabled={loading}
                />
                {errors.sessionYear && (
                  <div className={styles.errorMessage}>{errors.sessionYear}</div>
                )}
                {!errors.sessionYear && formData.sessionYear && /^\d{4}-\d{4}$/.test(formData.sessionYear) && (
                  <div className={styles.helpText}>✓ Valid session year format</div>
                )}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label className={styles.label} htmlFor="batchStartingDate">
                  Batch Starting Date
                  <span className={styles.required}>*</span>
                </label>
                <input
                  id="batchStartingDate"
                  type="date"
                  value={formData.batchStartingDate}
                  onChange={(e) => handleChange('batchStartingDate', e.target.value)}
                  onBlur={() => handleBlur('batchStartingDate')}
                  className={`${styles.input} ${errors.batchStartingDate ? styles.inputError : ''}`}
                  disabled={loading}
                />
                {errors.batchStartingDate && (
                  <div className={styles.errorMessage}>{errors.batchStartingDate}</div>
                )}
                {!errors.batchStartingDate && formData.batchStartingDate && (
                  <div className={styles.helpText}>
                    ✓ Starting date: {new Date(formData.batchStartingDate).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="batchClosingDate">
                  Batch Closing Date
                  <span className={styles.required}>*</span>
                </label>
                <input
                  id="batchClosingDate"
                  type="date"
                  value={formData.batchClosingDate}
                  onChange={(e) => handleChange('batchClosingDate', e.target.value)}
                  onBlur={() => handleBlur('batchClosingDate')}
                  className={`${styles.input} ${errors.batchClosingDate ? styles.inputError : ''}`}
                  disabled={loading}
                  min={formData.batchStartingDate}
                />
                {errors.batchClosingDate && (
                  <div className={styles.errorMessage}>{errors.batchClosingDate}</div>
                )}
                {!errors.batchClosingDate && formData.batchClosingDate && formData.batchStartingDate && (
                  <div className={styles.helpText}>
                    ✓ Closing date is valid
                  </div>
                )}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label className={styles.label} htmlFor="admissionFee">
                  Admission Fee
                </label>
                <div className={styles.inputWithSymbol}>
                  <span className={styles.currencySymbol}>$</span>
                  <input
                    id="admissionFee"
                    type="number"
                    value={formData.admissionFee}
                    onChange={(e) => handleChange('admissionFee', e.target.value)}
                    onBlur={() => handleBlur('admissionFee')}
                    placeholder="0"
                    className={`${styles.input} ${errors.admissionFee ? styles.inputError : ''}`}
                    disabled={loading}
                    min="0"
                    step="0.01"
                  />
                </div>
                {errors.admissionFee && (
                  <div className={styles.errorMessage}>{errors.admissionFee}</div>
                )}
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="tuitionFee">
                  Tuition Fee
                </label>
                <div className={styles.inputWithSymbol}>
                  <span className={styles.currencySymbol}>$</span>
                  <input
                    id="tuitionFee"
                    type="number"
                    value={formData.tuitionFee}
                    onChange={(e) => handleChange('tuitionFee', e.target.value)}
                    onBlur={() => handleBlur('tuitionFee')}
                    placeholder="0"
                    className={`${styles.input} ${errors.tuitionFee ? styles.inputError : ''}`}
                    disabled={loading}
                    min="0"
                    step="0.01"
                  />
                </div>
                {errors.tuitionFee && (
                  <div className={styles.errorMessage}>{errors.tuitionFee}</div>
                )}
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formField}>
                <label className={styles.label} htmlFor="courseFee">
                  Course Fee
                </label>
                <div className={styles.inputWithSymbol}>
                  <span className={styles.currencySymbol}>$</span>
                  <input
                    id="courseFee"
                    type="number"
                    value={formData.courseFee}
                    onChange={(e) => handleChange('courseFee', e.target.value)}
                    onBlur={() => handleBlur('courseFee')}
                    placeholder="0"
                    className={`${styles.input} ${errors.courseFee ? styles.inputError : ''}`}
                    disabled={loading}
                    min="0"
                    step="0.01"
                  />
                </div>
                {errors.courseFee && (
                  <div className={styles.errorMessage}>{errors.courseFee}</div>
                )}
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="maxStudents">
                  Max Students
                </label>
                <input
                  id="maxStudents"
                  type="number"
                  value={formData.maxStudents}
                  onChange={(e) => handleChange('maxStudents', e.target.value)}
                  onBlur={() => handleBlur('maxStudents')}
                  placeholder="50"
                  className={`${styles.input} ${errors.maxStudents ? styles.inputError : ''}`}
                  disabled={loading}
                  min="1"
                  max="1000"
                />
                {errors.maxStudents && (
                  <div className={styles.errorMessage}>{errors.maxStudents}</div>
                )}
                {!errors.maxStudents && formData.maxStudents && (
                  <div className={styles.helpText}>✓ {formData.maxStudents} students maximum</div>
                )}
              </div>
            </div>

            <div className={styles.totalFeeDisplay}>
              <span className={styles.totalFeeLabel}>Total Fee:</span>
              <span className={styles.totalFeeValue}>${calculateTotalFee().toLocaleString()}</span>
            </div>

            <div className={styles.formField}>
              <label className={styles.label} htmlFor="description">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange('description', e.target.value)}
                onBlur={() => handleBlur('description')}
                placeholder="Describe the batch curriculum, objectives, and requirements..."
                className={styles.textarea}
                rows={3}
                disabled={loading}
                maxLength={500}
              />
              {formData.description.length > 0 && (
                <div className={styles.helpText}>
                  {500 - formData.description.length} characters remaining
                </div>
              )}
            </div>

            <div className={styles.formField}>
              <label className={styles.label} htmlFor="status">
                Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className={styles.select}
                disabled={loading}
              >
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          
          <div className={styles.modalFooter}>
            <button
              type="button"
              onClick={onClose}
              className={styles.btnSecondary}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={loading}
              onClick={() => {
                console.log('🟡 Submit button clicked');
                console.log('🟡 Form data:', formData);
                console.log('🟡 Errors:', errors);
                console.log('🟡 Is form valid?', isFormValid());
              }}
            >
              {loading ? (
                <>
                  <span className={styles.spinnerSmall}></span>
                  Creating...
                </>
              ) : (
                'Create Batch'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}