"use client";

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store/store";
import { 
  fetchAdmissionTemplates, 
  createAdmissionTemplate, 
  updateAdmissionTemplate, 
  deleteAdmissionTemplate,
  clearSuccess, 
  clearError 
} from "@/api/admissionApi/admissionSlice";
import { FormFields, AdmissionTemplate } from "@/api/admissionApi/types/admission.types";
import { toastManager } from "@/utils/toastConfig";
import styles from './AdmissionTemplates.module.css';

// Default schema fallback
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

export default function AdmissionTemplatesPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { templates, loading, success, error } = useSelector((state: RootState) => state.admission);
  
  const [view, setView] = useState<'list' | 'form'>('list');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("");
  const [description, setDescription] = useState("");
  const [localFields, setLocalFields] = useState<FormFields>(defaultFields);

  useEffect(() => {
    dispatch(fetchAdmissionTemplates());
  }, [dispatch]);

  useEffect(() => {
    if (success) {
      if (view === 'form') {
        toastManager.showSuccess(currentId ? "Template updated successfully!" : "Template created successfully!");
        setView('list');
      }
      dispatch(clearSuccess());
    }
    if (error) {
      toastManager.showError(error);
      dispatch(clearError());
    }
  }, [success, error, dispatch, view, currentId]);

  const handleCreateNew = () => {
    setCurrentId(null);
    setTemplateName("");
    setDescription("");
    setLocalFields(defaultFields);
    setView('form');
  };

  const handleEdit = (template: AdmissionTemplate) => {
    setCurrentId(template._id);
    setTemplateName(template.templateName);
    setDescription(template.description || "");
    setLocalFields(template.fields);
    setView('form');
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      dispatch(deleteAdmissionTemplate(id));
    }
  };

  const handleToggle = (fieldKey: keyof FormFields, type: 'isVisible' | 'isRequired') => {
    setLocalFields(prev => {
      const currentField = prev[fieldKey];
      const updatedField = { ...currentField, [type]: !currentField[type] };

      if (type === 'isVisible' && !updatedField.isVisible) updatedField.isRequired = false;
      if (type === 'isRequired' && updatedField.isRequired) updatedField.isVisible = true;

      return { ...prev, [fieldKey]: updatedField };
    });
  };

  const handleSave = () => {
    if (!templateName.trim()) {
      toastManager.showError("Template Name is required");
      return;
    }

    const payload = {
      templateName,
      description,
      fields: localFields
    };

    if (currentId) {
      dispatch(updateAdmissionTemplate({ id: currentId, data: payload }));
    } else {
      dispatch(createAdmissionTemplate(payload));
    }
  };

  if (loading && templates.length === 0 && view === 'list') {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinnerLarge}></div>
        <p>Loading templates...</p>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Admission Templates</h1>
          <p className={styles.pageSubtitle}>Manage specific form structures for different courses or batches</p>
        </div>
        {view === 'list' && (
          <button className={styles.btnPrimary} onClick={handleCreateNew}>
            + Create Template
          </button>
        )}
      </div>

      {view === 'list' ? (
        <>
          {templates.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📋</div>
              <h3>No Templates Found</h3>
              <p>You haven't created any specific admission templates yet.</p>
              <button className={styles.btnPrimary} style={{ margin: '0 auto' }} onClick={handleCreateNew}>
                Create Your First Template
              </button>
            </div>
          ) : (
            <div className={styles.templatesGrid}>
              {templates.map(template => (
                <div key={template._id} className={styles.templateCard}>
                  <div>
                    <h3 className={styles.templateName}>{template.templateName}</h3>
                    <p className={styles.templateDesc}>{template.description || "No description provided."}</p>
                  </div>
                  <div className={styles.templateActions}>
                    <button className={styles.btnEdit} onClick={() => handleEdit(template)}>✏️ Edit</button>
                    <button className={styles.btnDelete} onClick={() => handleDelete(template._id)}>🗑️ Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className={styles.settingsCard}>
          <div className={styles.formGroup}>
            <label>Template Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input 
              type="text" 
              className={styles.input} 
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., Admission Test 2026"
            />
          </div>
          <div className={styles.formGroup}>
            <label>Description (Optional)</label>
            <textarea 
              className={styles.textarea} 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this template for?"
              rows={2}
            />
          </div>

          <h3 style={{ marginTop: '32px', marginBottom: '16px', color: '#1f2937', fontSize: '18px' }}>
            Configure Fields for this Template
          </h3>

          <div className={styles.fieldsList}>
            {(Object.keys(fieldLabels) as Array<keyof FormFields>).map((key) => {
              const fieldSetting = localFields[key];
              return (
                <div key={key} className={styles.fieldRow}>
                  <div className={styles.fieldInfo}>
                    <h3 className={styles.fieldName}>{fieldLabels[key].label}</h3>
                    <p className={styles.fieldDesc}>{fieldLabels[key].desc}</p>
                  </div>
                  <div className={styles.controls}>
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

          <div className={styles.formActions}>
            <button 
              className={styles.btnSecondary} 
              onClick={() => setView('list')}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              className={styles.btnPrimary} 
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? <><span className={styles.spinnerSmall}></span> Saving...</> : 'Save Template'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}