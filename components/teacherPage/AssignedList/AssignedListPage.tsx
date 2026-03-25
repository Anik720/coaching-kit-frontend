import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store/store';
import { fetchAssignments, deleteAssignment } from '../../../api/teacherApi/teacherSlice';
import { fetchTeachers } from '../../../api/teacherApi/teacherSlice';
import { TeacherAssignment } from '../../../api/teacherApi/types/teacher.types';
import styles from './AssignedList.module.css';
import EditAssignmentModal from './EditAssignmentModal';
import { toast } from 'react-toastify';

const AssignedListPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { 
    assignments, 
    assignmentTotalPages, 
    assignmentPage, 
    loading, 
    teachers 
  } = useSelector((state: RootState) => state.teacher);

  const [page, setPage] = useState(1);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedPaymentType, setSelectedPaymentType] = useState<string>('');
  
  const [editingAssignment, setEditingAssignment] = useState<TeacherAssignment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchTeachers({ limit: 1000 }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchAssignments({ 
      page, 
      limit: 10,
      teacher: selectedTeacher || undefined,
      paymentType: selectedPaymentType as any || undefined
    }));
  }, [dispatch, page, selectedTeacher, selectedPaymentType]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this assignment?")) {
      try {
        await dispatch(deleteAssignment(id)).unwrap();
        toast.success("Assignment deleted successfully");
        // Refetch immediately to ensure correct pagination
        dispatch(fetchAssignments({ page, limit: 10, teacher: selectedTeacher || undefined }));
      } catch (error: any) {
        toast.error(error || "Failed to delete assignment");
      }
    }
  };

  const openEditModal = (assignment: TeacherAssignment) => {
    setEditingAssignment(assignment);
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setEditingAssignment(null);
    setIsModalOpen(false);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTitle}>
          <span className={styles.headerIcon}>📋</span>
          <h2>Assigned Subjects & Salaries</h2>
        </div>
      </div>

      {/* Filters */}
      <div className={styles.filterCard}>
        <div className={styles.filterGroup}>
          <label>Filter by Teacher</label>
          <select 
            className={styles.selectInput}
            value={selectedTeacher}
            onChange={(e) => {
              setSelectedTeacher(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Teachers</option>
            {teachers.map(t => (
               <option key={t._id} value={t._id}>{t.fullName}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Filter by Payment Type</label>
          <select 
            className={styles.selectInput}
            value={selectedPaymentType}
            onChange={(e) => {
              setSelectedPaymentType(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Types</option>
            <option value="monthly">Monthly</option>
            <option value="monthly_hourly">Monthly Hourly</option>
            <option value="daily">Daily</option>
            <option value="per_class">Per Class</option>
            <option value="per_class_hourly">Per Class Hourly</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableContainer}>
          {loading && assignments.length === 0 ? (
            <div className={styles.emptyState}>Loading assignments...</div>
          ) : assignments.length === 0 ? (
            <div className={styles.emptyState}>No assignments found matching your criteria.</div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>TEACHER</th>
                  <th>DESIGNATION</th>
                  <th>ASSIGNMENT</th>
                  <th>PAYMENT SETUP</th>
                  <th>STATUS</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((item) => (
                  <tr key={item._id}>
                    <td>
                      <div className={styles.teacherName}>{item.teacher.fullName}</div>
                    </td>
                    <td>{item.teacher.designation}</td>
                    <td>
                       <div className={styles.courseDetails}>
                         <strong>{item.subject?.subjectName || 'N/A'}</strong>
                         <span className={styles.subtext}>
                            {item.class?.classname ? `Cls: ${item.class.classname}` : ''} 
                            {item.batch?.batchName ? ` | Bch: ${item.batch.batchName}` : ''}
                         </span>
                       </div>
                    </td>
                    <td>
                       <div className={styles.paymentBadge}>{item.paymentType.replace('_', ' ').toUpperCase()}</div>
                       <div className={styles.subtext}>Amount: BDT {item.amount}</div>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${item.status === 'active' ? styles.active : styles.inactive}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionGroup}>
                        <button 
                          className={styles.actionBtnEdit}
                          onClick={() => openEditModal(item)}
                          title="Edit"
                        >
                           Edit
                        </button>
                        <button 
                           className={styles.actionBtnDelete}
                           onClick={() => handleDelete(item._id)}
                           title="Delete"
                        >
                           Delete
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
        {assignmentTotalPages > 1 && (
          <div className={styles.pagination}>
            <button 
              className={styles.paginationBtn}
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
               &lt; Previous
            </button>
            <span className={styles.pageInfo}>Page {page} of {assignmentTotalPages}</span>
            <button 
              className={styles.paginationBtn}
              disabled={page === assignmentTotalPages}
              onClick={() => setPage(page + 1)}
            >
               Next &gt;
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isModalOpen && editingAssignment && (
         <EditAssignmentModal 
           assignment={editingAssignment} 
           onClose={closeEditModal} 
         />
      )}
    </div>
  );
};

export default AssignedListPage;
