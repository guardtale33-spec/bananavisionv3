import React from "react";
import { X } from "lucide-react";

export default function ConfirmDialog({
  open,
  title = "Konfirmasi",
  description = "",
  onCancel,
  onConfirm,
  confirmText = "Hapus",
  cancelText = "Batal",
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel && onCancel();
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b">
          <h3 className="font-bold text-gray-800">{title}</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 text-sm text-gray-600">{description}</div>

        <div className="flex gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl bg-white border border-gray-200 font-medium hover:bg-gray-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold hover:bg-red-500"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
