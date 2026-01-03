"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AdmissionItem,
  CreateAdmissionDto,
  UpdateAdmissionDto,
  AdmissionStatus,
  AdmissionType,
  Gender,
  Religion,
  BatchSubject,
  AdmissionBatch,
  BatchForDropdown,
  ClassForDropdown,
  GroupForDropdown,
  SubjectForDropdown,
} from '@/api/admissionApi/types/admission.types';
import styles from './AdmissionPage.module.css';

interface AdmissionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: AdmissionItem | null;
  loading: boolean;
  isEditing: boolean;
  batches: BatchForDropdown[];
  classes: ClassForDropdown[];
  groups: GroupForDropdown[];
  subjects: SubjectForDropdown[];
  dropdownsLoaded: boolean;
  fetchBatchesByClass: (classId: string) => Promise<any[]>;
}

export default function AdmissionFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading,
  isEditing,
  batches,
  classes,
  groups,
  subjects,
  dropdownsLoaded,
  fetchBatchesByClass,
}: AdmissionFormModalProps) {
  // Form state
  const [formData, setFormData] = useState({
    registrationId: '',
    name: '',
    nameNative: '',
    studentGender: Gender.MALE,
    studentDateOfBirth: '',
    presentAddress: '',
    permanentAddress: '',
    religion: Religion.ISLAM,
    whatsappMobile: '',
    studentMobileNumber: '',
    instituteName: '',
    fathersName: '',
    mothersName: '',
    guardianMobileNumber: '',
    motherMobileNumber: '',
    admissionType: AdmissionType.MONTHLY,
    courseFee: 0,
    admissionFee: 0,
    tuitionFee: 0,
    referBy: '',
    admissionDate: new Date().toISOString().split('T')[0],
    remarks: '',
    photo: null as File | null,
    batches: [] as AdmissionBatch[],
  });

  // Batch selection state
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectForDropdown[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<SubjectForDropdown[]>([]);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Initialize form with initial data
  useEffect(() => {
    if (initialData) {
      setFormData({
        registrationId: initialData.registrationId,
        name: initialData.name,
        nameNative: initialData.nameNative || '',
        studentGender: initialData.studentGender,
        studentDateOfBirth: initialData.studentDateOfBirth?.split('T')[0] || '',
        presentAddress: initialData.presentAddress || '',
        permanentAddress: initialData.permanentAddress || '',
        religion: initialData.religion,
        whatsappMobile: initialData.whatsappMobile || '',
        studentMobileNumber: initialData.studentMobileNumber || '',
        instituteName: initialData.instituteName,
        fathersName: initialData.fathersName || '',
        mothersName: initialData.mothersName || '',
        guardianMobileNumber: initialData.guardianMobileNumber,
        motherMobileNumber: initialData.motherMobileNumber || '',
        admissionType: initialData.admissionType,
        courseFee: initialData.courseFee || 0,
        admissionFee: initialData.admissionFee || 0,
        tuitionFee: initialData.tuitionFee || 0,
        referBy: initialData.referBy || '',
        admissionDate: initialData.admissionDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        remarks: initialData.remarks || '',
        photo: null,
        batches: initialData.batches || [],
      });
      
      // If there are batches, set selected subjects
      if (initialData.batches && initialData.batches.length > 0) {
        const allSubjects: SubjectForDropdown[] = [];
        initialData.batches.forEach(batch => {
          batch.subjects.forEach(subject => {
            allSubjects.push({
              _id: subject.subjectId.toString(),
              subjectName: subject.subjectName,
            });
          });
        });
        setSelectedSubjects(allSubjects);
      }
    } else {
      // Reset form for new admission
      const timestamp = Date.now();
      const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      const generatedId = `REG${timestamp.toString().slice(-6)}${randomNum}`;
      
      setFormData({
        registrationId: generatedId,
        name: '',
        nameNative: '',
        studentGender: Gender.MALE,
        studentDateOfBirth: '',
        presentAddress: '',
        permanentAddress: '',
        religion: Religion.ISLAM,
        whatsappMobile: '',
        studentMobileNumber: '',
        instituteName: '',
        fathersName: '',
        mothersName: '',
        guardianMobileNumber: '',
        motherMobileNumber: '',
        admissionType: AdmissionType.MONTHLY,
        courseFee: 0,
        admissionFee: 0,
        tuitionFee: 0,
        referBy: '',
        admissionDate: new Date().toISOString().split('T')[0],
        remarks: '',
        photo: null,
        batches: [],
      });
      setSelectedClass('');
      setSelectedBatch('');
      setSelectedSubjects([]);
      setAvailableSubjects([]);
      setAvailableBatches([]);
    }
    
    setErrors({});
    setTouched({});
  }, [initialData, isOpen]);

  // Fetch batches when class is selected
  useEffect(() => {
    const fetchBatchesForClass = async () => {
      if (!selectedClass) {
        setAvailableBatches([]);
        setSelectedBatch('');
        setSelectedSubjects([]);
        setAvailableSubjects([]);
        return;
      }

      setLoadingBatches(true);
      try {
        console.log('Fetching batches for class:', selectedClass);
        const classBatches = await fetchBatchesByClass(selectedClass);
        console.log('Fetched batches:', classBatches);
        setAvailableBatches(classBatches);
        
        // If editing and there's already a batch selected, try to find it in the new list
        if (initialData?.batches && initialData.batches.length > 0 && classBatches.length > 0) {
          const existingBatch = initialData.batches[0];
          const foundBatch = classBatches.find(b => b._id === existingBatch.batch);
          if (foundBatch) {
            setSelectedBatch(foundBatch._id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch batches:', error);
        setAvailableBatches([]);
      } finally {
        setLoadingBatches(false);
      }
    };

    fetchBatchesForClass();
  }, [selectedClass, fetchBatchesByClass]);

  // Update available subjects when batch is selected
  useEffect(() => {
    if (selectedBatch) {
      const selectedBatchData = availableBatches.find(b => b._id === selectedBatch);
      console.log('Selected batch data:', selectedBatchData);
      
      if (selectedBatchData) {
        // Get subject from the selected batch
        const batchSubjects = selectedBatchData.subject ? [selectedBatchData.subject] : [];
        console.log('Batch subjects:', batchSubjects);
        
        const formattedSubjects: SubjectForDropdown[] = batchSubjects.map((subject: any) => ({
          _id: subject._id,
          subjectName: subject.subjectName,
        }));
        
        console.log('Formatted subjects:', formattedSubjects);
        setAvailableSubjects(formattedSubjects);
        
        // If editing and there are existing subjects, preselect them
        if (initialData?.batches && initialData.batches.length > 0) {
          const existingSubjects = initialData.batches.flatMap(batch => 
            batch.subjects.map(subject => subject.subjectId.toString())
          );
          const preselectedSubjects = formattedSubjects.filter(subject => 
            existingSubjects.includes(subject._id)
          );
          setSelectedSubjects(preselectedSubjects);
        } else {
          setSelectedSubjects([]);
        }
      }
    } else {
      setAvailableSubjects([]);
      setSelectedSubjects([]);
    }
  }, [selectedBatch, availableBatches, initialData]);

  // Handle input changes
  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (touched[field] && errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle blur events for validation
  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, formData[field as keyof typeof formData]);
  };

  // Field validation
  const validateField = (field: string, value: any) => {
    let error = '';
    
    switch (field) {
      case 'name':
        if (!value.trim()) error = 'Student name is required';
        else if (value.trim().length < 2) error = 'Name must be at least 2 characters';
        break;
      
      case 'instituteName':
        if (!value.trim()) error = 'Institute name is required';
        break;
      
      case 'guardianMobileNumber':
        if (!value.trim()) error = 'Guardian mobile number is required';
        else if (!/^[0-9]{11}$/.test(value)) error = 'Enter a valid 11-digit mobile number';
        break;
      
      case 'studentMobileNumber':
        if (value && !/^[0-9]{11}$/.test(value)) error = 'Enter a valid 11-digit mobile number';
        break;
      
      case 'whatsappMobile':
        if (value && !/^[0-9]{11}$/.test(value)) error = 'Enter a valid 11-digit mobile number';
        break;
      
      case 'motherMobileNumber':
        if (value && !/^[0-9]{11}$/.test(value)) error = 'Enter a valid 11-digit mobile number';
        break;
      
      case 'admissionDate':
        if (!value) error = 'Admission date is required';
        else if (new Date(value) > new Date()) error = 'Admission date cannot be in the future';
        break;
      
      case 'studentDateOfBirth':
        if (value && new Date(value) > new Date()) error = 'Date of birth cannot be in the future';
        break;
      
      case 'courseFee':
      case 'admissionFee':
      case 'tuitionFee':
        if (value < 0) error = 'Fee cannot be negative';
        break;
    }
    
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    } else if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    return !error;
  };

  // Validate all fields
  const validateForm = () => {
    const requiredFields = ['name', 'instituteName', 'guardianMobileNumber', 'admissionDate'];
    const newErrors: Record<string, string> = {};
    
    requiredFields.forEach(field => {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });
    
    // Validate mobile numbers
    if (formData.guardianMobileNumber && !/^[0-9]{11}$/.test(formData.guardianMobileNumber)) {
      newErrors.guardianMobileNumber = 'Enter a valid 11-digit mobile number';
    }
    
    if (formData.studentMobileNumber && !/^[0-9]{11}$/.test(formData.studentMobileNumber)) {
      newErrors.studentMobileNumber = 'Enter a valid 11-digit mobile number';
    }
    
    if (formData.whatsappMobile && !/^[0-9]{11}$/.test(formData.whatsappMobile)) {
      newErrors.whatsappMobile = 'Enter a valid 11-digit mobile number';
    }
    
    if (formData.motherMobileNumber && !/^[0-9]{11}$/.test(formData.motherMobileNumber)) {
      newErrors.motherMobileNumber = 'Enter a valid 11-digit mobile number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle class selection
  const handleClassSelect = (classId: string) => {
    console.log('Class selected:', classId);
    setSelectedClass(classId);
    setSelectedBatch('');
    setSelectedSubjects([]);
    setAvailableBatches([]);
    setAvailableSubjects([]);
  };

  // Handle batch selection
  const handleBatchSelect = (batchId: string) => {
    console.log('Batch selected:', batchId);
    setSelectedBatch(batchId);
    
    if (!batchId) {
      setSelectedSubjects([]);
      return;
    }
    
    const selectedBatchData = availableBatches.find(b => b._id === batchId);
    console.log('Selected batch data for subjects:', selectedBatchData);
    
    if (selectedBatchData) {
      // Create batch object for form data
      const newBatch: AdmissionBatch = {
        batch: selectedBatchData._id,
        batchName: selectedBatchData.batchName,
        batchId: selectedBatchData.batchId,
        subjects: selectedSubjects.map(subject => ({
          subjectName: subject.subjectName,
          subjectId: subject._id,
        })),
        admissionFee: selectedBatchData.admissionFee || 0,
        tuitionFee: selectedBatchData.tuitionFee || 0,
        courseFee: selectedBatchData.courseFee || 0,
      };
      
      console.log('New batch object:', newBatch);
      
      // Update form data with batch
      setFormData(prev => ({
        ...prev,
        admissionFee: selectedBatchData.admissionFee || prev.admissionFee,
        tuitionFee: selectedBatchData.tuitionFee || prev.tuitionFee,
        courseFee: selectedBatchData.courseFee || prev.courseFee,
        batches: [...prev.batches.filter(b => b.batch !== batchId), newBatch],
      }));
    }
  };

  // Handle subject selection
  const handleSubjectToggle = (subject: SubjectForDropdown) => {
    const isSelected = selectedSubjects.some(s => s._id === subject._id);
    let newSelectedSubjects: SubjectForDropdown[];
    
    if (isSelected) {
      newSelectedSubjects = selectedSubjects.filter(s => s._id !== subject._id);
    } else {
      newSelectedSubjects = [...selectedSubjects, subject];
    }
    
    console.log('Selected subjects updated:', newSelectedSubjects);
    setSelectedSubjects(newSelectedSubjects);
    
    // Update the selected batch with new subjects
    if (selectedBatch) {
      const selectedBatchData = availableBatches.find(b => b._id === selectedBatch);
      if (selectedBatchData) {
        const updatedBatches = formData.batches.map(batch => {
          if (batch.batch === selectedBatch) {
            return {
              ...batch,
              subjects: newSelectedSubjects.map(subject => ({
                subjectName: subject.subjectName,
                subjectId: subject._id,
              })),
            };
          }
          return batch;
        });
        
        console.log('Updated batches:', updatedBatches);
        
        setFormData(prev => ({
          ...prev,
          batches: updatedBatches,
        }));
      }
    }
  };

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setErrors(prev => ({ ...prev, photo: 'File size must be less than 5MB' }));
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, photo: 'File must be an image' }));
        return;
      }
      
      handleChange('photo', file);
      setErrors(prev => ({ ...prev, photo: '' }));
    }
  };

  // Remove batch from selection
  const handleRemoveBatch = (batchId: string) => {
    setFormData(prev => ({
      ...prev,
      batches: prev.batches.filter(b => b.batch !== batchId),
    }));
    
    // If removing the currently selected batch, reset selection
    if (selectedBatch === batchId) {
      setSelectedBatch('');
      setSelectedSubjects([]);
    }
  };

  // Calculate total fee
  const totalFee = useMemo(() => {
    const batchFees = formData.batches.reduce((sum, batch) => {
      return sum + (batch.admissionFee + batch.tuitionFee + batch.courseFee);
    }, 0);
    
    return batchFees || (formData.admissionFee + formData.tuitionFee + formData.courseFee);
  }, [formData.batches, formData.admissionFee, formData.tuitionFee, formData.courseFee]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allFields = Object.keys(formData);
    const allTouched = allFields.reduce((acc, field) => {
      acc[field] = true;
      return acc;
    }, {} as Record<string, boolean>);
    setTouched(allTouched);
    
    if (!validateForm()) {
      return;
    }
    
    // Prepare submission data
    const submissionData: any = {
      ...formData,
      totalFee,
      dueAmount: totalFee - (initialData?.paidAmount || 0),
    };
    
    // Remove empty optional fields
    Object.keys(submissionData).forEach(key => {
      if (submissionData[key] === '' || submissionData[key] === null || submissionData[key] === undefined) {
        delete submissionData[key];
      }
    });
    
    onSubmit(submissionData);
  };

  // Handle modal close
  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  // Prevent closing when clicking inside modal
  const handleModalClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!isOpen) return null;

