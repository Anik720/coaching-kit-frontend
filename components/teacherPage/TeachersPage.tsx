"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useTeacher } from "@/hooks/useTeacher";
import { 
  clearError, 
  clearSuccess, 
  createTeacher, 
  deleteTeacher, 
  fetchTeachers,
  updateTeacher,
  updateTeacherStatus,
  verifyTeacherEmail,
  verifyTeacherPhone,
  fetchMyStatsSummary
} from "@/api/teacherApi/teacherSlice";
import { toastManager } from "@/utils/toastConfig";
import styles from './Teachers.module.css';
import ConfirmationModal from "../common/ConfirmationModal";
import CreateTeacherModal from "./CreateTeacherModal";
import { 
  AssignType, 
  BloodGroup,
  Designation, 
  Gender, 
  Religion,
  TeacherItem, 
  TeacherStatus,
  UpdateTeacherDto 
} from "@/api/teacherApi/types/teacher.types";
import EditTeacherModal from "./EditTeacherModal";


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
  } = useTeacher();

  const [open, setOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<TeacherItem | null>(null);
  const [editFormData, setEditFormData] = useState<UpdateTeacherDto | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [filters, setFilters] = useState({
    designation: "",
    assignType: "",
    status: "",
    isActive: "",
    gender: "",
    religion: "",
    bloodGroup: "",
  });
  const [stats, setStats] = useState({
    totalTeachers: 0,
    activeTeachers: 0,
    inactiveTeachers: 0,
    verifiedEmail: 0,
    verifiedPhone: 0,
    byDesignation: [] as Array<{ _id: Designation; count: number }>,
    byAssignType: [] as Array<{ _id: AssignType; count: number }>,
    byGender: [] as Array<{ _id: Gender; count: number }>,
    byReligion: [] as Array<{ _id: Religion; count: number }>,
    byBloodGroup: [] as Array<{ _id: BloodGroup; count: number }>,
  });
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Use debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch teachers on component mount and when filters change
  useEffect(() => {
    const loadTeachers = async () => {
      try {
        const queryParams: any = {
          search: debouncedSearchTerm || undefined,
          page: currentPage,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        };

        // Add filters if they're set
        if (filters.designation) queryParams.designation = filters.designation;
        if (filters.assignType) queryParams.assignType = filters.assignType;
        if (filters.status) queryParams.status = filters.status;
        if (filters.isActive !== "") queryParams.isActive = filters.isActive === "true";
        if (filters.gender) queryParams.gender = filters.gender;
        if (filters.religion) queryParams.religion = filters.religion;
        if (filters.bloodGroup) queryParams.bloodGroup = filters.bloodGroup;

        await dispatch(fetchTeachers(queryParams)).unwrap();
      } catch (error: any) {
        console.error('Failed to load teachers:', error);
      }
    };

    loadTeachers();
  }, [dispatch, debouncedSearchTerm, currentPage, filters]);

  // Load statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        const statsData = await dispatch(fetchMyStatsSummary()).unwrap();
        setStats(statsData);
      } catch (error) {
        console.error('Failed to load stats:', error);
      }
    };

    loadStats();
  }, [dispatch]);

  // Handle success/error messages with toast
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

  const handleCreateTeacher = useCallback(async (teacherData: any) => {
    const toastId = toastManager.showLoading('Creating teacher...');
    
    try {
      await dispatch(createTeacher(teacherData)).unwrap();
      toastManager.updateToast(toastId, 'Teacher created successfully!', 'success');
      setOpen(false);
    } catch (error: any) {
      toastManager.safeUpdateToast(toastId, error.message || 'Failed to create teacher', 'error');
    }
  }, [dispatch]);

