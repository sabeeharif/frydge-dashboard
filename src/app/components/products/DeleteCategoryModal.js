import { Loader2 } from "lucide-react";
import React from "react";

const DeleteCategoryModal = ({ open, onClose, onDelete,isLoading,setIsLoading }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4">
      <div className="bg-white w-full sm:w-[350px] rounded-t-2xl sm:rounded-[20px] p-4 sm:p-6 shadow-lg flex flex-col items-center gap-4 sm:gap-5 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-6">
        <div className="flex justify-center sm:hidden w-full pt-1 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Title */}
        <p className="text-black text-center font-[Montserrat] text-base sm:text-[20px] font-semibold">
          Are you sure?
        </p>

        {/* Subtitle */}
        <p className="text-[rgba(0,0,0,0.6)] text-center font-[Montserrat] text-sm sm:text-[14px] leading-relaxed px-1">
          Do you really want to delete this? This action cannot be undone.
        </p>

        {/* Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-4 mt-2 sm:mt-4 w-full sm:w-auto">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-[120px] h-[42px] sm:h-[45px] rounded-[50px] border-[2px] border-[#00B69D] text-[#00B69D] font-[Montserrat] font-medium text-sm sm:text-[16px]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onDelete}
            className="w-full sm:w-[120px] flex h-[42px] sm:h-[45px] rounded-[50px] justify-center items-center gap-2 bg-red-500 text-white font-[Montserrat] font-medium text-sm sm:text-[16px]"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteCategoryModal;
