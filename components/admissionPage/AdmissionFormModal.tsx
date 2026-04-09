"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@/store/store';
import {
  fetchAdmissionTemplates,
  createAdmission,
  updateAdmission,
  saveDraftForm,
  clearDraftForm,
} from '@/api/admissionApi/admissionSlice';
import {
  AdmissionItem,
  AdmissionStatus,
  AdmissionType,
  Gender,
  Religion,
  AdmissionBatch,
  BatchForDropdown,
  ClassForDropdown,
  GroupForDropdown,
  SubjectForDropdown,
  FormFields,
  AdmissionFormDraft,
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

// Default fallback settings matching the backend
const defaultFields: FormFields = {
  nameNative: { isVisible: true, isRequired: false },
  studentDateOfBirth: { isVisible: true, isRequired: true },
  studentMobileNumber: { isVisible: true, isRequired: false },
  whatsappMobile: { isVisible: true, isRequired: false },
  fathersName: { isVisible: true, isRequired: true },
  mothersName: { isVisible: true, isRequired: false },
  motherMobileNumber: { isVisible: true, isRequired: false },
  presentAddress: { isVisible: true, isRequired: true },
  permanentAddress: { isVisible: true, isRequired: false },
  photo: { isVisible: true, isRequired: false },
  referBy: { isVisible: true, isRequired: false },
  remarks: { isVisible: true, isRequired: false },
};

export default function AdmissionFormModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  loading,
  isEditing,
  classes,
  dropdownsLoaded,
  fetchBatchesByClass,
}: AdmissionFormModalProps) {
  const dispatch = useDispatch<AppDispatch>();

  // Get settings, templates, and draftForm from Redux store
  const { settings, templates, draftForm } = useSelector((state: RootState) => state.admission);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  // Auto-save state
  const [autoSavedRegId, setAutoSavedRegId] = useState<string | null>(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [draftRestored, setDraftRestored] = useState(false);

  // Refs for debouncing
  const draftSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // LOGIC: Determine active field visibility based on Template OR Global Settings
  const activeSettings = useMemo(() => {
    if (selectedTemplateId) {
      const template = templates.find(t => t._id === selectedTemplateId);
      if (template) return template.fields;
    }
    return settings?.fields || defaultFields;
  }, [selectedTemplateId, templates, settings]);

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

  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedBatch, setSelectedBatch] = useState<string>('');
  const [selectedSubjects, setSelectedSubjects] = useState<SubjectForDropdown[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<SubjectForDropdown[]>([]);
  const [availableBatches, setAvailableBatches] = useState<any[]>([]);
  const [loadingBatches, setLoadingBatches] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Fetch templates when modal opens
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchAdmissionTemplates());
    }
  }, [isOpen, dispatch]);

  useEffect(() => {
    if (initialData) {
      // Editing existing admission - populate from initialData
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
      setAutoSavedRegId(null);
      setDraftRestored(false);
    } else {
      // New admission - check if we have a draft to restore
      if (draftForm && isOpen) {
        // Restore from draft
        setFormData({
          registrationId: draftForm.registrationId,
          name: draftForm.formData.name,
          nameNative: draftForm.formData.nameNative,
          studentGender: draftForm.formData.studentGender as Gender,
          studentDateOfBirth: draftForm.formData.studentDateOfBirth,
          presentAddress: draftForm.formData.presentAddress,
          permanentAddress: draftForm.formData.permanentAddress,
          religion: draftForm.formData.religion as Religion,
          whatsappMobile: draftForm.formData.whatsappMobile,
          studentMobileNumber: draftForm.formData.studentMobileNumber,
          instituteName: draftForm.formData.instituteName,
          fathersName: draftForm.formData.fathersName,
          mothersName: draftForm.formData.mothersName,
          guardianMobileNumber: draftForm.formData.guardianMobileNumber,
          motherMobileNumber: draftForm.formData.motherMobileNumber,
          admissionType: draftForm.formData.admissionType as AdmissionType,
          courseFee: draftForm.formData.courseFee,
          admissionFee: draftForm.formData.admissionFee,
          tuitionFee: draftForm.formData.tuitionFee,
          referBy: draftForm.formData.referBy,
          admissionDate: draftForm.formData.admissionDate,
          remarks: draftForm.formData.remarks,
          photo: null,
          batches: draftForm.formData.batches,
        });
        setAutoSavedRegId(draftForm.autoSavedRegistrationId);
        setDraftRestored(true);
      } else {
        // Fresh new form
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const generatedId = `REG${timestamp.toString().slice(-6)}${randomNum}`;

        setFormData(prev => ({
          ...prev,
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
        }));
        setAutoSavedRegId(null);
        setDraftRestored(false);
      }
      setSelectedClass('');
      setSelectedBatch('');
      setSelectedSubjects([]);
      setAvailableSubjects([]);
      setAvailableBatches([]);
      setSelectedTemplateId('');
    }

    setErrors({});
    setTouched({});
  }, [initialData, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-save to backend when name AND guardianMobileNumber are both filled (only for new admissions)
  useEffect(() => {
    if (isEditing) return;
    if (!formData.name.trim() || !formData.guardianMobileNumber.trim()) return;

    // Debounce 2 seconds
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      performAutoSave();
    }, 2000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData.name, formData.guardianMobileNumber]); // eslint-disable-line react-hooks/exhaustive-deps

  const performAutoSave = useCallback(async () => {
    if (!formData.name.trim() || !formData.guardianMobileNumber.trim()) return;

    setAutoSaving(true);
    setAutoSaveStatus('saving');

    // Build the payload without photo (not serializable)
    const { photo, ...serializableFormData } = formData;

    // Provide placeholders for backend-required fields that may not be filled yet
    const autoSavePayload = {
      ...serializableFormData,
      instituteName: serializableFormData.instituteName || 'TBD',
      status: AdmissionStatus.INCOMPLETE,
    };

    try {
      if (autoSavedRegId) {
        // Already auto-saved - update it
        await dispatch(updateAdmission({
          registrationId: autoSavedRegId,
          admissionData: autoSavePayload,
        })).unwrap();
      } else {
        // First auto-save - create as INCOMPLETE
        const result = await dispatch(createAdmission(autoSavePayload as any)).unwrap();
        if (result?.registrationId) {
          setAutoSavedRegId(result.registrationId);
          // Update draft in Redux with the backend registrationId
          dispatch(saveDraftForm({
            registrationId: formData.registrationId,
            autoSavedRegistrationId: result.registrationId,
            formData: serializableFormData,
          }));
        }
      }
      setAutoSaveStatus('saved');
    } catch {
      // Silently fail - no toast for auto-save errors
      setAutoSaveStatus('error');
    } finally {
      setAutoSaving(false);
      // Reset status after 3 seconds
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  }, [formData, autoSavedRegId, dispatch]);

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
        const classBatches = await fetchBatchesByClass(selectedClass);
        setAvailableBatches(classBatches);
      } catch (error) {
        setAvailableBatches([]);
      } finally {
        setLoadingBatches(false);
      }
    };

    fetchBatchesForClass();
  }, [selectedClass, fetchBatchesByClass]);

  useEffect(() => {
    if (selectedBatch) {
      const selectedBatchData = availableBatches.find(b => b._id === selectedBatch);
      if (selectedBatchData) {
        const batchSubjects = selectedBatchData.subject ? [selectedBatchData.subject] : [];
        const formattedSubjects: SubjectForDropdown[] = batchSubjects.map((subject: any) => ({
          _id: subject._id,
          subjectName: subject.subjectName,
        }));
        setAvailableSubjects(formattedSubjects);
      }
    } else {
      setAvailableSubjects([]);
      setSelectedSubjects([]);
    }
  }, [selectedBatch, availableBatches]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Save draft to Redux (debounced, skip photo field)
      if (draftSaveTimerRef.current) {
        clearTimeout(draftSaveTimerRef.current);
      }
      draftSaveTimerRef.current = setTimeout(() => {
        if (!isEditing) {
          const { photo: _photo, ...serializableData } = updated;
          dispatch(saveDraftForm({
            registrationId: updated.registrationId,
            autoSavedRegistrationId: autoSavedRegId,
            formData: serializableData,
          }));
        }
      }, 500);

      return updated;
    });

    if (touched[field] && errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Core Base Validation
    if (!formData.name) newErrors.name = 'Student Name is required';
    if (!formData.instituteName) newErrors.instituteName = 'Institute Name is required';
    if (!formData.guardianMobileNumber) newErrors.guardianMobileNumber = 'Guardian Mobile is required';
    if (!formData.admissionDate) newErrors.admissionDate = 'Admission Date is required';

    // Dynamic Validation based on active template/settings
    if (activeSettings.nameNative.isVisible && activeSettings.nameNative.isRequired && !formData.nameNative)
      newErrors.nameNative = "Native Name is required";
    if (activeSettings.studentDateOfBirth.isVisible && activeSettings.studentDateOfBirth.isRequired && !formData.studentDateOfBirth)
      newErrors.studentDateOfBirth = "Date of Birth is required";
    if (activeSettings.studentMobileNumber.isVisible && activeSettings.studentMobileNumber.isRequired && !formData.studentMobileNumber)
      newErrors.studentMobileNumber = "Student Mobile is required";
    if (activeSettings.whatsappMobile.isVisible && activeSettings.whatsappMobile.isRequired && !formData.whatsappMobile)
      newErrors.whatsappMobile = "WhatsApp Mobile is required";
    if (activeSettings.fathersName.isVisible && activeSettings.fathersName.isRequired && !formData.fathersName)
      newErrors.fathersName = "Father's Name is required";
    if (activeSettings.mothersName.isVisible && activeSettings.mothersName.isRequired && !formData.mothersName)
      newErrors.mothersName = "Mother's Name is required";
    if (activeSettings.motherMobileNumber.isVisible && activeSettings.motherMobileNumber.isRequired && !formData.motherMobileNumber)
      newErrors.motherMobileNumber = "Mother's Mobile is required";
    if (activeSettings.presentAddress.isVisible && activeSettings.presentAddress.isRequired && !formData.presentAddress)
      newErrors.presentAddress = "Present Address is required";
    if (activeSettings.permanentAddress.isVisible && activeSettings.permanentAddress.isRequired && !formData.permanentAddress)
      newErrors.permanentAddress = "Permanent Address is required";
    if (activeSettings.referBy.isVisible && activeSettings.referBy.isRequired && !formData.referBy)
      newErrors.referBy = "Refer By is required";
    if (activeSettings.remarks.isVisible && activeSettings.remarks.isRequired && !formData.remarks)
      newErrors.remarks = "Remarks is required";
    if (activeSettings.photo.isVisible && activeSettings.photo.isRequired && !formData.photo)
      newErrors.photo = "Photo is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClassSelect = (classId: string) => {
    setSelectedClass(classId);
    setSelectedBatch('');
    setSelectedSubjects([]);
    setAvailableBatches([]);
    setAvailableSubjects([]);
  };

  const handleBatchSelect = (batchId: string) => {
    setSelectedBatch(batchId);
    if (!batchId) {
      setSelectedSubjects([]);
      return;
    }
    const selectedBatchData = availableBatches.find(b => b._id === batchId);
    if (selectedBatchData) {
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
      setFormData(prev => ({
        ...prev,
        admissionFee: selectedBatchData.admissionFee || prev.admissionFee,
        tuitionFee: selectedBatchData.tuitionFee || prev.tuitionFee,
        courseFee: selectedBatchData.courseFee || prev.courseFee,
        batches: [...prev.batches.filter(b => b.batch !== batchId), newBatch],
      }));
    }
  };

  const handleSubjectToggle = (subject: SubjectForDropdown) => {
    const isSelected = selectedSubjects.some(s => s._id === subject._id);
    let newSelectedSubjects = isSelected
      ? selectedSubjects.filter(s => s._id !== subject._id)
      : [...selectedSubjects, subject];

    setSelectedSubjects(newSelectedSubjects);

    if (selectedBatch) {
      const updatedBatches = formData.batches.map(batch => {
        if (batch.batch === selectedBatch) {
          return {
            ...batch,
            subjects: newSelectedSubjects.map(sub => ({
              subjectName: sub.subjectName,
              subjectId: sub._id,
            })),
          };
        }
        return batch;
      });
      setFormData(prev => ({ ...prev, batches: updatedBatches }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleChange('photo', file);
      setErrors(prev => ({ ...prev, photo: '' }));
    }
  };

  const handleRemoveBatch = (batchId: string) => {
    setFormData(prev => ({ ...prev, batches: prev.batches.filter(b => b.batch !== batchId) }));
    if (selectedBatch === batchId) {
      setSelectedBatch('');
      setSelectedSubjects([]);
    }
  };

  const handleClearDraft = () => {
    dispatch(clearDraftForm());
    setDraftRestored(false);
    setAutoSavedRegId(null);

    // Reset to fresh form
    const timestamp = Date.now();
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const generatedId = `REG${timestamp.toString().slice(-6)}${randomNum}`;

    setFormData(prev => ({
      ...prev,
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
    }));
    setSelectedClass('');
    setSelectedBatch('');
    setSelectedSubjects([]);
    setAvailableSubjects([]);
    setAvailableBatches([]);
    setErrors({});
    setTouched({});
  };

  const totalFee = useMemo(() => {
    return formData.batches.reduce((sum, batch) => sum + (batch.admissionFee + batch.tuitionFee + batch.courseFee), 0) || (formData.admissionFee + formData.tuitionFee + formData.courseFee);
  }, [formData.batches, formData.admissionFee, formData.tuitionFee, formData.courseFee]);

  const submitData = (isDraft: boolean) => {
    if (!validateForm()) return;
    const submissionData = {
      ...formData,
      totalFee,
      dueAmount: totalFee - (initialData?.paidAmount || 0),
      status: isDraft
        ? AdmissionStatus.INCOMPLETE
        : (initialData?.status === AdmissionStatus.INCOMPLETE
          ? AdmissionStatus.PENDING
          : (initialData?.status || AdmissionStatus.PENDING)),
      _autoSavedRegistrationId: isDraft ? null : autoSavedRegId,
    };

    if (!isDraft) {
      // Clear draft from Redux on full submit
      dispatch(clearDraftForm());
    }

    onSubmit(submissionData);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', minimumFractionDigits: 0 }).format(amount);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalExtraLarge} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTitleWrapper}>
            <h2 className={styles.modalTitle}>{isEditing ? 'Edit Admission' : 'Create New Admission'}</h2>
            <p className={styles.modalSubtitle}>Register a new student to your institution</p>
          </div>
          {/* Auto-save status indicator */}
          {!isEditing && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
              {autoSaveStatus === 'saving' && (
                <span style={{ color: '#6366f1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{
                    width: '10px', height: '10px', border: '2px solid #6366f1',
                    borderTopColor: 'transparent', borderRadius: '50%',
                    display: 'inline-block', animation: 'spin 0.8s linear infinite'
                  }}></span>
                  Auto-saving...
                </span>
              )}
              {autoSaveStatus === 'saved' && (
                <span style={{ color: '#10b981' }}>Draft saved</span>
              )}
            </div>
          )}
          <button onClick={onClose} className={styles.modalClose} disabled={loading} type="button">✕</button>
        </div>

        {/* Draft Restored Banner */}
        {draftRestored && !isEditing && (
          <div style={{
            background: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: '10px 16px',
            margin: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '14px',
            color: '#1e40af',
          }}>
            <span>
              <strong>Draft restored</strong> — your previous progress has been loaded.
            </span>
            <button
              type="button"
              onClick={handleClearDraft}
              style={{
                background: '#dbeafe',
                border: '1px solid #93c5fd',
                borderRadius: '6px',
                padding: '4px 12px',
                fontSize: '12px',
                color: '#1d4ed8',
                cursor: 'pointer',
                marginLeft: '12px',
                whiteSpace: 'nowrap',
              }}
            >
              Start Fresh
            </button>
          </div>
        )}

        {loading && <div className={styles.modalLoading}><div className={styles.spinnerLarge}></div><p>Processing...</p></div>}

        <form onSubmit={e => { e.preventDefault(); submitData(false); }} className={styles.modalForm}>
          <div className={styles.modalBody}>

            {/* TEMPLATE SELECTION CARD */}
            {!isEditing && (
              <div className={styles.formSectionCard} style={{ border: '2px solid #6366f1', background: '#f5f3ff', marginBottom: '24px' }}>
                <div className={styles.sectionHeader} style={{ borderBottomColor: '#ddd6fe' }}>
                  <div className={styles.sectionIcon}>📋</div>
                  <h3 className={styles.sectionTitle}>Apply Admission Template</h3>
                </div>
                <div className={styles.formField}>
                  <label className={styles.label}>Select a form structure (Optional)</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className={styles.select}
                    disabled={loading}
                  >
                    <option value="">Default (Global Settings)</option>
                    {templates.map(template => (
                      <option key={template._id} value={template._id}>
                        {template.templateName}
                      </option>
                    ))}
                  </select>
                  <p style={{ fontSize: '12px', color: '#6366f1', marginTop: '8px' }}>
                    * Selecting a template will dynamically adjust visible and required fields.
                  </p>
                </div>
              </div>
            )}

            <div className={styles.formSectionsContainer}>
              {/* Section 1: Basic Information */}
              <div className={styles.formSectionCard}>
                <div className={styles.sectionHeader}><div className={styles.sectionIcon}>👤</div><h3 className={styles.sectionTitle}>Student Information</h3></div>
                <div className={styles.formGrid}>
                  <div className={styles.formField}><label className={styles.label}>Registration ID</label><input type="text" value={formData.registrationId} className={styles.input} disabled /></div>
                  <div className={styles.formField}>
                    <label className={styles.label}>Student Name <span className={styles.required}>*</span></label>
                    <input type="text" value={formData.name} onChange={e => handleChange('name', e.target.value)} onBlur={() => handleBlur('name')} className={`${styles.input} ${errors.name ? styles.inputError : ''}`} required />
                    {errors.name && <div className={styles.errorMessage}>{errors.name}</div>}
                  </div>

                  {activeSettings.nameNative.isVisible && (
                    <div className={styles.formField}>
                      <label className={styles.label}>Name (Native) {activeSettings.nameNative.isRequired && '*'}</label>
                      <input type="text" value={formData.nameNative} onChange={e => handleChange('nameNative', e.target.value)} className={styles.input} />
                    </div>
                  )}

                  <div className={styles.formField}>
                    <label className={styles.label}>Gender</label>
                    <select value={formData.studentGender} onChange={e => handleChange('studentGender', e.target.value)} className={styles.select}>
                      {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>

                  {activeSettings.studentDateOfBirth.isVisible && (
                    <div className={styles.formField}>
                      <label className={styles.label}>Date of Birth {activeSettings.studentDateOfBirth.isRequired && '*'}</label>
                      <input type="date" value={formData.studentDateOfBirth} onChange={e => handleChange('studentDateOfBirth', e.target.value)} className={styles.input} />
                    </div>
                  )}

                  <div className={styles.formField}>
                    <label className={styles.label}>Religion</label>
                    <select value={formData.religion} onChange={e => handleChange('religion', e.target.value)} className={styles.select}>
                      {Object.values(Religion).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Contact Information */}
              <div className={styles.formSectionCard}>
                <div className={styles.sectionHeader}><div className={styles.sectionIcon}>📞</div><h3 className={styles.sectionTitle}>Contact Information</h3></div>
                <div className={styles.formGrid}>
                  <div className={styles.formField}><label className={styles.label}>Guardian Mobile <span className={styles.required}>*</span></label><input type="tel" value={formData.guardianMobileNumber} onChange={e => handleChange('guardianMobileNumber', e.target.value)} className={styles.input} required /></div>
                  {activeSettings.whatsappMobile.isVisible && (
                    <div className={styles.formField}><label className={styles.label}>WhatsApp {activeSettings.whatsappMobile.isRequired && '*'}</label><input type="tel" value={formData.whatsappMobile} onChange={e => handleChange('whatsappMobile', e.target.value)} className={styles.input} /></div>
                  )}
                  {activeSettings.studentMobileNumber.isVisible && (
                    <div className={styles.formField}><label className={styles.label}>Student Mobile {activeSettings.studentMobileNumber.isRequired && '*'}</label><input type="tel" value={formData.studentMobileNumber} onChange={e => handleChange('studentMobileNumber', e.target.value)} className={styles.input} /></div>
                  )}
                </div>
              </div>

              {/* Section 3: Family Info */}
              {(activeSettings.fathersName.isVisible || activeSettings.mothersName.isVisible) && (
                <div className={styles.formSectionCard}>
                  <div className={styles.sectionHeader}><div className={styles.sectionIcon}>👨‍👩‍👧‍👦</div><h3 className={styles.sectionTitle}>Family Information</h3></div>
                  <div className={styles.formGrid}>
                    {activeSettings.fathersName.isVisible && (
                      <div className={styles.formField}><label className={styles.label}>Father's Name {activeSettings.fathersName.isRequired && '*'}</label><input type="text" value={formData.fathersName} onChange={e => handleChange('fathersName', e.target.value)} className={styles.input} /></div>
                    )}
                    {activeSettings.mothersName.isVisible && (
                      <div className={styles.formField}><label className={styles.label}>Mother's Name {activeSettings.mothersName.isRequired && '*'}</label><input type="text" value={formData.mothersName} onChange={e => handleChange('mothersName', e.target.value)} className={styles.input} /></div>
                    )}
                    {activeSettings.motherMobileNumber.isVisible && (
                      <div className={styles.formField}><label className={styles.label}>Mother's Mobile {activeSettings.motherMobileNumber.isRequired && '*'}</label><input type="tel" value={formData.motherMobileNumber} onChange={e => handleChange('motherMobileNumber', e.target.value)} className={styles.input} /></div>
                    )}
                  </div>
                </div>
              )}

              {/* Section 4: Address */}
              {activeSettings.presentAddress.isVisible && (
                <div className={styles.formSectionCard}>
                  <div className={styles.sectionHeader}><div className={styles.sectionIcon}>🏠</div><h3 className={styles.sectionTitle}>Address Details</h3></div>
                  <div className={styles.formGrid}>
                    <div className={styles.formFieldFull}><label className={styles.label}>Present Address {activeSettings.presentAddress.isRequired && '*'}</label><textarea value={formData.presentAddress} onChange={e => handleChange('presentAddress', e.target.value)} className={styles.textarea} rows={2} /></div>
                    {activeSettings.permanentAddress.isVisible && (
                      <div className={styles.formFieldFull}><label className={styles.label}>Permanent Address {activeSettings.permanentAddress.isRequired && '*'}</label><textarea value={formData.permanentAddress} onChange={e => handleChange('permanentAddress', e.target.value)} className={styles.textarea} rows={2} /></div>
                    )}
                  </div>
                </div>
              )}

              {/* Section 5: Academic & Batch */}
              <div className={styles.formSectionCard}>
                <div className={styles.sectionHeader}><div className={styles.sectionIcon}>🎓</div><h3 className={styles.sectionTitle}>Academic Information</h3></div>
                <div className={styles.formGrid} style={{ marginBottom: '20px' }}>
                  <div className={styles.formField}>
                    <label className={styles.label}>Admission Type</label>
                    <select value={formData.admissionType} onChange={e => handleChange('admissionType', e.target.value as AdmissionType)} className={styles.select}>
                      {Object.values(AdmissionType).map(type => (
                        <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.formField}><label className={styles.label}>Institute Name <span className={styles.required}>*</span></label><input type="text" value={formData.instituteName} onChange={e => handleChange('instituteName', e.target.value)} className={styles.input} required /></div>
                  <div className={styles.formField}><label className={styles.label}>Admission Date <span className={styles.required}>*</span></label><input type="date" value={formData.admissionDate} onChange={e => handleChange('admissionDate', e.target.value)} className={styles.input} required /></div>
                </div>

                {!dropdownsLoaded ? <p>Loading classes...</p> : (
                  <div className={styles.batchSelectionFlow}>
                    <div className={styles.selectionStep}>
                      <span className={styles.stepTitle}>1. Select Class</span>
                      <select value={selectedClass} onChange={e => handleClassSelect(e.target.value)} className={styles.select}>
                        <option value="">Choose Class</option>
                        {classes.map(c => <option key={c._id} value={c._id}>{c.classname}</option>)}
                      </select>
                    </div>
                    {selectedClass && (
                      <div className={styles.selectionStep}>
                        <span className={styles.stepTitle}>2. Select Batch</span>
                        {loadingBatches ? <p>Loading...</p> : (
                          <select value={selectedBatch} onChange={e => handleBatchSelect(e.target.value)} className={styles.select}>
                            <option value="">Choose Batch</option>
                            {availableBatches.map(b => <option key={b._id} value={b._id}>{b.batchName}</option>)}
                          </select>
                        )}
                      </div>
                    )}
                    {selectedBatch && (
                      <div className={styles.selectionStep}>
                        <span className={styles.stepTitle}>3. Select Subjects</span>
                        <div className={styles.subjectGrid}>
                          {availableSubjects.map(s => (
                            <div key={s._id} className={styles.subjectCheckbox}>
                              <input type="checkbox" id={`sub-${s._id}`} checked={selectedSubjects.some(sub => sub._id === s._id)} onChange={() => handleSubjectToggle(s)} />
                              <label htmlFor={`sub-${s._id}`}>{s.subjectName}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Fee Summary */}
              <div className={styles.formSectionCard}>
                <div className={styles.sectionHeader}><div className={styles.sectionIcon}>💰</div><h3 className={styles.sectionTitle}>Fee Summary</h3></div>
                <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>Total: {formatCurrency(totalFee)}</div>
              </div>

              {/* Additional Details */}
              {(activeSettings.remarks.isVisible || activeSettings.photo.isVisible) && (
                <div className={styles.formSectionCard}>
                  <div className={styles.sectionHeader}><div className={styles.sectionIcon}>📝</div><h3 className={styles.sectionTitle}>Additional Information</h3></div>
                  <div className={styles.formGrid}>
                    {activeSettings.referBy.isVisible && (
                      <div className={styles.formField}><label className={styles.label}>Refer By {activeSettings.referBy.isRequired && '*'}</label><input type="text" value={formData.referBy} onChange={e => handleChange('referBy', e.target.value)} className={styles.input} /></div>
                    )}
                    {activeSettings.remarks.isVisible && (
                      <div className={styles.formFieldFull}><label className={styles.label}>Remarks</label><textarea value={formData.remarks} onChange={e => handleChange('remarks', e.target.value)} className={styles.textarea} rows={2} /></div>
                    )}
                    {activeSettings.photo.isVisible && (
                      <div className={styles.formField}><label className={styles.label}>Photo</label><input type="file" accept="image/*" onChange={handleFileChange} /></div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button type="button" onClick={onClose} className={styles.btnSecondary} disabled={loading}>Cancel</button>
            <button type="button" onClick={() => submitData(true)} className={styles.btnDraft} disabled={loading}>Save Draft</button>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              {loading ? 'Processing...' : (isEditing ? 'Update Admission' : 'Submit Admission')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
