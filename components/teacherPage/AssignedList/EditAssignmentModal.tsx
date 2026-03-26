import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../store/store';
import { TeacherAssignment, PaymentType, UpdateAssignmentDto } from '../../../api/teacherApi/types/teacher.types';
import { updateAssignment, fetchAssignments } from '../../../api/teacherApi/teacherSlice';
import { fetchClasses } from '../../../api/classApi/classSlice';
import { fetchBatches } from '../../../api/batchApi/batchSlice';
import { fetchSubjects } from '../../../api/subjectApi/subjectSlice';
import styles from './AssignedList.module.css';
import { toast } from 'react-toastify';

// Reusing some setup styles from assignment creation
const modalStyles = {
  overlay: {
    position: 'fixed' as const,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    padding: '24px',
    borderRadius: '8px',
    width: '600px',
    maxHeight: '90vh',
    overflowY: 'auto' as const,
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '1px solid #e5e7eb',
  },
  title: { margin: 0, fontSize: '18px', color: '#111827' },
  closeBtn: { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#6b7280' },
  inputGroup: { marginBottom: '16px' },
  label: { display: 'block', fontSize: '13px', fontWeight: 500, color: '#4b5563', marginBottom: '4px' },
  input: { width: '100%', padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' },
  setupBox: { backgroundColor: '#fefce8', border: '1px solid #fef08a', borderRadius: '8px', padding: '16px', marginBottom: '16px' },
  setupTitle: { fontSize: '14px', fontWeight: 600, color: '#4b5563', margin: '0 0 12px 0' },
  row: { display: 'flex', gap: '12px' },
  half: { flex: 1 },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' },
  cancelBtn: { padding: '8px 16px', border: '1px solid #d1d5db', background: 'white', borderRadius: '6px', cursor: 'pointer' },
  saveBtn: { padding: '8px 16px', border: 'none', background: '#3b82f6', color: 'white', borderRadius: '6px', cursor: 'pointer', fontWeight: 500 }
};

interface EditModalProps {
  assignment: TeacherAssignment;
  onClose: () => void;
}

const EditAssignmentModal: React.FC<EditModalProps> = ({ assignment, onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { classes } = useSelector((state: RootState) => state.class);
  const { batches } = useSelector((state: RootState) => state.batch);
  const { subjects } = useSelector((state: RootState) => state.subject);

  const [classId, setClassId] = useState(assignment.class?._id || '');
  const [batchId, setBatchId] = useState(assignment.batch?._id || '');
  const [subjectId, setSubjectId] = useState(assignment.subject?._id || '');
  const [paymentType, setPaymentType] = useState<PaymentType>(assignment.paymentType);
  
  const [monthlyHourlySetup, setMonthlyHourlySetup] = useState({ 
    totalHours: assignment.totalHoursPerMonth?.toString() || '', 
    totalPayment: assignment.amount?.toString() || '' 
  });
  
  const [dailySetup, setDailySetup] = useState({ 
    totalClass: assignment.totalClassPerDay?.toString() || '', 
    totalPayment: assignment.amount?.toString() || '' 
  });
  
  const [monthlySetup, setMonthlySetup] = useState({ 
    amount: assignment.amount?.toString() || '', 
    hasTotalClass: assignment.hasTotalClass || false 
  });
  
  const [perClassHourlySetup, setPerClassHourlySetup] = useState({ 
    minutes: assignment.ratePerHour?.toString() || '', // or ratePerClass depending on setup interpretation
    amount: assignment.amount?.toString() || '' 
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchClasses({ limit: 1000 }));
    dispatch(fetchBatches({ limit: 1000 }));
    dispatch(fetchSubjects({ limit: 1000 }));
  }, [dispatch]);

  const getBatchesForClass = (clsId: string) => {
    if (!clsId) return [];
    return batches.filter(b => {
      const bClassId = typeof b.className === 'object' ? b.className._id : b.className;
      return bClassId === clsId;
    });
  };

  const availableBatches = getBatchesForClass(classId);

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setClassId(e.target.value);
    setBatchId(''); // Reset batch when class changes
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    
    const updateData: UpdateAssignmentDto = {
      subject: subjectId,
      paymentType: paymentType,
      amount: 0,
    };

    if (classId) updateData.class = classId;
    if (batchId) updateData.batch = batchId;

    switch (paymentType) {
      case PaymentType.MONTHLY_HOURLY:
        updateData.totalHoursPerMonth = Number(monthlyHourlySetup.totalHours) || 0;
        updateData.amount = Number(monthlyHourlySetup.totalPayment) || 0;
        break;
      case PaymentType.DAILY:
        updateData.totalClassPerDay = Number(dailySetup.totalClass) || 0;
        updateData.amount = Number(dailySetup.totalPayment) || 0;
        break;
      case PaymentType.MONTHLY:
        updateData.amount = Number(monthlySetup.amount) || 0;
        updateData.hasTotalClass = monthlySetup.hasTotalClass;
        break;
      case PaymentType.PER_CLASS_HOURLY:
        updateData.ratePerHour = Number(perClassHourlySetup.amount) || 0;
        updateData.amount = Number(perClassHourlySetup.amount) || 0;
        break;
      case PaymentType.PER_CLASS:
        updateData.amount = 0; // Default or allow input
        break;
    }

    try {
      await dispatch(updateAssignment({ id: assignment._id, assignmentData: updateData })).unwrap();
      toast.success('Assignment updated successfully');
      // Refetch page data
      dispatch(fetchAssignments({ page: 1, limit: 10 }));
      onClose();
    } catch (error: any) {
      toast.error(error || 'Failed to update assignment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={modalStyles.overlay}>
      <div style={modalStyles.modal}>
        <div style={modalStyles.header}>
          <h3 style={modalStyles.title}>Edit Assignment - {assignment.teacher.fullName}</h3>
          <button style={modalStyles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        {/* Classes, Batches, Subjects */}
        <div style={modalStyles.row}>
          <div style={{...modalStyles.inputGroup, ...modalStyles.half}}>
            <label style={modalStyles.label}>Course / Subject</label>
            <select style={modalStyles.input} value={subjectId} onChange={e => setSubjectId(e.target.value)}>
              <option value="">Select Subject</option>
              {subjects.map(s => <option key={s._id} value={s._id}>{s.subjectName}</option>)}
            </select>
          </div>
        </div>

        <div style={modalStyles.row}>
          <div style={{...modalStyles.inputGroup, ...modalStyles.half}}>
            <label style={modalStyles.label}>Class</label>
            <select style={modalStyles.input} value={classId} onChange={handleClassChange}>
              <option value="">Select Class</option>
              {classes.map(c => <option key={c._id} value={c._id}>{c.classname}</option>)}
            </select>
          </div>
          <div style={{...modalStyles.inputGroup, ...modalStyles.half}}>
            <label style={modalStyles.label}>Batch</label>
            <select style={modalStyles.input} value={batchId} onChange={e => setBatchId(e.target.value)} disabled={!classId}>
              <option value="">Select Batch</option>
              {availableBatches.map(b => <option key={b._id} value={b._id}>{b.batchName}</option>)}
            </select>
          </div>
        </div>

        {/* Payment Type */}
        <div style={modalStyles.inputGroup}>
          <label style={modalStyles.label}>Payment Type</label>
          <select style={modalStyles.input} value={paymentType} onChange={e => setPaymentType(e.target.value as PaymentType)}>
            {Object.values(PaymentType).map(pt => (
              <option key={pt} value={pt}>{pt.replace('_', ' ').toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* Dynamic Configs */}
        {paymentType === PaymentType.MONTHLY_HOURLY && (
          <div style={modalStyles.setupBox}>
            <h4 style={modalStyles.setupTitle}>Monthly Hourly Setup</h4>
            <div style={modalStyles.row}>
               <div style={{...modalStyles.inputGroup, ...modalStyles.half}}>
                 <label style={modalStyles.label}>Total Hours Per Month</label>
                 <input type="number" style={modalStyles.input} value={monthlyHourlySetup.totalHours} onChange={e => setMonthlyHourlySetup({...monthlyHourlySetup, totalHours: e.target.value})} />
               </div>
               <div style={{...modalStyles.inputGroup, ...modalStyles.half}}>
                 <label style={modalStyles.label}>Total Payment</label>
                 <input type="number" style={modalStyles.input} value={monthlyHourlySetup.totalPayment} onChange={e => setMonthlyHourlySetup({...monthlyHourlySetup, totalPayment: e.target.value})} />
               </div>
            </div>
          </div>
        )}

        {paymentType === PaymentType.DAILY && (
          <div style={modalStyles.setupBox}>
            <h4 style={modalStyles.setupTitle}>Daily Setup</h4>
            <div style={modalStyles.row}>
               <div style={{...modalStyles.inputGroup, ...modalStyles.half}}>
                 <label style={modalStyles.label}>Total Class Per Day</label>
                 <input type="number" style={modalStyles.input} value={dailySetup.totalClass} onChange={e => setDailySetup({...dailySetup, totalClass: e.target.value})} />
               </div>
               <div style={{...modalStyles.inputGroup, ...modalStyles.half}}>
                 <label style={modalStyles.label}>Total Payment</label>
                 <input type="number" style={modalStyles.input} value={dailySetup.totalPayment} onChange={e => setDailySetup({...dailySetup, totalPayment: e.target.value})} />
               </div>
            </div>
          </div>
        )}

        {paymentType === PaymentType.MONTHLY && (
          <div style={modalStyles.setupBox}>
            <h4 style={modalStyles.setupTitle}>Monthly Salary Setup</h4>
            <div style={modalStyles.inputGroup}>
              <label style={modalStyles.label}>Amount</label>
              <input type="number" style={modalStyles.input} value={monthlySetup.amount} onChange={e => setMonthlySetup({...monthlySetup, amount: e.target.value})} />
            </div>
            <label style={{...modalStyles.label, display: 'flex', alignItems: 'center', gap: '8px'}}>
              <input type="checkbox" checked={monthlySetup.hasTotalClass} onChange={e => setMonthlySetup({...monthlySetup, hasTotalClass: e.target.checked})} />
              Has Total Class Config?
            </label>
          </div>
        )}

        {paymentType === PaymentType.PER_CLASS_HOURLY && (
          <div style={modalStyles.setupBox}>
            <h4 style={modalStyles.setupTitle}>Per Class Hourly</h4>
            <div style={modalStyles.row}>
               <div style={{...modalStyles.inputGroup, ...modalStyles.half}}>
                 <label style={modalStyles.label}>Minutes (E.g. 60)</label>
                 <input type="number" style={modalStyles.input} value={perClassHourlySetup.minutes} onChange={e => setPerClassHourlySetup({...perClassHourlySetup, minutes: e.target.value})} />
               </div>
               <div style={{...modalStyles.inputGroup, ...modalStyles.half}}>
                 <label style={modalStyles.label}>Amount / Rate</label>
                 <input type="number" style={modalStyles.input} value={perClassHourlySetup.amount} onChange={e => setPerClassHourlySetup({...perClassHourlySetup, amount: e.target.value})} />
               </div>
            </div>
          </div>
        )}

        <div style={modalStyles.footer}>
          <button style={modalStyles.cancelBtn} onClick={onClose}>Cancel</button>
          <button style={modalStyles.saveBtn} onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAssignmentModal;
