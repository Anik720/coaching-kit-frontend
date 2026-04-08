"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { fetchAdmissionSettings, updateAdmissionSettings, clearSuccess, clearError } from "@/api/admissionApi/admissionSlice";
import { FormFields } from "@/api/admissionApi/types/admission.types";
import { toastManager } from "@/utils/toastConfig";
import styles from './AdmissionSettings.module.css';

// Default schema fallback matching backend
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

// UI Mapping for friendly labels
const fieldLabels: Record<keyof FormFields, { label: string; desc: string }> = {
  nameNative: { label: "Student Name (Bangla)", desc: "Native language name field" },
  studentDateOfBirth: { label: "Date of Birth", desc: "Student's birth date" },
  studentMobileNumber: { label: "Student Mobile", desc: "Student's personal contact number" },
  whatsappMobile: { label: "WhatsApp Number", desc: "WhatsApp contact number" },
  fathersName: { label: "Father's Name", desc: "Name of the student's father" },
  mothersName: { label: "Mother's Name", desc: "Name of the student's mother" },
  motherMobileNumber: { label: "Mother's Mobile", desc: "Mother's contact number" },
  presentAddress: { label: "Present Address", desc: "Current living address" },
  permanentAddress: { label: "Permanent Address", desc: "Permanent home address" },
  photo: { label: "Student Photo", desc: "Image upload field for student profile" },
  referBy: { label: "Referred By", desc: "Reference or marketing source" },
  remarks: { label: "Remarks", desc: "Additional notes or comments" },
};

export default function AdmissionSettingsPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { settings, loading, success, error } = useSelector((state: RootState) => state.admission);
  
  const [localFields, setLocalFields] = useState<FormFields>(defaultFields);

  useEffect(() => {
    dispatch(fetchAdmissionSettings());
  }, [dispatch]);

  useEffect(() => {
    if (settings && settings.fields) {
      setLocalFields(settings.fields);
    }
  }, [settings]);

  useEffect(() => {
    if (success) {
      toastManager.showSuccess("Settings updated successfully!");
      dispatch(clearSuccess());
    }
    if (error) {
      toastManager.showError(error);
      dispatch(clearError());
    }
  }, [success, error, dispatch]);

  const handleToggle = (fieldKey: keyof FormFields, type: 'isVisible' | 'isRequired') => {
    setLocalFields(prev => {
      const currentField = prev[fieldKey];
      const updatedField = { ...currentField, [type]: !currentField[type] };

      // Logical constraint: If a field is hidden, it cannot be required
      if (type === 'isVisible' && !updatedField.isVisible) {
        updatedField.isRequired = false;
      }
      // Logical constraint: If a field is required, it must be visible
      if (type === 'isRequired' && updatedField.isRequired) {
        updatedField.isVisible = true;
      }

      return {
        ...prev,
        [fieldKey]: updatedField
      };
    });
  };

  const handleSave = () => {
    dispatch(updateAdmissionSettings(localFields));
  };

  if (loading && !settings) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinnerLarge}></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Form Settings</h1>
          <p className={styles.pageSubtitle}>Customize which fields appear on the admission form</p>
        </div>
      </div>

      <div className={styles.settingsCard}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>Dynamic Fields Configuration</h2>
          <button 
            className={styles.btnSave} 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? <><span className={styles.spinnerSmall}></span> Saving...</> : 'Save Changes'}
          </button>
        </div>

        <div className={styles.fieldsList}>
          {(Object.keys(fieldLabels) as Array<keyof FormFields>).map((key) => {
            const fieldSetting = localFields[key] || defaultFields[key];
            
            return (
              <div key={key} className={styles.fieldRow}>
                <div className={styles.fieldInfo}>
                  <h3 className={styles.fieldName}>{fieldLabels[key].label}</h3>
                  <p className={styles.fieldDesc}>{fieldLabels[key].desc}</p>
                </div>
                
                <div className={styles.controls}>
                  {/* Visible Toggle */}
                  <div className={styles.controlGroup}>
                    <span className={styles.controlLabel}>Visible</span>
                    <label className={styles.toggleSwitch}>
                      <input 
                        type="checkbox" 
                        checked={fieldSetting.isVisible}
                        onChange={() => handleToggle(key, 'isVisible')}
                        disabled={loading}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>

                  {/* Required Toggle */}
                  <div className={styles.controlGroup}>
                    <span className={styles.controlLabel}>Required</span>
                    <label className={styles.toggleSwitch}>
                      <input 
                        type="checkbox" 
                        checked={fieldSetting.isRequired}
                        onChange={() => handleToggle(key, 'isRequired')}
                        disabled={loading || !fieldSetting.isVisible}
                      />
                      <span className={styles.slider}></span>
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}