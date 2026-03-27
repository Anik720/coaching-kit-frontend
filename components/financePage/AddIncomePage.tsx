"use client";
import { useState, useRef, ChangeEvent, useEffect } from "react";
import { useFinance } from "@/hooks/useFinance";
import { toastManager } from "@/utils/toastConfig";
import styles from "@/components/employeePage/Employee.module.css";
import Link from "next/link";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "mobile_banking", label: "Mobile Banking" },
  { value: "cheque", label: "Cheque" },
  { value: "other", label: "Other" },
];

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function AddIncomePage() {
  const {
    categories,
    todayIncomes,
    todayIncomeTotal,
    incomeLoading,
    fetchCategories,
    fetchTodayIncome,
    createIncome,
    deleteIncome,
  } = useFinance();

  const [form, setForm] = useState({
    category: "",
    incomeName: "",
    date: "",
    amount: "",
    paymentMethod: "cash",
    walletOrAccountNo: "",
    receivedBy: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [docFile, setDocFile] = useState<File | null>(null);
  const [docPreview, setDocPreview] = useState<{
    url: string;
    type: "image" | "pdf";
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchCategories({ type: "income", status: "published" });
    fetchTodayIncome();
  }, []);

  const incomeCategories = categories.filter((c) => c.type === "income");

  const handleChange =
    (field: string) =>
    (
      e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toastManager.showError("File must be under 10 MB");
      return;
    }
    setDocFile(file);
    const isPdf = file.type === "application/pdf";
    if (isPdf) {
      setDocPreview({ url: file.name, type: "pdf" });
    } else {
      const reader = new FileReader();
      reader.onload = (ev) =>
        setDocPreview({
          url: ev.target?.result as string,
          type: "image",
        });
      reader.readAsDataURL(file);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.category) errs.category = "Category is required";
    if (!form.incomeName.trim()) errs.incomeName = "Income name is required";
    if (!form.date) errs.date = "Date is required";
    if (
      !form.amount ||
      isNaN(Number(form.amount)) ||
      Number(form.amount) < 0
    )
      errs.amount = "Valid amount is required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      toastManager.showError("Please fix the errors");
      return;
    }
    setSubmitting(true);
    const tid = toastManager.showLoading("Creating income record...");
    try {
      const fd = new FormData();
      fd.append("category", form.category);
      fd.append("incomeName", form.incomeName.trim());
      fd.append("date", form.date);
      fd.append("amount", form.amount);
      fd.append("paymentMethod", form.paymentMethod);
      if (form.walletOrAccountNo.trim())
        fd.append("walletOrAccountNo", form.walletOrAccountNo.trim());
      if (form.receivedBy.trim())
        fd.append("receivedBy", form.receivedBy.trim());
      if (form.description.trim())
        fd.append("description", form.description.trim());
      if (docFile) fd.append("document", docFile);

      const result = await createIncome(fd);
      // @ts-ignore
      if (result?.type?.endsWith("/rejected"))
        throw new Error(result.payload as string || "Failed");

      toastManager.safeUpdateToast(tid, "Income record created!", "success");
      setForm({
        category: "",
        incomeName: "",
        date: "",
        amount: "",
        paymentMethod: "cash",
        walletOrAccountNo: "",
        receivedBy: "",
        description: "",
      });
      setDocFile(null);
      setDocPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchTodayIncome();
    } catch (err: any) {
      toastManager.safeUpdateToast(tid, err.message || "Failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this income record?")) return;
    const tid = toastManager.showLoading("Deleting...");
    try {
      await deleteIncome(id);
      toastManager.safeUpdateToast(tid, "Deleted!", "success");
      fetchTodayIncome();
    } catch {
      toastManager.safeUpdateToast(tid, "Failed to delete", "error");
    }
  };

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString() : "-";
  const formatAmount = (n: number) => `৳ ${n?.toLocaleString() || 0}`;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.headerText}>
          <h1>Add Income Report</h1>
          <p>Record a new income transaction</p>
        </div>
        <Link
          href="/dashboard/finance/income/report"
          className={styles.btnSecondary}
        >
          📋 Income Report
        </Link>
      </div>

      {/* ── Form Card ── */}
      <div className={styles.sectionCard}>
        <div className={styles.formGrid}>
          {/* Category */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>* Select Category</label>
            <select
              className={`${styles.formSelect} ${errors.category ? styles.error : ""}`}
              value={form.category}
              onChange={handleChange("category")}
            >
              <option value="">Select Category</option>
              {incomeCategories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.categoryName}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className={styles.fieldError}>{errors.category}</p>
            )}
          </div>

          {/* Income Name */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>* Income Name</label>
            <input
              type="text"
              className={`${styles.formInput} ${errors.incomeName ? styles.error : ""}`}
              value={form.incomeName}
              onChange={handleChange("incomeName")}
              placeholder="Income name"
            />
            {errors.incomeName && (
              <p className={styles.fieldError}>{errors.incomeName}</p>
            )}
          </div>

          {/* Date */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>* Date</label>
            <input
              type="date"
              className={`${styles.formInput} ${errors.date ? styles.error : ""}`}
              value={form.date}
              onChange={handleChange("date")}
            />
            {errors.date && (
              <p className={styles.fieldError}>{errors.date}</p>
            )}
          </div>

          {/* Amount */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>* Amount</label>
            <input
              type="number"
              className={`${styles.formInput} ${errors.amount ? styles.error : ""}`}
              value={form.amount}
              onChange={handleChange("amount")}
              placeholder="0"
              min="0"
            />
            {errors.amount && (
              <p className={styles.fieldError}>{errors.amount}</p>
            )}
          </div>

          {/* Payment Method */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Payment Method</label>
            <select
              className={styles.formSelect}
              value={form.paymentMethod}
              onChange={handleChange("paymentMethod")}
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Wallet / AC No */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Wallet No / AC No</label>
            <input
              type="text"
              className={styles.formInput}
              value={form.walletOrAccountNo}
              onChange={handleChange("walletOrAccountNo")}
              placeholder="Account or wallet number"
            />
          </div>

          {/* Received By */}
          <div className={styles.formField}>
            <label className={styles.formLabel}>Received By</label>
            <input
              type="text"
              className={styles.formInput}
              value={form.receivedBy}
              onChange={handleChange("receivedBy")}
              placeholder="Received by name"
            />
          </div>

          {/* Document Upload */}
          <div className={styles.formFieldFull}>
            <label className={styles.formLabel}>Add Document</label>
            <div className={styles.profilePictureSection}>
              {docPreview && (
                <div className={styles.profilePreview}>
                  {docPreview.type === "image" ? (
                    <img
                      src={docPreview.url}
                      alt="Document preview"
                      className={styles.profilePreviewImg}
                    />
                  ) : (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 4,
                        padding: 8,
                      }}
                    >
                      <span style={{ fontSize: 28 }}>📄</span>
                      <span
                        style={{
                          fontSize: 11,
                          color: "#6b7280",
                          wordBreak: "break-all",
                          textAlign: "center",
                          maxWidth: 100,
                        }}
                      >
                        {docPreview.url}
                      </span>
                    </div>
                  )}
                </div>
              )}
              <div className={styles.fileInputWrapper}>
                <label
                  className={styles.fileInputLabel}
                  htmlFor="docInput"
                >
                  📎 Choose File
                  {docFile ? ` — ${docFile.name}` : " — No file chosen"}
                </label>
                <input
                  id="docInput"
                  type="file"
                  ref={fileInputRef}
                  className={styles.fileInput}
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf"
                  onChange={handleFileChange}
                />
                <span className={styles.fileHint}>
                  JPG, PNG, GIF, WEBP, PDF — max 10 MB
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className={styles.formFieldFull}>
            <label className={styles.formLabel}>Description</label>
            <textarea
              className={styles.formTextarea}
              value={form.description}
              onChange={handleChange("description")}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
        </div>

        <div className={styles.formActions} style={{ marginTop: 20 }}>
          <button
            className={styles.btnPrimary}
            onClick={handleSubmit}
            disabled={submitting || incomeLoading}
          >
            {submitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </div>

      {/* ── Today's Report ── */}
      <div className={styles.tableCard} style={{ marginTop: 24 }}>
        <div className={styles.tableHeader}>
          <div>
            <h2 className={styles.tableTitle}>Today's Income Report</h2>
            <span
              style={{
                background: "#1d4ed8",
                color: "white",
                padding: "4px 14px",
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 700,
                display: "inline-block",
                marginTop: 6,
              }}
            >
              Total Amount = {formatAmount(todayIncomeTotal)}
            </span>
          </div>
          <Link
            href="/dashboard/finance/income/report"
            className={styles.btnSecondary}
            style={{ fontSize: 13, padding: "8px 16px" }}
          >
            Full Report
          </Link>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Income Name</th>
                <th>Category</th>
                <th>Description</th>
                <th>Amount</th>
                <th>Transaction ID</th>
                <th>Payment Method</th>
                <th>Wallet/AC No</th>
                <th>Received By</th>
                <th>Date</th>
                <th>Created At</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {todayIncomes.length === 0 ? (
                <tr>
                  <td
                    colSpan={13}
                    style={{
                      padding: "30px",
                      textAlign: "center",
                      color: "#9ca3af",
                    }}
                  >
                    No Transaction Found Today!
                  </td>
                </tr>
              ) : (
                todayIncomes.map((inc, i) => (
                  <tr key={inc._id}>
                    <td>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{inc.incomeName}</td>
                    <td>{inc.categoryInfo?.categoryName || "-"}</td>
                    <td>{inc.description || "-"}</td>
                    <td style={{ fontWeight: 600, color: "#059669" }}>
                      {formatAmount(inc.amount)}
                    </td>
                    <td style={{ fontSize: 12 }}>
                      {inc.transactionId || "-"}
                    </td>
                    <td style={{ textTransform: "capitalize" }}>
                      {inc.paymentMethod?.replace("_", " ")}
                    </td>
                    <td>{inc.walletOrAccountNo || "-"}</td>
                    <td>
                      {typeof inc.receivedBy === "object"
                        ? inc.receivedBy?.username ||
                          inc.receivedBy?.email ||
                          "-"
                        : inc.receivedBy || "-"}
                    </td>
                    <td>{formatDate(inc.date)}</td>
                    <td>{formatDate(inc.createdAt)}</td>
                    <td>
                      <span
                        style={{
                          background:
                            inc.status === "approved"
                              ? "#d1fae5"
                              : "#fef3c7",
                          color:
                            inc.status === "approved"
                              ? "#065f46"
                              : "#92400e",
                          padding: "2px 8px",
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 600,
                          textTransform: "capitalize",
                        }}
                      >
                        {inc.status}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionGroup}>
                        {inc.document && (
                          <a
                            href={`${BASE_URL}${inc.document}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.actionBtnView}
                            style={{ marginRight: 4 }}
                            title="View Document"
                          >
                            📎
                          </a>
                        )}
                        <button
                          className={styles.actionBtnDelete}
                          onClick={() => handleDelete(inc._id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
