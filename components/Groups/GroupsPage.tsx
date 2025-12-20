"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useGroup } from "@/hooks/useGroup";
import { toastManager } from "@/utils/toastConfig";
import styles from "./Groups.module.css";
import ConfirmationModal from "../common/ConfirmationModal";
import { clearError, clearSuccess, createGroup, deleteGroup, fetchGroups, fetchMyGroups, toggleGroupActive, updateGroup } from "@/api/groupsApi/groupSlice";

// Improved debounce hook
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

export default function GroupsPage() {
  const {
    groups,
    loading,
    error,
    success,
    total,
    page,
    limit,
    totalPages,
    dispatch,
  } = useGroup();

  const [open, setOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<{
    id: string;
    groupName: string;
    description: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [viewMode, setViewMode] = useState<"all" | "my">("all");
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Use debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch groups on component mount and when filters change
  useEffect(() => {
    let isMounted = true;
    
    const loadGroups = async () => {
      setIsSearching(true);
      try {
        if (viewMode === "all") {
          await dispatch(
            fetchGroups({
              search: debouncedSearchTerm || undefined,
              page: currentPage,
              limit: 10,
              sortBy: "createdAt",
              sortOrder: "desc",
              isActive: undefined,
            })
          ).unwrap();
        } else {
          await dispatch(
            fetchMyGroups({
              search: debouncedSearchTerm || undefined,
              page: currentPage,
              limit: 10,
              isActive: true,
            })
          ).unwrap();
        }
      } catch (error: any) {
        console.error("Failed to load groups:", error);
        toastManager.showError("Failed to load groups");
      } finally {
        if (isMounted) {
          setIsSearching(false);
        }
      }
    };

    loadGroups();
    
    return () => {
      isMounted = false;
    };
  }, [dispatch, debouncedSearchTerm, currentPage, viewMode]);

  // Handle success/error messages with toast
  useEffect(() => {
    if (success) {
      dispatch(clearSuccess());
    }
    if (error) {
      toastManager.showError(error);
      dispatch(clearError());
    }
  }, [success, error, dispatch]);

  const handleCreateGroup = useCallback(
    async (groupData: { groupName: string; description: string }) => {
      const toastId = toastManager.showLoading("Creating group...");

      try {
        await dispatch(createGroup(groupData)).unwrap();
        toastManager.updateToast(
          toastId,
          "Group created successfully!",
          "success"
        );

        setOpen(false);
      } catch (error: any) {
        toastManager.safeUpdateToast(
          toastId,
          "Failed to create group",
          "error"
        );
      }
    },
    [dispatch]
  );

  const handleUpdateGroup = useCallback(
    async (
      id: string,
      groupData: { groupName?: string; description?: string }
    ) => {
      setIsUpdating(true);
      const toastId = toastManager.showLoading("Updating group...");

      try {
        await dispatch(updateGroup({ id, groupData })).unwrap();
        toastManager.safeUpdateToast(
          toastId,
          "Group updated successfully!",
          "success"
        );
        setEditingGroup(null);
      } catch (error: any) {
        toastManager.safeUpdateToast(
          toastId,
          "Failed to update group",
          "error"
        );
      } finally {
        setIsUpdating(false);
      }
    },
    [dispatch]
  );

  const handleDeleteClick = useCallback((id: string) => {
    setGroupToDelete(id);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!groupToDelete) return;

    setIsDeleting(true);
    const toastId = toastManager.showLoading("Deleting group...");

    try {
      await dispatch(deleteGroup(groupToDelete)).unwrap();
      toastManager.safeUpdateToast(
        toastId,
        "Group deleted successfully!",
        "success"
      );
    } catch (error: any) {
      toastManager.safeUpdateToast(
        toastId,
        "Failed to delete group",
        "error"
      );
    } finally {
      setIsDeleting(false);
      setGroupToDelete(null);
    }
  }, [dispatch, groupToDelete]);

  const handleDeleteCancel = useCallback(() => {
    setGroupToDelete(null);
  }, []);

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Optional: Add input sanitization
    const sanitizedValue = value.replace(/[<>]/g, ''); // Remove potential HTML tags
    setSearchTerm(sanitizedValue);
    setCurrentPage(1); // Reset to first page when searching
  }, []);

  const handleSearchClear = useCallback(() => {
    setSearchTerm("");
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault(); // Prevent form submission if inside a form
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

  const startEdit = (group: (typeof groups)[0]) => {
    setEditingGroup({
      id: group._id,
      groupName: group.groupName,
      description: group.description,
    });
  };

  const cancelEdit = () => {
    setEditingGroup(null);
  };

  const saveEdit = () => {
    if (editingGroup) {
      handleUpdateGroup(editingGroup.id, {
        groupName: editingGroup.groupName,
        description: editingGroup.description,
      });
    }
  };

  // Calculate statistics safely
  const stats = useMemo(() => {
    // Get current user from localStorage
    const userStr = localStorage.getItem("user");
    let currentUser = null;
    
    if (userStr) {
      try {
        currentUser = JSON.parse(userStr);
      } catch (error) {
        console.error("Failed to parse user:", error);
        currentUser = null;
      }
    }

    const totalGroups = total || 0;
    
    // Count active groups
    const activeGroups = groups.reduce((count, group) => {
      return count + (group?.isActive ? 1 : 0);
    }, 0);
    
    // Count "my groups"
    const myGroups = groups.reduce((count, group) => {
      if (!group || !group.createdBy || !currentUser) return count;
      
      // Check if this group was created by current user
      const isMyGroup = group.createdBy._id === currentUser.id;
      
      return count + (isMyGroup ? 1 : 0);
    }, 0);
    
    // You would typically fetch these from your API
    const totalBatches = groups.reduce((total, group) => {
      // This would come from API data
      return total + 0; // Placeholder
    }, 0);
    
    const avgBatchesPerGroup = totalGroups > 0 
      ? (totalBatches / totalGroups).toFixed(1) 
      : "0";

    return { 
      totalGroups, 
      activeGroups, 
      myGroups, 
      totalBatches, 
      avgBatchesPerGroup 
    };
  }, [groups, total]);

  // Toggle group active status
  const handleToggleActive = useCallback(
    async (id: string) => {
      const toastId = toastManager.showLoading("Updating group status...");

      try {
        await dispatch(toggleGroupActive(id)).unwrap();
        toastManager.safeUpdateToast(
          toastId,
          "Group status updated!",
          "success"
        );
      } catch (error: any) {
        toastManager.safeUpdateToast(
          toastId,
          "Failed to update status",
          "error"
        );
      }
    },
    [dispatch]
  );

  const searchInput = (
    <form onSubmit={handleSearchSubmit} className={styles.searchBox}>
      <svg
        className={styles.searchIcon}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
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
        placeholder="Search by group name..."
        className={styles.searchInput}
        value={searchTerm}
        onChange={handleSearch}
        disabled={loading || isUpdating} // Removed isSearching from here
        maxLength={50} // Limit input length
      />
      {searchTerm && (
        <button
          onClick={handleSearchClear}
          className={styles.searchClear}
          title="Clear search"
          disabled={loading || isUpdating || isSearching}
          type="button"
        >
          ✕
        </button>
      )}
      {(loading || isUpdating || isSearching) && (
        <div className={styles.searchLoading}>
          <div className={styles.spinnerSmall}></div>
        </div>
      )}
    </form>
  );

  return (
    <div className={styles.pageContainer}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerContent}>
          <div className={styles.headerText}>
            <h1 className={styles.pageTitle}>Group Management</h1>
            <p className={styles.pageSubtitle}>
              Manage and organize academic groups
            </p>
            <div className={styles.searchStats}>
              {debouncedSearchTerm && (
                <span className={styles.searchResultInfo}>
                  Showing results for "{debouncedSearchTerm}"
                </span>
              )}
              {(loading || isSearching) && (
                <span className={styles.loadingIndicator}>
                  <div className={styles.spinnerSmall}></div>
                  {isSearching ? "Searching..." : "Loading..."}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => setOpen(true)}
            className={styles.btnPrimary}
            disabled={loading || isUpdating || isSearching}
            type="button"
          >
            {loading || isUpdating || isSearching ? (
              <span className={styles.spinnerSmall}></span>
            ) : (
              <>
                <svg
                  className={styles.btnIcon}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create New Group
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
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          >
            👥
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Groups</p>
            <p className={styles.statValue}>{stats.totalGroups}</p>
            <span className={styles.statSubtext}>
              {stats.activeGroups} active
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{
              background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            }}
          >
            📝
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>Total Batches</p>
            <p className={styles.statValue}>{stats.totalBatches}</p>
            <span className={styles.statSubtext}>
              Avg: {stats.avgBatchesPerGroup} per group
            </span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div
            className={styles.statIcon}
            style={{
              background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            }}
          >
            👤
          </div>
          <div className={styles.statContent}>
            <p className={styles.statLabel}>My Groups</p>
            <p className={styles.statValue}>{stats.myGroups}</p>
            <span className={styles.statSubtext}>Created by you</span>
          </div>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className={styles.viewToggle}>
        <button
          onClick={() => {
            setViewMode("all");
            setCurrentPage(1);
          }}
          className={`${styles.viewButton} ${
            viewMode === "all" ? styles.active : ""
          }`}
          type="button"
          disabled={loading || isUpdating || isSearching}
        >
          All Groups
        </button>
        <button
          onClick={() => {
            setViewMode("my");
            setCurrentPage(1);
          }}
          className={`${styles.viewButton} ${
            viewMode === "my" ? styles.active : ""
          }`}
          type="button"
          disabled={loading || isUpdating || isSearching}
        >
          My Groups
        </button>
      </div>

      {/* Groups Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableHeader}>
          <h2 className={styles.tableTitle}>
            {viewMode === "all" ? "All Groups" : "My Groups"}
            <span className={styles.tableCount}>({total} total)</span>
          </h2>
          {searchInput}
        </div>

        {loading && !groups.length ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinnerLarge}></div>
            <p className={styles.loadingText}>Loading groups...</p>
            <p className={styles.loadingSubtext}>
              Please wait while we fetch your data
            </p>
          </div>
        ) : (
          <>
            <div className={styles.tableWrapper}>
              {groups.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>👥</div>
                  <h3 className={styles.emptyTitle}>
                    {isSearching ? "Searching..." : "No groups found"}
                  </h3>
                  <p className={styles.emptyDescription}>
                    {debouncedSearchTerm
                      ? `No groups found for "${debouncedSearchTerm}". Try a different search term.`
                      : "You haven't created any groups yet. Get started by creating your first group!"}
                  </p>
                  {!debouncedSearchTerm && (
                    <button
                      onClick={() => setOpen(true)}
                      className={styles.btnPrimary}
                      type="button"
                      disabled={loading || isUpdating || isSearching}
                    >
                      Create First Group
                    </button>
                  )}
                </div>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Group Name</th>
                      <th>Description</th>
                      <th>Status</th>
                      <th>Created By</th>
                      <th>Created Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groups.map((group) => (
                      <tr
                        key={group._id}
                        className={
                          editingGroup?.id === group._id
                            ? styles.editingRow
                            : ""
                        }
                      >
                        <td>
                          {editingGroup?.id === group._id ? (
                            <input
                              type="text"
                              value={editingGroup.groupName}
                              onChange={(e) =>
                                setEditingGroup({
                                  ...editingGroup,
                                  groupName: e.target.value,
                                })
                              }
                              className={styles.editInput}
                              autoFocus
                              disabled={isUpdating || isSearching}
                            />
                          ) : (
                            <div className={styles.groupNameCell}>
                              <span className={styles.groupIcon}>👥</span>
                              <span className={styles.groupName}>
                                {group.groupName}
                              </span>
                            </div>
                          )}
                        </td>
                        <td>
                          {editingGroup?.id === group._id ? (
                            <input
                              type="text"
                              value={editingGroup.description}
                              onChange={(e) =>
                                setEditingGroup({
                                  ...editingGroup,
                                  description: e.target.value,
                                })
                              }
                              className={styles.editInput}
                              disabled={isUpdating || isSearching}
                            />
                          ) : (
                            <span className={styles.description}>
                              {group.description}
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => handleToggleActive(group._id)}
                            className={`${styles.statusBadge} ${
                              group.isActive ? styles.active : styles.inactive
                            }`}
                            type="button"
                            title={
                              group.isActive
                                ? "Click to deactivate"
                                : "Click to activate"
                            }
                            disabled={loading || isUpdating || isSearching}
                          >
                            {group.isActive ? "Active" : "Inactive"}
                          </button>
                        </td>
                        <td>
                          <div className={styles.userCell}>
                            <div className={styles.userAvatar}>
                              {group?.createdBy?.username?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div className={styles.userInfo}>
                              <span className={styles.userName}>
                                {group?.createdBy?.username || "Unknown"}
                              </span>
                              <span className={styles.userRole}>
                                {group?.createdBy?.role || "N/A"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className={styles.dateCell}>
                          {new Date(group.createdAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </td>
                        <td>
                          <div className={styles.actionButtons}>
                            {editingGroup?.id === group._id ? (
                              <>
                                <button
                                  onClick={saveEdit}
                                  className={styles.btnSave}
                                  title="Save"
                                  disabled={isUpdating || isSearching}
                                  type="button"
                                >
                                  {isUpdating ? (
                                    <span
                                      className={styles.spinnerSmall}
                                    ></span>
                                  ) : (
                                    "✓"
                                  )}
                                </button>
                                <button
                                  onClick={cancelEdit}
                                  className={styles.btnCancel}
                                  title="Cancel"
                                  disabled={isUpdating || isSearching}
                                  type="button"
                                >
                                  ✕
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => startEdit(group)}
                                  className={styles.btnEdit}
                                  title="Edit"
                                  disabled={loading || isUpdating || isSearching}
                                  type="button"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(group._id)}
                                  className={styles.btnDelete}
                                  title="Delete"
                                  disabled={loading || isUpdating || isSearching}
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
                  disabled={currentPage === 1 || loading || isUpdating || isSearching}
                  className={styles.paginationButton}
                  type="button"
                >
                  First
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1 || loading || isUpdating || isSearching}
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
                        className={`${styles.pageNumber} ${
                          currentPage === pageNum ? styles.activePage : ""
                        }`}
                        disabled={loading || isUpdating || isSearching}
                        type="button"
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || loading || isUpdating || isSearching}
                  className={styles.paginationButton}
                  type="button"
                >
                  Next
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages || loading || isUpdating || isSearching}
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

      {/* Create Group Modal */}
      {open && (
        <CreateGroupModal
          onClose={() => setOpen(false)}
          onCreate={handleCreateGroup}
          loading={loading || isUpdating || isSearching}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!groupToDelete}
        title="Delete Group"
        message="Are you sure you want to delete this group? This action cannot be undone and all associated data will be permanently removed."
        confirmText="Delete Group"
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

// Create Group Modal Component (keep as is)
function CreateGroupModal({
  onClose,
  onCreate,
  loading,
}: {
  onClose: () => void;
  onCreate: (groupData: { groupName: string; description: string }) => void;
  loading: boolean;
}) {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{
    groupName?: string;
    description?: string;
  }>({});
  const [touched, setTouched] = useState({
    groupName: false,
    description: false,
  });

  const validateField = (
    name: "groupName" | "description",
    value: string
  ) => {
    if (!touched[name]) return "";

    if (name === "groupName") {
      if (!value.trim()) return "Group name is required";
      if (value.trim().length < 2)
        return "Group name must be at least 2 characters";
      if (value.trim().length > 50)
        return "Group name must be less than 50 characters";
    }

    if (name === "description") {
      if (!value.trim()) return "Description is required";
      if (value.trim().length < 10)
        return "Description must be at least 10 characters";
      if (value.trim().length > 500)
        return "Description must be less than 500 characters";
    }

    return "";
  };

  const validateForm = () => {
    const newErrors = {
      groupName: validateField("groupName", groupName),
      description: validateField("description", description),
    };

    setErrors(newErrors);
    return !newErrors.groupName && !newErrors.description;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({ groupName: true, description: true });

    if (validateForm()) {
      onCreate({
        groupName: groupName.trim(),
        description: description.trim(),
      });
    }
  };

  const handleBlur = (field: "groupName" | "description") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const error = validateField(
      field,
      field === "groupName" ? groupName : description
    );
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleChange = (
    field: "groupName" | "description",
    value: string
  ) => {
    if (field === "groupName") {
      setGroupName(value);
    } else {
      setDescription(value);
    }

    // Clear error when user starts typing
    if (touched[field] && errors[field]) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const getValidationIcon = (field: "groupName" | "description") => {
    const value = field === "groupName" ? groupName : description;
    const error = validateField(field, value);

    if (!touched[field]) return null;

    if (error) {
      return (
        <span className={`${styles.validationIcon} ${styles.invalid}`}>✗</span>
      );
    } else if (value.trim().length > 0) {
      return (
        <span className={`${styles.validationIcon} ${styles.valid}`}>✓</span>
      );
    }

    return null;
  };

  const isFormValid = () => {
    return (
      groupName.trim().length >= 2 &&
      description.trim().length >= 10 &&
      !errors.groupName &&
      !errors.description
    );
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Create New Group</h2>
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
              <label className={styles.label} htmlFor="groupName">
                Group Name
                <span className={styles.required}>*</span>
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id="groupName"
                  type="text"
                  value={groupName}
                  onChange={(e) => handleChange("groupName", e.target.value)}
                  onBlur={() => handleBlur("groupName")}
                  placeholder="e.g., Science Group, Commerce Group"
                  className={`${styles.input} ${
                    touched.groupName &&
                    !errors.groupName &&
                    groupName.trim()
                      ? styles.successBorder
                      : errors.groupName
                      ? styles.inputError
                      : ""
                  }`}
                  autoFocus
                  disabled={loading}
                  maxLength={50}
                />
                {getValidationIcon("groupName")}
              </div>
              {touched.groupName && errors.groupName && (
                <div className={styles.errorMessage}>{errors.groupName}</div>
              )}
              <div className={styles.helpText}>
                Enter a unique name for your group (2-50 characters)
              </div>
              <div className={styles.charCounter}>
                <span
                  className={`${styles.charCount} ${
                    groupName.length >= 45 ? styles.warning : ""
                  }`}
                >
                  {groupName.length}/50 characters
                </span>
              </div>
            </div>

            <div className={styles.formField}>
              <label className={styles.label} htmlFor="description">
                Description
                <span className={styles.required}>*</span>
              </label>
              <div
                className={`${styles.inputWrapper} ${styles.textareaWrapper}`}
              >
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  onBlur={() => handleBlur("description")}
                  placeholder="Describe the group purpose, curriculum, and requirements..."
                  className={`${styles.textarea} ${
                    touched.description &&
                    !errors.description &&
                    description.trim()
                      ? styles.successBorder
                      : errors.description
                      ? styles.inputError
                      : ""
                  }`}
                  rows={4}
                  disabled={loading}
                  maxLength={500}
                />
                {getValidationIcon("description")}
              </div>
              {touched.description && errors.description && (
                <div className={styles.errorMessage}>{errors.description}</div>
              )}
              <div className={styles.helpText}>
                Provide detailed information about this group (10-500
                characters)
              </div>
              <div className={styles.charCounter}>
                <span
                  className={`${styles.charCount} ${
                    description.length > 450
                      ? styles.warning
                      : description.length >= 500
                      ? styles.error
                      : ""
                  }`}
                >
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
                "Create Group"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}