'use client';

import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Yes, confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmationDialogProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconColor: 'text-red-500',
          buttonColor: 'bg-red-500 hover:bg-red-600',
          borderColor: 'border-red-200',
          bgColor: 'bg-red-50'
        };
      case 'warning':
        return {
          iconColor: 'text-amber-500',
          buttonColor: 'bg-amber-500 hover:bg-amber-600',
          borderColor: 'border-amber-200',
          bgColor: 'bg-amber-50'
        };
      case 'info':
      default:
        return {
          iconColor: 'text-blue-500',
          buttonColor: 'bg-blue-500 hover:bg-blue-600',
          borderColor: 'border-blue-200',
          bgColor: 'bg-blue-50'
        };
    }
  };

  const styles = getVariantStyles();

  if (!isOpen) return null;

  return (
    <AlertDialog.Root open={isOpen} onOpenChange={onClose}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md p-6 bg-white rounded-2xl border border-slate-200 shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${styles.bgColor} border ${styles.borderColor}`}>
                <AlertTriangle className={`h-5 w-5 ${styles.iconColor}`} />
              </div>
              <AlertDialog.Title className="text-lg font-bold leading-6 text-slate-900">
                {title}
              </AlertDialog.Title>
            </div>
          </div>

          <div className="mt-2">
            <p className="text-sm text-slate-600">
              {message}
            </p>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                className="px-4 py-2 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                {cancelText}
              </button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <button
                type="button"
                className={`px-4 py-2 text-sm font-bold text-white rounded-lg transition-colors ${styles.buttonColor}`}
                onClick={onConfirm}
              >
                {confirmText}
              </button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}