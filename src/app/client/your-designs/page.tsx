"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { Design, DesignComment, DesignRoom } from "@/types";
import DesignRemarkModal from "@/components/DesignRemarkModal";
import DesignFinalizationModal from "@/components/DesignFinalizationModal";
import DesignAgreementModal from "../DesignAgreementModal";
interface RoomWithLatestRevision {
  room_id: number;
  room_name: string;
  room_created_at: string;
  latest_revision: {
    revision_id: number;
    revision_number: number;
    created_at: string;
    designs: Design[];
    can_comment: boolean;
  };
}
const YourDesignsPage: React.FC = () => {
  const { data: session } = useSession();
  const [rooms, setRooms] = useState<RoomWithLatestRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [selectedRoomForComment, setSelectedRoomForComment] =
    useState<RoomWithLatestRevision | null>(null);
  const [comments, setComments] = useState<DesignComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showPreviousRevisions, setShowPreviousRevisions] = useState<{
    [roomId: number]: boolean;
  }>({});
  const [previousRevisions, setPreviousRevisions] = useState<{
    [roomId: number]: any[];
  }>({});
  const [currentDesignIndices, setCurrentDesignIndices] = useState<{
    [roomId: number]: number;
  }>({});
  const [showRevisionInfo, setShowRevisionInfo] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [finalizedSelections, setFinalizedSelections] = useState<any[]>([]);
  const [visibleRevisions, setVisibleRevisions] = useState<Set<string>>(
    new Set()
  );
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [showAgreementModal, setShowAgreementModal] = useState(true);
  const [agreementChecked, setAgreementChecked] = useState(false);
  const previousRevisionsRef = useRef<{ [key: string]: HTMLDivElement }>({});
  /* ---------------------------------------------------------
     ESC + screenshot / print hardening
  --------------------------------------------------------- */
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveImage(null);
      if (
        e.key === "PrintScreen" ||
        (e.ctrlKey && (e.key === "p" || e.key === "s"))
      ) {
        e.preventDefault();
        setActiveImage(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  useEffect(() => {
    const checkAgreement = async () => {
      try {
        const res = await fetch(
          "/api/client/design-agreement/check",
          {
            credentials: "include",
          }
        );

        const data = await res.json();

        if (data.accepted) {
          setShowAgreementModal(false);
        } else {
          setShowAgreementModal(true);
        }

        setAgreementChecked(true);

      } catch (err) {
        console.error(err);
        setShowAgreementModal(true);
        setAgreementChecked(true);
      }
    };

    if (session) {
      checkAgreement();
    }
  }, [session]);
  /* ---------------------------------------------------------
     Blur on visibility change (screenshots / tab switch)
  --------------------------------------------------------- */
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        document.documentElement.classList.add("capture-blur");
      } else {
        document.documentElement.classList.remove("capture-blur");
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);
  /* ---------------------------------------------------------
     Setup Intersection Observer for lazy loading previous revisions
  --------------------------------------------------------- */
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const designId = entry.target.getAttribute("data-design-id");
            if (designId) {
              setVisibleRevisions((prev) => new Set([...prev, designId]));
            }
          }
        });
      },
      { rootMargin: "50px" }
    );
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);
  /* ---------------------------------------------------------
     Fetch rooms with designs
  --------------------------------------------------------- */
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/client/designs", {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setRooms(data);
        } else {
          setError("Failed to load designs");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load designs");
      } finally {
        setLoading(false);
      }
    };
    if (session) fetchRooms();
    // Also check finalized state (convenience flag + selections)
    const fetchFinalized = async () => {
      try {
        const res = await fetch("/api/client/finalize-designs", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.finalized) {
            setFinalized(true);
            setFinalizedSelections(data.selections || []);
          }
        }
      } catch (err) {
        console.error("Error fetching finalized state:", err);
      }
    };
    if (session) fetchFinalized();
  }, [session, showAgreementModal]);
  /* ---------------------------------------------------------
     Fetch comments when modal opens
  --------------------------------------------------------- */
  useEffect(() => {
    if (selectedRoomForComment) {
      const fetchComments = async () => {
        setLoadingComments(true);
        try {
          // Fetch comments from all designs in the latest revision
          const designIds = selectedRoomForComment.latest_revision.designs.map(
            (d) => d.id
          );
          const commentsPromises = designIds.map((id) =>
            fetch(`/api/client/designs/${id}/comments`, {
              credentials: "include",
            })
              .then((res) => (res.ok ? res.json() : { comments: [] }))
              .then((data) => data.comments || [])
          );
          const allCommentsArrays = await Promise.all(commentsPromises);
          const allComments = allCommentsArrays.flat();
          // Sort by date descending
          allComments.sort(
            (a, b) =>
              new Date(b.date + " " + b.time).getTime() -
              new Date(a.date + " " + a.time).getTime()
          );
          setComments(allComments);
        } catch (error) {
          console.error("Error fetching comments:", error);
          setComments([]);
        } finally {
          setLoadingComments(false);
        }
      };
      fetchComments();
    }
  }, [selectedRoomForComment]);
  /* ---------------------------------------------------------
     Show revision policy popup on first visit
  --------------------------------------------------------- */
  useEffect(() => {
    const hasSeenRevisionInfo = localStorage.getItem("hasSeenRevisionInfo");
    if (!hasSeenRevisionInfo) {
      setShowRevisionInfo(true);
      localStorage.setItem("hasSeenRevisionInfo", "true");
    }
  }, []);
  /* ---------------------------------------------------------
     Handle comment submission
  --------------------------------------------------------- */
  const handleSubmitComment = async () => {
    if (!selectedRoomForComment || !commentText.trim()) return;
    setIsSubmittingComment(true);
    try {
      // Post comment to the first design in the latest revision
      const firstDesign = selectedRoomForComment.latest_revision.designs[0];
      if (!firstDesign) return;
      const response = await fetch(
        `/api/client/designs/${firstDesign.id}/comments`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({ comment: commentText.trim() }),
        }
      );
      if (response.ok) {
        // Refresh comments from all designs
        const designIds = selectedRoomForComment.latest_revision.designs.map(
          (d) => d.id
        );
        const commentsPromises = designIds.map((id) =>
          fetch(`/api/client/designs/${id}/comments`, {
            credentials: "include",
          })
            .then((res) => (res.ok ? res.json() : { comments: [] }))
            .then((data) => data.comments || [])
        );
        const allCommentsArrays = await Promise.all(commentsPromises);
        const allComments = allCommentsArrays.flat();
        allComments.sort(
          (a, b) =>
            new Date(b.date + " " + b.time).getTime() -
            new Date(a.date + " " + a.time).getTime()
        );
        setComments(allComments);
        setCommentText("");
      } else {
        alert("Failed to add comment. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting comment:", error);
      alert("Failed to add comment. Please try again.");
    } finally {
      setIsSubmittingComment(false);
    }
  };
  if (!agreementChecked) {
    return (
      <div className="min-h-screen bg-[#D2EBD0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#295A47] mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Checking agreement status...
          </p>
        </div>
      </div>
    );
  }
  /* ---------------------------------------------------------
     Loading / Error
  --------------------------------------------------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#D2EBD0] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#295A47] mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your designs...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen bg-[#D2EBD0] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#295A47] text-white rounded hover:bg-[#1e3d32]"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }
  /* ---------------------------------------------------------
     Page
  --------------------------------------------------------- */
  return (
    <>
      <DesignAgreementModal
        isOpen={showAgreementModal}
        onAccepted={() => {
          setShowAgreementModal(false);
        }}
      />

      <div
        className={`min-h-screen bg-[#D2EBD0] p-4 sm:p-8 ${showAgreementModal ? "pointer-events-none blur-sm select-none" : ""
          }`}
      >
        <style jsx global>{`
        * {
          user-select: none;
          -webkit-user-drag: none;
        }
        @media print {
          body {
            display: none !important;
          }
        }
        .capture-blur img {
          filter: blur(25px) brightness(0.7);
        }
      `}</style>
        <div className="max-w-7xl mx-auto">
          <div className="mb-4">
            <button
              onClick={() => (window.location.href = "/client")}
              className="px-4 py-2 mt-10 bg-[#295A47] text-white rounded-lg hover:bg-[#1e3d32] transition-colors"
            >
              ← Back to Dashboard
            </button>
            {/* Finalize button */}
            {!finalized && rooms.length > 0 && (
              <button
                onClick={() => {
                  const proceed = window.confirm(
                    "Attention — finalizing your design cannot be reverted or modified later. Are you sure you want to proceed?"
                  );
                  if (proceed) setShowFinalizeModal(true);
                }}
                className="ml-4 px-4 py-2 mt-10 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Finalize Your Design
              </button>
            )}
          </div>
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#295A47] mb-4">
              Your Designs
            </h1>
            <p className="text-gray-600 text-base sm:text-lg">
              View the beautiful designs created for you by our designers.
            </p>
            <div className="mt-2 text-sm text-gray-700 flex items-center justify-center gap-2">
              <span>
                You will receive a maximum of <strong>3 design sets</strong> to
                choose from.
              </span>
              <button
                type="button"
                onClick={() => setShowRevisionInfo(true)}
                className="text-red-500 underline hover:text-[#1e3d32]"
              >
                Know more
              </button>
            </div>
          </div>
          {finalized ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {finalizedSelections.map((s: any) => (
                <div
                  key={`${s.room_id}-${s.design_id}`}
                  className="bg-white rounded-xl shadow-md p-4"
                >
                  <h3 className="font-semibold text-[#295A47] mb-2">
                    {s.room_name}
                  </h3>
                  <div className="aspect-video overflow-hidden rounded">
                    <img
                      src={`/api/images/resolve?path=${s.image_path}`}
                      className="w-full h-full object-cover"
                      alt="final"
                    />
                  </div>
                </div>
              ))}
              <div className="fixed bottom-6 right-6">
                <button
                  onClick={() =>
                    (window.location.href = "/client/your-designs?view=past")
                  }
                  className="px-4 py-2 bg-[#295A47] text-white rounded-lg"
                >
                  See Your Past Designs
                </button>
              </div>
            </div>
          ) : rooms.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎨</div>
              <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                No designs yet
              </h2>
              <p className="text-gray-600">
                Your designer will upload designs here soon.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {rooms.map((room) => (
                <div
                  key={room.room_id}
                  className="bg-white rounded-xl shadow-md p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[#295A47] truncate">
                      {room.room_name}
                    </h2>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedRoomForComment(room)}
                        disabled={!room.latest_revision.can_comment}
                        className={`px-4 py-2 text-white text-sm rounded transition-colors whitespace-nowrap ${room.latest_revision.can_comment
                          ? "bg-[#295A47] hover:bg-[#1e3d32]"
                          : "bg-gray-400 cursor-not-allowed"
                          }`}
                      >
                        {room.latest_revision.can_comment
                          ? "Add Remarks"
                          : "Comments Locked"}
                      </button>
                      <button
                        onClick={() => {
                          const roomId = room.room_id;
                          setShowPreviousRevisions((prev) => ({
                            ...prev,
                            [roomId]: !prev[roomId],
                          }));
                          if (!previousRevisions[roomId]) {
                            // Fetch previous revisions
                            fetch(`/api/client/rooms/${roomId}/revisions`, {
                              credentials: "include",
                            })
                              .then((res) => res.json())
                              .then((data) => {
                                setPreviousRevisions((prev) => ({
                                  ...prev,
                                  [roomId]: data.revisions || [],
                                }));
                              })
                              .catch((err) =>
                                console.error("Error fetching revisions:", err)
                              );
                          }
                        }}
                        className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
                      >
                        {showPreviousRevisions[room.room_id]
                          ? "Hide Previous"
                          : "View Previous Designs"}
                      </button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 mb-4">
                    Revision {room.latest_revision.revision_number} of 3 •{" "}
                    {new Date(
                      room.latest_revision.created_at
                    ).toLocaleDateString()}
                  </div>
                  {(() => {
                    const designs = room.latest_revision.designs;
                    const currentIndex = currentDesignIndices[room.room_id] || 0;
                    const currentDesign = designs[currentIndex];
                    if (!currentDesign) return null;
                    return (
                      <>
                        <div className="h-64 relative mb-4 flex items-center justify-center bg-gray-100 rounded">
                          {currentDesign.product_name === "2D Design" &&
                            currentDesign["2d_pdf_path"] ? (
                            <button
                              onClick={() => {
                                window.open(
                                  `/api/pdfs?path=${encodeURIComponent(
                                    currentDesign["2d_pdf_path"]!
                                  )}`,
                                  "_blank"
                                );
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                              View 2D Design (PDF)
                            </button>
                          ) : (
                            <>
                              <img
                                src={`/api/images/resolve?path=${currentDesign.image_path}`}
                                alt={`${currentDesign.room_name}`}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() =>
                                  setActiveImage(currentDesign.image_path)
                                }
                                draggable={false}
                                onContextMenu={(e) => e.preventDefault()}
                              />
                              {/* watermark stays same */}
                              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                                <div
                                  className="absolute inset-[-50%] flex flex-wrap gap-40 opacity-30"
                                  style={{ transform: "rotate(-40deg)" }}
                                >
                                  {Array.from({ length: 40 }).map((_, i) => (
                                    <span
                                      key={i}
                                      className="text-black/80 font-semibold"
                                    >
                                      KAYAPALAT: 6026026026
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex justify-between items-center mb-2">
                          {designs.length > 1 && (
                            <button
                              onClick={() =>
                                setCurrentDesignIndices((prev) => ({
                                  ...prev,
                                  [room.room_id]: Math.max(
                                    0,
                                    (prev[room.room_id] || 0) - 1
                                  ),
                                }))
                              }
                              className="px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300 disabled:opacity-50"
                              disabled={currentIndex === 0}
                            >
                              Prev
                            </button>
                          )}
                          <span className="text-gray-700 font-medium text-center flex-1">
                            {currentDesign.product_name}
                          </span>
                          {designs.length > 1 && (
                            <button
                              onClick={() =>
                                setCurrentDesignIndices((prev) => ({
                                  ...prev,
                                  [room.room_id]: Math.min(
                                    designs.length - 1,
                                    (prev[room.room_id] || 0) + 1
                                  ),
                                }))
                              }
                              className="px-2 py-1 bg-gray-200 rounded text-sm hover:bg-gray-300 disabled:opacity-50"
                              disabled={currentIndex === designs.length - 1}
                            >
                              Next
                            </button>
                          )}
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>Designer: {currentDesign.designer_id}</span>
                          <span>
                            {new Date(
                              currentDesign.timestamp
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                  {showPreviousRevisions[room.room_id] &&
                    previousRevisions[room.room_id] && (
                      <div className="mt-6 border-t pt-6">
                        <h3 className="text-lg font-semibold mb-4">
                          Previous Revisions
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                          {previousRevisions[room.room_id]
                            .flatMap((revision: any) =>
                              revision.designs.map((design: any) => ({
                                ...design,
                                revision_number: revision.revision_number,
                                revision_date: revision.created_at,
                              }))
                            )
                            .map((design: any) => (
                              <div
                                key={design.id}
                                className="border rounded-lg overflow-hidden bg-white shadow hover:shadow-md transition relative"
                              >
                                <div className="aspect-square relative">
                                  {design.product_name === "2D Design" &&
                                    design["2d_pdf_path"] ? (
                                    <button
                                      onClick={() =>
                                        window.open(
                                          `/api/pdfs?path=${encodeURIComponent(
                                            design["2d_pdf_path"]!
                                          )}`,
                                          "_blank"
                                        )
                                      }
                                      className="w-full h-full flex items-center justify-center bg-red-600 text-white text-sm font-semibold"
                                    >
                                      View 2D Design
                                    </button>
                                  ) : (
                                    <img
                                      src={`/api/images/resolve?path=${design.image_path}`}
                                      alt={`${design.room_name} - ${design.product_name}`}
                                      className="w-full h-full object-cover cursor-pointer"
                                      onClick={() =>
                                        setActiveImage(design.image_path)
                                      }
                                      draggable={false}
                                      onContextMenu={(e) => e.preventDefault()}
                                    />
                                  )}
                                  {/* Dense watermark overlay */}
                                  <div className="pointer-events-none absolute inset-0 overflow-hidden">
                                    <div
                                      className="absolute inset-[-50%] flex flex-wrap gap-40 opacity-30"
                                      style={{ transform: "rotate(-40deg)" }}
                                    >
                                      {Array.from({ length: 40 }).map((_, i) => (
                                        <span
                                          key={i}
                                          className="select-none text-black/80 font-semibold tracking-widest text-l"
                                        >
                                          KAYAPALAT: 6026026026
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                                <div className="p-3">
                                  <p className="text-sm font-medium">
                                    Revision {design.revision_number} -{" "}
                                    {design.product_name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(
                                      design.revision_date
                                    ).toLocaleDateString("en-IN")}
                                  </p>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                </div>
              ))}
              {activeImage && (
                <div
                  className="fixed inset-0 z-50 bg-black/95"
                  onClick={() => setActiveImage(null)}
                >
                  <button
                    onClick={() => setActiveImage(null)}
                    className="fixed top-4 right-4 z-60 text-white text-3xl hover:opacity-70"
                    aria-label="Close"
                  >
                    &times;
                  </button>
                  <div className="w-full h-full overflow-x-auto overflow-y-hidden flex items-center">
                    <div
                      className="relative mx-auto h-full flex items-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <img
                        src={`/api/images/resolve?path=${activeImage}`}
                        alt="Full screen design"
                        className="h-full max-h-screen w-auto object-contain"
                        draggable={false}
                        onContextMenu={(e) => e.preventDefault()}
                      />
                      {/* Dense adaptive watermark (UNCHANGED) */}
                      <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div
                          className="absolute inset-[-60%] flex flex-wrap gap-90 opacity-40"
                          style={{
                            transform: "rotate(-40deg)",
                            mixBlendMode: "overlay",
                          }}
                        >
                          {Array.from({ length: 80 }).map((_, i) => (
                            <span
                              key={i}
                              className="select-none text-black/80 font-semibold tracking-widest text-3xl"
                            >
                              KAYAPALAT: 6026026026
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {/* Comment Modal */}
              <DesignRemarkModal
                isOpen={!!selectedRoomForComment}
                comments={comments}
                currentComment={commentText}
                setCurrentComment={setCommentText}
                onSave={handleSubmitComment}
                onClose={() => {
                  setSelectedRoomForComment(null);
                  setCommentText("");
                  setComments([]);
                }}
                loading={loadingComments || isSubmittingComment}
                locked={!selectedRoomForComment?.latest_revision.can_comment}
              />
              <DesignFinalizationModal
                isOpen={showFinalizeModal}
                rooms={rooms}
                onClose={() => setShowFinalizeModal(false)}
                onFinalized={async () => {
                  // Refresh finalized state and rooms
                  try {
                    const res = await fetch("/api/client/finalize-designs", {
                      credentials: "include",
                    });
                    if (res.ok) {
                      const data = await res.json();
                      if (data && data.finalized) {
                        setFinalized(true);
                        setFinalizedSelections(data.selections || []);
                      }
                    }
                  } catch (err) {
                    console.error("Error refreshing finalized state:", err);
                  }
                }}
              />
            </div>
          )}
          {showRevisionInfo && (
            <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
              <div className="bg-white max-w-md w-full rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-semibold text-[#295A47] mb-3">
                  Design Revision Policy
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  You will receive a maximum of <strong>3 design sets</strong>.
                  <br />
                  <br />
                  Please be careful while requesting modifications, as
                  <strong>
                    {" "}
                    no further changes are allowed after the third revision
                  </strong>
                  .
                  <br />
                  <br />
                  If additional changes are required,{" "}
                  <strong>a new design fee will apply</strong>.
                </p>
                <div className="mt-6 text-right">
                  <button
                    onClick={() => setShowRevisionInfo(false)}
                    className="px-4 py-2 bg-[#295A47] text-white rounded hover:bg-[#1e3d32]"
                  >
                    Got it
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
export default YourDesignsPage;
