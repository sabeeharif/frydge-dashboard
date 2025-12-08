import React from "react";

const DeleteModal = ({ open, onClose, onDelete }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="w-[350px] bg-white rounded-[20px] p-6 shadow-lg flex flex-col items-center gap-5">
        {/* Title */}
        <p className="text-black text-center font-[Montserrat] text-[20px] font-semibold">
          Are you sure?
        </p>

        {/* Subtitle */}
        <p className="text-[rgba(0,0,0,0.6)] text-center font-[Montserrat] text-[14px] leading-[100%]">
          Do you really want to delete this? This action cannot be undone.
        </p>

        {/* Buttons */}
        <div className="flex gap-4 mt-4">
          <button
            onClick={onClose}
            className="w-[120px] h-[45px] rounded-[50px] border-[2px] border-[#00B69D] text-[#00B69D] font-[Montserrat] font-medium text-[16px]"
          >
            Cancel
          </button>

          <button
            onClick={onDelete}
            className="w-[120px] h-[45px] rounded-[50px] bg-red-500 text-white font-[Montserrat] font-medium text-[16px]"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteModal;
