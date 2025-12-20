"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useClass } from "@/hooks/useClass";
import { clearError, clearSuccess, createClass, deleteClass, fetchClasses, updateClass } from "@/api/classApi/classSlice";
// import { toast } from "react-toastify";
import { toastManager } from "@/utils/toastConfig";
import styles from './Classes.module.css';
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

export default function ClassesPage() {
  const {
    classes,
    loading,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
    dispatch,
  } = useClass();

  const [open, setOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<{ id: string; name: string; description: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [classToDelete, setClassToDelete] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Use debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch classes on component mount and when filters change
  useEffect(() => {
    const loadClasses = async () => {
      try {
        await dispatch(fetchClasses({
          search: debouncedSearchTerm || undefined,
          page: currentPage,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        })).unwrap();
      } catch (error: any) {
        // Error is handled by Redux interceptor
        console.error('Failed to load classes:', error);
      }
    };

    loadClasses();
  }, [dispatch, debouncedSearchTerm, currentPage]);

  // Handle success/error messages with toast
  useEffect(() => {
    if (success) {
      // toastManager.showSuccess('Operation completed successfully!');
      dispatch(clearSuccess());
    }
    if (error) {
      toastManager.showError(error);
      dispatch(clearError());
    }
  }, [success, error, dispatch]);

  const handleCreateClass = useCallback(async (classData: { classname: string; description: string }) => {
    const toastId = toastManager.showLoading('Creating class...');
    
    try {
      await dispatch(createClass(classData)).unwrap();
      const toastId = toastManager.showLoading('Creating class...');
      toastManager.updateToast(toastId, 'Class created successfully!', 'success');
      
      setOpen(false);
    } catch (error: any) {


       toastManager.safeUpdateToast(toastId, 'Failed to create class', 'error');
    }
  }, [dispatch]);

  const handleUpdateClass = useCallback(async (id: string, classData: { classname?: string; description?: string }) => {
    setIsUpdating(true);
    const toastId = toastManager.showLoading('Updating class...');
    
    try {
      await dispatch(updateClass({ id, classData })).unwrap();


       toastManager.safeUpdateToast(toastId, 'Class updated successfully!', 'success');
      setEditingClass(null);
    } catch (error: any) { toastManager.safeUpdateToast(toastId, 'Failed to update class', 'error');
    } finally {
      setIsUpdating(false);
    }
  }, [dispatch]);

  const handleDeleteClick = useCallback((id: string) => {
    setClassToDelete(id);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!classToDelete) return;
    
    setIsDeleting(true);
    const toastId = toastManager.showLoading('Deleting class...');
    
    try {
      await dispatch(deleteClass(classToDelete)).unwrap();
    toastManager.safeUpdateToast(toastId, 'Class deleted successfully!', 'success');
    } catch (error: any) {
      toastManager.safeUpdateToast(toastId, 'Class deleted successfully!', 'error');
    } finally {
      setIsDeleting(false);
      setClassToDelete(null);
    }
  }, [dispatch, classToDelete]);

  const handleDeleteCancel = useCallback(() => {
    setClassToDelete(null);
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
      // Scroll to top on page change
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalPages]);

  const startEdit = (cls: typeof classes[0]) => {
    setEditingClass({ id: cls._id, name: cls.classname, description: cls.description });
  };

  const cancelEdit = () => {
    setEditingClass(null);
  };

  const saveEdit = () => {
    if (editingClass) {
      handleUpdateClass(editingClass.id, {
        classname: editingClass.name,
        description: editingClass.description,
      });
    }
  };

  // Calculate statistics with proper data
  const stats = useMemo(() => {
    const totalClasses = total;
    const totalStudents = classes.reduce((sum, cls) => {
      // You would fetch actual student count from API
      // For now, using a placeholder
      return sum + Math.floor(Math.random() * 50) + 20; // Random for demo
    }, 0);
    
    const totalSubjects = classes.reduce((sum, cls) => {
      // You would fetch actual subject count from API
      // For now, using a placeholder
      return sum + Math.floor(Math.random() * 8) + 3; // Random for demo
    }, 0);
    
    const activeClasses = classes.filter(cls => cls.isActive).length;

    return { totalClasses, totalStudents, totalSubjects, activeClasses };
  }, [classes, total]);

  // Optimize search input
  const searchInput = (
    <div className={styles.searchBox}>
      <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        ref={searchInputRef}
        type="text"
        placeholder="Search by class name..."
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
            <h1 className={styles.pageTitle}>Class Management</h1>
            <p className={styles.pageSubtitle}>Manage and organize your academic classes</p>
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
                Create New Class
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
            <p className={styles.statLabel}>Total Classes</p>
            <p className={styles.statValue}>{stats.totalClasses}</p>
            <span className={styles.statSubtext}>{stats.activeClasses} active</span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            👨‍🎓
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Students</p>
            <p className={styles.statValue}>{stats.totalStudents.toLocaleString()}</p>
            <span className={styles.statSubtext}>Avg: {Math.round(stats.totalStudents / Math.max(stats.totalClasses, 1))} per class</span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            📝
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Subjects</p>
            <p className={styles.statValue}>{stats.totalSubjects}</p>
            <span className={styles.statSubtext}>Avg: {Math.round(stats.totalSubjects / Math.max(stats.totalClasses, 1))} per class</span>
          </div>
        </div>
      </div>

      {/* Classes Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>
            All Classes
            <span className={styles.tableCount}>({total} total)</span>
          </h2>
          {searchInput}
        </div>

        {loading && !classes.length ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinnerLarge}></div>
            <p className={styles.loadingText}>Loading classes...</p>
            <p className={styles.loadingSubtext}>Please wait while we fetch your data</p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              {classes.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>📚</div>
                  <h3 className={styles.emptyTitle}>No classes found</h3>
                  <p className={styles.emptyDescription}>
                    {debouncedSearchTerm 
                      ? `No classes found for "${debouncedSearchTerm}". Try a different search term.`
                      : "You haven't created any classes yet. Get started by creating your first class!"}
                  </p>
                  {!debouncedSearchTerm && (
                    <button 
                      onClick={() => setOpen(true)} 
                      className={styles.btnPrimary}
                      type="button"
                    >
                      Create First Class
                    </button>
                  )}
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Class Name</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Created By</th>
                      <th>Created Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((cls) => (
                      <tr key={cls._id} className={editingClass?.id === cls._id ? styles.editingRow : ''}>
                        <td>
                          {editingClass?.id === cls._id ? (
                            <input
                              type="text"
                              value={editingClass.name}
                              onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                              className={styles.editInput}
                              autoFocus
                              disabled={isUpdating}
                            />
                          ) : (
                            <div className={styles.classNameCell}>
                              <span className={styles.classIcon}>📚</span>
                              <span className={styles.className}>{cls.classname}</span>
                            </div>
                          )}
                        </td>
                        <td>
                          {editingClass?.id === cls._id ? (
                            <input
                              type="text"
                              value={editingClass.description}
                              onChange={(e) => setEditingClass({ ...editingClass, description: e.target.value })}
                              className={styles.editInput}
                              disabled={isUpdating}
                            />
                          ) : (
                            <span className={styles.description}>{cls.description}</span>
                          )}
                        </td>
                        <td>
                          <span className={`${styles.statusBadge} ${cls.isActive ? styles.active : styles.inactive}`}>
                            {cls.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className={styles.userCell}>
                            <div className={styles.userAvatar}>
                              {cls.createdBy.username.charAt(0).toUpperCase()}
                            </div>
                            <div className={styles.userInfo}>
                              <span className={styles.userName}>{cls.createdBy.username}</span>
                              <span className={styles.userRole}>{cls.createdBy.role}</span>
                            </div>
                          </div>
                        </td>
                        <td className={styles.dateCell}>
                          {new Date(cls.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            {editingClass?.id === cls._id ? (
                              <>
                                <button
                                  onClick={saveEdit}
                                  className={styles.btnSave}
                                  title="Save"
                                  disabled={isUpdating}
                                  type="button"
                                >
                                  {isUpdating ? <span className={styles.spinnerSmall}></span> : '✓'}
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className={styles.btnCancel}
                                  title="Cancel"
                                  disabled={isUpdating}
                                  type="button"
                                >
                                  ✕
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(cls)}
                                  className={styles.btnEdit}
                                  title="Edit"
                                  disabled={loading || isUpdating}
                                  type="button"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(cls._id)}
                                  className={styles.btnDelete}
                                  title="Delete"
                                  disabled={loading || isUpdating}
                                  type="button"
                                >
                                  🗑️
                                </button>
                              </>
                            )}
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

      {/* Create Class Modal */}
      {open && (
        <CreateClassModal
          onClose={() => setOpen(false)}
          onCreate={handleCreateClass}
          loading={loading || isUpdating}
        />
      )}

          {/* Delete Confirmation Modal */}
        <ConfirmationModal
          isOpen={!!classToDelete}
          title="Delete Class"
          message="Are you sure you want to delete this class? This action cannot be undone and all associated data will be permanently removed."
          confirmText="Delete Class"
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

// Create Class Modal Component
// Create Class Modal Component
function CreateClassModal({
  onClose,
  onCreate,
  loading,
}: {
  onClose: () => void;
  onCreate: (classData: { classname: string; description: string }) => void;
  loading: boolean;
}) {
  const [className, setClassName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ classname?: string; description?: string }>({});
  const [touched, setTouched] = useState({ classname: false, description: false });

  const validateField = (name: 'classname' | 'description', value: string) => {
    if (!touched[name]) return '';
    
    if (name === 'classname') {
      if (!value.trim()) return 'Class name is required';
      if (value.trim().length < 2) return 'Class name must be at least 2 characters';
      if (value.trim().length > 50) return 'Class name must be less than 50 characters';
    }
    
    if (name === 'description') {
      if (!value.trim()) return 'Description is required';
      if (value.trim().length < 10) return 'Description must be at least 10 characters';
      if (value.trim().length > 500) return 'Description must be less than 500 characters';
    }
    
    return '';
  };

  const validateForm = () => {
    const newErrors = {
      classname: validateField('classname', className),
      description: validateField('description', description),
    };
    
    setErrors(newErrors);
    return !newErrors.classname && !newErrors.description;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    setTouched({ classname: true, description: true });
    
    if (validateForm()) {
      onCreate({ classname: className.trim(), description: description.trim() });
    }
  };

  const handleBlur = (field: 'classname' | 'description') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, field === 'classname' ? className : description);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleChange = (field: 'classname' | 'description', value: string) => {
    if (field === 'classname') {
      setClassName(value);
    } else {
      setDescription(value);
    }
    
    // Clear error when user starts typing
    if (touched[field] && errors[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const getValidationIcon = (field: 'classname' | 'description') => {
    const value = field === 'classname' ? className : description;
    const error = validateField(field, value);
    
    if (!touched[field]) return null;
    
    if (error) {
      return <span className={`${styles.validationIcon} ${styles.invalid}`}>✗</span>;
    } else if (value.trim().length > 0) {
      return <span className={`${styles.validationIcon} ${styles.valid}`}>✓</span>;
    }
    
    return null;
  };

  const isFormValid = () => {
    return className.trim().length >= 2 && 
           description.trim().length >= 10 &&
           !errors.classname && 
           !errors.description;
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Create New Class</h2>
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
              <label className={styles.label} htmlFor="className">
                Class Name
                <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="className"
                  type="text"
                  value={className}
                  onChange={(e) => handleChange('classname', e.target.value)}
                  onBlur={() => handleBlur('classname')}
                  placeholder="e.g., HSC, SSC, Class 12"
                  className={`${styles.input} ${
                    touched.classname && !errors.classname && className.trim() 
                      ? styles.successBorder 
                      : errors.classname 
                      ? styles.inputError 
                      : ''
                  }`}
                  autoFocus
                  disabled={loading}
                  maxLength={50}
                />
                {getValidationIcon('classname')}
              </div>
              {touched.classname && errors.classname && (
                <div className={styles.errorMessage}>{errors.classname}</div>
              )}
              <div className={styles.helpText}>
                Enter a unique name for your class (2-50 characters)
              </div>
              <div className={styles.charCounter}>
                <span className={`${styles.charCount} ${
                  className.length >= 45 ? styles.warning : ''
                }`}>
                  {className.length}/50 characters
                </span>
              </div>
            </div>

            <div className={styles.formField}>
              <label className={styles.label} htmlFor="description">
                Description
                <span className={styles.required}>*</span>
              </label>
              <div className={`${styles.inputWrapper} ${styles.textareaWrapper}`}>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  onBlur={() => handleBlur('description')}
                  placeholder="Describe the class curriculum, objectives, and requirements..."
                  className={`${styles.textarea} ${
                    touched.description && !errors.description && description.trim() 
                      ? styles.successBorder 
                      : errors.description 
                      ? styles.inputError 
                      : ''
                  }`}
                  rows={4}
                  disabled={loading}
                  maxLength={500}
                />
                {getValidationIcon('description')}
              </div>
              {touched.description && errors.description && (
                <div className={styles.errorMessage}>{errors.description}</div>
              )}
              <div className={styles.helpText}>
                Provide detailed information about this class (10-500 characters)
              </div>
              <div className={styles.charCounter}>
                <span className={`${styles.charCount} ${
                  description.length > 450 ? styles.warning : 
                  description.length >= 500 ? styles.error : ''
                }`}>
                  {description.length}/500 characters
                </span>
              </div>
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
              disabled={loading || !isFormValid()}
            >
              {loading ? (
                <>
                  <span className={styles.spinnerSmall}></span>
                  Creating...
                </>
              ) : (
                'Create Class'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}