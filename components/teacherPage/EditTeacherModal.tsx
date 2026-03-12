import { useState, useEffect } from "react";
import styles from './CreateTeacherModal.module.css';
import { 
  AssignType, 
  BloodGroup, 
  Designation, 
  Gender, 
  Religion, 
  TeacherItem, 
  TeacherStatus, 
  UpdateTeacherDto 
} from "@/api/teacherApi/types/teacher.types";

interface EditTeacherModalProps {
  teacher: TeacherItem;
  onClose: () => void;
  onSave: (updatedTeacher: UpdateTeacherDto) => void;
  onUpdate: (updatedTeacher: UpdateTeacherDto) => void;
  loading: boolean;
}

export default function EditTeacherModal({ 
  teacher, 
  onClose, 
  onSave, 
  onUpdate,
  loading 
}: EditTeacherModalProps) {
  const [formData, setFormData] = useState<UpdateTeacherDto>({
    fullName: teacher.fullName,
    fatherName: teacher.fatherName,
    motherName: teacher.motherName,
    religion: teacher.religion,
    gender: teacher.gender,
    dateOfBirth: teacher.dateOfBirth.split('T')[0],
    contactNumber: teacher.contactNumber,
    emergencyContactNumber: teacher.emergencyContactNumber,
    presentAddress: teacher.presentAddress,
    permanentAddress: teacher.permanentAddress,
    whatsappNumber: teacher.whatsappNumber,
    email: teacher.email,
    secondaryEmail: teacher.secondaryEmail || '',
    nationalId: teacher.nationalId,
    bloodGroup: teacher.bloodGroup,
    
    // System Access
    systemEmail: teacher.systemEmail,
    
    // Job Information
    designation: teacher.designation,
    assignType: teacher.assignType,
    monthlyTotalClass: teacher.monthlyTotalClass || 0,
    salary: teacher.salary || 0,
    joiningDate: teacher.joiningDate.split('T')[0],
    status: teacher.status,
    isActive: teacher.isActive,
    isEmailVerified: teacher.isEmailVerified,
    isPhoneVerified: teacher.isPhoneVerified,
    remarks: teacher.remarks || '',
    profilePicture: teacher.profilePicture || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  // Update onUpdate when formData changes
  useEffect(() => {
    onUpdate(formData);
  }, [formData, onUpdate]);

  const validateField = (name: string, value: any): string => {
    if (!touched[name]) return '';
    
    switch (name) {
      case 'fullName':
        if (!value?.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Full name must be at least 2 characters';
        if (value.trim().length > 100) return 'Full name must be less than 100 characters';
        break;
        
      case 'fatherName':
        if (!value?.trim()) return "Father's name is required";
        if (value.trim().length < 2) return "Father's name must be at least 2 characters";
        break;
        
      case 'motherName':
        if (!value?.trim()) return "Mother's name is required";
        if (value.trim().length < 2) return "Mother's name must be at least 2 characters";
        break;
        
      case 'email':
        if (!value?.trim()) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
        break;
        
      case 'systemEmail':
        if (!value?.trim()) return 'System email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
        break;
        
      case 'contactNumber':
        if (!value?.trim()) return 'Contact number is required';
        if (!/^01[3-9]\d{8}$/.test(value)) return 'Contact number must be 11 digits starting with 01';
        break;
        
      case 'emergencyContactNumber':
        if (!value?.trim()) return 'Emergency contact number is required';
        if (!/^01[3-9]\d{8}$/.test(value)) return 'Emergency contact number must be 11 digits starting with 01';
        break;
        
      case 'whatsappNumber':
        if (!value?.trim()) return 'WhatsApp number is required';
        if (!/^01[3-9]\d{8}$/.test(value)) return 'WhatsApp number must be 11 digits starting with 01';
        break;
        
      case 'nationalId':
        if (!value?.trim()) return 'National ID is required';
        if (!/^\d{10,17}$/.test(value)) return 'National ID must be 10-17 digits';
        break;
        
      case 'dateOfBirth':
        if (!value) return 'Date of birth is required';
        const dob = new Date(value);
        const today = new Date();
        if (dob > today) return 'Date of birth cannot be in the future';
        if (dob.getFullYear() < 1900) return 'Date of birth is invalid';
        break;
        
      case 'joiningDate':
        if (!value) return 'Joining date is required';
        const joinDate = new Date(value);
        if (joinDate > new Date()) return 'Joining date cannot be in the future';
        break;
        
      case 'presentAddress':
        if (!value?.trim()) return 'Present address is required';
        if (value.trim().length < 5) return 'Present address must be at least 5 characters';
        break;
        
      case 'permanentAddress':
        if (!value?.trim()) return 'Permanent address is required';
        if (value.trim().length < 5) return 'Permanent address must be at least 5 characters';
        break;
        
      case 'secondaryEmail':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
        break;
    }
    
    return '';
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    Object.keys(formData).forEach(key => {
      if (key !== 'secondaryEmail' && key !== 'remarks' && key !== 'profilePicture' && 
          key !== 'isEmailVerified' && key !== 'isPhoneVerified' && key !== 'isActive') {
        const error = validateField(key, (formData as any)[key]);
        if (error) newErrors[key] = error;
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched: Record<string, boolean> = {};
    Object.keys(formData).forEach(key => { 
      if (key !== 'secondaryEmail' && key !== 'remarks' && key !== 'profilePicture' && 
          key !== 'isEmailVerified' && key !== 'isPhoneVerified' && key !== 'isActive') {
        allTouched[key] = true; 
      }
    });
    setTouched(allTouched);
    
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleChange = <K extends keyof UpdateTeacherDto>(
    field: K,
    value: UpdateTeacherDto[K]
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, (formData as any)[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const getValidationIcon = (field: string) => {
    const value = (formData as any)[field];
    const error = validateField(field, value);
    
    if (!touched[field]) return null;
    
    if (error) {
      return <span className={`${styles.validationIcon} ${styles.invalid}`}>✗</span>;
    } else if (value && value.toString().trim().length > 0) {
      return <span className={`${styles.validationIcon} ${styles.valid}`}>✓</span>;
    }
    
    return null;
  };

  const isFormValid = () => {
    return (
      (formData.fullName?.trim()?.length || 0) >= 2 &&
      (formData.fatherName?.trim()?.length || 0) >= 2 &&
      (formData.motherName?.trim()?.length || 0) >= 2 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email || '') &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.systemEmail || '') &&
      /^01[3-9]\d{8}$/.test(formData.contactNumber || '') &&
      /^01[3-9]\d{8}$/.test(formData.emergencyContactNumber || '') &&
      /^01[3-9]\d{8}$/.test(formData.whatsappNumber || '') &&
      /^\d{10,17}$/.test(formData.nationalId || '') &&
      formData.dateOfBirth &&
      formData.joiningDate &&
      (formData.presentAddress?.trim()?.length || 0) >= 5 &&
      (formData.permanentAddress?.trim()?.length || 0) >= 5
    );
  };

  // Type-safe enum value getters
  const getGenderValues = (): Gender[] => Object.values(Gender) as Gender[];
  const getReligionValues = (): Religion[] => Object.values(Religion) as Religion[];
  const getDesignationValues = (): Designation[] => Object.values(Designation) as Designation[];
  const getAssignTypeValues = (): AssignType[] => Object.values(AssignType) as AssignType[];
  const getStatusValues = (): TeacherStatus[] => Object.values(TeacherStatus) as TeacherStatus[];
  const getBloodGroupValues = (): BloodGroup[] => Object.values(BloodGroup) as BloodGroup[];

  const formatEnumForDisplay = (value: string): string => {
    return value.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.modalHeader}>
            <h2 className={styles.modalTitle}>Edit Teacher Profile</h2>
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
          
          <div className={styles.modalBody}>
            {/* Basic Information Section */}
            <div className={styles.sectionTitle}>Basic Information</div>
            
            <div className={styles.formRow}>
              {/* Full Name */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="fullName">
                  Full Name *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="fullName"
                    type="text"
                    value={formData.fullName || ''}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    onBlur={() => handleBlur('fullName')}
                    placeholder="Enter full name"
                    className={`${styles.input} ${
                      errors.fullName ? styles.inputError : ''
                    }`}
                    autoFocus
                    disabled={loading}
                    maxLength={100}
                  />
                  {getValidationIcon('fullName')}
                </div>
                {errors.fullName && (
                  <div className={styles.errorMessage}>{errors.fullName}</div>
                )}
              </div>

              {/* Father's Name */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="fatherName">
                  Father's Name *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="fatherName"
                    type="text"
                    value={formData.fatherName || ''}
                    onChange={(e) => handleChange('fatherName', e.target.value)}
                    onBlur={() => handleBlur('fatherName')}
                    placeholder="Enter father's name"
                    className={`${styles.input} ${
                      errors.fatherName ? styles.inputError : ''
                    }`}
                    disabled={loading}
                    maxLength={50}
                  />
                  {getValidationIcon('fatherName')}
                </div>
                {errors.fatherName && (
                  <div className={styles.errorMessage}>{errors.fatherName}</div>
                )}
              </div>

              {/* Mother's Name */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="motherName">
                  Mother's Name *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="motherName"
                    type="text"
                    value={formData.motherName || ''}
                    onChange={(e) => handleChange('motherName', e.target.value)}
                    onBlur={() => handleBlur('motherName')}
                    placeholder="Enter mother's name"
                    className={`${styles.input} ${
                      errors.motherName ? styles.inputError : ''
                    }`}
                    disabled={loading}
                    maxLength={50}
                  />
                  {getValidationIcon('motherName')}
                </div>
                {errors.motherName && (
                  <div className={styles.errorMessage}>{errors.motherName}</div>
                )}
              </div>

              {/* Religion */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="religion">
                  Religion *
                </label>
                <select
                  id="religion"
                  value={formData.religion}
                  onChange={(e) => handleChange('religion', e.target.value as Religion)}
                  className={styles.select}
                  disabled={loading}
                >
                  {getReligionValues().map(religion => (
                    <option key={religion} value={religion}>
                      {formatEnumForDisplay(religion)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Gender */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="gender">
                  Gender *
                </label>
                <select
                  id="gender"
                  value={formData.gender}
                  onChange={(e) => handleChange('gender', e.target.value as Gender)}
                  className={styles.select}
                  disabled={loading}
                >
                  <option value="">Select Gender</option>
                  {getGenderValues().map(gender => (
                    <option key={gender} value={gender}>
                      {formatEnumForDisplay(gender)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date of Birth */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="dateOfBirth">
                  Date of Birth *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth || ''}
                    onChange={(e) => handleChange('dateOfBirth', e.target.value)}
                    onBlur={() => handleBlur('dateOfBirth')}
                    className={`${styles.input} ${
                      errors.dateOfBirth ? styles.inputError : ''
                    }`}
                    disabled={loading}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {getValidationIcon('dateOfBirth')}
                </div>
                {errors.dateOfBirth && (
                  <div className={styles.errorMessage}>{errors.dateOfBirth}</div>
                )}
              </div>

              {/* Contact Number */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="contactNumber">
                  Contact Number *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="contactNumber"
                    type="tel"
                    value={formData.contactNumber || ''}
                    onChange={(e) => handleChange('contactNumber', e.target.value)}
                    onBlur={() => handleBlur('contactNumber')}
                    placeholder="01XXXXXXXXX"
                    className={`${styles.input} ${
                      errors.contactNumber ? styles.inputError : ''
                    }`}
                    disabled={loading}
                    maxLength={11}
                  />
                  {getValidationIcon('contactNumber')}
                </div>
                {errors.contactNumber && (
                  <div className={styles.errorMessage}>{errors.contactNumber}</div>
                )}
                <div className={styles.helpText}>Must be 11 digits starting with 01</div>
              </div>

              {/* Emergency Contact */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="emergencyContactNumber">
                  Emergency Contact Number *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="emergencyContactNumber"
                    type="tel"
                    value={formData.emergencyContactNumber || ''}
                    onChange={(e) => handleChange('emergencyContactNumber', e.target.value)}
                    onBlur={() => handleBlur('emergencyContactNumber')}
                    placeholder="01XXXXXXXXX"
                    className={`${styles.input} ${
                      errors.emergencyContactNumber ? styles.inputError : ''
                    }`}
                    disabled={loading}
                    maxLength={11}
                  />
                  {getValidationIcon('emergencyContactNumber')}
                </div>
                {errors.emergencyContactNumber && (
                  <div className={styles.errorMessage}>{errors.emergencyContactNumber}</div>
                )}
              </div>

              {/* WhatsApp Number */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="whatsappNumber">
                  WhatsApp Number *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="whatsappNumber"
                    type="tel"
                    value={formData.whatsappNumber || ''}
                    onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                    onBlur={() => handleBlur('whatsappNumber')}
                    placeholder="01XXXXXXXXX"
                    className={`${styles.input} ${
                      errors.whatsappNumber ? styles.inputError : ''
                    }`}
                    disabled={loading}
                    maxLength={11}
                  />
                  {getValidationIcon('whatsappNumber')}
                </div>
                {errors.whatsappNumber && (
                  <div className={styles.errorMessage}>{errors.whatsappNumber}</div>
                )}
              </div>

              {/* National ID */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="nationalId">
                  National ID / Birth Reg. No *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="nationalId"
                    type="text"
                    value={formData.nationalId || ''}
                    onChange={(e) => handleChange('nationalId', e.target.value)}
                    onBlur={() => handleBlur('nationalId')}
                    placeholder="Enter national ID (10-17 digits)"
                    className={`${styles.input} ${
                      errors.nationalId ? styles.inputError : ''
                    }`}
                    disabled={loading}
                    maxLength={17}
                  />
                  {getValidationIcon('nationalId')}
                </div>
                {errors.nationalId && (
                  <div className={styles.errorMessage}>{errors.nationalId}</div>
                )}
              </div>

              {/* Blood Group */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="bloodGroup">
                  Blood Group *
                </label>
                <select
                  id="bloodGroup"
                  value={formData.bloodGroup}
                  onChange={(e) => handleChange('bloodGroup', e.target.value as BloodGroup)}
                  className={styles.select}
                  disabled={loading}
                >
                  <option value="">Select Blood Group</option>
                  {getBloodGroupValues().map(group => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              {/* Email */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="email">
                  Personal Email *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
                    placeholder="personal@example.com"
                    className={`${styles.input} ${
                      errors.email ? styles.inputError : ''
                    }`}
                    disabled={loading}
                  />
                  {getValidationIcon('email')}
                </div>
                {errors.email && (
                  <div className={styles.errorMessage}>{errors.email}</div>
                )}
              </div>

              {/* Secondary Email */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="secondaryEmail">
                  Secondary Email
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="secondaryEmail"
                    type="email"
                    value={formData.secondaryEmail || ''}
                    onChange={(e) => handleChange('secondaryEmail', e.target.value)}
                    onBlur={() => handleBlur('secondaryEmail')}
                    placeholder="secondary@example.com"
                    className={`${styles.input} ${
                      errors.secondaryEmail ? styles.inputError : ''
                    }`}
                    disabled={loading}
                  />
                  {getValidationIcon('secondaryEmail')}
                </div>
                {errors.secondaryEmail && (
                  <div className={styles.errorMessage}>{errors.secondaryEmail}</div>
                )}
              </div>
            </div>

            {/* Address Information */}
            <div className={styles.sectionTitle}>Address Information</div>
            
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="presentAddress">
                Present Address *
              </label>
              <textarea
                id="presentAddress"
                value={formData.presentAddress || ''}
                onChange={(e) => handleChange('presentAddress', e.target.value)}
                onBlur={() => handleBlur('presentAddress')}
                placeholder="Enter complete present address"
                className={`${styles.textarea} ${
                  errors.presentAddress ? styles.inputError : ''
                }`}
                disabled={loading}
                rows={3}
                maxLength={500}
              />
              {errors.presentAddress && (
                <div className={styles.errorMessage}>{errors.presentAddress}</div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="permanentAddress">
                Permanent Address *
              </label>
              <textarea
                id="permanentAddress"
                value={formData.permanentAddress || ''}
                onChange={(e) => handleChange('permanentAddress', e.target.value)}
                onBlur={() => handleBlur('permanentAddress')}
                placeholder="Enter complete permanent address"
                className={`${styles.textarea} ${
                  errors.permanentAddress ? styles.inputError : ''
                }`}
                disabled={loading}
                rows={3}
                maxLength={500}
              />
              {errors.permanentAddress && (
                <div className={styles.errorMessage}>{errors.permanentAddress}</div>
              )}
            </div>

            {/* System Access Section */}
            <div className={styles.sectionTitle}>System Access</div>
            
            <div className={styles.formRow}>
              {/* System Email */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="systemEmail">
                  System Email Address *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="systemEmail"
                    type="email"
                    value={formData.systemEmail || ''}
                    onChange={(e) => handleChange('systemEmail', e.target.value)}
                    onBlur={() => handleBlur('systemEmail')}
                    placeholder="teacher@academy.edu"
                    className={`${styles.input} ${
                      errors.systemEmail ? styles.inputError : ''
                    }`}
                    disabled={loading}
                  />
                  {getValidationIcon('systemEmail')}
                </div>
                {errors.systemEmail && (
                  <div className={styles.errorMessage}>{errors.systemEmail}</div>
                )}
              </div>

              {/* Password Field (Read-only/Change Password) */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="password">
                  Password *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="password"
                    type="text"
                    value="••••••••"
                    readOnly
                    className={`${styles.input} ${styles.viewMode}`}
                    disabled={loading}
                  />
                </div>
                <div className={styles.helpText}>
                  <button 
                    type="button" 
                    className={styles.changePasswordBtn}
                    onClick={() => {/* Add password change logic */}}
                  >
                    Change Password
                  </button>
                </div>
              </div>
            </div>

            {/* Job Information Section */}
            <div className={styles.sectionTitle}>Job Information</div>
            
            <div className={styles.formRow}>
              {/* Designation */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="designation">
                  Designation *
                </label>
                <select
                  id="designation"
                  value={formData.designation}
                  onChange={(e) => handleChange('designation', e.target.value as Designation)}
                  className={styles.select}
                  disabled={loading}
                >
                  {getDesignationValues().map(designation => (
                    <option key={designation} value={designation}>
                      {formatEnumForDisplay(designation)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Assign Type */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="assignType">
                  Assign Type *
                </label>
                <select
                  id="assignType"
                  value={formData.assignType}
                  onChange={(e) => handleChange('assignType', e.target.value as AssignType)}
                  className={styles.select}
                  disabled={loading}
                >
                  {getAssignTypeValues().map(type => (
                    <option key={type} value={type}>
                      {formatEnumForDisplay(type)}
                    </option>
                  ))}
                </select>
              </div>

              {(formData.assignType === AssignType.MONTHLY_BASIS || formData.assignType === AssignType.BOTH) && (
                <>
                  {/* Monthly Total Class */}
                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="monthlyTotalClass">
                      Monthly Total Class
                    </label>
                    <input
                      id="monthlyTotalClass"
                      type="number"
                      value={formData.monthlyTotalClass || 0}
                      onChange={(e) => handleChange('monthlyTotalClass', parseInt(e.target.value) || 0)}
                      className={styles.input}
                      disabled={loading}
                      min="0"
                      step="1"
                    />
                  </div>

                  {/* Salary */}
                  <div className={styles.formGroup}>
                    <label className={styles.label} htmlFor="salary">
                      Salary (৳)
                    </label>
                    <input
                      id="salary"
                      type="number"
                      value={formData.salary || 0}
                      onChange={(e) => handleChange('salary', parseInt(e.target.value) || 0)}
                      className={styles.input}
                      disabled={loading}
                      min="0"
                      step="100"
                    />
                  </div>
                </>
              )}

              {/* Joining Date */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="joiningDate">
                  Joining Date *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="joiningDate"
                    type="date"
                    value={formData.joiningDate || ''}
                    onChange={(e) => handleChange('joiningDate', e.target.value)}
                    onBlur={() => handleBlur('joiningDate')}
                    className={`${styles.input} ${
                      errors.joiningDate ? styles.inputError : ''
                    }`}
                    disabled={loading}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {getValidationIcon('joiningDate')}
                </div>
                {errors.joiningDate && (
                  <div className={styles.errorMessage}>{errors.joiningDate}</div>
                )}
              </div>

              {/* Status */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="status">
                  Status *
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleChange('status', e.target.value as TeacherStatus)}
                  className={styles.select}
                  disabled={loading}
                >
                  {getStatusValues().map(status => (
                    <option key={status} value={status}>
                      {formatEnumForDisplay(status)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Active Status */}
              <div className={styles.formGroup}>
                <label className={styles.label} htmlFor="isActive">
                  Active Status *
                </label>
                <select
                  id="isActive"
                  value={formData.isActive?.toString() || 'true'}
                  onChange={(e) => handleChange('isActive', e.target.value === 'true')}
                  className={styles.select}
                  disabled={loading}
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>

            {/* Verification Status */}
            <div className={styles.sectionTitle}>Verification Status</div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Email Verification
                </label>
                <div className={styles.verificationStatus}>
                  <span className={`${styles.verificationBadge} ${
                    formData.isEmailVerified ? styles.verified : styles.unverified
                  }`}>
                    {formData.isEmailVerified ? '✓ Verified' : '✗ Unverified'}
                  </span>
                  {!formData.isEmailVerified && (
                    <button
                      type="button"
                      onClick={() => handleChange('isEmailVerified', true)}
                      className={styles.btnVerify}
                      disabled={loading}
                    >
                      Mark as Verified
                    </button>
                  )}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>
                  Phone Verification
                </label>
                <div className={styles.verificationStatus}>
                  <span className={`${styles.verificationBadge} ${
                    formData.isPhoneVerified ? styles.verified : styles.unverified
                  }`}>
                    {formData.isPhoneVerified ? '✓ Verified' : '✗ Unverified'}
                  </span>
                  {!formData.isPhoneVerified && (
                    <button
                      type="button"
                      onClick={() => handleChange('isPhoneVerified', true)}
                      className={styles.btnVerify}
                      disabled={loading}
                    >
                      Mark as Verified
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Remarks */}
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="remarks">
                Remarks
              </label>
              <textarea
                id="remarks"
                value={formData.remarks || ''}
                onChange={(e) => handleChange('remarks', e.target.value)}
                placeholder="Any additional notes or remarks..."
                className={styles.textarea}
                disabled={loading}
                rows={2}
                maxLength={500}
              />
            </div>

            {/* Profile Picture */}
            <div className={styles.formGroup}>
              <label className={styles.label} htmlFor="profilePicture">
                Profile Picture
              </label>
              <div className={styles.fileUpload}>
                <input
                  id="profilePicture"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        handleChange('profilePicture', reader.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  disabled={loading}
                  className={styles.fileInput}
                />
                <button
                  type="button"
                  className={styles.fileButton}
                  onClick={() => document.getElementById('profilePicture')?.click()}
                  disabled={loading}
                >
                  Change Photo
                </button>
                <span className={styles.fileName}>
                  {formData.profilePicture ? 'File selected' : 'No file chosen'}
                </span>
              </div>
              {(formData.profilePicture || teacher.profilePicture) && (
                <div className={styles.imagePreview}>
                  <img 
                    src={formData.profilePicture || teacher.profilePicture} 
                    alt="Profile preview" 
                    className={styles.previewImage}
                  />
                </div>
              )}
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
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}