const handleUpdateTeacher = useCallback(async (id: string, teacherData: UpdateTeacherDto) => {
  console.log('Update Teacher Called:', { id, teacherData }); // Add this
  setIsUpdating(true);
  const toastId = toastManager.showLoading('Updating teacher...');
  
  try {
    const result = await dispatch(updateTeacher({ id, teacherData })).unwrap();
    console.log('Update Result:', result); // Add this
    toastManager.safeUpdateToast(toastId, 'Teacher updated successfully!', 'success');
    setEditingTeacher(null);
    setEditFormData(null);
  } catch (error: any) {
    console.error('Update Error:', error); // Add this
    toastManager.safeUpdateToast(toastId, error.message || 'Failed to update teacher', 'error');
  } finally {
    setIsUpdating(false);
  }
}, [dispatch]);

  const handleStatusUpdate = useCallback(async (id: string, status: TeacherStatus, isActive: boolean) => {
    const toastId = toastManager.showLoading('Updating status...');
    
    try {
      await dispatch(updateTeacherStatus({ id, status, isActive })).unwrap();
      toastManager.safeUpdateToast(toastId, 'Status updated successfully!', 'success');
    } catch (error: any) {
      toastManager.safeUpdateToast(toastId, error.message || 'Failed to update status', 'error');
    }
  }, [dispatch]);

  const handleVerifyEmail = useCallback(async (id: string) => {
    const toastId = toastManager.showLoading('Verifying email...');
    
    try {
      await dispatch(verifyTeacherEmail(id)).unwrap();
      toastManager.safeUpdateToast(toastId, 'Email verified successfully!', 'success');
    } catch (error: any) {
      toastManager.safeUpdateToast(toastId, error.message || 'Failed to verify email', 'error');
    }
  }, [dispatch]);

  const handleVerifyPhone = useCallback(async (id: string) => {
    const toastId = toastManager.showLoading('Verifying phone...');
    
    try {
      await dispatch(verifyTeacherPhone(id)).unwrap();
      toastManager.safeUpdateToast(toastId, 'Phone verified successfully!', 'success');
    } catch (error: any) {
      toastManager.safeUpdateToast(toastId, error.message || 'Failed to verify phone', 'error');
    }
  }, [dispatch]);

  const handleDeleteClick = useCallback((id: string) => {
    setTeacherToDelete(id);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!teacherToDelete) return;
    
    setIsDeleting(true);
    const toastId = toastManager.showLoading('Deleting teacher...');
    
    try {
      await dispatch(deleteTeacher(teacherToDelete)).unwrap();
      toastManager.safeUpdateToast(toastId, 'Teacher deleted successfully!', 'success');
    } catch (error: any) {
      toastManager.safeUpdateToast(toastId, error.message || 'Failed to delete teacher', 'error');
    } finally {
      setIsDeleting(false);
      setTeacherToDelete(null);
    }
  }, [dispatch, teacherToDelete]);

  const handleDeleteCancel = useCallback(() => {
    setTeacherToDelete(null);
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

  const handleFilterChange = useCallback((filterName: string, value: string) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  const startEdit = (teacher: TeacherItem) => {
    setEditingTeacher(teacher);
  };

  const cancelEdit = () => {
    setEditingTeacher(null);
    setEditFormData(null);
  };

const saveEdit = () => {
  console.log('Save Edit Called:', { editingTeacher, editFormData }); // Add this
  if (editingTeacher && editFormData) {
    handleUpdateTeacher(editingTeacher._id, editFormData);
  } else {
    console.error('Missing data for save:', { editingTeacher, editFormData });
  }
};

  const handleEditUpdate = (updatedTeacher: UpdateTeacherDto) => {
    setEditFormData(updatedTeacher);
  };

  // Calculate statistics with proper data
  const calculatedStats = useMemo(() => {
    const totalTeachers = total;
    const activeTeachers = teachers?.length > 0 && teachers.filter(t => t.isActive).length || 0;
    const inactiveTeachers = totalTeachers - activeTeachers;
    const verifiedEmail = teachers?.length > 0 && teachers.filter(t => t.isEmailVerified).length || 0;
    const verifiedPhone = teachers?.length > 0 && teachers.filter(t => t.isPhoneVerified).length || 0;

    return { 
      totalTeachers, 
      activeTeachers, 
      inactiveTeachers, 
      verifiedEmail, 
      verifiedPhone 
    };
  }, [teachers, total]);

  // Format enum for display
  const formatEnumForDisplay = (value: string): string => {
    return value.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
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
        placeholder="Search by name, email, phone, or national ID..."
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
            <h1 className={styles.pageTitle}>Teacher Management</h1>
            <p className={styles.pageSubtitle}>
              Manage teacher profiles, assignments, and academic responsibilities
            </p>
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
                Add New Teacher
              </>
            )}
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
            <p className={styles.statValue}>{stats.totalTeachers}</p>
            <span className={styles.statSubtext}>{stats.activeTeachers} active, {stats.inactiveTeachers} inactive</span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            ✅
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Verified Accounts</p>
            <p className={styles.statValue}>{stats.verifiedEmail}</p>
            <span className={styles.statSubtext}>{stats.verifiedPhone} phone verified</span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            💼
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Top Designation</p>
            <p className={styles.statValue}>
              {stats.byDesignation.length > 0 ? stats.byDesignation[0].count : 0}
            </p>
            <span className={styles.statSubtext}>
              {stats.byDesignation.length > 0 ? formatEnumForDisplay(stats.byDesignation[0]._id) : 'None'}
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
            📊
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Assignment Type</p>
            <p className={styles.statValue}>
              {stats.byAssignType.length > 0 ? stats.byAssignType[0].count : 0}
            </p>
            <span className={styles.statSubtext}>
              {stats.byAssignType.length > 0 ? formatEnumForDisplay(stats.byAssignType[0]._id) : 'None'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className={styles.quickStats}>
        <div className={styles.quickStat}>
          <span>Male:</span>
          <span className={styles.quickStatValue}>
            {teachers?.length > 0 && teachers.filter(t => t.gender === Gender.MALE).length || 0}
          </span>
        </div>
        <div className={styles.quickStat}>
          <span>Female:</span>
          <span className={styles.quickStatValue}>
            {teachers?.length > 0 && teachers.filter(t => t.gender === Gender.FEMALE).length || 0}
          </span>
        </div>
        <div className={styles.quickStat}>
          <span>Subject Teachers:</span>
          <span className={styles.quickStatValue}>
            {teachers?.length > 0 && teachers.filter(t => t.designation === Designation.SUBJECT_TEACHER).length || 0}
          </span>
        </div>
        <div className={styles.quickStat}>
          <span>Class Basis:</span>
          <span className={styles.quickStatValue}>
            {teachers?.length > 0 && teachers.filter(t => t.assignType === AssignType.CLASS_BASIS).length || 0}
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className={styles.filterBar}>
        <select 
          className={styles.filterSelect}
          value={filters.designation}
          onChange={(e) => handleFilterChange('designation', e.target.value)}
          disabled={loading || isUpdating}
        >
          <option value="">All Designations</option>
          {Object.values(Designation).map(designation => (
            <option key={designation} value={designation}>
              {formatEnumForDisplay(designation)}
            </option>
          ))}
        </select>

        <select 
          className={styles.filterSelect}
          value={filters.assignType}
          onChange={(e) => handleFilterChange('assignType', e.target.value)}
          disabled={loading || isUpdating}
        >
          <option value="">All Assign Types</option>
          {Object.values(AssignType).map(type => (
            <option key={type} value={type}>
              {formatEnumForDisplay(type)}
            </option>
          ))}
        </select>

        <select 
          className={styles.filterSelect}
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value as TeacherStatus)}
          disabled={loading || isUpdating}
        >
          <option value="">All Status</option>
          {Object.values(TeacherStatus).map(status => (
            <option key={status} value={status}>
              {formatEnumForDisplay(status)}
            </option>
          ))}
        </select>

        <select 
          className={styles.filterSelect}
          value={filters.gender}
          onChange={(e) => handleFilterChange('gender', e.target.value)}
          disabled={loading || isUpdating}
        >
          <option value="">All Genders</option>
          {Object.values(Gender).map(gender => (
            <option key={gender} value={gender}>
              {formatEnumForDisplay(gender)}
            </option>
          ))}
        </select>

        <select 
          className={styles.filterSelect}
          value={filters.religion}
          onChange={(e) => handleFilterChange('religion', e.target.value)}
          disabled={loading || isUpdating}
        >
          <option value="">All Religions</option>
          {Object.values(Religion).map(religion => (
            <option key={religion} value={religion}>
              {formatEnumForDisplay(religion)}
            </option>
          ))}
        </select>

        <select 
          className={styles.filterSelect}
          value={filters.bloodGroup}
          onChange={(e) => handleFilterChange('bloodGroup', e.target.value)}
          disabled={loading || isUpdating}
        >
          <option value="">All Blood Groups</option>
          {Object.values(BloodGroup).map(group => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </select>

        <select 
          className={styles.filterSelect}
          value={filters.isActive}
          onChange={(e) => handleFilterChange('isActive', e.target.value)}
          disabled={loading || isUpdating}
        >
          <option value="">All Active Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Teachers Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>
            All Teachers
            <span className={styles.tableCount}>({total} total)</span>
          </h2>
          {searchInput}
        </div>

        {loading && !teachers.length ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinnerLarge}></div>
            <p className={styles.loadingText}>Loading teachers...</p>
            <p className={styles.loadingSubtext}>Please wait while we fetch your data</p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              {teachers?.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>👨‍🏫</div>
                  <h3 className={styles.emptyTitle}>No teachers found</h3>
                  <p className={styles.emptyDescription}>
                    {debouncedSearchTerm || Object.values(filters).some(f => f !== "")
                      ? "No teachers match your search criteria. Try adjusting your filters."
                      : "You haven't added any teachers yet. Get started by adding your first teacher!"}
                  </p>
                  {!debouncedSearchTerm && !Object.values(filters).some(f => f !== "") && (
                    <button 
                      onClick={() => setOpen(true)} 
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
                      <th>Teacher Info</th>
                      <th>Contact</th>
                      <th>Designation</th>
                      <th>Status</th>
                      <th>Verification</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teachers?.length > 0 && teachers.map((teacher) => (
                      <tr key={teacher._id} className={editingTeacher?._id === teacher._id ? styles.editingRow : ''}>
                        <td>
                          <div className={styles.teacherInfoCell}>
                            <div className={styles.teacherAvatar}>
                              {teacher.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className={styles.teacherInfo}>
                              <div className={styles.teacherName}>{teacher.fullName}</div>
                              <div className={styles.teacherEmail}>{teacher.email}</div>
                              {teacher.secondaryEmail && (
                                <div className={styles.teacherEmail}>Secondary: {teacher.secondaryEmail}</div>
                              )}
                              <div className={styles.teacherId}>ID: {teacher.nationalId}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.contactInfo}>
                            <div>📞 {teacher.contactNumber}</div>
                            <div>📱 {teacher.whatsappNumber}</div>
                            <div>🚨 {teacher.emergencyContactNumber}</div>
                            <div>📧 {teacher.systemEmail}</div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.designationInfo}>
                            <span className={styles.designationBadge}>
                              {formatEnumForDisplay(teacher.designation)}
                            </span>
                            <div className={styles.assignType}>
                              <span className={styles.assignTypeBadge}>
                                {formatEnumForDisplay(teacher.assignType)}
                              </span>
                            </div>
                            {teacher.salary && (
                              <div className={styles.salaryInfo}>
                                <span className={styles.salaryBadge}>
                                  ৳{teacher.salary.toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className={styles.statusInfo}>
                            <span className={`${styles.statusBadge} ${
                              teacher.status === TeacherStatus.ACTIVE ? styles.active :
                              teacher.status === TeacherStatus.INACTIVE ? styles.inactive :
                              teacher.status === TeacherStatus.SUSPENDED ? styles.suspended :
                              teacher.status === TeacherStatus.RESIGNED ? styles.resigned :
                              styles.onLeave
                            }`}>
                              {formatEnumForDisplay(teacher.status)}
                            </span>
                            <div className={styles.activeStatus}>
                              {teacher.isActive ? '✅ Active' : '❌ Inactive'}
                            </div>
                            <div className={styles.bloodGroup}>
                              🩸 {teacher.bloodGroup}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.verificationInfo}>
                            <div className={styles.verificationItem}>
                              <span className={`${styles.verificationBadge} ${teacher.isEmailVerified ? styles.verified : styles.unverified}`}>
                                {teacher.isEmailVerified ? '✓ Email Verified' : '✗ Email Unverified'}
                              </span>
                            </div>
                            <div className={styles.verificationItem}>
                              <span className={`${styles.verificationBadge} ${teacher.isPhoneVerified ? styles.verified : styles.unverified}`}>
                                {teacher.isPhoneVerified ? '✓ Phone Verified' : '✗ Phone Unverified'}
                              </span>
                            </div>
                            <div className={styles.personalInfo}>
                              <div>👨 {teacher.fatherName}</div>
                              <div>👩 {teacher.motherName}</div>
                              <div>{formatEnumForDisplay(teacher.gender)} | {formatEnumForDisplay(teacher.religion)}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.dateInfo}>
                            {new Date(teacher.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                            <div className={styles.createdBy}>
                              by {teacher.createdBy.username}
                            </div>
                            <div className={styles.joiningDate}>
                              Joined: {new Date(teacher.joiningDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button
                              onClick={() => startEdit(teacher)}
                              className={styles.btnEdit}
                              title="Edit"
                              disabled={loading || isUpdating}
                              type="button"
                            >
                              ✏️
                            </button>
                            {!teacher.isEmailVerified && (
                              <button
                                onClick={() => handleVerifyEmail(teacher._id)}
                                className={styles.btnVerify}
                                title="Verify Email"
                                disabled={loading || isUpdating}
                                type="button"
                              >
                                ✓
                              </button>
                            )}
                            {!teacher.isPhoneVerified && (
                              <button
                                onClick={() => handleVerifyPhone(teacher._id)}
                                className={styles.btnVerify}
                                title="Verify Phone"
                                disabled={loading || isUpdating}
                                type="button"
                              >
                                📱
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteClick(teacher._id)}
                              className={styles.btnDelete}
                              title="Delete"
                              disabled={loading || isUpdating}
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

      {/* Create Teacher Modal */}
      {open && (
        <CreateTeacherModal
          onClose={() => setOpen(false)}
          onCreate={handleCreateTeacher}
          loading={loading || isUpdating}
        />
      )}

      {/* Edit Teacher Modal */}
      {editingTeacher && (
        <EditTeacherModal
          teacher={editingTeacher}
          onClose={cancelEdit}
          onSave={saveEdit}
          onUpdate={handleEditUpdate}
          loading={isUpdating}
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
        onCancel={handleDeleteCancel}
        isConfirming={isDeleting}
        isDanger={true}
        icon="danger"
      />
    </div>
  );
}