"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useStudent } from "@/hooks/useStudent";
import { toastManager } from "@/utils/toastConfig";
import ConfirmationModal from "@/components/common/ConfirmationModal";
import { StudentItem, AdmissionType, StudentStatus, Gender, Religion } from "@/api/studentApi/types/student.types";
import styles from './Student.module.css';

import api from "@/api/axios";
import CreateStudentModal from "./CreateStudentModal";

// Custom hook for debounce
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

export default function StudentsPage() {
  const {
    students,
    loading,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
    currentStudent,
    classes,
    fetchStudents,
    createStudent,
    deleteStudent,
    makePayment,
    setCurrentStudent,
    fetchClasses,
  } = useStudent();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterAdmissionType, setFilterAdmissionType] = useState<string>("");
  const [paymentModal, setPaymentModal] = useState<{ 
    open: boolean; 
    student: StudentItem | null;
    paymentRemarks: string;
  }>({
    open: false,
    student: null,
    paymentRemarks: "",
  });
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [viewStudentModal, setViewStudentModal] = useState<boolean>(false);
  const [dropdownsLoaded, setDropdownsLoaded] = useState(false);
  const [hasFetchedClasses, setHasFetchedClasses] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch classes on component mount - ONLY ONCE
  useEffect(() => {
    const loadClasses = async () => {
      if (hasFetchedClasses || classes.length > 0) {
        setDropdownsLoaded(true);
        return;
      }

      try {
        await fetchClasses();
        setHasFetchedClasses(true);
        setDropdownsLoaded(true);
      } catch (error: any) {
        console.error('Failed to fetch classes:', error);
        toastManager.showError('Failed to load classes');
        setDropdownsLoaded(true); // Still set to true to avoid blocking UI
      }
    };

    loadClasses();
  }, [fetchClasses, hasFetchedClasses, classes.length]);

  // Fetch students - with proper dependencies
  useEffect(() => {
    const loadStudents = async () => {
      try {
        await fetchStudents({
          search: debouncedSearchTerm || undefined,
          status: filterStatus ? (filterStatus as StudentStatus) : undefined,
          admissionType: filterAdmissionType ? (filterAdmissionType as AdmissionType) : undefined,
          page: currentPage,
          limit: 10,
          sortBy: "createdAt",
          sortOrder: "desc",
        });
      } catch (error: any) {
        console.error("Failed to load students:", error);
      }
    };

    // Add a small delay to prevent too many API calls
    const timer = setTimeout(() => {
      loadStudents();
    }, 300);

    return () => clearTimeout(timer);
  }, [debouncedSearchTerm, currentPage, filterStatus, filterAdmissionType]);

  // Handle success/error messages with toast
  useEffect(() => {
    if (success) {
      toastManager.showSuccess("Operation completed successfully!");
    }
    if (error) {
      toastManager.showError(error);
    }
  }, [success, error]);

  const handleCreateStudent = useCallback(
    async (studentData: any) => {
      const toastId = toastManager.showLoading("Creating student...");

      try {
        await createStudent(studentData);
        toastManager.updateToast(toastId, "Student created successfully!", "success");
        setIsModalOpen(false);
      } catch (error: any) {
        toastManager.safeUpdateToast(toastId, "Failed to create student", "error");
      }
    },
    [createStudent]
  );

  // Fetch batches function - memoized
  const fetchBatchesByClass = useCallback(async (classId: string) => {
    try {
      const response = await api.get(`/batches/class/${classId}`);
      console.log('Batches response for class', classId, ':', response.data);
      
      if (response.data.data) {
        return response.data.data;
      } else if (Array.isArray(response.data)) {
        return response.data;
      }
      return [];
    } catch (error) {
      console.error('Failed to fetch batches:', error);
      return [];
    }
  }, []);

  const handleDeleteClick = useCallback((id: string) => {
    setStudentToDelete(id);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!studentToDelete) return;

    setIsDeleting(true);
    const toastId = toastManager.showLoading("Deleting student...");

    try {
      await deleteStudent(studentToDelete);
      toastManager.safeUpdateToast(toastId, "Student deleted successfully!", "success");
      // Reset to first page after deletion
      setCurrentPage(1);
    } catch (error: any) {
      toastManager.safeUpdateToast(toastId, "Failed to delete student", "error");
    } finally {
      setIsDeleting(false);
      setStudentToDelete(null);
    }
  }, [deleteStudent, studentToDelete]);

  const handleDeleteCancel = useCallback(() => {
    setStudentToDelete(null);
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
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback(
    (newPage: number) => {
      if (newPage >= 1 && newPage <= totalPages) {
        setCurrentPage(newPage);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [totalPages]
  );

  const handlePaymentClick = useCallback((student: StudentItem) => {
    setPaymentModal({ 
      open: true, 
      student,
      paymentRemarks: "" 
    });
    setPaymentAmount("");
    setPaymentMethod("cash");
  }, []);

  const handlePaymentSubmit = useCallback(async () => {
    if (!paymentModal.student || !paymentAmount) {
      toastManager.showError("Please enter payment amount");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toastManager.showError("Please enter a valid payment amount");
      return;
    }

    if (amount > paymentModal.student.dueAmount) {
      toastManager.showError("Payment amount cannot exceed due amount");
      return;
    }

    const toastId = toastManager.showLoading("Processing payment...");

    try {
      await makePayment(paymentModal.student._id, {
        amount,
        paymentMethod,
        paymentDate: new Date().toISOString(),
        remarks: paymentModal.paymentRemarks
      });
      toastManager.safeUpdateToast(toastId, "Payment processed successfully!", "success");
      setPaymentModal({ 
        open: false, 
        student: null,
        paymentRemarks: "" 
      });
      setPaymentAmount("");
      setPaymentMethod("cash");
    } catch (error: any) {
      toastManager.safeUpdateToast(toastId, "Failed to process payment", "error");
    }
  }, [makePayment, paymentModal, paymentAmount, paymentMethod]);

  const handleViewStudent = useCallback(async (student: StudentItem) => {
    setCurrentStudent(student);
    setViewStudentModal(true);
  }, [setCurrentStudent]);

  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount).replace('BDT', '৳');
  }, []);

  // Calculate statistics - memoized
  const stats = useMemo(() => {
    const totalStudents = total;
    const activeStudents = students.filter((std) => std.isActive).length;
    const totalDue = students.reduce((sum, std) => sum + (std.dueAmount || 0), 0);
    const totalPaid = students.reduce((sum, std) => sum + (std.paidAmount || 0), 0);
    const monthlyStudents = students.filter((std) => std.admissionType === AdmissionType.MONTHLY).length;
    const courseStudents = students.filter((std) => std.admissionType === AdmissionType.COURSE).length;

    return { totalStudents, activeStudents, totalDue, totalPaid, monthlyStudents, courseStudents };
  }, [students, total]);

  // Get gender display text - memoized
  const getGenderText = useCallback((gender: string) => {
    switch (gender) {
      case Gender.MALE: return 'Male';
      case Gender.FEMALE: return 'Female';
      case Gender.OTHER: return 'Other';
      default: return gender;
    }
  }, []);

  // Get religion display text - memoized
  const getReligionText = useCallback((religion: string) => {
    switch (religion) {
      case Religion.ISLAM: return 'Islam';
      case Religion.HINDUISM: return 'Hinduism';
      case Religion.CHRISTIANITY: return 'Christianity';
      case Religion.BUDDHISM: return 'Buddhism';
      case Religion.OTHER: return 'Other';
      default: return religion;
    }
  }, []);

  // Get admission type display text - memoized
  const getAdmissionTypeText = useCallback((type: string) => {
    switch (type) {
      case AdmissionType.MONTHLY: return 'Monthly';
      case AdmissionType.COURSE: return 'Course';
      default: return type;
    }
  }, []);

  // Get status display text - memoized
  const getStatusText = useCallback((status: string) => {
    switch (status) {
      case StudentStatus.ACTIVE: return 'Active';
      case StudentStatus.INACTIVE: return 'Inactive';
      case StudentStatus.GRADUATED: return 'Graduated';
      case StudentStatus.DROPPED: return 'Dropped';
      case StudentStatus.SUSPENDED: return 'Suspended';
      default: return status;
    }
  }, []);

  return (
    <div className={styles.pageContainer}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>Student Management</h1>
            <p className={styles.pageSubtitle}>Manage and track all student records</p>
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
            onClick={() => setIsModalOpen(true)}
            className={styles.btnPrimary}
            disabled={loading}
            type="button"
            title={!dropdownsLoaded ? "Loading dropdown data..." : "Register new student"}
          >
            {loading ? (
              <span className={styles.spinnerSmall}></span>
            ) : (
              <>
                <svg className={styles.btnIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Register New Student
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}
          >
            👨‍🎓
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Students</p>
            <p className={styles.statValue}>{stats.totalStudents}</p>
            <span className={styles.statSubtext}>{stats.activeStudents} active</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" }}
          >
            ✅
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Active Students</p>
            <p className={styles.statValue}>{stats.activeStudents}</p>
            <span className={styles.statSubtext}>{stats.monthlyStudents} monthly, {stats.courseStudents} course</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)" }}
          >
            💰
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Paid</p>
            <p className={styles.statValue}>{formatCurrency(stats.totalPaid)}</p>
            <span className={styles.statSubtext}>Total collected</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{ background: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)" }}
          >
            📊
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Due</p>
            <p className={styles.statValue}>{formatCurrency(stats.totalDue)}</p>
            <span className={styles.statSubtext}>Outstanding payments</span>
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>
            All Students
            <span className={styles.tableCount}>({total} total)</span>
          </h2>
          <div className={styles.filterGroup}>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
              disabled={loading}
            >
              <option value="">All Status</option>
              <option value={StudentStatus.ACTIVE}>Active</option>
              <option value={StudentStatus.INACTIVE}>Inactive</option>
              <option value={StudentStatus.GRADUATED}>Graduated</option>
              <option value={StudentStatus.DROPPED}>Dropped</option>
              <option value={StudentStatus.SUSPENDED}>Suspended</option>
            </select>

            <select
              value={filterAdmissionType}
              onChange={(e) => {
                setFilterAdmissionType(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
              disabled={loading}
            >
              <option value="">All Types</option>
              <option value={AdmissionType.MONTHLY}>Monthly</option>
              <option value={AdmissionType.COURSE}>Course</option>
            </select>

            <div className={styles.searchBox}>
              <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search by name, reg ID, or mobile..."
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
        </div>

        {loading && !students.length ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinnerLarge}></div>
            <p className={styles.loadingText}>Loading students...</p>
            <p className={styles.loadingSubtext}>Please wait while we fetch your data</p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              {students.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>👨‍🎓</div>
                  <h3 className={styles.emptyTitle}>No students found</h3>
                  <p className={styles.emptyDescription}>
                    {debouncedSearchTerm
                      ? `No students found for "${debouncedSearchTerm}". Try a different search term.`
                      : "You haven't registered any students yet. Get started by registering your first student!"}
                  </p>
                  {!debouncedSearchTerm && (
                    <button onClick={() => setIsModalOpen(true)} className={styles.btnPrimary} type="button">
                      Register First Student
                    </button>
                  )}
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Student Info</th>
                      <th>Reg. ID</th>
                      <th>Class/Batch</th>
                      <th>Contact</th>
                      <th>Admission</th>
                      <th>Fees</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student._id}>
                        <td>
                          <div className={styles.photoCell}>
                            {student.photoUrl ? (
                              <img src={student.photoUrl} alt={student.nameEnglish} className={styles.studentPhoto} />
                            ) : (
                              <div className={styles.photoPlaceholder}>
                                {student.nameEnglish.charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className={styles.studentInfo}>
                            <span className={styles.studentName}>{student.nameEnglish}</span>
                            <span className={styles.studentDetails}>
                              {getGenderText(student.gender)} • {formatDate(student.dateOfBirth)}
                            </span>
                            <span className={styles.studentFather}>Father: {student.fatherName}</span>
                          </div>
                        </td>
                        <td>
                          <span className={styles.regId}>{student.registrationId}</span>
                        </td>
                        <td>
                          <div className={styles.classInfo}>
                            <span className={styles.className}>{student.class?.classname || "N/A"}</span>
                            {student.batch && (
                              <span className={styles.batchName}>{student.batch.batchName}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className={styles.contactInfo}>
                            {student.studentMobileNumber && (
                              <span className={styles.phone}>📱 {student.studentMobileNumber}</span>
                            )}
                            <span className={styles.phone}>👨 {student.fatherMobileNumber}</span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.admissionInfo}>
                            <span className={`${styles.admissionBadge} ${styles[student.admissionType.toLowerCase()]}`}>
                              {getAdmissionTypeText(student.admissionType)}
                            </span>
                            <span className={styles.admissionDate}>
                              {formatDate(student.admissionDate)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className={styles.feeInfo}>
                            <span className={styles.feeLabel}>Total: {formatCurrency(student.totalAmount)}</span>
                            <span className={styles.feePaid}>Paid: {formatCurrency(student.paidAmount)}</span>
                            <span className={`${styles.feeDue} ${student.dueAmount > 0 ? styles.hasDue : ""}`}>
                              Due: {formatCurrency(student.dueAmount)}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span
                            className={`${styles.statusBadge} ${student.isActive ? styles.active : styles.inactive}`}
                          >
                            {getStatusText(student.status)}
                          </span>
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            <button
                              onClick={() => handlePaymentClick(student)}
                              className={styles.btnPayment}
                              title="Make Payment"
                              disabled={loading || student.dueAmount <= 0}
                              type="button"
                            >
                              💳
                            </button>
                            <button
                              onClick={() => handleViewStudent(student)}
                              className={styles.btnView}
                              title="View Details"
                              disabled={loading}
                              type="button"
                            >
                              👁️
                            </button>
                            <button
                              onClick={() => console.log("Edit", student._id)}
                              className={styles.btnEdit}
                              title="Edit"
                              disabled={loading}
                              type="button"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteClick(student._id)}
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
                        className={`${styles.pageNumber} ${currentPage === pageNum ? styles.activePage : ""}`}
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

      {/* Create Student Modal */}
      {isModalOpen && (
        <CreateStudentModal
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateStudent}
          loading={loading}
          classes={classes}
          fetchBatchesByClass={fetchBatchesByClass}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!studentToDelete}
        title="Delete Student"
        message="Are you sure you want to delete this student? This action cannot be undone and all associated data will be permanently removed."
        confirmText="Delete Student"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        isConfirming={isDeleting}
        isDanger={true}
        icon="danger"
      />

      {/* Payment Modal */}
      {paymentModal.open && paymentModal.student && (
        <div className={styles.modalOverlay} onClick={() => setPaymentModal({ open: false, student: null, paymentRemarks: "" })}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Make Payment</h2>
              <button
                onClick={() => setPaymentModal({ open: false, student: null, paymentRemarks: "" })}
                className={styles.modalClose}
                type="button"
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.paymentInfo}>
                <p>
                  <strong>Student:</strong> {paymentModal.student.nameEnglish}
                </p>
                <p>
                  <strong>Reg. ID:</strong> {paymentModal.student.registrationId}
                </p>
                <p>
                  <strong>Total Amount:</strong> {formatCurrency(paymentModal.student.totalAmount)}
                </p>
                <p>
                  <strong>Paid Amount:</strong> {formatCurrency(paymentModal.student.paidAmount)}
                </p>
                <p className={styles.dueHighlight}>
                  <strong>Due Amount:</strong> {formatCurrency(paymentModal.student.dueAmount)}
                </p>
              </div>
              
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="paymentAmount">
                    Payment Amount <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="paymentAmount"
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    placeholder="Enter payment amount"
                    className={styles.input}
                    min="1"
                    max={paymentModal.student.dueAmount}
                    step="1"
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.label} htmlFor="paymentMethod">
                    Payment Method
                  </label>
                  <select
                    id="paymentMethod"
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className={styles.input}
                  >
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="mobile">Mobile Banking</option>
                    <option value="card">Card</option>
                  </select>
                </div>

                <div className={styles.formFieldFull}>
                  <label className={styles.label} htmlFor="paymentRemarks">
                    Remarks (Optional)
                  </label>
                  <textarea
                    id="paymentRemarks"
                    value={paymentModal.paymentRemarks}
                    onChange={(e) => setPaymentModal(prev => ({ 
                      ...prev, 
                      paymentRemarks: e.target.value 
                    }))}
                    placeholder="Any remarks about this payment"
                    className={styles.textarea}
                    rows={2}
                  />
                </div>
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setPaymentModal({ open: false, student: null, paymentRemarks: "" })}
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
                Process Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Student Details Modal */}
      {viewStudentModal && currentStudent && (
        <div className={styles.modalOverlay} onClick={() => setViewStudentModal(false)}>
          <div className={`${styles.modal} ${styles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Student Details</h2>
              <button
                onClick={() => setViewStudentModal(false)}
                className={styles.modalClose}
                type="button"
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label}>Registration ID</label>
                  <div className={`${styles.input} ${styles.viewMode}`}>{currentStudent.registrationId}</div>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Student Name</label>
                  <div className={`${styles.input} ${styles.viewMode}`}>{currentStudent.nameEnglish}</div>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Date of Birth</label>
                  <div className={`${styles.input} ${styles.viewMode}`}>{formatDate(currentStudent.dateOfBirth)}</div>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Gender</label>
                  <div className={`${styles.input} ${styles.viewMode}`}>{getGenderText(currentStudent.gender)}</div>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Religion</label>
                  <div className={`${styles.input} ${styles.viewMode}`}>{getReligionText(currentStudent.religion)}</div>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Father's Name</label>
                  <div className={`${styles.input} ${styles.viewMode}`}>{currentStudent.fatherName}</div>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Father's Mobile</label>
                  <div className={`${styles.input} ${styles.viewMode}`}>{currentStudent.fatherMobileNumber}</div>
                </div>
                <div className={styles.formFieldFull}>
                  <label className={styles.label}>Present Address</label>
                  <div className={`${styles.textarea} ${styles.viewMode}`}>{currentStudent.presentAddress}</div>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Admission Type</label>
                  <div className={`${styles.input} ${styles.viewMode}`}>{getAdmissionTypeText(currentStudent.admissionType)}</div>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Admission Date</label>
                  <div className={`${styles.input} ${styles.viewMode}`}>{formatDate(currentStudent.admissionDate)}</div>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Total Amount</label>
                  <div className={`${styles.input} ${styles.viewMode}`}>{formatCurrency(currentStudent.totalAmount)}</div>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Paid Amount</label>
                  <div className={`${styles.input} ${styles.viewMode}`}>{formatCurrency(currentStudent.paidAmount)}</div>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Due Amount</label>
                  <div className={`${styles.input} ${styles.viewMode}`}>{formatCurrency(currentStudent.dueAmount)}</div>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Status</label>
                  <div className={`${styles.input} ${styles.viewMode}`}>{getStatusText(currentStudent.status)}</div>
                </div>
                <div className={styles.formFieldFull}>
                  <label className={styles.label}>Created At</label>
                  <div className={`${styles.input} ${styles.viewMode}`}>{new Date(currentStudent.createdAt).toLocaleString()}</div>
                </div>
                {currentStudent.remarks && (
                  <div className={styles.formFieldFull}>
                    <label className={styles.label}>Remarks</label>
                    <div className={`${styles.textarea} ${styles.viewMode}`}>{currentStudent.remarks}</div>
                  </div>
                )}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                onClick={() => setViewStudentModal(false)}
                className={styles.btnPrimary}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}