console.log('Raw classes data:', classes);
console.log('Classes array length:', classes?.length);
console.log('First class item:', classes?.[0]);

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalExtraLarge} onClick={handleModalClick}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleWrapper}>
            <h2 className={styles.modalTitle}>
              {isEditing ? 'Edit Admission' : 'Create New Admission'}
            </h2>
            <p className={styles.modalSubtitle}>
              {isEditing ? 'Update admission details' : 'Fill in the admission form to register a new student'}
            </p>
          </div>
          <button 
            onClick={handleClose} 
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
            <p>Saving admission...</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.modalBody}>
            {/* Form Sections Container with Scroll */}
            <div className={styles.formSectionsContainer}>
              
              {/* Section 1: Basic Information */}
              <div className={styles.formSectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}>👤</div>
                  <h3 className={styles.sectionTitle}>Student Information</h3>
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Registration ID
                      <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.registrationId}
                      onChange={(e) => handleChange('registrationId', e.target.value)}
                      onBlur={() => handleBlur('registrationId')}
                      className={`${styles.input} ${errors.registrationId ? styles.inputError : ''}`}
                      disabled={loading || isEditing}
                      required
                    />
                    {errors.registrationId && (
                      <div className={styles.errorMessage}>{errors.registrationId}</div>
                    )}
                  </div>
                  
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Student Name
                      <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      onBlur={() => handleBlur('name')}
                      className={`${styles.input} ${errors.name ? styles.inputError : ''}`}
                      disabled={loading}
                      required
                    />
                    {errors.name && (
                      <div className={styles.errorMessage}>{errors.name}</div>
                    )}
                  </div>
                  
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Name (Native)
                    </label>
                    <input
                      type="text"
                      value={formData.nameNative}
                      onChange={(e) => handleChange('nameNative', e.target.value)}
                      onBlur={() => handleBlur('nameNative')}
                      className={styles.input}
                      disabled={loading}
                    />
                  </div>
                  
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Gender
                      <span className={styles.required}>*</span>
                    </label>
                    <select
                      value={formData.studentGender}
                      onChange={(e) => handleChange('studentGender', e.target.value)}
                      className={styles.select}
                      disabled={loading}
                    >
                      {Object.values(Gender).map(gender => (
                        <option key={gender} value={gender}>
                          {gender.charAt(0).toUpperCase() + gender.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      value={formData.studentDateOfBirth}
                      onChange={(e) => handleChange('studentDateOfBirth', e.target.value)}
                      onBlur={() => handleBlur('studentDateOfBirth')}
                      className={`${styles.input} ${errors.studentDateOfBirth ? styles.inputError : ''}`}
                      disabled={loading}
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {errors.studentDateOfBirth && (
                      <div className={styles.errorMessage}>{errors.studentDateOfBirth}</div>
                    )}
                  </div>
                  
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Religion
                      <span className={styles.required}>*</span>
                    </label>
                    <select
                      value={formData.religion}
                      onChange={(e) => handleChange('religion', e.target.value)}
                      className={styles.select}
                      disabled={loading}
                    >
                      {Object.values(Religion).map(religion => (
                        <option key={religion} value={religion}>
                          {religion.charAt(0).toUpperCase() + religion.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Section 2: Contact Information */}
              <div className={styles.formSectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}>📞</div>
                  <h3 className={styles.sectionTitle}>Contact Information</h3>
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Guardian Mobile Number
                      <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.guardianMobileNumber}
                      onChange={(e) => handleChange('guardianMobileNumber', e.target.value)}
                      onBlur={() => handleBlur('guardianMobileNumber')}
                      className={`${styles.input} ${errors.guardianMobileNumber ? styles.inputError : ''}`}
                      disabled={loading}
                      required
                      pattern="[0-9]{11}"
                      placeholder="01XXXXXXXXX"
                    />
                    {errors.guardianMobileNumber && (
                      <div className={styles.errorMessage}>{errors.guardianMobileNumber}</div>
                    )}
                  </div>
                  
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Student Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={formData.studentMobileNumber}
                      onChange={(e) => handleChange('studentMobileNumber', e.target.value)}
                      onBlur={() => handleBlur('studentMobileNumber')}
                      className={`${styles.input} ${errors.studentMobileNumber ? styles.inputError : ''}`}
                      disabled={loading}
                      pattern="[0-9]{11}"
                      placeholder="01XXXXXXXXX"
                    />
                    {errors.studentMobileNumber && (
                      <div className={styles.errorMessage}>{errors.studentMobileNumber}</div>
                    )}
                  </div>
                  
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      WhatsApp Number
                    </label>
                    <input
                      type="tel"
                      value={formData.whatsappMobile}
                      onChange={(e) => handleChange('whatsappMobile', e.target.value)}
                      onBlur={() => handleBlur('whatsappMobile')}
                      className={`${styles.input} ${errors.whatsappMobile ? styles.inputError : ''}`}
                      disabled={loading}
                      pattern="[0-9]{11}"
                      placeholder="01XXXXXXXXX"
                    />
                    {errors.whatsappMobile && (
                      <div className={styles.errorMessage}>{errors.whatsappMobile}</div>
                    )}
                  </div>
                  
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Mother's Mobile Number
                    </label>
                    <input
                      type="tel"
                      value={formData.motherMobileNumber}
                      onChange={(e) => handleChange('motherMobileNumber', e.target.value)}
                      onBlur={() => handleBlur('motherMobileNumber')}
                      className={`${styles.input} ${errors.motherMobileNumber ? styles.inputError : ''}`}
                      disabled={loading}
                      pattern="[0-9]{11}"
                      placeholder="01XXXXXXXXX"
                    />
                    {errors.motherMobileNumber && (
                      <div className={styles.errorMessage}>{errors.motherMobileNumber}</div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Section 3: Address Information */}
              <div className={styles.formSectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}>🏠</div>
                  <h3 className={styles.sectionTitle}>Address Information</h3>
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.formFieldFull}>
                    <label className={styles.label}>
                      Present Address
                    </label>
                    <textarea
                      value={formData.presentAddress}
                      onChange={(e) => handleChange('presentAddress', e.target.value)}
                      onBlur={() => handleBlur('presentAddress')}
                      className={styles.textarea}
                      disabled={loading}
                      rows={3}
                      placeholder="Enter present address..."
                    />
                  </div>
                  
                  <div className={styles.formFieldFull}>
                    <label className={styles.label}>
                      Permanent Address
                    </label>
                    <textarea
                      value={formData.permanentAddress}
                      onChange={(e) => handleChange('permanentAddress', e.target.value)}
                      onBlur={() => handleBlur('permanentAddress')}
                      className={styles.textarea}
                      disabled={loading}
                      rows={3}
                      placeholder="Enter permanent address..."
                    />
                  </div>
                </div>
              </div>
              
              {/* Section 4: Family Information */}
              <div className={styles.formSectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}>👨‍👩‍👧‍👦</div>
                  <h3 className={styles.sectionTitle}>Family Information</h3>
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Father's Name
                    </label>
                    <input
                      type="text"
                      value={formData.fathersName}
                      onChange={(e) => handleChange('fathersName', e.target.value)}
                      onBlur={() => handleBlur('fathersName')}
                      className={styles.input}
                      disabled={loading}
                      placeholder="Enter father's name"
                    />
                  </div>
                  
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Mother's Name
                    </label>
                    <input
                      type="text"
                      value={formData.mothersName}
                      onChange={(e) => handleChange('mothersName', e.target.value)}
                      onBlur={() => handleBlur('mothersName')}
                      className={styles.input}
                      disabled={loading}
                      placeholder="Enter mother's name"
                    />
                  </div>
                </div>
              </div>
              
              {/* Section 5: Academic Information */}
              <div className={styles.formSectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}>🎓</div>
                  <h3 className={styles.sectionTitle}>Academic Information</h3>
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Institute Name
                      <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.instituteName}
                      onChange={(e) => handleChange('instituteName', e.target.value)}
                      onBlur={() => handleBlur('instituteName')}
                      className={`${styles.input} ${errors.instituteName ? styles.inputError : ''}`}
                      disabled={loading}
                      required
                      placeholder="Enter institute name"
                    />
                    {errors.instituteName && (
                      <div className={styles.errorMessage}>{errors.instituteName}</div>
                    )}
                  </div>
                  
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Admission Type
                      <span className={styles.required}>*</span>
                    </label>
                    <select
                      value={formData.admissionType}
                      onChange={(e) => handleChange('admissionType', e.target.value)}
                      className={styles.select}
                      disabled={loading}
                    >
                      {Object.values(AdmissionType).map(type => (
                        <option key={type} value={type}>
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Admission Date
                      <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.admissionDate}
                      onChange={(e) => handleChange('admissionDate', e.target.value)}
                      onBlur={() => handleBlur('admissionDate')}
                      className={`${styles.input} ${errors.admissionDate ? styles.inputError : ''}`}
                      disabled={loading}
                      required
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {errors.admissionDate && (
                      <div className={styles.errorMessage}>{errors.admissionDate}</div>
                    )}
                  </div>
                  
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Referred By
                    </label>
                    <input
                      type="text"
                      value={formData.referBy}
                      onChange={(e) => handleChange('referBy', e.target.value)}
                      onBlur={() => handleBlur('referBy')}
                      className={styles.input}
                      disabled={loading}
                      placeholder="Optional"
                    />
                  </div>
                </div>
              </div>
              
              {/* Section 6: Batch & Subject Selection */}
              <div className={styles.formSectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}>📚</div>
                  <h3 className={styles.sectionTitle}>Batch & Subject Selection</h3>
                </div>
                
                {!dropdownsLoaded ? (
                  <div className={styles.loadingSection}>
                    <div className={styles.spinnerSmall}></div>
                    <p>Loading academic data...</p>
                  </div>
                ) : (
                  <div className={styles.batchSelectionFlow}>
                    {/* Step 1: Class Selection */}
                    <div className={styles.selectionStep}>
                      <div className={styles.stepHeader}>
                        <span className={styles.stepNumber}>1</span>
                        <span className={styles.stepTitle}>Select Class</span>
                      </div>
                     <div className={styles.formField}>
                      <select
                        value={selectedClass}
                        onChange={(e) => {
                          console.log('Selected class ID:', e.target.value);
                          console.log('Selected class name:', 
                            classes?.find(c => c._id === e.target.value)?.classname
                          );
                          handleClassSelect(e.target.value);
                        }}
                        className={styles.select}
                        disabled={loading || !dropdownsLoaded || !classes?.length}
                      >
                        <option value="">Select a class</option>
                        {classes && classes.length > 0 ? (
                          classes.map(cls => {
                            console.log('Mapping class:', cls);
                            return (
                              <option key={cls._id} value={cls._id}>
                                {cls.classname || 'No Name'}
                              </option>
                            );
                          })
                        ) : (
                          <option value="" disabled>
                            {dropdownsLoaded ? 'No classes available' : 'Loading classes...'}
                          </option>
                        )}
                      </select>
                      {dropdownsLoaded && classes && classes.length === 0 && (
                        <div className={styles.errorMessage}>
                          ⚠ No classes found. Please add classes in the academic section first.
                        </div>
                      )}
                    </div>
                    </div>
                    
                    {/* Step 2: Batch Selection */}
                    {selectedClass && (
                      <div className={styles.selectionStep}>
                        <div className={styles.stepHeader}>
                          <span className={styles.stepNumber}>2</span>
                          <span className={styles.stepTitle}>Select Batch</span>
                        </div>
                        {loadingBatches ? (
                          <div className={styles.loadingSectionSmall}>
                            <div className={styles.spinnerSmall}></div>
                            <p>Loading batches...</p>
                          </div>
                        ) : (
                          <div className={styles.formField}>
                            <select
                              value={selectedBatch}
                              onChange={(e) => handleBatchSelect(e.target.value)}
                              className={styles.select}
                              disabled={loading || availableBatches.length === 0}
                            >
                              <option value="">Select a batch</option>
                              {availableBatches.map(batch => (
                                <option key={batch._id} value={batch._id}>
                                  {batch.batchName} - {batch.className?.classname || 'N/A'} - {batch.sessionYear}
                                </option>
                              ))}
                            </select>
                            {availableBatches.length === 0 && (
                              <div className={styles.helpText}>
                                No active batches available for this class
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Step 3: Subject Selection */}
                    {selectedBatch && (
                      <div className={styles.selectionStep}>
                        <div className={styles.stepHeader}>
                          <span className={styles.stepNumber}>3</span>
                          <span className={styles.stepTitle}>Select Subjects</span>
                        </div>
                        <div className={styles.subjectSelection}>
                          {availableSubjects.length === 0 ? (
                            <div className={styles.noSubjects}>
                              No subjects available for this batch
                            </div>
                          ) : (
                            <div className={styles.subjectGrid}>
                              {availableSubjects.map(subject => (
                                <div key={subject._id} className={styles.subjectCheckbox}>
                                  <input
                                    type="checkbox"
                                    id={`subject-${subject._id}`}
                                    checked={selectedSubjects.some(s => s._id === subject._id)}
                                    onChange={() => handleSubjectToggle(subject)}
                                    disabled={loading}
                                  />
                                  <label htmlFor={`subject-${subject._id}`}>
                                    {subject.subjectName}
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Selected Batches Display */}
                    <div className={styles.selectedBatchesSection}>
                      <h4 className={styles.subSectionTitle}>Selected Batches</h4>
                      {formData.batches.length === 0 ? (
                        <div className={styles.noSelection}>
                          <div className={styles.noSelectionIcon}>📚</div>
                          <p>No batches selected yet</p>
                          <p className={styles.noSelectionHint}>
                            Select a class and batch to get started
                          </p>
                        </div>
                      ) : (
                        <div className={styles.batchesList}>
                          {formData.batches.map((batch, index) => (
                            <div key={index} className={styles.batchCard}>
                              <div className={styles.batchHeader}>
                                <div className={styles.batchInfo}>
                                  <span className={styles.batchName}>{batch.batchName}</span>
                                  <span className={styles.batchDetails}>
                                    {batch.subjects.length} subject{batch.subjects.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBatch(batch.batch)}
                                  className={styles.removeBatch}
                                  disabled={loading}
                                >
                                  ✕
                                </button>
                              </div>
                              <div className={styles.batchDetailsGrid}>
                                <div className={styles.detailItem}>
                                  <span className={styles.detailLabel}>Admission Fee:</span>
                                  <span className={styles.detailValue}>
                                    {formatCurrency(batch.admissionFee)}
                                  </span>
                                </div>
                                <div className={styles.detailItem}>
                                  <span className={styles.detailLabel}>Tuition Fee:</span>
                                  <span className={styles.detailValue}>
                                    {formatCurrency(batch.tuitionFee)}
                                  </span>
                                </div>
                                <div className={styles.detailItem}>
                                  <span className={styles.detailLabel}>Course Fee:</span>
                                  <span className={styles.detailValue}>
                                    {formatCurrency(batch.courseFee)}
                                  </span>
                                </div>
                                <div className={styles.detailItem}>
                                  <span className={styles.detailLabel}>Total:</span>
                                  <span className={styles.detailValueTotal}>
                                    {formatCurrency(batch.admissionFee + batch.tuitionFee + batch.courseFee)}
                                  </span>
                                </div>
                              </div>
                              {batch.subjects.length > 0 && (
                                <div className={styles.subjectsList}>
                                  <span className={styles.subjectsLabel}>Subjects:</span>
                                  <div className={styles.subjectTags}>
                                    {batch.subjects.map((subject, idx) => (
                                      <span key={idx} className={styles.subjectTag}>
                                        {subject.subjectName}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Section 7: Fee Information */}
              <div className={styles.formSectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}>💰</div>
                  <h3 className={styles.sectionTitle}>Fee Information</h3>
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Admission Fee
                    </label>
                    <div className={styles.inputWithSymbol}>
                      <span className={styles.currencySymbol}>৳</span>
                      <input
                        type="number"
                        value={formData.admissionFee}
                        onChange={(e) => handleChange('admissionFee', parseFloat(e.target.value) || 0)}
                        onBlur={() => handleBlur('admissionFee')}
                        className={`${styles.input} ${errors.admissionFee ? styles.inputError : ''}`}
                        disabled={loading || formData.batches.length > 0}
                        min="0"
                        step="1"
                      />
                    </div>
                    {errors.admissionFee && (
                      <div className={styles.errorMessage}>{errors.admissionFee}</div>
                    )}
                    {formData.batches.length > 0 && (
                      <div className={styles.helpText}>Automatically set by selected batch</div>
                    )}
                  </div>
                  
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Tuition Fee
                    </label>
                    <div className={styles.inputWithSymbol}>
                      <span className={styles.currencySymbol}>৳</span>
                      <input
                        type="number"
                        value={formData.tuitionFee}
                        onChange={(e) => handleChange('tuitionFee', parseFloat(e.target.value) || 0)}
                        onBlur={() => handleBlur('tuitionFee')}
                        className={`${styles.input} ${errors.tuitionFee ? styles.inputError : ''}`}
                        disabled={loading || formData.batches.length > 0}
                        min="0"
                        step="1"
                      />
                    </div>
                    {errors.tuitionFee && (
                      <div className={styles.errorMessage}>{errors.tuitionFee}</div>
                    )}
                  </div>
                  
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Course Fee
                    </label>
                    <div className={styles.inputWithSymbol}>
                      <span className={styles.currencySymbol}>৳</span>
                      <input
                        type="number"
                        value={formData.courseFee}
                        onChange={(e) => handleChange('courseFee', parseFloat(e.target.value) || 0)}
                        onBlur={() => handleBlur('courseFee')}
                        className={`${styles.input} ${errors.courseFee ? styles.inputError : ''}`}
                        disabled={loading || formData.batches.length > 0}
                        min="0"
                        step="1"
                      />
                    </div>
                    {errors.courseFee && (
                      <div className={styles.errorMessage}>{errors.courseFee}</div>
                    )}
                  </div>
                  
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Total Fee
                    </label>
                    <div className={styles.totalFeeDisplay}>
                      <span className={styles.totalFeeValue}>{formatCurrency(totalFee)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Section 8: Additional Information */}
              <div className={styles.formSectionCard}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionIcon}>📝</div>
                  <h3 className={styles.sectionTitle}>Additional Information</h3>
                </div>
                <div className={styles.formGrid}>
                  <div className={styles.formFieldFull}>
                    <label className={styles.label}>
                      Remarks
                    </label>
                    <textarea
                      value={formData.remarks}
                      onChange={(e) => handleChange('remarks', e.target.value)}
                      onBlur={() => handleBlur('remarks')}
                      className={styles.textarea}
                      disabled={loading}
                      rows={3}
                      placeholder="Any additional notes or remarks..."
                    />
                  </div>
                  
                  <div className={styles.formField}>
                    <label className={styles.label}>
                      Student Photo
                    </label>
                    <div className={styles.fileUploadArea}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className={styles.fileInput}
                        disabled={loading}
                        id="photo-upload"
                      />
                      <label htmlFor="photo-upload" className={styles.fileUploadLabel}>
                        <span className={styles.fileUploadIcon}>📷</span>
                        <span className={styles.fileUploadText}>
                          {formData.photo ? 'Change Photo' : 'Upload Photo'}
                        </span>
                        <span className={styles.fileUploadHint}>(Max 5MB)</span>
                      </label>
                      {errors.photo && (
                        <div className={styles.errorMessage}>{errors.photo}</div>
                      )}
                      {formData.photo && (
                        <div className={styles.filePreview}>
                          <span className={styles.fileName}>{formData.photo.name}</span>
                          <span className={styles.fileSize}>
                            {(formData.photo.size / 1024 / 1024).toFixed(2)} MB
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.modalFooter}>
            <div className={styles.footerInfo}>
              <div className={styles.totalSummary}>
                <span className={styles.totalLabel}>Total Admission Fee:</span>
                <span className={styles.totalAmount}>{formatCurrency(totalFee)}</span>
              </div>
              <div className={styles.requiredHint}>
                <span className={styles.required}>*</span> Required fields
              </div>
            </div>
            <div className={styles.footerActions}>
              <button
                type="button"
                onClick={handleClose}
                className={styles.btnSecondary}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={loading || !dropdownsLoaded}
              >
                {loading ? (
                  <>
                    <span className={styles.spinnerSmall}></span>
                    {isEditing ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  isEditing ? 'Update Admission' : 'Create Admission'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}