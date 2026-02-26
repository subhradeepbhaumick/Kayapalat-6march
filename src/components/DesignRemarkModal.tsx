"use client";

import React from "react";
import { DesignComment } from "@/types";

interface DesignRemarkModalProps {
  isOpen: boolean;
  comments: DesignComment[];
  currentComment: string;
  setCurrentComment: (comment: string) => void;
  onSave: () => void;
  onClose: () => void;
  loading?: boolean;
  viewOnly?: boolean;
  locked?: boolean;
}

const DesignRemarkModal: React.FC<DesignRemarkModalProps> = ({
  isOpen,
  comments,
  currentComment,
  setCurrentComment,
  onSave,
  onClose,
  loading = false,
  viewOnly = false,
  locked = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="p-4 border-b border-gray-100 shrink-0 flex justify-between items-center bg-white">
            <h2 className="text-lg md:text-xl font-semibold text-[#295A47]">Design Comments</h2>
            <button
              onClick={onClose}
              className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto flex-1 min-h-0 bg-white">
            {loading ? (
            <div className="flex flex-col items-center justify-center py-8 border border-gray-100 rounded-lg bg-gray-50 h-full">
                <div className="w-6 h-6 border-2 border-[#295A47] border-t-transparent rounded-full animate-spin mb-2"></div>
                <p className="text-gray-500 text-sm">Loading comments...</p>
            </div>
            ) : comments.length > 0 ? (
            <div className="space-y-3">
                {comments.map((c) => (
                <div
                    key={c.id}
                    className="bg-gray-50 p-3 rounded-lg border border-gray-100 hover:border-green-100 transition-colors"
                >
                    <div className="flex justify-between items-start mb-1.5">
                        <span className="text-xs font-medium text-[#295A47] bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                            {c.date}
                        </span>
                        <span className="text-xs text-gray-400">{c.time}</span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{c.comment}</p>
                </div>
                ))}
            </div>
            ) : (
            <div className="flex flex-col items-center justify-center py-10 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200 h-full">
                <p className="text-sm">No comments yet.</p>
            </div>
            )}
        </div>

        {/* Footer / Input Area */}
        {!viewOnly && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 shrink-0">
              {locked ? (
                <div className="text-center py-4">
                  <p className="text-red-600 font-medium mb-2">Comments Locked</p>
                  <p className="text-sm text-gray-600">Maximum revisions reached. No further comments can be added.</p>
                </div>
              ) : (
                <>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5 uppercase tracking-wide">Add New Comment</label>
                  <textarea
                  value={currentComment}
                  onChange={(e) => setCurrentComment(e.target.value)}
                  placeholder="Enter your comment about the changes required..."
                  className="w-full p-3 border border-gray-300 rounded-lg mb-3 focus:ring-2 focus:ring-[#295A47] focus:border-transparent outline-none text-sm resize-none bg-white"
                  rows={3}
                  />

                  <div className="flex justify-end gap-3">
                  <button
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-800 transition-all shadow-sm"
                  >
                      Cancel
                  </button>
                  <button
                      onClick={onSave}
                      disabled={!currentComment.trim()}
                      className="px-4 py-2 text-sm font-medium text-white bg-[#295A47] rounded-lg hover:bg-[#224a3b] transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  >
                      Save Comment
                  </button>
                  </div>
                </>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignRemarkModal;
