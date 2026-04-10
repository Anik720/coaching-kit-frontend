"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAdmission } from "@/hooks/useAdmission";
import {
  clearError,
  clearSuccess,
  createAdmission,
  deleteAdmission,
  fetchAdmissions,
  updateAdmission,
  fetchAdmissionStatistics,
  updateAdmissionStatus,
  updateAdmissionPayment,
  fetchActiveBatches,
  fetchClasses,
  fetchGroups,
  fetchSubjects,
} from "@/api/admissionApi/admissionSlice";
import { toastManager } from "@/utils/toastConfig";
import styles from './AdmissionPage.module.css';
import ConfirmationModal from "../common/ConfirmationModal";

import {
  AdmissionItem,
  AdmissionStatus,
  AdmissionType,
  Gender,
  Religion,
} from "@/api/admissionApi/types/admission.types";
import AdmissionFormModal from "./AdmissionFormModal";
import api from "@/api/axios";

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

// Props interface for routing flexibility
interface AdmissionPageProps {
  defaultStatus?: AdmissionStatus | "all";
  autoOpenNew?: boolean;
}

export default function AdmissionPage({ defaultStatus = "all", autoOpenNew = false }: AdmissionPageProps) {
  const {
    admissions,
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
    dispatch,
  } = useAdmission();

  const [open, setOpen] = useState(autoOpenNew);
  const [editingAdmission, setEditingAdmission] = useState<AdmissionItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [admissionToDelete, setAdmissionToDelete] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AdmissionStatus | "all">(defaultStatus);
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; admission: AdmissionItem | null }>({
    open: false,
    admission: null,
  });
  const [paymentAmount, setPaymentAmount] = useState("");
  const [dropdownsLoaded, setDropdownsLoaded] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Load dropdown data on component mount
  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        await Promise.all([
          dispatch(fetchClasses()),
          dispatch(fetchGroups()),
          dispatch(fetchSubjects()),
        ]);
        setDropdownsLoaded(true);
      } catch (error: any) {
        console.error('Failed to load dropdown data:', error);
        toastManager.showError('Failed to load some dropdown data');
      }
    };

    loadDropdownData();
  }, [dispatch]);

  // Fetch admissions
  useEffect(() => {
    const loadAdmissions = async () => {
      try {
        const params: any = {
          search: debouncedSearchTerm || undefined,
          page: currentPage,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        };
        
        if (statusFilter !== "all") {
          params.status = statusFilter;
        }

        await dispatch(fetchAdmissions(params)).unwrap();
      } catch (error: any) {
        console.error('Failed to load admissions:', error);
      }
    };

    loadAdmissions();
  }, [dispatch, debouncedSearchTerm, currentPage, statusFilter]);

  // Fetch statistics
  useEffect(() => {
    const loadStatistics = async () => {
      try {
        await dispatch(fetchAdmissionStatistics()).unwrap();
      } catch (error: any) {
        console.error('Failed to load statistics:', error);
      }
    };

    loadStatistics();
  }, [dispatch]);

  // Handle success/error messages
  useEffect(() => {
    if (success) {
      dispatch(clearSuccess());
    }
    if (error) {
      toastManager.showError(error);
      dispatch(clearError());
    }
  }, [success, error, dispatch]);

  const handleCreateAdmission = useCallback(async (admissionData: any) => {
    const { _autoSavedRegistrationId, ...cleanData } = admissionData;

    const toastId = toastManager.showLoading('Creating admission...');
    try {
      await dispatch(createAdmission(cleanData)).unwrap();
      toastManager.updateToast(toastId, 'Admission created successfully!', 'success');
      setOpen(false);

      await dispatch(fetchAdmissions({
        page: currentPage,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        status: statusFilter !== "all" ? statusFilter : undefined,
      }));

      await dispatch(fetchAdmissionStatistics());

    } catch (error: any) {
      console.error('Create admission error:', error);
      toastManager.safeUpdateToast(toastId, error.message || 'Failed to create admission', 'error');
    }
  }, [dispatch, currentPage, statusFilter]);


  const handleUpdateAdmission = useCallback(async (registrationId: string, admissionData: any) => {
    setIsUpdating(true);
    const toastId = toastManager.showLoading('Updating admission...');
    
    try {
      await dispatch(updateAdmission({ registrationId, admissionData })).unwrap();
      toastManager.safeUpdateToast(toastId, 'Admission updated successfully!', 'success');
      setEditingAdmission(null);
      
      await dispatch(fetchAdmissions({
        page: currentPage,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        status: statusFilter !== "all" ? statusFilter : undefined,
      }));
      
    } catch (error: any) {
      console.error('Update admission error:', error);
      toastManager.safeUpdateToast(toastId, error.message || 'Failed to update admission', 'error');
    } finally {
      setIsUpdating(false);
    }
  }, [dispatch, currentPage, statusFilter]);

  const handleDeleteClick = useCallback((registrationId: string) => {
    setAdmissionToDelete(registrationId);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!admissionToDelete) return;
    
    setIsDeleting(true);
    const toastId = toastManager.showLoading('Deleting admission...');
    
    try {
      await dispatch(deleteAdmission(admissionToDelete)).unwrap();
      toastManager.safeUpdateToast(toastId, 'Admission deleted successfully!', 'success');
      
      await dispatch(fetchAdmissions({
        page: currentPage,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        status: statusFilter !== "all" ? statusFilter : undefined,
      }));
      
      await dispatch(fetchAdmissionStatistics());
      
    } catch (error: any) {
      console.error('Delete admission error:', error);
      toastManager.safeUpdateToast(toastId, error.message || 'Failed to delete admission', 'error');
    } finally {
      setIsDeleting(false);
      setAdmissionToDelete(null);
    }
  }, [dispatch, admissionToDelete, currentPage, statusFilter]);

  const handleDeleteCancel = useCallback(() => {
    setAdmissionToDelete(null);
  }, []);

  const handleStatusChange = useCallback(async (registrationId: string, status: AdmissionStatus) => {
    const toastId = toastManager.showLoading('Updating status...');
    
    try {
      await api.put(`/admissions/${registrationId}`, { status });
      toastManager.safeUpdateToast(toastId, 'Status updated successfully!', 'success');
      
      await dispatch(fetchAdmissions({
        search: debouncedSearchTerm || undefined,
        page: currentPage,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        status: statusFilter !== "all" ? statusFilter : undefined,
      }));
      
      await dispatch(fetchAdmissionStatistics());
      
    } catch (error: any) {
      console.error('Update status error:', error);
      toastManager.safeUpdateToast(toastId, error.message || 'Failed to update status', 'error');
    }
  }, [dispatch, debouncedSearchTerm, currentPage, statusFilter]);

  const handlePaymentSubmit = useCallback(async () => {
    if (!paymentDialog.admission || !paymentAmount) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toastManager.showError('Please enter a valid payment amount');
      return;
    }

    const safeDueAmount = paymentDialog.admission.dueAmount || 0;
    if (amount > safeDueAmount) {
      toastManager.showError(`Payment cannot exceed due amount of ${formatCurrency(safeDueAmount)}`);
      return;
    }

    const toastId = toastManager.showLoading('Processing payment...');
    
    try {
      await dispatch(updateAdmissionPayment({
        registrationId: paymentDialog.admission.registrationId,
        paidAmount: amount,
      })).unwrap();
      
      toastManager.safeUpdateToast(toastId, 'Payment updated successfully!', 'success');
      setPaymentDialog({ open: false, admission: null });
      setPaymentAmount("");
      
      await dispatch(fetchAdmissions({
        page: currentPage,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc',
        status: statusFilter !== "all" ? statusFilter : undefined,
      }));
      
    } catch (error: any) {
      console.error('Update payment error:', error);
      toastManager.safeUpdateToast(toastId, error.message || 'Failed to update payment', 'error');
    }
  }, [dispatch, paymentDialog.admission, paymentAmount, currentPage, statusFilter]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchTerm("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  const startEdit = (admission: AdmissionItem) => {
    setEditingAdmission(admission);
  };

  const getStatusColor = (status: AdmissionStatus | undefined) => {
    const safeStatus = status || AdmissionStatus.PENDING;
    switch (safeStatus) {
      case AdmissionStatus.APPROVED: return styles.statusApproved;
      case AdmissionStatus.COMPLETED: return styles.statusCompleted;
      case AdmissionStatus.PENDING: return styles.statusPending;
      case AdmissionStatus.REJECTED: return styles.statusRejected;
      case AdmissionStatus.INCOMPLETE: return styles.statusIncomplete;
      case AdmissionStatus.CANCELLED: return styles.statusCancelled;
      default: return styles.statusDefault;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric', month: 'short', day: 'numeric',
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const calculatedStats = useMemo(() => {
    if (!admissions || admissions.length === 0) return null;
    
    const totalAdmissions = total;
    const pendingCount = admissions.filter(a => (a.status || AdmissionStatus.PENDING) === AdmissionStatus.PENDING).length;
    const incompleteCount = admissions.filter(a => (a.status || AdmissionStatus.PENDING) === AdmissionStatus.INCOMPLETE).length;
    const completedCount = admissions.filter(a => (a.status || AdmissionStatus.PENDING) === AdmissionStatus.COMPLETED).length;
    const approvedCount = admissions.filter(a => (a.status || AdmissionStatus.PENDING) === AdmissionStatus.APPROVED).length;
    const rejectedCount = admissions.filter(a => (a.status || AdmissionStatus.PENDING) === AdmissionStatus.REJECTED).length;
    const cancelledCount = admissions.filter(a => (a.status || AdmissionStatus.PENDING) === AdmissionStatus.CANCELLED).length;
    
    const today = new Date().toISOString().split('T')[0];
    const todayAdmissions = admissions.filter(a => a.createdAt && a.createdAt.split('T')[0] === today).length;
    
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const thisMonthAdmissions = admissions.filter(a => {
      if (!a.createdAt) return false;
      try {
        const date = new Date(a.createdAt);
        return date.getMonth() === thisMonth && date.getFullYear() === thisYear;
      } catch {
        return false;
      }
    }).length;
    
    const totalRevenue = admissions.reduce((sum, admission) => sum + (admission.paidAmount || 0), 0);
    const totalFees = admissions.reduce((sum, admission) => sum + (admission.totalFee || 0), 0);
    
    return {
      total: totalAdmissions,
      pending: pendingCount,
      incomplete: incompleteCount,
      completed: completedCount,
      approved: approvedCount,
      rejected: rejectedCount,
      cancelled: cancelledCount,
      todayAdmissions,
      thisMonthAdmissions,
      totalRevenue,
      totalFees,
      monthlyRevenue: totalRevenue / 12,
    };
  }, [admissions, total]);

  const displayStats = statistics || calculatedStats;

  const getStatusDisplayText = (status: AdmissionStatus | undefined) => {
    const safeStatus = status || AdmissionStatus.PENDING;
    return safeStatus.charAt(0).toUpperCase() + safeStatus.slice(1).toLowerCase();
  };

  const searchInput = (
    <div className={styles.searchBox}>
      <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        ref={searchInputRef}
        type="text"
        placeholder="Search by registration ID, name, or phone..."
        className={styles.searchInput}
        value={searchTerm}
        onChange={handleSearch}
        disabled={loading || isUpdating}
      />
      {searchTerm && (
        <button onClick={handleSearchClear} className={styles.searchClear} disabled={loading || isUpdating} type="button">✕</button>
      )}
      {(loading || isUpdating) && (
        <div className={styles.searchLoading}>
          <div className={styles.spinnerSmall}></div>
        </div>
      )}
    </div>
  );

  const isIncompleteContext = defaultStatus === AdmissionStatus.INCOMPLETE;

  return (
    <div className={styles.pageContainer}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>
              {isIncompleteContext ? 'Incomplete Admissions' : 'Admission Management'}
            </h1>
            <p className={styles.pageSubtitle}>
              {isIncompleteContext
                ? 'Review and complete draft admissions'
                : 'Manage student admissions and registrations'}
            </p>
            <div className={styles.searchStats}>
              {debouncedSearchTerm && (
                <span className={styles.searchResultInfo}>Showing results for "{debouncedSearchTerm}"</span>
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
            disabled={loading || isUpdating || !dropdownsLoaded}
            type="button"
            title={!dropdownsLoaded ? "Loading dropdown data..." : "Create new admission"}
          >
            {loading || isUpdating ? (
              <span className={styles.spinnerSmall}></span>
            ) : (
              <>
                <svg className={styles.btnIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Admission
              </>
            )}
          </button>
        </div>
      </div>

      {/* Incomplete Admissions Info Banner */}
      {isIncompleteContext && (
        <div style={{
          background: '#fffbeb',
          border: '1px solid #fcd34d',
          borderRadius: '10px',
          padding: '14px 20px',
          margin: '0 0 20px 0',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
          fontSize: '14px',
          color: '#92400e',
        }}>
          <span style={{ fontSize: '20px', flexShrink: 0 }}>⚠️</span>
          <div>
            <strong style={{ display: 'block', marginBottom: '4px' }}>About Incomplete Admissions</strong>
            These are draft admissions that were started but not fully submitted. They may have been
            auto-saved when the form was partially filled, or explicitly saved as a draft.
            Click the <strong>Complete</strong> button on any row to open the form and finish submitting the admission.
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {displayStats && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>📋</div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Total Admissions</p>
              <p className={styles.statValue}>{displayStats.total?.toLocaleString() || '0'}</p>
              <span className={styles.statSubtext}>{(displayStats.todayAdmissions || 0)} today • {(displayStats.thisMonthAdmissions || 0)} this month</span>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>⏳</div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Pending</p>
              <p className={styles.statValue}>{displayStats.pending || 0}</p>
              <span className={styles.statSubtext}>{(displayStats.completed || 0)} completed • {(displayStats.approved || 0)} approved</span>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>💰</div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Total Revenue</p>
              <p className={styles.statValue}>{formatCurrency(displayStats.totalRevenue || 0)}</p>
              <span className={styles.statSubtext}>Monthly: {formatCurrency((displayStats.totalRevenue || 0) / 12)}</span>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>📊</div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Status Overview</p>
              <div className={styles.statusOverview}>
                <span className={styles.statusBadgeSmall} style={{ backgroundColor: '#e74c3c' }}>{displayStats.rejected || 0} Rejected</span>
                <span className={styles.statusBadgeSmall} style={{ backgroundColor: '#95a5a6' }}>{displayStats.cancelled || 0} Cancelled</span>
                <span className={styles.statusBadgeSmall} style={{ backgroundColor: '#f39c12' }}>{displayStats.incomplete || 0} Incomplete</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className={styles.filterSection}>
        <div className={styles.statusFilter}>
          <button
            className={`${styles.statusFilterButton} ${statusFilter === "all" ? styles.active : ""}`}
            onClick={() => setStatusFilter("all")}
            disabled={loading || isUpdating}
          >
            All ({total || 0})
          </button>
          {Object.values(AdmissionStatus).map((status) => (
            <button
              key={status}
              className={`${styles.statusFilterButton} ${statusFilter === status ? styles.active : ""} ${getStatusColor(status)}`}
              onClick={() => setStatusFilter(status)}
              disabled={loading || isUpdating}
            >
              {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
              {displayStats && (
                <span className={styles.statusCount}>
                  {status === AdmissionStatus.PENDING ? (displayStats.pending || 0) :
                   status === AdmissionStatus.INCOMPLETE ? (displayStats.incomplete || 0) :
                   status === AdmissionStatus.COMPLETED ? (displayStats.completed || 0) :
                   status === AdmissionStatus.APPROVED ? (displayStats.approved || 0) :
                   status === AdmissionStatus.REJECTED ? (displayStats.rejected || 0) :
                   status === AdmissionStatus.CANCELLED ? (displayStats.cancelled || 0) : 0}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Admissions Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>
            All Admissions <span className={styles.tableCount}>({total || 0} total)</span>
          </h2>
          {searchInput}
        </div>

        {loading && !admissions?.length ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinnerLarge}></div>
            <p className={styles.loadingText}>Loading admissions...</p>
            <p className={styles.loadingSubtext}>Please wait while we fetch your data</p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              {!admissions?.length ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📋</div>
                  <h3 className={styles.emptyTitle}>No admissions found</h3>
                  <p className={styles.emptyDescription}>
                    {debouncedSearchTerm || statusFilter !== "all"
                      ? "No admissions match your filters. Try adjusting your search criteria."
                      : "You haven't created any admissions yet. Get started by creating your first admission!"}
                  </p>
                  {!debouncedSearchTerm && statusFilter === "all" && (
                    <button 
                      onClick={() => setOpen(true)} 
                      className={styles.btnPrimary}
                      type="button"
                      disabled={!dropdownsLoaded}
                    >
                      Create First Admission
                    </button>
                  )}
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Registration ID</th>
                      <th>Student Name</th>
                      <th>Institute</th>
                      <th>Contact</th>
                      <th>Batches</th>
                      <th>Status</th>
                      <th>Fees</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admissions.map((admission) => {
                      const safeAdmission = {
                        ...admission,
                        registrationId: admission.registrationId || 'N/A',
                        name: admission.name || 'Unknown Student',
                        status: admission.status || AdmissionStatus.PENDING,
                        instituteName: admission.instituteName || 'Not Specified',
                        studentGender: admission.studentGender || 'Not Specified',
                        guardianMobileNumber: admission.guardianMobileNumber || 'Not Provided',
                        admissionType: admission.admissionType || AdmissionType.MONTHLY,
                        batches: admission.batches || [],
                        totalFee: admission.totalFee || 0,
                        paidAmount: admission.paidAmount || 0,
                        dueAmount: admission.dueAmount || 0,
                        admissionFee: admission.admissionFee || 0,
                        tuitionFee: admission.tuitionFee || 0,
                        courseFee: admission.courseFee || 0,
                        createdAt: admission.createdAt || new Date().toISOString(),
                        admissionDate: admission.admissionDate,
                        nameNative: admission.nameNative,
                        studentDateOfBirth: admission.studentDateOfBirth,
                        religion: admission.religion,
                        whatsappMobile: admission.whatsappMobile,
                        studentMobileNumber: admission.studentMobileNumber,
                        fathersName: admission.fathersName,
                        mothersName: admission.mothersName,
                        motherMobileNumber: admission.motherMobileNumber,
                        presentAddress: admission.presentAddress,
                        permanentAddress: admission.permanentAddress,
                        referBy: admission.referBy,
                        remarks: admission.remarks,
                        isCompleted: admission.isCompleted || false,
                      };

                      return (
                        <tr key={admission._id}>
                          <td>
                            <div className={styles.registrationId}>
                              <span className={styles.idBadge}>{safeAdmission.registrationId}</span>
                              <div className={styles.admissionType}>{safeAdmission.admissionType}</div>
                            </div>
                          </td>
                          <td>
                            <div className={styles.studentInfo}>
                              <div className={styles.studentName}>{safeAdmission.name}</div>
                              {safeAdmission.nameNative && (
                                <div className={styles.studentNameNative}>({safeAdmission.nameNative})</div>
                              )}
                              <div className={styles.studentGender}>{safeAdmission.studentGender}</div>
                              {safeAdmission.studentDateOfBirth && (
                                <div className={styles.studentDOB}>
                                  DOB: {formatDate(safeAdmission.studentDateOfBirth)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className={styles.instituteName}>{safeAdmission.instituteName}</div>
                            {safeAdmission.religion && (
                              <div className={styles.religion}>{safeAdmission.religion}</div>
                            )}
                          </td>
                          <td>
                            <div className={styles.contactInfo}>
                              <div className={styles.phoneNumber}>📞 {safeAdmission.guardianMobileNumber}</div>
                              {safeAdmission.whatsappMobile && (
                                <div className={styles.whatsappNumber}>💬 {safeAdmission.whatsappMobile}</div>
                              )}
                              {safeAdmission.studentMobileNumber && (
                                <div className={styles.studentMobile}>📱 Student: {safeAdmission.studentMobileNumber}</div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className={styles.batchesInfo}>
                              {safeAdmission.batches && safeAdmission.batches.length > 0 ? (
                                <div className={styles.batchesList}>
                                  {safeAdmission.batches.slice(0, 2).map((batch, index) => (
                                    <div key={index} className={styles.batchItem}>
                                      <span className={styles.batchName}>{batch.batchName || 'Unnamed Batch'}</span>
                                      {batch.subjects && batch.subjects.length > 0 && (
                                        <span className={styles.subjectCount}>
                                          ({batch.subjects.length} subject{batch.subjects.length > 1 ? 's' : ''})
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                  {safeAdmission.batches.length > 2 && (
                                    <div className={styles.moreBatches}>+{safeAdmission.batches.length - 2} more</div>
                                  )}
                                </div>
                              ) : (
                                <span className={styles.noBatches}>No batches</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <span className={`${styles.statusBadge} ${getStatusColor(safeAdmission.status)}`}>
                              {getStatusDisplayText(safeAdmission.status)}
                            </span>
                            {safeAdmission.isCompleted && (
                              <div className={styles.completedIndicator}>✓ Completed</div>
                            )}
                          </td>
                          <td>
                            <div className={styles.feeInfo}>
                              <div className={styles.feeTotal}>Total: {formatCurrency(safeAdmission.totalFee)}</div>
                              <div className={`${styles.feePaid} ${safeAdmission.paidAmount > 0 ? styles.paid : ''}`}>
                                Paid: {formatCurrency(safeAdmission.paidAmount)}
                              </div>
                              <div className={`${styles.feeDue} ${safeAdmission.dueAmount > 0 ? styles.due : ''}`}>
                                Due: {formatCurrency(safeAdmission.dueAmount)}
                              </div>
                              <div className={styles.feeBreakdown}>
                                <small>A: {formatCurrency(safeAdmission.admissionFee)} | T: {formatCurrency(safeAdmission.tuitionFee)} | C: {formatCurrency(safeAdmission.courseFee)}</small>
                              </div>
                            </div>
                          </td>
                          <td className={styles.dateCell}>
                            {formatDate(safeAdmission.createdAt)}
                            {safeAdmission.admissionDate && (
                              <div className={styles.admissionDate}>
                                Admission: {formatDate(safeAdmission.admissionDate)}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className={styles.actionButtons}>
                              {safeAdmission.status === AdmissionStatus.INCOMPLETE && (
                                <button
                                  onClick={() => startEdit(safeAdmission)}
                                  title="Complete this admission"
                                  disabled={loading || isUpdating}
                                  type="button"
                                  style={{
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '6px',
                                    padding: '5px 10px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                  }}
                                >Complete →</button>
                              )}
                              <button
                                onClick={() => startEdit(safeAdmission)}
                                className={styles.btnEdit}
                                title="Edit"
                                disabled={loading || isUpdating}
                                type="button"
                              >✏️</button>
                              <button
                                onClick={() => handleDeleteClick(safeAdmission.registrationId)}
                                className={styles.btnDelete}
                                title="Delete"
                                disabled={loading || isUpdating}
                                type="button"
                              >🗑️</button>
                              <button
                                onClick={() => setPaymentDialog({ open: true, admission: safeAdmission })}
                                className={styles.btnPayment}
                                title="Add Payment"
                                disabled={loading || isUpdating || safeAdmission.dueAmount <= 0}
                                type="button"
                              >💰</button>
                              <select
                                value={safeAdmission.status}
                                onChange={(e) => handleStatusChange(safeAdmission.registrationId, e.target.value as AdmissionStatus)}
                                className={styles.statusSelect}
                                disabled={loading || isUpdating}
                              >
                                {Object.values(AdmissionStatus).map((status) => (
                                  <option key={status} value={status}>{getStatusDisplayText(status)}</option>
                                ))}
                              </select>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination Full Logic */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1 || loading || isUpdating}
                  className={styles.paginationButton}
                  type="button"
                >First</button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading || isUpdating}
                  className={styles.paginationButton}
                  type="button"
                >Previous</button>
                
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
                        disabled={loading || isUpdating}
                        type="button"
                      >{pageNum}</button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading || isUpdating}
                  className={styles.paginationButton}
                  type="button"
                >Next</button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages || loading || isUpdating}
                  className={styles.paginationButton}
                  type="button"
                >Last</button>
                <span className={styles.paginationInfo}>
                  Page {currentPage} of {totalPages} • Showing {admissions.length} of {total} admissions
                </span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Admission Modal */}
      {(open || editingAdmission) && (
        <AdmissionFormModal
          isOpen={open || !!editingAdmission}
          onClose={() => { setOpen(false); setEditingAdmission(null); }}
          onSubmit={editingAdmission ? (data) => handleUpdateAdmission(editingAdmission.registrationId, data) : handleCreateAdmission}
          initialData={editingAdmission}
          loading={loading || isUpdating}
          isEditing={!!editingAdmission}
          batches={batches}
          classes={classes}
          groups={groups}
          subjects={subjects}
          dropdownsLoaded={dropdownsLoaded}
          fetchBatchesByClass={async (classId) => {
            try {
              const response = await api.get(`/batches/class/${classId}?limit=1000`);
              if (response.data.data) {
                return response.data.data;
              } else if (Array.isArray(response.data)) {
                return response.data;
              }
              return [];
            } catch (error: any) {
              if (error.response?.status === 404) return [];
              return [];
            }
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!admissionToDelete}
        title="Delete Admission"
        message="Are you sure you want to delete this admission? This action cannot be undone and all associated data will be permanently removed."
        confirmText="Delete Admission"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isConfirming={isDeleting}
        isDanger={true}
        icon="danger"
      />

      {/* Payment Modal */}
      {paymentDialog.open && paymentDialog.admission && (
        <div className={styles.modalOverlay} onClick={() => setPaymentDialog({ open: false, admission: null })}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Add Payment</h2>
              <button 
                onClick={() => setPaymentDialog({ open: false, admission: null })}
                className={styles.modalClose}
                type="button"
                disabled={loading}
              >✕</button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.paymentInfo}>
                <div className={styles.paymentRow}>
                  <span>Student:</span>
                  <strong>{paymentDialog.admission.name || 'Unknown Student'}</strong>
                </div>
                <div className={styles.paymentRow}>
                  <span>Registration ID:</span>
                  <strong>{paymentDialog.admission.registrationId || 'N/A'}</strong>
                </div>
                <div className={styles.paymentRow}>
                  <span>Total Fee:</span>
                  <strong>{formatCurrency(paymentDialog.admission.totalFee || 0)}</strong>
                </div>
                <div className={styles.paymentRow}>
                  <span>Paid Amount:</span>
                  <strong className={styles.paidAmount}>
                    {formatCurrency(paymentDialog.admission.paidAmount || 0)}
                  </strong>
                </div>
                <div className={styles.paymentRow}>
                  <span>Due Amount:</span>
                  <strong className={styles.dueAmount}>
                    {formatCurrency(paymentDialog.admission.dueAmount || 0)}
                  </strong>
                </div>
                <div className={styles.paymentRow}>
                  <span>Payment Progress:</span>
                  <div className={styles.paymentProgress}>
                    <div 
                      className={styles.progressBar} 
                      style={{ 
                        width: `${((paymentDialog.admission.paidAmount || 0) / (paymentDialog.admission.totalFee || 1)) * 100}%` 
                      }}
                    ></div>
                    <span className={styles.progressText}>
                      {Math.round(((paymentDialog.admission.paidAmount || 0) / (paymentDialog.admission.totalFee || 1)) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Payment Amount (BDT) <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className={styles.input}
                  placeholder="Enter payment amount"
                  min="0"
                  max={paymentDialog.admission.dueAmount || 0}
                  step="1"
                  disabled={loading}
                />
                <div className={styles.helpText}>
                  Maximum amount: {formatCurrency(paymentDialog.admission.dueAmount || 0)}
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setPaymentDialog({ open: false, admission: null })}
                className={styles.btnSecondary}
                disabled={loading}
              >Cancel</button>
              <button
                type="button"
                onClick={handlePaymentSubmit}
                className={styles.btnPrimary}
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0 || loading}
              >
                {loading ? (
                  <><span className={styles.spinnerSmall}></span> Processing...</>
                ) : 'Add Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}