import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDestructive = true,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-4 mb-6">
        <div
          className={`p-3 rounded-full shrink-0 ${
            isDestructive
              ? 'bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
              : 'bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
          }`}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
            {message}
          </p>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2 sm:gap-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] text-xs sm:text-sm font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition flex items-center justify-center cursor-pointer"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`w-full sm:w-auto px-5 py-2.5 min-h-[44px] text-xs sm:text-sm font-semibold text-white rounded-xl shadow-xs transition flex items-center justify-center cursor-pointer active:scale-95 ${
            isDestructive
              ? 'bg-rose-600 hover:bg-rose-700'
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
};
