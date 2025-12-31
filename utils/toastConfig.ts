"use client";

import { ToastOptions, toast, Id } from "react-toastify";

// Toast configuration options
const toastConfig: ToastOptions = {
  position: "top-right",
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "light",
  style: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    borderRadius: "12px",
    fontSize: "14px",
    fontWeight: "500",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
    border: "1px solid rgba(0, 0, 0, 0.05)",
    padding: "16px",
  },
};

// Custom toast styles
const toastStyles = {
  success: {
    background: "linear-gradient(135deg, #10b981 0%, #34d399 100%)",
    color: "white",
  },
  error: {
    background: "linear-gradient(135deg, #ef4444 0%, #f87171 100%)",
    color: "white",
  },
  warning: {
    background: "linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)",
    color: "white",
  },
  info: {
    background: "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
    color: "white",
  },
  loading: {
    background: "linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)",
    color: "white",
  },
};

// Toast manager to prevent duplicate toasts
class ToastManager {
  private activeToasts = new Map<string, Id>();

  showSuccess(message: string, options?: ToastOptions): Id {
    const id = `success-${message}`;
    if (this.activeToasts.has(id)) {
      return this.activeToasts.get(id)!;
    }

    const toastId = toast.success(message, {
      ...toastConfig,
      ...options,
      style: { ...toastConfig.style, ...toastStyles.success },
      onClose: () => this.activeToasts.delete(id),
    });

    this.activeToasts.set(id, toastId);
    return toastId;
  }

  showError(message: string, options?: ToastOptions): Id {
    const id = `error-${message}`;
    if (this.activeToasts.has(id)) {
      return this.activeToasts.get(id)!;
    }

    const toastId = toast.error(message, {
      ...toastConfig,
      ...options,
      style: { ...toastConfig.style, ...toastStyles.error },
      onClose: () => this.activeToasts.delete(id),
    });

    this.activeToasts.set(id, toastId);
    return toastId;
  }

  showWarning(message: string, options?: ToastOptions): Id {
    const id = `warning-${message}`;
    if (this.activeToasts.has(id)) {
      return this.activeToasts.get(id)!;
    }

    const toastId = toast.warning(message, {
      ...toastConfig,
      ...options,
      style: { ...toastConfig.style, ...toastStyles.warning },
      onClose: () => this.activeToasts.delete(id),
    });

    this.activeToasts.set(id, toastId);
    return toastId;
  }

  showInfo(message: string, options?: ToastOptions): Id {
    const id = `info-${message}`;
    if (this.activeToasts.has(id)) {
      return this.activeToasts.get(id)!;
    }

    const toastId = toast.info(message, {
      ...toastConfig,
      ...options,
      style: { ...toastConfig.style, ...toastStyles.info },
      onClose: () => this.activeToasts.delete(id),
    });

    this.activeToasts.set(id, toastId);
    return toastId;
  }

  showLoading(message: string, options?: ToastOptions): Id {
    const id = `loading-${message}`;
    if (this.activeToasts.has(id)) {
      return this.activeToasts.get(id)!;
    }

    const toastId = toast.loading(message, {
      ...toastConfig,
      ...options,
      style: { ...toastConfig.style, ...toastStyles.loading },
      onClose: () => this.activeToasts.delete(id),
    });

    this.activeToasts.set(id, toastId);
    return toastId;
  }

  updateToast(
    toastId: Id | undefined, 
    message: string, 
    type: 'success' | 'error' | 'warning' | 'info' = 'success'
  ): void {
    if (!toastId) {
      // If no toastId, show a new toast instead
      if (type === 'success') {
        this.showSuccess(message);
      } else if (type === 'error') {
        this.showError(message);
      } else if (type === 'warning') {
        this.showWarning(message);
      } else {
        this.showInfo(message);
      }
      return;
    }

    const style = toastStyles[type] || toastStyles.success;
    
    toast.update(toastId, {
      render: message,
      type,
      isLoading: false,
      autoClose: 3000,
      style: { ...toastConfig.style, ...style },
    });
  }

  dismissToast(toastId: Id): void {
    toast.dismiss(toastId);
  }

  dismissAll(): void {
    toast.dismiss();
    this.activeToasts.clear();
  }

  // Helper method to safely update toast with null check
  safeUpdateToast(
    toastId: Id | undefined, 
    message: string, 
    type: 'success' | 'error' | 'warning' | 'info' = 'success'
  ): void {
    if (toastId) {
      this.updateToast(toastId, message, type);
    } else {
      // Fallback to showing a new toast
      if (type === 'success') {
        this.showSuccess(message);
      } else if (type === 'error') {
        this.showError(message);
      } else if (type === 'warning') {
        this.showWarning(message);
      } else {
        this.showInfo(message);
      }
    }
  }
}

export const toastManager = new ToastManager();