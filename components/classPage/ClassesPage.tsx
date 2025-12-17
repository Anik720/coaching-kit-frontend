"use client";

import { useState, useEffect, useCallback } from "react";

// import {
//   fetchClasses,
//   createClass,
//   updateClass,
//   deleteClass,
//   resetClassState,
//   clearError,
//   clearSuccess,
// } from "../slices/classSlice";


import styles from './Classes.module.css';
import { useClass } from "@/hooks/useClass";
import { clearError, clearSuccess, createClass, deleteClass, fetchClasses, updateClass } from "@/api/classApi/classSlice";

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

  // Fetch classes on component mount and when filters change
  useEffect(() => {
    dispatch(fetchClasses({
      search: searchTerm || undefined,
      page: currentPage,
      limit: 10,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    }));
  }, [dispatch, searchTerm, currentPage]);

  // Handle success/error messages
  useEffect(() => {
    if (success) {
      // You can add a toast notification here
      console.log('Operation successful');
      dispatch(clearSuccess());
    }
    if (error) {
      // You can add a toast notification here
      console.error('Error:', error);
      dispatch(clearError());
    }
  }, [success, error, dispatch]);

  const handleCreateClass = useCallback((classData: { classname: string; description: string }) => {
    dispatch(createClass(classData))
      .unwrap()
      .then(() => {
        setOpen(false);
      })
      .catch((err: any) => {
        console.error('Failed to create class:', err);
      });
  }, [dispatch]);

  const handleUpdateClass = useCallback((id: string, classData: { classname?: string; description?: string }) => {
    dispatch(updateClass({ id, classData }))
      .unwrap()
      .then(() => {
        setEditingClass(null);
      })
      .catch((err) => {
        console.error('Failed to update class:', err);
      });
  }, [dispatch]);

  const handleDeleteClass = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this class?')) {
      dispatch(deleteClass(id))
        .unwrap()
        .catch((err) => {
          console.error('Failed to delete class:', err);
        });
    }
  }, [dispatch]);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  }, [totalPages]);

  const startEdit = (cls: typeof classes[0]) => {
    setEditingClass({ id: cls._id, name: cls.classname, description: cls.description });
  };

  const saveEdit = () => {
    if (editingClass) {
      handleUpdateClass(editingClass.id, {
        classname: editingClass.name,
        description: editingClass.description,
      });
    }
  };

  // Calculate statistics
  const totalStudents = classes.reduce((sum, cls) => {
    // You would need to fetch actual student count from API
    // For now, using a placeholder
    return sum + 0;
  }, 0);

  const totalSubjects = classes.reduce((sum, cls) => {
    // You would need to fetch actual subject count from API
    // For now, using a placeholder
    return sum + 0;
  }, 0);

  return (
    <div className={styles.pageContainer}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div>
            <h1 className={styles.pageTitle}>Class Management</h1>
            <p className={styles.pageSubtitle}>Manage and organize your academic classes</p>
          </div>
          <button 
            onClick={() => setOpen(true)} 
            className={styles.btnPrimary}
            disabled={loading}
          >
            {loading ? (
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
            <p className={styles.statValue}>{total}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
            👨‍🎓
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Students</p>
            <p className={styles.statValue}>{totalStudents}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
            📝
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Subjects</p>
            <p className={styles.statValue}>{totalSubjects}</p>
          </div>
        </div>
      </div>

      {/* Classes Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>All Classes</h2>
          <div className={styles.searchBox}>
            <svg className={styles.searchIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search classes..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={handleSearch}
              disabled={loading}
            />
          </div>
        </div>

        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Loading classes...</p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
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
                    <tr key={cls._id}>
                      <td>
                        {editingClass?.id === cls._id ? (
                          <input
                            type="text"
                            value={editingClass.name}
                            onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                            className={styles.editInput}
                            autoFocus
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
                        {new Date(cls.createdAt).toLocaleDateString()}
                      </td>
                      <td>
                        <div className={styles.actionButtons}>
                          {editingClass?.id === cls._id ? (
                            <>
                              <button
                                onClick={saveEdit}
                                className={styles.btnSave}
                                title="Save"
                                disabled={loading}
                              >
                                {loading ? <span className={styles.spinnerSmall}></span> : '✓'}
                              </button>
                              <button
                                onClick={() => setEditingClass(null)}
                                className={styles.btnCancel}
                                title="Cancel"
                                disabled={loading}
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
                                disabled={loading}
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteClass(cls._id)}
                                className={styles.btnDelete}
                                title="Delete"
                                disabled={loading}
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
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                  className={styles.paginationButton}
                >
                  Previous
                </button>
                <span className={styles.paginationInfo}>
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading}
                  className={styles.paginationButton}
                >
                  Next
                </button>
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
          loading={loading}
        />
      )}
    </div>
  );
}

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (className.trim() && description.trim()) {
      onCreate({ classname: className, description });
      setClassName('');
      setDescription('');
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Create New Class</h2>
          <button onClick={onClose} className={styles.modalClose} disabled={loading}>
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Class Name</label>
              <input
                type="text"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                placeholder="Enter class name (e.g., HSC, SSC)"
                className={styles.input}
                autoFocus
                required
                disabled={loading}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter class description"
                className={styles.textarea}
                rows={3}
                required
                disabled={loading}
              />
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
              disabled={loading || !className.trim() || !description.trim()}
            >
              {loading ? (
                <span className={styles.spinnerSmall}></span>
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