"use client";

import { useState, useEffect } from 'react';
import {
  AdmissionType,
  Gender,
  Religion,
  StudentStatus,
  UpdateStudentDto,
  StudentItem,
} from '@/api/studentApi/types/student.types';
import styles from './CreateStudentModal.module.css';

interface ClassForDropdown {
  _id: string;
  classname: string;
}

interface BatchForDropdown {
  _id: string;
  batchName: string;
  batchId: number | string;
  sessionYear: string;
  className?: { classname: string };
}

interface EditStudentModalProps {
  student: StudentItem;
  onClose: () => void;
  onUpdate: (id: string, studentData: UpdateStudentDto) => Promise<void>;
  loading?: boolean;
  classes?: ClassForDropdown[];
  fetchBatchesByClass?: (classId: string) => Promise<BatchForDropdown[]>;
}

function toDateInput(dateStr: string) {
  if (!dateStr) return '';
  return dateStr.split('T')[0];
}

export default function EditStudentModal({
  student,
  onClose,
  onUpdate,
  loading = false,
  classes = [],
  fetchBatchesByClass,
}: EditStudentModalProps) {
  const [formData, setFormData] = useState<UpdateStudentDto>({
    registrationId: student.registrationId,
    class: student.class?._id || '',
    batch: student.batch?._id || '',
    nameEnglish: student.nameEnglish,
    subunitCategory: student.subunitCategory || '',
    dateOfBirth: toDateInput(student.dateOfBirth),
    gender: student.gender,
    religion: student.religion,
    studentMobileNumber: student.studentMobileNumber || '',
    presentAddress: student.presentAddress,
    permanentAddress: student.permanentAddress || '',
    fatherName: student.fatherName,
    fatherMobileNumber: student.fatherMobileNumber,
    motherName: student.motherName || '',
    motherMobileNumber: student.motherMobileNumber || '',
    admissionType: student.admissionType,
    admissionFee: student.admissionFee,
    monthlyTuitionFee: student.monthlyTuitionFee || 0,
    courseFee: student.courseFee || 0,
    totalAmount: student.totalAmount,
    referredBy: student.referredBy || '',
    status: student.status,
    isActive: student.isActive,
    remarks: student.remarks || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedClass, setSelectedClass] = useState<string>(student.class?._id || '');
  const [availableBatches, setAvailableBatches] = useState<BatchForDropdown[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Load batches for the student's current class on mount
  useEffect(() => {
    const loadBatches = async () => {
      if (!selectedClass || !fetchBatchesByClass) {
        setAvailableBatches([]);
        return;
      }
      setLoadingBatches(true);
      try {
        const batches = await fetchBatchesByClass(selectedClass);
        setAvailableBatches(batches);
      } catch {
        setAvailableBatches([]);
      } finally {
        setLoadingBatches(false);
      }
    };
    loadBatches();
  }, [selectedClass, fetchBatchesByClass]);

  // Auto-calculate total amount
  useEffect(() => {
    if (formData.admissionType === AdmissionType.MONTHLY) {
      setFormData(prev => ({
        ...prev,
        totalAmount: (prev.admissionFee || 0) + (prev.monthlyTuitionFee || 0),
      }));
    } else if (formData.admissionType === AdmissionType.COURSE) {
      setFormData(prev => ({
        ...prev,
        totalAmount: (prev.admissionFee || 0) + (prev.courseFee || 0),
      }));
    }
  }, [formData.admissionFee, formData.monthlyTuitionFee, formData.courseFee, formData.admissionType]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const classId = e.target.value;
    setSelectedClass(classId);
    setFormData(prev => ({ ...prev, class: classId, batch: '' }));
  };

  const handleBatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, batch: e.target.value }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.class?.trim()) newErrors.class = 'Class is required';
    if (!formData.nameEnglish?.trim()) newErrors.nameEnglish = 'Student name is required';
    if (!formData.fatherName?.trim()) newErrors.fatherName = "Father's name is required";
    if (!formData.fatherMobileNumber?.trim()) {
      newErrors.fatherMobileNumber = "Father's mobile number is required";
    } else if (!/^01[3-9]\d{8}$/.test(formData.fatherMobileNumber)) {
      newErrors.fatherMobileNumber = 'Please enter a valid Bangladeshi mobile number';
    }
    if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
    if (!formData.presentAddress?.trim()) newErrors.presentAddress = 'Present address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await onUpdate(student._id, formData);
    } catch (error) {
      console.error('Failed to update student:', error);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.modalLarge}`} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Edit Student</h2>
          <button onClick={onClose} className={styles.modalClose} type="button" disabled={loading}>
            ✕
          </button>
        </div>

        {loading && (
          <div className={styles.modalLoading}>
            <div className={styles.spinnerLarge}></div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div className={styles.modalBody}>
            {/* Registration & Class/Batch */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Registration & Academic Details</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label}>Registration ID</label>
                  <input
                    type="text"
                    value={formData.registrationId || ''}
                    className={styles.input}
                    readOnly
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>
                    Select Class <span className={styles.required}>*</span>
                  </label>
                  <select
                    value={selectedClass}
                    onChange={handleClassChange}
                    className={`${styles.input} ${errors.class ? styles.inputError : ''}`}
                    disabled={loading || !classes.length}
                  >
                    <option value="">Select the class</option>
                    {classes.map(cls => (
                      <option key={cls._id} value={cls._id}>{cls.classname}</option>
                    ))}
                  </select>
                  {errors.class && <span className={styles.errorMessage}>{errors.class}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Select Batch</label>
                  <select
                    value={formData.batch || ''}
                    onChange={handleBatchChange}
                    className={styles.input}
                    disabled={loading || !selectedClass || loadingBatches}
                  >
                    <option value="">
                      {!selectedClass ? 'Select class first' : loadingBatches ? 'Loading...' : availableBatches.length === 0 ? 'No batches available' : 'Select the batch'}
                    </option>
                    {availableBatches.map(batch => (
                      <option key={batch._id} value={batch._id}>
                        {batch.batchName} - {batch.className?.classname || ''} - {batch.sessionYear}
                      </option>
                    ))}
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Status</label>
                  <select
                    name="status"
                    value={formData.status || ''}
                    onChange={handleChange}
                    className={styles.input}
                    disabled={loading}
                  >
                    <option value={StudentStatus.ACTIVE}>Active</option>
                    <option value={StudentStatus.INACTIVE}>Inactive</option>
                    <option value={StudentStatus.GRADUATED}>Graduated</option>
                    <option value={StudentStatus.DROPPED}>Dropped</option>
                    <option value={StudentStatus.SUSPENDED}>Suspended</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Student Information */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Student Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label}>
                    Name (English) <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    name="nameEnglish"
                    value={formData.nameEnglish || ''}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.nameEnglish ? styles.inputError : ''}`}
                    placeholder="Enter full name in English"
                    disabled={loading}
                  />
                  {errors.nameEnglish && <span className={styles.errorMessage}>{errors.nameEnglish}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Name (Bangla)</label>
                  <input
                    type="text"
                    name="subunitCategory"
                    value={formData.subunitCategory || ''}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="বাংলায় নাম লিখুন"
                    disabled={loading}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>
                    Date of Birth <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={formData.dateOfBirth || ''}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.dateOfBirth ? styles.inputError : ''}`}
                    disabled={loading}
                  />
                  {errors.dateOfBirth && <span className={styles.errorMessage}>{errors.dateOfBirth}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Gender</label>
                  <select
                    name="gender"
                    value={formData.gender || ''}
                    onChange={handleChange}
                    className={styles.input}
                    disabled={loading}
                  >
                    <option value={Gender.MALE}>Male</option>
                    <option value={Gender.FEMALE}>Female</option>
                    <option value={Gender.OTHER}>Other</option>
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Religion</label>
                  <select
                    name="religion"
                    value={formData.religion || ''}
                    onChange={handleChange}
                    className={styles.input}
                    disabled={loading}
                  >
                    <option value={Religion.ISLAM}>Islam</option>
                    <option value={Religion.HINDUISM}>Hinduism</option>
                    <option value={Religion.CHRISTIANITY}>Christianity</option>
                    <option value={Religion.BUDDHISM}>Buddhism</option>
                    <option value={Religion.OTHER}>Other</option>
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Student Mobile</label>
                  <input
                    type="tel"
                    name="studentMobileNumber"
                    value={formData.studentMobileNumber || ''}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="01XXXXXXXXX"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Address */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Address Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formFieldFull}>
                  <label className={styles.label}>
                    Present Address <span className={styles.required}>*</span>
                  </label>
                  <textarea
                    name="presentAddress"
                    value={formData.presentAddress || ''}
                    onChange={handleChange}
                    className={`${styles.textarea} ${errors.presentAddress ? styles.inputError : ''}`}
                    rows={3}
                    disabled={loading}
                  />
                  {errors.presentAddress && <span className={styles.errorMessage}>{errors.presentAddress}</span>}
                </div>

                <div className={styles.formFieldFull}>
                  <label className={styles.label}>Permanent Address</label>
                  <textarea
                    name="permanentAddress"
                    value={formData.permanentAddress || ''}
                    onChange={handleChange}
                    className={styles.textarea}
                    rows={3}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Guardian */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Guardian Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label}>
                    Father's Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    name="fatherName"
                    value={formData.fatherName || ''}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.fatherName ? styles.inputError : ''}`}
                    disabled={loading}
                  />
                  {errors.fatherName && <span className={styles.errorMessage}>{errors.fatherName}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>
                    Father's Mobile <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="tel"
                    name="fatherMobileNumber"
                    value={formData.fatherMobileNumber || ''}
                    onChange={handleChange}
                    className={`${styles.input} ${errors.fatherMobileNumber ? styles.inputError : ''}`}
                    placeholder="01XXXXXXXXX"
                    disabled={loading}
                  />
                  {errors.fatherMobileNumber && <span className={styles.errorMessage}>{errors.fatherMobileNumber}</span>}
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Mother's Name</label>
                  <input
                    type="text"
                    name="motherName"
                    value={formData.motherName || ''}
                    onChange={handleChange}
                    className={styles.input}
                    disabled={loading}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Mother's Mobile</label>
                  <input
                    type="tel"
                    name="motherMobileNumber"
                    value={formData.motherMobileNumber || ''}
                    onChange={handleChange}
                    className={styles.input}
                    placeholder="01XXXXXXXXX"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Payment Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formField}>
                  <label className={styles.label}>Admission Type</label>
                  <select
                    name="admissionType"
                    value={formData.admissionType || ''}
                    onChange={handleChange}
                    className={styles.input}
                    disabled={loading}
                  >
                    <option value={AdmissionType.MONTHLY}>Monthly</option>
                    <option value={AdmissionType.COURSE}>Course</option>
                  </select>
                </div>

                {formData.admissionType === AdmissionType.MONTHLY && (
                  <div className={styles.formField}>
                    <label className={styles.label}>Monthly Tuition Fee</label>
                    <input
                      type="number"
                      name="monthlyTuitionFee"
                      value={formData.monthlyTuitionFee || ''}
                      onChange={handleChange}
                      className={styles.input}
                      min="0"
                      step="100"
                      disabled={loading}
                    />
                  </div>
                )}

                {formData.admissionType === AdmissionType.COURSE && (
                  <div className={styles.formField}>
                    <label className={styles.label}>Course Fee</label>
                    <input
                      type="number"
                      name="courseFee"
                      value={formData.courseFee || ''}
                      onChange={handleChange}
                      className={styles.input}
                      min="0"
                      step="100"
                      disabled={loading}
                    />
                  </div>
                )}

                <div className={styles.formField}>
                  <label className={styles.label}>Admission Fee</label>
                  <input
                    type="number"
                    name="admissionFee"
                    value={formData.admissionFee ?? ''}
                    onChange={handleChange}
                    className={styles.input}
                    min="0"
                    step="100"
                    disabled={loading}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Total Amount</label>
                  <input
                    type="number"
                    value={formData.totalAmount ?? ''}
                    className={styles.input}
                    readOnly
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.label}>Referred By</label>
                  <input
                    type="text"
                    name="referredBy"
                    value={formData.referredBy || ''}
                    onChange={handleChange}
                    className={styles.input}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Additional Information</h3>
              <div className={styles.formGrid}>
                <div className={styles.formFieldFull}>
                  <label className={styles.label}>Remarks</label>
                  <textarea
                    name="remarks"
                    value={formData.remarks || ''}
                    onChange={handleChange}
                    className={styles.textarea}
                    rows={2}
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnSecondary} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? (
                <>
                  <span className={styles.spinnerSmall}></span>
                  Updating...
                </>
              ) : (
                'Update Student'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
