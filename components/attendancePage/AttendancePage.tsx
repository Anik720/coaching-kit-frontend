// src/components/attendancePage/AttendancePage.tsx
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAttendance } from "@/hooks/useAttendance";
import { clearError, clearSuccess } from "@/api/attendanceApi/attendanceSlice";
import { toastManager } from "@/utils/toastConfig";
import styles from './Attendance.module.css';
import ConfirmationModal from "../common/ConfirmationModal";
import attendanceApi from "@/api/attendanceApi/attendanceApi";

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

interface Student {
  _id: string;
  registrationId: string;
  nameEnglish: string;
  class: {
    _id: string;
    classname: string;
  };
  batch: {
    _id: string;
    batchName: string;
  };
}

interface Class {
  _id: string;
  classname: string;
}

interface Batch {
  _id: string;
  batchName: string;
  sessionYear: string;
}

export default function AttendancePage() {
  const {
    attendanceRecords,
    attendanceStats,
    loading,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
    dispatch,
    fetchAttendanceRecords,
    fetchAttendanceStats,
    clearError: clearAttendanceError,
    clearSuccess: clearAttendanceSuccess,
  } = useAttendance();

  const [open, setOpen] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedBatch, setSelectedBatch] = useState<string>("");
  const [attendanceDate, setAttendanceDate] = useState<string>("");
  const [classStartingTime, setClassStartingTime] = useState<string>("");
  const [classEndingTime, setClassEndingTime] = useState<string>("");
  const [attendanceType, setAttendanceType] = useState<string>("present");
  const [studentAttendance, setStudentAttendance] = useState<Record<string, string>>({});
  const [studentRemarks, setStudentRemarks] = useState<Record<string, string>>({});
  
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [attendanceToDelete, setAttendanceToDelete] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState<string>("");
  const [classFilter, setClassFilter] = useState<string>("");
  const [batchFilter, setBatchFilter] = useState<string>("");
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Use debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch classes on component mount
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const response = await attendanceApi.getClasses();
        setClasses(response.data.classes || response.data);
      } catch (error: any) {
        console.error('Failed to load classes:', error);
        toastManager.showError('Failed to load classes');
      }
    };

    loadClasses();
  }, []);

  // Fetch batches when class is selected
  useEffect(() => {
    const loadBatches = async () => {
      if (selectedClass) {
        try {
          const response = await attendanceApi.getBatches(selectedClass);
          setBatches(response.data.batches || response.data);
          setSelectedBatch(""); // Reset batch when class changes
        } catch (error: any) {
          console.error('Failed to load batches:', error);
          toastManager.showError('Failed to load batches');
        }
      } else {
        setBatches([]);
        setSelectedBatch("");
      }
    };

    loadBatches();
  }, [selectedClass]);

  // Fetch students when class and batch are selected
  useEffect(() => {
    const loadStudents = async () => {
      if (selectedClass && selectedBatch) {
        try {
          const response = await attendanceApi.getStudentsByClassBatch(selectedClass, selectedBatch);
          const studentsData = response.data.students || response.data;
          setStudents(studentsData);
          
          // Initialize attendance for all students as present
          const initialAttendance: Record<string, string> = {};
          studentsData.forEach((student: Student) => {
            initialAttendance[student._id] = "present";
          });
          setStudentAttendance(initialAttendance);
        } catch (error: any) {
          console.error('Failed to load students:', error);
          toastManager.showError('Failed to load students');
        }
      } else {
        setStudents([]);
        setStudentAttendance({});
      }
    };

    loadStudents();
  }, [selectedClass, selectedBatch]);

  // Fetch attendance records on component mount and when filters change
  useEffect(() => {
    const loadAttendance = async () => {
      try {
        const filters: any = {};
        if (debouncedSearchTerm) filters.search = debouncedSearchTerm;
        if (dateFilter) filters.attendanceDate = dateFilter;
        if (classFilter) filters.classId = classFilter;
        if (batchFilter) filters.batchId = batchFilter;
        filters.page = currentPage;
        filters.limit = 10;
        filters.sortBy = 'attendanceDate';
        filters.sortOrder = 'desc';

        await dispatch(fetchAttendanceRecords(filters)).unwrap();
      } catch (error: any) {
        console.error('Failed to load attendance records:', error);
      }
    };

    loadAttendance();
  }, [dispatch, debouncedSearchTerm, currentPage, dateFilter, classFilter, batchFilter]);

  // Fetch attendance statistics
  useEffect(() => {
    const loadStats = async () => {
      try {
        const filters: any = {};
        if (classFilter) filters.classId = classFilter;
        if (batchFilter) filters.batchId = batchFilter;
        if (dateFilter) {
          filters.startDate = dateFilter;
          filters.endDate = dateFilter;
        }

        await dispatch(fetchAttendanceStats(filters)).unwrap();
      } catch (error: any) {
        console.error('Failed to load attendance statistics:', error);
      }
    };

    loadStats();
  }, [dispatch, classFilter, batchFilter, dateFilter]);

  // Handle success/error messages with toast
  useEffect(() => {
    if (success) {
      toastManager.showSuccess('Operation completed successfully!');
      dispatch(clearAttendanceSuccess());
      setOpen(false);
      resetForm();
    }
    if (error) {
      toastManager.showError(error);
      dispatch(clearAttendanceError());
    }
  }, [success, error, dispatch, clearAttendanceSuccess, clearAttendanceError]);

  const handleSubmitAttendance = useCallback(async () => {
    if (!selectedClass || !selectedBatch || !attendanceDate || !classStartingTime || !classEndingTime) {
      toastManager.showError('Please fill all required fields');
      return;
    }

    if (students.length === 0) {
      toastManager.showError('No students found for selected class and batch');
      return;
    }

    setIsSubmitting(true);
    const toastId = toastManager.showLoading('Submitting attendance...');
    
    try {
      const attendanceData = {
        classId: selectedClass,
        batchId: selectedBatch,
        attendanceDate,
        classStartingTime,
        classEndingTime,
        attendanceType,
        students: Object.entries(studentAttendance).map(([studentId, attendanceType]) => ({
          studentId,
          attendanceType,
          remarks: studentRemarks[studentId] || '',
        })),
      };

      await dispatch(fetchAttendanceRecords).unwrap();
      toastManager.safeUpdateToast(toastId, 'Attendance submitted successfully!', 'success');
    } catch (error: any) {
      toastManager.safeUpdateToast(toastId, 'Failed to submit attendance', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [dispatch, selectedClass, selectedBatch, attendanceDate, classStartingTime, classEndingTime, attendanceType, studentAttendance, studentRemarks, students.length]);

  const handleDeleteClick = useCallback((id: string) => {
    setAttendanceToDelete(id);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!attendanceToDelete) return;
    
    setIsDeleting(true);
    const toastId = toastManager.showLoading('Deleting attendance record...');
    
    try {
      await dispatch(fetchAttendanceRecords).unwrap();
      toastManager.safeUpdateToast(toastId, 'Attendance record deleted successfully!', 'success');
    } catch (error: any) {
      toastManager.safeUpdateToast(toastId, 'Failed to delete attendance record', 'error');
    } finally {
      setIsDeleting(false);
      setAttendanceToDelete(null);
    }
  }, [dispatch, attendanceToDelete]);

  const handleDeleteCancel = useCallback(() => {
    setAttendanceToDelete(null);
  }, []);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
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

  const resetForm = () => {
    setSelectedClass("");
    setSelectedBatch("");
    setAttendanceDate("");
    setClassStartingTime("");
    setClassEndingTime("");
    setAttendanceType("present");
    setStudentAttendance({});
    setStudentRemarks({});
    setStudents([]);
  };

  const handleAttendanceChange = (studentId: string, type: string) => {
    setStudentAttendance(prev => ({
      ...prev,
      [studentId]: type
    }));
  };

  const handleRemarkChange = (studentId: string, remark: string) => {
    setStudentRemarks(prev => ({
      ...prev,
      [studentId]: remark
    }));
  };

  const getAttendanceStats = useMemo(() => {
    if (attendanceStats) {
      return attendanceStats;
    }
    
    // Calculate from current student attendance if no stats available
    const presentCount = Object.values(studentAttendance).filter(type => type === 'present').length;
    const absentCount = Object.values(studentAttendance).filter(type => type === 'absent').length;
    const lateCount = Object.values(studentAttendance).filter(type => type === 'late').length;
    const halfDayCount = Object.values(studentAttendance).filter(type => type === 'half_day').length;
    const totalStudents = students.length;
    const attendanceRate = totalStudents > 0 ? (presentCount / totalStudents) * 100 : 0;

    return {
      totalStudents,
      presentCount,
      absentCount,
      lateCount,
      halfDayCount,
      attendanceRate: parseFloat(attendanceRate.toFixed(2)),
    };
  }, [attendanceStats, studentAttendance, students.length]);

  const searchInput = (
    <div className={styles.searchBox}>
      <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        ref={searchInputRef}
        type="text"
        placeholder="Search by student name or registration ID..."
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
            <h1 className={styles.pageTitle}>Students Attendance</h1>
            <p className={styles.pageSubtitle}>Track and manage student attendance records</p>
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
                Take Attendance
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
            👨‍🎓
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Students</p>
            <p className={styles.statValue}>{getAttendanceStats.totalStudents}</p>
            <span className={styles.statSubtext}>Current selection</span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
            ✅
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Present Today</p>
            <p className={styles.statValue}>{getAttendanceStats.presentCount}</p>
            <span className={styles.statSubtext}>
              {getAttendanceStats.totalStudents > 0 
                ? `${((getAttendanceStats.presentCount / getAttendanceStats.totalStudents) * 100).toFixed(1)}% attendance`
                : '0% attendance'
              }
            </span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
            ⏰
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Late Arrivals</p>
            <p className={styles.statValue}>{getAttendanceStats.lateCount}</p>
            <span className={styles.statSubtext}>
              {getAttendanceStats.totalStudents > 0 
                ? `${((getAttendanceStats.lateCount / getAttendanceStats.totalStudents) * 100).toFixed(1)}% late rate`
                : '0% late rate'
              }
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
            ❌
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Absent Today</p>
            <p className={styles.statValue}>{getAttendanceStats.absentCount}</p>
            <span className={styles.statSubtext}>
              {getAttendanceStats.totalStudents > 0 
                ? `${((getAttendanceStats.absentCount / getAttendanceStats.totalStudents) * 100).toFixed(1)}% absence rate`
                : '0% absence rate'
              }
            </span>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className={styles.filterCard}>
        <h3 className={styles.filterTitle}>Filter Attendance Records</h3>
        <div className={styles.filterGrid}>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className={styles.filterInput}
            />
          </div>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Class</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Classes</option>
              {classes.map(cls => (
                <option key={cls._id} value={cls._id}>{cls.classname}</option>
              ))}
            </select>
          </div>
          <div className={styles.filterField}>
            <label className={styles.filterLabel}>Batch</label>
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className={styles.filterSelect}
              disabled={!classFilter}
            >
              <option value="">All Batches</option>
              {batches
                .filter(batch => !classFilter || true) // Filter by class if selected
                .map(batch => (
                  <option key={batch._id} value={batch._id}>
                    {batch.batchName} ({batch.sessionYear})
                  </option>
                ))
              }
            </select>
          </div>
          <div className={styles.filterActions}>
            <button
              onClick={() => {
                setDateFilter("");
                setClassFilter("");
                setBatchFilter("");
              }}
              className={styles.btnSecondary}
              type="button"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Attendance Records Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>
            Attendance Records
            <span className={styles.tableCount}>({total} total)</span>
          </h2>
          {searchInput}
        </div>

        {loading && !attendanceRecords.length ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinnerLarge}></div>
            <p className={styles.loadingText}>Loading attendance records...</p>
            <p className={styles.loadingSubtext}>Please wait while we fetch your data</p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              {attendanceRecords.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📊</div>
                  <h3 className={styles.emptyTitle}>No attendance records found</h3>
                  <p className={styles.emptyDescription}>
                    {debouncedSearchTerm || dateFilter || classFilter || batchFilter
                      ? "No records match your filters. Try adjusting your search criteria."
                      : "No attendance records available. Start by taking attendance for today!"}
                  </p>
                  {!debouncedSearchTerm && !dateFilter && !classFilter && !batchFilter && (
                    <button 
                      onClick={() => setOpen(true)} 
                      className={styles.btnPrimary}
                      type="button"
                    >
                      Take First Attendance
                    </button>
                  )}
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Class</th>
                      <th>Batch</th>
                      <th>Student</th>
                      <th>Status</th>
                      <th>Time</th>
                      <th>Remarks</th>
                      <th>Recorded By</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRecords.map((record) => (
                      <tr key={record._id}>
                        <td className={styles.dateCell}>
                          {new Date(record.attendanceDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            weekday: 'short',
                          })}
                        </td>
                        <td>
                          <span className={styles.classBadge}>
                            {record.class?.classname || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className={styles.batchBadge}>
                            {record.batch?.batchName || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <div className={styles.studentCell}>
                            <div className={styles.studentAvatar}>
                              {record.student.nameEnglish.charAt(0).toUpperCase()}
                            </div>
                            <div className={styles.studentInfo}>
                              <span className={styles.studentName}>{record.student.nameEnglish}</span>
                              <span className={styles.registrationId}>
                                ID: {record.student.registrationId}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${
                            record.attendanceType === 'present' ? styles.present :
                            record.attendanceType === 'absent' ? styles.absent :
                            record.attendanceType === 'late' ? styles.late :
                            styles.halfDay
                          }`}>
                            {record.attendanceType.charAt(0).toUpperCase() + record.attendanceType.slice(1)}
                          </span>
                        </td>
                        <td className={styles.timeCell}>
                          {record.classStartingTime} - {record.classEndingTime}
                        </td>
                        <td className={styles.remarksCell}>
                          {record.remarks || '-'}
                        </td>
                        <td>
                          <div className={styles.userCell}>
                            <div className={styles.userAvatar}>
                              {record.createdBy.username.charAt(0).toUpperCase()}
                            </div>
                            <div className={styles.userInfo}>
                              <span className={styles.userName}>{record.createdBy.username}</span>
                              <span className={styles.userRole}>{record.createdBy.role}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button
                              onClick={() => {/* Implement edit functionality */}}
                              className={styles.btnEdit}
                              title="Edit"
                              disabled={loading || isUpdating}
                              type="button"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteClick(record._id)}
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

      {/* Take Attendance Modal */}
      {open && (
        <TakeAttendanceModal
          onClose={() => setOpen(false)}
          onSubmit={handleSubmitAttendance}
          loading={isSubmitting}
          classes={classes}
          batches={batches}
          students={students}
          selectedClass={selectedClass}
          setSelectedClass={setSelectedClass}
          selectedBatch={selectedBatch}
          setSelectedBatch={setSelectedBatch}
          attendanceDate={attendanceDate}
          setAttendanceDate={setAttendanceDate}
          classStartingTime={classStartingTime}
          setClassStartingTime={setClassStartingTime}
          classEndingTime={classEndingTime}
          setClassEndingTime={setClassEndingTime}
          attendanceType={attendanceType}
          setAttendanceType={setAttendanceType}
          studentAttendance={studentAttendance}
          handleAttendanceChange={handleAttendanceChange}
          studentRemarks={studentRemarks}
          handleRemarkChange={handleRemarkChange}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!attendanceToDelete}
        title="Delete Attendance Record"
        message="Are you sure you want to delete this attendance record? This action cannot be undone."
        confirmText="Delete Record"
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

// Take Attendance Modal Component
function TakeAttendanceModal({
  onClose,
  onSubmit,
  loading,
  classes,
  batches,
  students,
  selectedClass,
  setSelectedClass,
  selectedBatch,
  setSelectedBatch,
  attendanceDate,
  setAttendanceDate,
  classStartingTime,
  setClassStartingTime,
  classEndingTime,
  setClassEndingTime,
  attendanceType,
  setAttendanceType,
  studentAttendance,
  handleAttendanceChange,
  studentRemarks,
  handleRemarkChange,
}: {
  onClose: () => void;
  onSubmit: () => void;
  loading: boolean;
  classes: any[];
  batches: any[];
  students: any[];
  selectedClass: string;
  setSelectedClass: (value: string) => void;
  selectedBatch: string;
  setSelectedBatch: (value: string) => void;
  attendanceDate: string;
  setAttendanceDate: (value: string) => void;
  classStartingTime: string;
  setClassStartingTime: (value: string) => void;
  classEndingTime: string;
  setClassEndingTime: (value: string) => void;
  attendanceType: string;
  setAttendanceType: (value: string) => void;
  studentAttendance: Record<string, string>;
  handleAttendanceChange: (studentId: string, type: string) => void;
  studentRemarks: Record<string, string>;
  handleRemarkChange: (studentId: string, remark: string) => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!selectedClass) newErrors.class = 'Please select a class';
    if (!selectedBatch) newErrors.batch = 'Please select a batch';
    if (!attendanceDate) newErrors.date = 'Please select attendance date';
    if (!classStartingTime) newErrors.startTime = 'Please select class starting time';
    if (!classEndingTime) newErrors.endTime = 'Please select class ending time';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit();
    }
  };

  const getAttendanceTypeColor = (type: string) => {
    switch (type) {
      case 'present': return '#10b981';
      case 'absent': return '#ef4444';
      case 'late': return '#f59e0b';
      case 'half_day': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getAttendanceTypeIcon = (type: string) => {
    switch (type) {
      case 'present': return '✅';
      case 'absent': return '❌';
      case 'late': return '⏰';
      case 'half_day': return '½';
      default: return '❓';
    }
  };

  const isFormValid = () => {
    return selectedClass && selectedBatch && attendanceDate && classStartingTime && classEndingTime;
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Take Attendance</h2>
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
            {/* Class and Batch Selection */}
            <div className={styles.formGrid}>
              <div className={styles.formField}>
                <label className={styles.label} htmlFor="classSelect">
                  Select the class
                  <span className={styles.required}>*</span>
                </label>
                <select
                  id="classSelect"
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className={`${styles.select} ${errors.class ? styles.inputError : ''}`}
                  disabled={loading}
                >
                  <option value="">Select the class</option>
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>{cls.classname}</option>
                  ))}
                </select>
                {errors.class && <div className={styles.errorMessage}>{errors.class}</div>}
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="batchSelect">
                  Select the Batch
                  <span className={styles.required}>*</span>
                </label>
                <select
                  id="batchSelect"
                  value={selectedBatch}
                  onChange={(e) => setSelectedBatch(e.target.value)}
                  className={`${styles.select} ${errors.batch ? styles.inputError : ''}`}
                  disabled={loading || !selectedClass}
                >
                  <option value="">Select the batch</option>
                  {batches.map(batch => (
                    <option key={batch._id} value={batch._id}>
                      {batch.batchName} ({batch.sessionYear})
                    </option>
                  ))}
                </select>
                {errors.batch && <div className={styles.errorMessage}>{errors.batch}</div>}
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="attendanceDate">
                  Attendance Date
                  <span className={styles.required}>*</span>
                </label>
                <input
                  id="attendanceDate"
                  type="date"
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className={`${styles.input} ${errors.date ? styles.inputError : ''}`}
                  disabled={loading}
                />
                {errors.date && <div className={styles.errorMessage}>{errors.date}</div>}
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="classStartingTime">
                  Class Starting Time
                  <span className={styles.required}>*</span>
                </label>
                <input
                  id="classStartingTime"
                  type="time"
                  value={classStartingTime}
                  onChange={(e) => setClassStartingTime(e.target.value)}
                  className={`${styles.input} ${errors.startTime ? styles.inputError : ''}`}
                  disabled={loading}
                />
                {errors.startTime && <div className={styles.errorMessage}>{errors.startTime}</div>}
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="classEndingTime">
                  Class Ending Time
                  <span className={styles.required}>*</span>
                </label>
                <input
                  id="classEndingTime"
                  type="time"
                  value={classEndingTime}
                  onChange={(e) => setClassEndingTime(e.target.value)}
                  className={`${styles.input} ${errors.endTime ? styles.inputError : ''}`}
                  disabled={loading}
                />
                {errors.endTime && <div className={styles.errorMessage}>{errors.endTime}</div>}
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="attendanceType">
                  Default Attendance Type
                </label>
                <select
                  id="attendanceType"
                  value={attendanceType}
                  onChange={(e) => setAttendanceType(e.target.value)}
                  className={styles.select}
                  disabled={loading}
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="half_day">Half Day</option>
                </select>
              </div>
            </div>

            {/* Students List */}
            {students.length > 0 && (
              <div className={styles.studentsSection}>
                <h3 className={styles.sectionTitle}>
                  Students List ({students.length} students)
                </h3>
                <div className={styles.studentsList}>
                  {students.map((student) => (
                    <div key={student._id} className={styles.studentRow}>
                      <div className={styles.studentInfo}>
                        <div className={styles.studentAvatar}>
                          {student.nameEnglish.charAt(0).toUpperCase()}
                        </div>
                        <div className={styles.studentDetails}>
                          <span className={styles.studentName}>{student.nameEnglish}</span>
                          <span className={styles.registrationId}>
                            ID: {student.registrationId}
                          </span>
                        </div>
                      </div>
                      
                      <div className={styles.attendanceControls}>
                        <div className={styles.attendanceButtons}>
                          {['present', 'absent', 'late', 'half_day'].map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => handleAttendanceChange(student._id, type)}
                              className={`${styles.attendanceButton} ${
                                studentAttendance[student._id] === type ? styles.active : ''
                              }`}
                              style={{
                                backgroundColor: studentAttendance[student._id] === type 
                                  ? getAttendanceTypeColor(type) 
                                  : 'transparent',
                                borderColor: getAttendanceTypeColor(type),
                                color: studentAttendance[student._id] === type ? 'white' : getAttendanceTypeColor(type),
                              }}
                              disabled={loading}
                            >
                              {getAttendanceTypeIcon(type)} {type.charAt(0).toUpperCase() + type.slice(1)}
                            </button>
                          ))}
                        </div>
                        
                        <input
                          type="text"
                          placeholder="Remarks (optional)"
                          value={studentRemarks[student._id] || ''}
                          onChange={(e) => handleRemarkChange(student._id, e.target.value)}
                          className={styles.remarkInput}
                          disabled={loading}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedClass && selectedBatch && students.length === 0 && (
              <div className={styles.emptyStudents}>
                <div className={styles.emptyIcon}>👨‍🎓</div>
                <h4 className={styles.emptyTitle}>No students found</h4>
                <p className={styles.emptyDescription}>
                  No active students found for the selected class and batch.
                </p>
              </div>
            )}
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
              disabled={loading || !isFormValid() || students.length === 0}
            >
              {loading ? (
                <>
                  <span className={styles.spinnerSmall}></span>
                  Submitting...
                </>
              ) : (
                'Submit Attendance'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}