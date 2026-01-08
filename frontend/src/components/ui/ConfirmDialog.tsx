import { AlertTriangle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Button from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  const variantStyles = {
    danger: 'border-red-200 dark:border-red-800',
    warning: 'border-yellow-200 dark:border-yellow-800',
    default: 'border-gray-200 dark:border-gray-700',
  };

  const iconColors = {
    danger: 'text-red-600 dark:text-red-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    default: 'text-blue-600 dark:text-blue-400',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div
        className={`relative bg-white dark:bg-gray-800 rounded-xl border ${variantStyles[variant]} shadow-xl max-w-md w-full p-6 space-y-4`}
      >
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 ${iconColors[variant]}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {message}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="ghost" onClick={onCancel}>
            {cancelText || t('common.cancel')}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : variant === 'warning' ? 'primary' : 'primary'}
            onClick={onConfirm}
          >
            {confirmText || t('common.confirm')}
          </Button>
        </div>
      </div>
    </div>
  );
}
