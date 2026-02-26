"use client";

import React from "react";
import { X } from "lucide-react";

interface ImagePreviewModalProps {
  isOpen: boolean;
  imagePath: string;
  imageAlt: string;
  onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  imagePath,
  imageAlt,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-black/40 text-white transition-colors z-10"
          aria-label="Close image preview"
        >
          <X size={28} />
        </button>

        {/* Image Container */}
        <div className="w-full h-full flex items-center justify-center">
          <img
            src={`/api/images/resolve?path=${imagePath}`}
            alt={imageAlt}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          />
        </div>

        {/* Click to close instruction */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm opacity-70">
          Click outside or press ESC to close
        </div>
      </div>
    </div>
  );
};

export default ImagePreviewModal;
