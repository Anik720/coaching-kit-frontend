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

export default function AdmissionPage() {
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
    dispatch,
  } = useAdmission();

  const [open, setOpen] = useState(false);
  const [editingAdmission, setEditingAdmission] = useState<AdmissionItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [admissionToDelete, setAdmissionToDelete] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusFilter, setStatusFilter] = useState<AdmissionStatus | "all">("all");
  const [paymentDialog, setPaymentDialog] = useState<{ open: boolean; admission: AdmissionItem | null }>({
    open: false,
    admission: null,
  });
  const [paymentAmount, setPaymentAmount] = useState("");
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Use debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch admissions and statistics on component mount and when filters change
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
    const toastId = toastManager.showLoading('Creating admission...');
    
    try {
      await dispatch(createAdmission(admissionData)).unwrap();
      toastManager.updateToast(toastId, 'Admission created successfully!', 'success');
      setOpen(false);
    } catch (error: any) {
      toastManager.safeUpdateToast(toastId, 'Failed to create admission', 'error');
    }
  }, [dispatch]);

  const handleUpdateAdmission = useCallback(async (registrationId: string, admissionData: any) => {
    setIsUpdating(true);
    const toastId = toastManager.showLoading('Updating admission...');
    
    try {
      await dispatch(updateAdmission({ registrationId, admissionData })).unwrap();
      toastManager.safeUpdateToast(toastId, 'Admission updated successfully!', 'success');
      setEditingAdmission(null);
    } catch (error: any) {
      toastManager.safeUpdateToast(toastId, 'Failed to update admission', 'error');
    } finally {
      setIsUpdating(false);
    }
  }, [dispatch]);

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
    } catch (error: any) {
      toastManager.safeUpdateToast(toastId, 'Failed to delete admission', 'error');
    } finally {
      setIsDeleting(false);
      setAdmissionToDelete(null);
    }
  }, [dispatch, admissionToDelete]);

  const handleDeleteCancel = useCallback(() => {
    setAdmissionToDelete(null);
  }, []);

  const handleStatusChange = useCallback(async (registrationId: string, status: AdmissionStatus) => {
    const toastId = toastManager.showLoading('Updating status...');
    
    try {
      await dispatch(updateAdmissionStatus({ registrationId, status })).unwrap();
      toastManager.safeUpdateToast(toastId, 'Status updated successfully!', 'success');
    } catch (error: any) {
      toastManager.safeUpdateToast(toastId, 'Failed to update status', 'error');
    }
  }, [dispatch]);

  const handlePaymentSubmit = useCallback(async () => {
    if (!paymentDialog.admission || !paymentAmount) return;
    
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toastManager.showError('Please enter a valid payment amount');
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
    } catch (error: any) {
      toastManager.safeUpdateToast(toastId, 'Failed to update payment', 'error');
    }
  }, [dispatch, paymentDialog.admission, paymentAmount]);

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

  const startEdit = (admission: AdmissionItem) => {
    setEditingAdmission(admission);
  };

  const cancelEdit = () => {
    setEditingAdmission(null);
  };

  const getStatusColor = (status: AdmissionStatus) => {
    switch (status) {
      case AdmissionStatus.APPROVED:
        return styles.statusApproved;
      case AdmissionStatus.COMPLETED:
        return styles.statusCompleted;
      case AdmissionStatus.PENDING:
        return styles.statusPending;
      case AdmissionStatus.REJECTED:
        return styles.statusRejected;
      case AdmissionStatus.INCOMPLETE:
        return styles.statusIncomplete;
      case AdmissionStatus.CANCELLED:
        return styles.statusCancelled;
      default:
        return styles.statusDefault;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Search input component
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
        <button
          onClick={handleSearchClear}
          className={styles.searchClear}
          title="Clear search"
          disabled={loading || isUpdating}
          type="button"
        >
          ✕
        </button>
      )}
      {(loading || isUpdating) && (
        <div className={styles.searchLoading}>
          <div className={styles.spinnerSmall}></div>
        </div>
      )}
    </div>
  );

  return (
    <div className={styles.pageContainer}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>Admission Management</h1>
            <p className={styles.pageSubtitle}>Manage student admissions and registrations</p>
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
            disabled={loading || isUpdating}
            type="button"
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

      {/* Stats Cards */}
      {statistics && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              📋
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Total Admissions</p>
              <p className={styles.statValue}>{statistics.total}</p>
              <span className={styles.statSubtext}>
                {statistics.todayAdmissions} today • {statistics.thisMonthAdmissions} this month
              </span>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              ⏳
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Pending</p>
              <p className={styles.statValue}>{statistics.pending}</p>
              <span className={styles.statSubtext}>
                {statistics.completed} completed • {statistics.approved} approved
              </span>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              💰
            </div>
            <div className={styles.statContent}>
              <p className={styles.statLabel}>Total Revenue</p>
              <p className={styles.statValue}>{formatCurrency(statistics.totalRevenue)}</p>
              <span className={styles.statSubtext}>
                Average: {formatCurrency(statistics.totalRevenue / Math.max(statistics.total, 1))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className={styles.filterSection}>
        <div className={styles.statusFilter}>
          <button
            className={`${styles.statusFilterButton} ${statusFilter === "all" ? styles.active : ""}`}
            onClick={() => setStatusFilter("all")}
          >
            All
          </button>
          {Object.values(AdmissionStatus).map((status) => (
            <button
              key={status}
              className={`${styles.statusFilterButton} ${statusFilter === status ? styles.active : ""} ${getStatusColor(status)}`}
              onClick={() => setStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Admissions Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>
            All Admissions
            <span className={styles.tableCount}>({total} total)</span>
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
                      <th>Status</th>
                      <th>Fees</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {admissions.map((admission) => (
                      <tr key={admission._id}>
                        <td>
                          <div className={styles.registrationId}>
                            <span className={styles.idBadge}>{admission.registrationId}</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.studentInfo}>
                            <div className={styles.studentName}>{admission.name}</div>
                            {admission.nameNative && (
                              <div className={styles.studentNameNative}>({admission.nameNative})</div>
                            )}
                            <div className={styles.studentGender}>{admission.studentGender}</div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.instituteName}>{admission.instituteName}</div>
                        </td>
                        <td>
                          <div className={styles.contactInfo}>
                            <div className={styles.phoneNumber}>
                              {admission.guardianMobileNumber}
                            </div>
                            {admission.whatsappMobile && (
                              <div className={styles.whatsappNumber}>
                                📱 {admission.whatsappMobile}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${getStatusColor(admission.status)}`}>
                            {admission.status.charAt(0).toUpperCase() + admission.status.slice(1)}
                          </span>
                        </td>
                        <td>
                          <div className={styles.feeInfo}>
                            <div className={styles.feeTotal}>
                              Total: {formatCurrency(admission.totalFee)}
                            </div>
                            <div className={styles.feePaid}>
                              Paid: {formatCurrency(admission.paidAmount)}
                            </div>
                            <div className={styles.feeDue}>
                              Due: {formatCurrency(admission.dueAmount)}
                            </div>
                          </div>
                        </td>
                        <td className={styles.dateCell}>
                          {formatDate(admission.createdAt)}
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button
                              onClick={() => startEdit(admission)}
                              className={styles.btnEdit}
                              title="Edit"
                              disabled={loading || isUpdating}
                              type="button"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteClick(admission.registrationId)}
                              className={styles.btnDelete}
                              title="Delete"
                              disabled={loading || isUpdating}
                              type="button"
                            >
                              🗑️
                            </button>
                            <button
                              onClick={() => setPaymentDialog({ open: true, admission })}
                              className={styles.btnPayment}
                              title="Add Payment"
                              disabled={loading || isUpdating}
                              type="button"
                            >
                              💰
                            </button>
                            <select
                              value={admission.status}
                              onChange={(e) => handleStatusChange(admission.registrationId, e.target.value as AdmissionStatus)}
                              className={styles.statusSelect}
                              disabled={loading || isUpdating}
                            >
                              {Object.values(AdmissionStatus).map((status) => (
                                <option key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </option>
                              ))}
                            </select>
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
                  disabled={currentPage === 1 || loading || isUpdating}
                  className={styles.paginationButton}
                  type="button"
                >
                  First
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading || isUpdating}
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
                        disabled={loading || isUpdating}
                        type="button"
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading || isUpdating}
                  className={styles.paginationButton}
                  type="button"
                >
                  Next
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages || loading || isUpdating}
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

      {/* Create/Edit Admission Modal */}
      {(open || editingAdmission) && (
        <AdmissionFormModal
          isOpen={open || !!editingAdmission}
          onClose={() => {
            setOpen(false);
            setEditingAdmission(null);
          }}
          onSubmit={editingAdmission ? 
            (data) => handleUpdateAdmission(editingAdmission.registrationId, data) :
            handleCreateAdmission
          }
          initialData={editingAdmission}
          loading={loading || isUpdating}
          isEditing={!!editingAdmission}
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
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.paymentInfo}>
                <div className={styles.paymentRow}>
                  <span>Student:</span>
                  <strong>{paymentDialog.admission.name}</strong>
                </div>
                <div className={styles.paymentRow}>
                  <span>Registration ID:</span>
                  <strong>{paymentDialog.admission.registrationId}</strong>
                </div>
                <div className={styles.paymentRow}>
                  <span>Total Fee:</span>
                  <strong>{formatCurrency(paymentDialog.admission.totalFee)}</strong>
                </div>
                <div className={styles.paymentRow}>
                  <span>Paid Amount:</span>
                  <strong>{formatCurrency(paymentDialog.admission.paidAmount)}</strong>
                </div>
                <div className={styles.paymentRow}>
                  <span>Due Amount:</span>
                  <strong className={styles.dueAmount}>
                    {formatCurrency(paymentDialog.admission.dueAmount)}
                  </strong>
                </div>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Payment Amount (BDT)
                  <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className={styles.input}
                  placeholder="Enter payment amount"
                  min="0"
                  max={paymentDialog.admission.dueAmount}
                  step="1"
                />
                <div className={styles.helpText}>
                  Maximum amount: {formatCurrency(paymentDialog.admission.dueAmount)}
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setPaymentDialog({ open: false, admission: null })}
                className={styles.btnSecondary}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePaymentSubmit}
                className={styles.btnPrimary}
                disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
              >
                Add Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}