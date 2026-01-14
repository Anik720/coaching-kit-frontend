import { useState } from "react";
import styles from './Teachers.module.css';
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
  onSave: () => void;
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
    systemEmail: teacher.systemEmail,
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
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (name: string, value: any): string => {
    if (!touched[name]) return '';
    
    switch (name) {
      case 'fullName':
        if (!value?.trim()) return 'Full name is required';
        if (value.trim().length < 2) return 'Full name must be at least 2 characters';
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
    }
    
    return '';
  };

  const handleChange = (field: keyof UpdateTeacherDto, value: any) => {
    const updatedFormData = { ...formData, [field]: value };
    setFormData(updatedFormData);
    
    // Update parent component with only the UpdateTeacherDto fields
    onUpdate(updatedFormData);
    
    // Clear error when user starts typing
    if (touched[field] && errors[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
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
      (formData.email?.trim()?.length || 0) > 0 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email || '') &&
      (formData.systemEmail?.trim()?.length || 0) > 0 &&
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
  const getDesignationValues = (): Designation[] => Object.values(Designation) as Designation[];
  const getStatusValues = (): TeacherStatus[] => Object.values(TeacherStatus) as TeacherStatus[];
  const getAssignTypeValues = (): AssignType[] => Object.values(AssignType) as AssignType[];
  const getGenderValues = (): Gender[] => Object.values(Gender) as Gender[];
  const getReligionValues = (): Religion[] => Object.values(Religion) as Religion[];
  const getBloodGroupValues = (): BloodGroup[] => Object.values(BloodGroup) as BloodGroup[];

  // Helper function to format enum values for display
  const formatEnumValue = (value: string): string => {
    return value.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Edit Teacher</h2>
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
        
        <form onSubmit={(e) => { e.preventDefault(); onSave(); }}>
          <div className={styles.modalBody}>
            <div className={styles.sectionTitle}>Basic Information</div>
            <div className={styles.twoColumnForm}>
              <div className={styles.formField}>
                <label className={styles.label} htmlFor="editFullName">
                  Full Name *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="editFullName"
                    type="text"
                    value={formData.fullName || ''}
                    onChange={(e) => handleChange('fullName', e.target.value)}
                    onBlur={() => handleBlur('fullName')}
                    className={`${styles.input} ${
                      errors.fullName ? styles.inputError : ''
                    }`}
                    disabled={loading}
                  />
                  {getValidationIcon('fullName')}
                </div>
                {errors.fullName && (
                  <div className={styles.errorMessage}>{errors.fullName}</div>
                )}
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="editFatherName">
                  Father's Name *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="editFatherName"
                    type="text"
                    value={formData.fatherName || ''}
                    onChange={(e) => handleChange('fatherName', e.target.value)}
                    onBlur={() => handleBlur('fatherName')}
                    className={`${styles.input} ${
                      errors.fatherName ? styles.inputError : ''
                    }`}
                    disabled={loading}
                  />
                  {getValidationIcon('fatherName')}
                </div>
                {errors.fatherName && (
                  <div className={styles.errorMessage}>{errors.fatherName}</div>
                )}
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="editMotherName">
                  Mother's Name *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="editMotherName"
                    type="text"
                    value={formData.motherName || ''}
                    onChange={(e) => handleChange('motherName', e.target.value)}
                    onBlur={() => handleBlur('motherName')}
                    className={`${styles.input} ${
                      errors.motherName ? styles.inputError : ''
                    }`}
                    disabled={loading}
                  />
                  {getValidationIcon('motherName')}
                </div>
                {errors.motherName && (
                  <div className={styles.errorMessage}>{errors.motherName}</div>
                )}
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="editEmail">
                  Personal Email *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="editEmail"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    onBlur={() => handleBlur('email')}
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

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="editSystemEmail">
                  System Email *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="editSystemEmail"
                    type="email"
                    value={formData.systemEmail || ''}
                    onChange={(e) => handleChange('systemEmail', e.target.value)}
                    onBlur={() => handleBlur('systemEmail')}
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

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="editContactNumber">
                  Contact Number *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="editContactNumber"
                    type="tel"
                    value={formData.contactNumber || ''}
                    onChange={(e) => handleChange('contactNumber', e.target.value)}
                    onBlur={() => handleBlur('contactNumber')}
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
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="editEmergencyContactNumber">
                  Emergency Contact *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="editEmergencyContactNumber"
                    type="tel"
                    value={formData.emergencyContactNumber || ''}
                    onChange={(e) => handleChange('emergencyContactNumber', e.target.value)}
                    onBlur={() => handleBlur('emergencyContactNumber')}
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

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="editWhatsappNumber">
                  WhatsApp Number *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="editWhatsappNumber"
                    type="tel"
                    value={formData.whatsappNumber || ''}
                    onChange={(e) => handleChange('whatsappNumber', e.target.value)}
                    onBlur={() => handleBlur('whatsappNumber')}
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

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="editNationalId">
                  National ID *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="editNationalId"
                    type="text"
                    value={formData.nationalId || ''}
                    onChange={(e) => handleChange('nationalId', e.target.value)}
                    onBlur={() => handleBlur('nationalId')}
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

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="editSecondaryEmail">
                  Secondary Email
                </label>
                <input
                  id="editSecondaryEmail"
                  type="email"
                  value={formData.secondaryEmail || ''}
                  onChange={(e) => handleChange('secondaryEmail', e.target.value)}
                  className={styles.input}
                  disabled={loading}
                />
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="editGender">
                  Gender *
                </label>
                <select
                  id="editGender"
                  value={formData.gender || ''}
                  onChange={(e) => handleChange('gender', e.target.value)}
                  className={styles.select}
                  disabled={loading}
                >
                  {getGenderValues().map(gender => (
                    <option key={gender} value={gender}>
                      {formatEnumValue(gender)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="editReligion">
                  Religion *
                </label>
                <select
                  id="editReligion"
                  value={formData.religion || ''}
                  onChange={(e) => handleChange('religion', e.target.value)}
                  className={styles.select}
                  disabled={loading}
                >
                  {getReligionValues().map(religion => (
                    <option key={religion} value={religion}>
                      {formatEnumValue(religion)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="editBloodGroup">
                  Blood Group *
                </label>
                <select
                  id="editBloodGroup"
                  value={formData.bloodGroup || ''}
                  onChange={(e) => handleChange('bloodGroup', e.target.value)}
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

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="editDateOfBirth">
                  Date of Birth *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="editDateOfBirth"
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
            </div>

            <div className={styles.sectionTitle}>Address Information</div>
            <div className={styles.formField}>
              <label className={styles.label} htmlFor="editPresentAddress">
                Present Address *
              </label>
              <textarea
                id="editPresentAddress"
                value={formData.presentAddress || ''}
                onChange={(e) => handleChange('presentAddress', e.target.value)}
                onBlur={() => handleBlur('presentAddress')}
                className={`${styles.textarea} ${
                  errors.presentAddress ? styles.inputError : ''
                }`}
                disabled={loading}
                rows={3}
              />
              {errors.presentAddress && (
                <div className={styles.errorMessage}>{errors.presentAddress}</div>
              )}
            </div>

            <div className={styles.formField}>
              <label className={styles.label} htmlFor="editPermanentAddress">
                Permanent Address *
              </label>
              <textarea
                id="editPermanentAddress"
                value={formData.permanentAddress || ''}
                onChange={(e) => handleChange('permanentAddress', e.target.value)}
                onBlur={() => handleBlur('permanentAddress')}
                className={`${styles.textarea} ${
                  errors.permanentAddress ? styles.inputError : ''
                }`}
                disabled={loading}
                rows={3}
              />
              {errors.permanentAddress && (
                <div className={styles.errorMessage}>{errors.permanentAddress}</div>
              )}
            </div>

            <div className={styles.sectionTitle}>Job Information</div>
            <div className={styles.twoColumnForm}>
              <div className={styles.formField}>
                <label className={styles.label} htmlFor="editDesignation">
                  Designation *
                </label>
                <select
                  id="editDesignation"
                  value={formData.designation || ''}
                  onChange={(e) => handleChange('designation', e.target.value)}
                  className={styles.select}
                  disabled={loading}
                >
                  {getDesignationValues().map(designation => (
                    <option key={designation} value={designation}>
                      {formatEnumValue(designation)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="editAssignType">
                  Assign Type *
                </label>
                <select
                  id="editAssignType"
                  value={formData.assignType || ''}
                  onChange={(e) => handleChange('assignType', e.target.value)}
                  className={styles.select}
                  disabled={loading}
                >
                  {getAssignTypeValues().map(type => (
                    <option key={type} value={type}>
                      {formatEnumValue(type)}
                    </option>
                  ))}
                </select>
              </div>

              {(formData.assignType === AssignType.MONTHLY_BASIS || formData.assignType === AssignType.BOTH) && (
                <>
                  <div className={styles.formField}>
                    <label className={styles.label} htmlFor="editMonthlyTotalClass">
                      Monthly Total Classes
                    </label>
                    <input
                      id="editMonthlyTotalClass"
                      type="number"
                      value={formData.monthlyTotalClass || 0}
                      onChange={(e) => handleChange('monthlyTotalClass', parseInt(e.target.value) || 0)}
                      className={styles.input}
                      disabled={loading}
                      min="0"
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.label} htmlFor="editSalary">
                      Salary (৳)
                    </label>
                    <input
                      id="editSalary"
                      type="number"
                      value={formData.salary || 0}
                      onChange={(e) => handleChange('salary', parseInt(e.target.value) || 0)}
                      className={styles.input}
                      disabled={loading}
                      min="0"
                    />
                  </div>
                </>
              )}

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="editJoiningDate">
                  Joining Date *
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id="editJoiningDate"
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

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="editStatus">
                  Status *
                </label>
                <select
                  id="editStatus"
                  value={formData.status || ''}
                  onChange={(e) => handleChange('status', e.target.value)}
                  className={styles.select}
                  disabled={loading}
                >
                  {getStatusValues().map(status => (
                    <option key={status} value={status}>
                      {formatEnumValue(status)}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formField}>
                <label className={styles.label} htmlFor="editIsActive">
                  Active Status *
                </label>
                <select
                  id="editIsActive"
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

            <div className={styles.formField}>
              <label className={styles.label} htmlFor="editRemarks">
                Remarks
              </label>
              <textarea
                id="editRemarks"
                value={formData.remarks || ''}
                onChange={(e) => handleChange('remarks', e.target.value)}
                className={styles.textarea}
                disabled={loading}
                rows={3}
              />
            </div>

            {/* Verification Status */}
            <div className={styles.sectionTitle}>Verification Status</div>
            <div className={styles.twoColumnForm}>
              <div className={styles.formField}>
                <div className={styles.label}>Email Verification</div>
                <div className={styles.verificationStatus}>
                  <span className={`${styles.verificationBadge} ${teacher.isEmailVerified ? styles.verified : styles.unverified}`}>
                    {teacher.isEmailVerified ? '✓ Verified' : '✗ Unverified'}
                  </span>
                  {!teacher.isEmailVerified && (
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

              <div className={styles.formField}>
                <div className={styles.label}>Phone Verification</div>
                <div className={styles.verificationStatus}>
                  <span className={`${styles.verificationBadge} ${teacher.isPhoneVerified ? styles.verified : styles.unverified}`}>
                    {teacher.isPhoneVerified ? '✓ Verified' : '✗ Unverified'}
                  </span>
                  {!teacher.isPhoneVerified && (
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