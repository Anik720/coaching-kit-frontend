import { cn } from "@/lib/utils";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
// import { XMarkIcon } from "@heroicons/react/24/outline";


interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
}

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  const sizes = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
  };

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop 
        transition
        className="fixed inset-0 bg-black/30 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in"
      />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel 
          transition
          className={cn(
            "w-full bg-white rounded-2xl shadow-xl transition-transform duration-300",
            "data-[closed]:scale-95 data-[closed]:opacity-0",
            "data-[enter]:duration-300 data-[leave]:duration-200",
            "data-[enter]:ease-out data-[leave]:ease-in",
            sizes[size]
          )}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              {title}
            </DialogTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {/* <XMarkIcon className="w-5 h-5" /> */}
            </button>
          </div>
          
          <div className="p-6">
            {children}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}