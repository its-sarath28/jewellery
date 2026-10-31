import { Trash2 } from "lucide-react";
import React from "react";

export interface DeleteConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  item: {
    type: "product" | "category";
    id: string;
    name: string;
  } | null;
}

export default function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  item,
}: DeleteConfirmDialogProps) {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#e3ded6] shadow-2xl max-w-sm w-full p-6 text-center animate-fade-in">
        <div className="w-11 h-11 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3.5">
          <Trash2 size={20} />
        </div>

        <h4 className="font-serif text-lg font-normal text-neutral-900 mb-1">
          Delete {item.type === "product" ? "Product" : "Category"}?
        </h4>

        <p className="text-xs text-neutral-500 font-light leading-relaxed mb-6">
          Are you sure you want to remove{" "}
          <strong className="font-medium text-neutral-800">
            "{item.name}"
          </strong>
          ? This action cannot be reversed.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-[#d9cfc1] text-xs uppercase tracking-wider font-medium text-neutral-700 hover:bg-[#f7f4ee] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2 bg-red-700 hover:bg-red-800 text-white text-xs uppercase tracking-wider font-medium shadow-xs cursor-pointer"
          >
            Confirm Delete
          </button>
        </div>
      </div>
    </div>
  );
}
