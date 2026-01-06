// src/components/teacherPage/TeachersPage.tsx

"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTeacher } from "@/hooks/useTeacher";
import { toastManager } from "@/utils/toastConfig";
import styles from './Teachers.module.css';
import ConfirmationModal from "../common/ConfirmationModal";
// src/components/teacherPage/TeachersPage.tsx - Add these imports at the top

import CreateTeacherModal from "./CreateTeacherModal"; // Add this import
import TeacherDetailsModal from "./TeacherDetailsModal"; // Add this import

import { TeacherItem } from "@/api/teacherApi/types/teacher.types"; // Import TeacherItem type
import { createTeacher } from "@/api/teacherApi/teacherSlice";

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

// Fix: Add proper types for the word parameter
const formatDesignation = (text: string): string => {
  return text.split('_').map((word: string) => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
};

export default function TeachersPage() {
  const {
    teachers,
    loading,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
    dispatch,
    fetchTeachers,
    deleteTeacher,
    updateTeacher,
    verifyTeacherEmail,
    verifyTeacherPhone,
    fetchMyStatsSummary,
    clearError,
    clearSuccess,
  } = useTeacher();

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openDetailsModal, setOpenDetailsModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherItem | null>(null); // Fix: Add type
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState({
    designation: "",
    assignType: "",
    status: "",
    isActive: "",
    gender: "",
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const loadTeachers = async () => {
      try {
        await fetchTeachers({
          search: debouncedSearchTerm || undefined,
          designation: filters.designation || undefined,
          assignType: filters.assignType || undefined,
          status: filters.status || undefined,
          isActive: filters.isActive === "" ? undefined : filters.isActive === "true",
          gender: filters.gender || undefined,
          page: currentPage,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        }).unwrap();
      } catch (error: any) {
        console.error('Failed to load teachers:', error);
      }
    };

    loadTeachers();
  }, [dispatch,
  fetchTeachers, // Add this
  debouncedSearchTerm,
  currentPage,
  filters.designation,
  filters.assignType,
  filters.status,
  filters.isActive,
  filters.gender]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await fetchMyStatsSummary().unwrap();
        setStats(statsData);
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };

    loadStats();
  }, [fetchMyStatsSummary]);

  useEffect(() => {
    if (success) {
      toastManager.showSuccess('Operation completed successfully!');
      clearSuccess();
    }
    if (error) {
      toastManager.showError(error);
      clearError();
    }
  }, [success, error, clearSuccess, clearError]);

  const handleCreateTeacher = useCallback(async (teacherData: any) => {
    const toastId = toastManager.showLoading('Creating teacher...');
    
    try {
      await dispatch(createTeacher(teacherData)).unwrap();
      toastManager.updateToast(toastId, 'Teacher created successfully!', 'success');
      setOpenCreateModal(false);
    } catch (error: any) {
      toastManager.safeUpdateToast(toastId, 'Failed to create teacher', 'error');
    }
  }, [dispatch]);

  const handleUpdateTeacher = useCallback(async (id: string, teacherData: any) => {
    const toastId = toastManager.showLoading('Updating teacher...');
    
    try {
      await updateTeacher(id, teacherData).unwrap();
      toastManager.safeUpdateToast(toastId, 'Teacher updated successfully!', 'success');
    } catch (error: any) {
      toastManager.safeUpdateToast(toastId, 'Failed to update teacher', 'error');
    }
  }, [updateTeacher]);

  const handleDeleteClick = useCallback((id: string) => {
    setTeacherToDelete(id);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!teacherToDelete) return;
    
    setIsDeleting(true);
    const toastId = toastManager.showLoading('Deleting teacher...');
    
    try {
      await deleteTeacher(teacherToDelete).unwrap();
      toastManager.safeUpdateToast(toastId, 'Teacher deleted successfully!', 'success');
    } catch (error: any) {
      toastManager.safeUpdateToast(toastId, 'Failed to delete teacher', 'error');
    } finally {
      setIsDeleting(false);
      setTeacherToDelete(null);
    }
  }, [deleteTeacher, teacherToDelete]);

  const handleVerifyEmail = useCallback(async (id: string) => {
    const toastId = toastManager.showLoading('Verifying email...');
    
    try {
      await verifyTeacherEmail(id).unwrap();
      toastManager.safeUpdateToast(toastId, 'Email verified successfully!', 'success');
    } catch (error: any) {
      toastManager.safeUpdateToast(toastId, 'Failed to verify email', 'error');
    }
  }, [verifyTeacherEmail]);

  const handleVerifyPhone = useCallback(async (id: string) => {
    const toastId = toastManager.showLoading('Verifying phone...');
    
    try {
      await verifyTeacherPhone(id).unwrap();
      toastManager.safeUpdateToast(toastId, 'Phone verified successfully!', 'success');
    } catch (error: any) {
      toastManager.safeUpdateToast(toastId, 'Failed to verify phone', 'error');
    }
  }, [verifyTeacherPhone]);

  // Fix: Add type for teacher parameter
  const handleTeacherClick = useCallback((teacher: TeacherItem) => {
    setSelectedTeacher(teacher);
    setOpenDetailsModal(true);
  }, []);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981';
      case 'inactive': return '#6b7280';
      case 'suspended': return '#f59e0b';
      case 'resigned': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male': return '👨';
      case 'female': return '👩';
      default: return '👤';
    }
  };

  return (
    <div className={styles.pageContainer}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>Teacher Management</h1>
            <p className={styles.pageSubtitle}>Manage academic staff and faculty members</p>
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
            onClick={() => setOpenCreateModal(true)} 
            className={styles.btnPrimary}
            disabled={loading}
            type="button"
          >
            <svg className={styles.btnIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add New Teacher
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            👨‍🏫
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Teachers</p>
            <p className={styles.statValue}>{stats?.totalTeachers || 0}</p>
            <span className={styles.statSubtext}>{stats?.activeTeachers || 0} active</span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            ✅
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Verified</p>
            <p className={styles.statValue}>{stats?.verifiedEmail || 0}</p>
            <span className={styles.statSubtext}>Email: {stats?.verifiedEmail || 0}, Phone: {stats?.verifiedPhone || 0}</span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            💼
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Designations</p>
            <p className={styles.statValue}>5</p>
            <span className={styles.statSubtext}>Head, Assistant, Subject, etc.</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            📊
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Assignment</p>
            <p className={styles.statValue}>3 Types</p>
            <span className={styles.statSubtext}>Monthly, Class, Both</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filtersCard}>
        <div className={styles.filtersHeader}>
          <h3 className={styles.filtersTitle}>Filters</h3>
          <button 
            onClick={() => setFilters({
              designation: "",
              assignType: "",
              status: "",
              isActive: "",
              gender: "",
            })}
            className={styles.clearFilters}
            type="button"
          >
            Clear All
          </button>
        </div>
        <div className={styles.filtersGrid}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Designation</label>
            <select 
              className={styles.filterSelect}
              value={filters.designation}
              onChange={(e) => handleFilterChange('designation', e.target.value)}
            >
              <option value="">All</option>
              <option value="head_teacher">Head Teacher</option>
              <option value="assistant_teacher">Assistant Teacher</option>
              <option value="subject_teacher">Subject Teacher</option>
              <option value="co_teacher">Co-Teacher</option>
              <option value="visiting_teacher">Visiting Teacher</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Assign Type</label>
            <select 
              className={styles.filterSelect}
              value={filters.assignType}
              onChange={(e) => handleFilterChange('assignType', e.target.value)}
            >
              <option value="">All</option>
              <option value="monthly_basis">Monthly Basis</option>
              <option value="class_basis">Class Basis</option>
              <option value="both">Both</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Status</label>
            <select 
              className={styles.filterSelect}
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="resigned">Resigned</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Active</label>
            <select 
              className={styles.filterSelect}
              value={filters.isActive}
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Gender</label>
            <select 
              className={styles.filterSelect}
              value={filters.gender}
              onChange={(e) => handleFilterChange('gender', e.target.value)}
            >
              <option value="">All</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Teachers Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>
            All Teachers
            <span className={styles.tableCount}>({total} total)</span>
          </h2>
          <div className={styles.searchBox}>
            <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name, email, or phone..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={handleSearch}
              disabled={loading}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className={styles.searchClear}
                title="Clear search"
                disabled={loading}
                type="button"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {loading && !teachers.length ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinnerLarge}></div>
            <p className={styles.loadingText}>Loading teachers...</p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              {teachers?.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>👨‍🏫</div>
                  <h3 className={styles.emptyTitle}>No teachers found</h3>
                  <p className={styles.emptyDescription}>
                    {debouncedSearchTerm 
                      ? `No teachers found for "${debouncedSearchTerm}". Try a different search term.`
                      : "You haven't added any teachers yet. Get started by adding your first teacher!"}
                  </p>
                  {!debouncedSearchTerm && (
                    <button 
                      onClick={() => setOpenCreateModal(true)} 
                      className={styles.btnPrimary}
                      type="button"
                    >
                      Add First Teacher
                    </button>
                  )}
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Teacher</th>
                      <th>Contact</th>
                      <th>Designation</th>
                      <th>Status</th>
                      <th>Verification</th>
                      <th>Joining Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers?.length > 0 && teachers?.map((teacher: TeacherItem) => ( // Fix: Add type annotation
                      <tr key={teacher._id}>
                        <td>
                          <div 
                            className={styles.teacherCell}
                            onClick={() => handleTeacherClick(teacher)}
                            style={{ cursor: 'pointer' }}
                          >
                            <div className={styles.teacherAvatar}>
                              {getGenderIcon(teacher.gender)}
                            </div>
                            <div className={styles.teacherInfo}>
                              <span className={styles.teacherName}>{teacher.fullName}</span>
                              <span className={styles.teacherEmail}>{teacher.email}</span>
                              <div className={styles.teacherMeta}>
                                <span className={styles.teacherGender}>
                                  {teacher.gender.charAt(0).toUpperCase() + teacher.gender.slice(1)}
                                </span>
                                {teacher.bloodGroup && (
                                  <span className={styles.teacherBloodGroup}>
                                    • {teacher.bloodGroup}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.contactInfo}>
                            <div className={styles.contactItem}>
                              <span className={styles.contactLabel}>Phone:</span>
                              <span className={styles.contactValue}>{teacher.contactNumber}</span>
                            </div>
                            {teacher.whatsappNumber && (
                              <div className={styles.contactItem}>
                                <span className={styles.contactLabel}>WhatsApp:</span>
                                <span className={styles.contactValue}>{teacher.whatsappNumber}</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className={styles.designationCell}>
                            <span className={styles.designationBadge}>
                              {formatDesignation(teacher.designation)} {/* Fix: Use helper function */}
                            </span>
                            <span className={styles.assignType}>
                              {formatDesignation(teacher.assignType)} {/* Fix: Use helper function */}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.statusCell}>
                            <span 
                              className={styles.statusBadge}
                              style={{ backgroundColor: getStatusColor(teacher.status) }}
                            >
                              {teacher.status.charAt(0).toUpperCase() + teacher.status.slice(1)}
                            </span>
                            <span className={styles.activeStatus}>
                              {teacher.isActive ? '🟢 Active' : '⚪ Inactive'}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.verificationCell}>
                            <div className={styles.verificationItem}>
                              <button
                                onClick={() => handleVerifyEmail(teacher._id)}
                                className={`${styles.verifyBtn} ${teacher.isEmailVerified ? styles.verified : ''}`}
                                title={teacher.isEmailVerified ? 'Email Verified' : 'Verify Email'}
                                type="button"
                              >
                                {teacher.isEmailVerified ? '✓ Email' : '✗ Email'}
                              </button>
                            </div>
                            <div className={styles.verificationItem}>
                              <button
                                onClick={() => handleVerifyPhone(teacher._id)}
                                className={`${styles.verifyBtn} ${teacher.isPhoneVerified ? styles.verified : ''}`}
                                title={teacher.isPhoneVerified ? 'Phone Verified' : 'Verify Phone'}
                                type="button"
                              >
                                {teacher.isPhoneVerified ? '✓ Phone' : '✗ Phone'}
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className={styles.dateCell}>
                          {formatDate(teacher.joiningDate)}
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button
                              onClick={() => handleTeacherClick(teacher)}
                              className={styles.btnView}
                              title="View Details"
                              type="button"
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => handleUpdateTeacher(teacher._id, { 
                                isActive: !teacher.isActive 
                              })}
                              className={styles.btnToggle}
                              title={teacher.isActive ? 'Deactivate' : 'Activate'}
                              type="button"
                            >
                              {teacher.isActive ? '⏸️' : '▶️'}
                            </button>
                            <button
                              onClick={() => handleDeleteClick(teacher._id)}
                              className={styles.btnDelete}
                              title="Delete"
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

      {/* Create Teacher Modal */}
      {openCreateModal && (
        <CreateTeacherModal
          onClose={() => setOpenCreateModal(false)}
          onCreate={handleCreateTeacher}
          loading={loading}
        />
      )}

      {/* Teacher Details Modal */}
      {openDetailsModal && selectedTeacher && (
        <TeacherDetailsModal
          teacher={selectedTeacher}
          onClose={() => setOpenDetailsModal(false)}
          onVerifyEmail={() => handleVerifyEmail(selectedTeacher._id)}
          onVerifyPhone={() => handleVerifyPhone(selectedTeacher._id)}
          onToggleActive={() => handleUpdateTeacher(selectedTeacher._id, { 
            isActive: !selectedTeacher.isActive 
          })}
          onDelete={() => handleDeleteClick(selectedTeacher._id)}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!teacherToDelete}
        title="Delete Teacher"
        message="Are you sure you want to delete this teacher? This action cannot be undone and all associated data will be permanently removed."
        confirmText="Delete Teacher"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setTeacherToDelete(null)}
        isConfirming={isDeleting}
        isDanger={true}
        icon="danger"
      />
    </div>
  );
}