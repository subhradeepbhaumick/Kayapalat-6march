"use client";

import React, { useState, useEffect } from "react";
import {
  Upload,
  Plus,
  Edit,
  Trash2,
  Filter,
  ArrowUpDown,
  MessageCircle,
} from "lucide-react";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Design, Client, RoomWithRevisions } from "@/types";
import DesignRemarkModal from "@/components/DesignRemarkModal";
import ImagePreviewModal from "@/components/ImagePreviewModal";
import EditRoomModal from "@/components/EditRoomModal";

interface UploadDesignsTableProps {}

const UploadDesignsTable: React.FC<UploadDesignsTableProps> = () => {
  const { data: session } = useSession();
  const [rooms, setRooms] = useState<RoomWithRevisions[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [showAddModal, setShowAddModal] = useState(false);
  const [show2DModal, setShow2DModal] = useState(false);
  const [editingDesign, setEditingDesign] = useState<Design | null>(null);
  const [comments, setComments] = useState<Record<number, any[]>>({});
  const [selectedDesignForReview, setSelectedDesignForReview] =
    useState<Design | null>(null);
  const [reviewComments, setReviewComments] = useState<any[]>([]);
  const [loadingReview, setLoadingReview] = useState(false);
  const [selectedImageForPreview, setSelectedImageForPreview] = useState<{
    path: string;
    alt: string;
  } | null>(null);
  const [currentEditingDesignId, setCurrentEditingDesignId] = useState<
    number | null
  >(null);
  const [currentImage, setCurrentImage] = useState<{
    path: string;
    alt: string;
  } | null>(null);
  const [showEditRoomModal, setShowEditRoomModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<RoomWithRevisions | null>(
    null
  );

  // Form state
  const [formData, setFormData] = useState({
    client_id: "",
    client_name: "",
    room_name: "",
    product_name: "",
    image: null as File | null,
    pdf: null as File | null,
  });

  // Fetch rooms with designs
  const fetchRooms = async () => {
    try {
      // For designer, fetch all rooms they have designs for
      const response = await fetch("/api/designer/rooms", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
        // Fetch comments for all designs in all revisions
        for (const room of data) {
          for (const revision of room.revisions) {
            for (const design of revision.designs) {
              await fetchComments(design.id);
            }
          }
        }
      } else {
        // Fallback to old API if new one not ready
        const response = await fetch("/api/designer/designs", {
          credentials: "include",
        });
        if (response.ok) {
          const designs = await response.json();
          // Group by room_name + client_id for fallback
          const roomMap = new Map();
          for (const design of designs) {
            const key = `${design.client_id}-${design.room_name}`;
            if (!roomMap.has(key)) {
              roomMap.set(key, {
                room_id: key,
                room_name: design.room_name,
                client_id: design.client_id,
                client_name: design.client_name,
                revisions: [
                  {
                    revision_id: 1,
                    revision_number: 1,
                    created_at: design.timestamp,
                    designs: [],
                  },
                ],
                current_revision_count: 1,
                can_upload: true,
              });
            }
            roomMap.get(key).revisions[0].designs.push(design);
          }
          setRooms(Array.from(roomMap.values()));
          await Promise.all(
            designs.map((design: Design) => fetchComments(design.id))
          );
        }
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      toast.error("Failed to load designs");
    } finally {
      setLoading(false);
    }
  };

  // Fetch comments for a design
  const fetchComments = async (designId: number) => {
    try {
      const response = await fetch(`/api/client/designs/${designId}/comments`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setComments((prev) => ({ ...prev, [designId]: data.comments }));
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    }
  };

  // Fetch clients
  const fetchClients = async () => {
    try {
      const response = await fetch("/api/clients", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        // Handle both direct array responses or objects containing a clients array
        setClients(Array.isArray(data) ? data : data.clients || []);
      }
    } catch (error) {
      console.error("Error fetching clients:", error);
    }
  };

  useEffect(() => {
    fetchRooms();
    fetchClients();
  }, []);

  // Filter and sort rooms
  const filteredAndSortedRooms = rooms
    .filter((room) => !selectedClient || room.client_id === selectedClient)
    .sort((a, b) => {
      const dateA = new Date(
        a.revisions[a.revisions.length - 1]?.created_at || 0
      ).getTime();
      const dateB = new Date(
        b.revisions[b.revisions.length - 1]?.created_at || 0
      ).getTime();
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingDesign && !formData.image && !formData.pdf) {
      toast.error("Please select an image or PDF to upload");
      return;
    }

    const submitData = new FormData();
    submitData.append("client_id", formData.client_id);
    submitData.append("client_name", formData.client_name);
    submitData.append("room_name", formData.room_name);
    submitData.append("product_name", formData.product_name);
    if (formData.image) {
      submitData.append("image", formData.image);
    }
    if (formData.pdf) {
      submitData.append("pdf", formData.pdf); // ✅ NEW
    }
    // Debug: Log what we're sending
    console.log("Form Data being sent:", {
      client_id: formData.client_id,
      client_name: formData.client_name,
      room_name: formData.room_name,
      product_name: formData.product_name,
      hasImage: !!formData.image,
      hasPdf: !!formData.pdf,
      editingDesignId: editingDesign?.id,
    });

    try {
      const url = editingDesign
        ? `/api/designer/designs/${editingDesign.id}`
        : "/api/designer/designs";
      const method = editingDesign ? "PUT" : "POST";

      console.log(`Calling ${method} ${url}`);
      const response = await fetch(url, {
        method,
        body: submitData,
        credentials: "include",
      });

      const responseData = await response.json();
      console.log("API Response:", {
        status: response.status,
        data: responseData,
      });

      if (response.ok) {
        toast.success(
          editingDesign
            ? "Design updated successfully"
            : "Design uploaded successfully"
        );
        // Close modal and reset form immediately
        setShowAddModal(false);
        setEditingDesign(null);
        setCurrentEditingDesignId(null);
        setCurrentImage(null);
        resetForm();
        // Fetch rooms in background without awaiting
        console.log("Response successful, fetching rooms in background...");
        fetchRooms();
      } else {
        console.error("API Error:", responseData);
        toast.error(responseData.error || "Failed to save design");
      }
    } catch (error) {
      console.error("Error saving design:", error);
      toast.error("Failed to save design");
    }
  };

  const handleDelete = async (designId: number) => {
    if (!confirm("Are you sure you want to delete this design?")) return;

    try {
      const response = await fetch(`/api/designer/designs/${designId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Design deleted successfully");
        fetchRooms();
      } else {
        toast.error("Failed to delete design");
      }
    } catch (error) {
      console.error("Error deleting design:", error);
      toast.error("Failed to delete design");
    }
  };

  const handleEditRoom = (room: RoomWithRevisions) => {
    setSelectedRoom(room);
    setShowEditRoomModal(true);
  };

  const handleDeleteRoom = async (room: RoomWithRevisions) => {
    if (
      !confirm(
        `Are you sure you want to delete the entire room "${room.room_name}" and all its designs? This action cannot be undone.`
      )
    )
      return;

    try {
      const response = await fetch(`/api/designer/rooms/${room.room_id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        toast.success("Room and all designs deleted successfully");
        fetchRooms();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete room");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      toast.error("Failed to delete room");
    }
  };

  const resetForm = () => {
    setFormData({
      client_id: "",
      client_name: "",
      room_name: "",
      product_name: "",
      image: null,
      pdf: null,
    });
    setCurrentImage(null);
    setCurrentEditingDesignId(null);
  };

  const handleEditDesign = (design: Design) => {
    setEditingDesign(design);
    setCurrentEditingDesignId(design.id);
    setFormData({
      client_id: design.client_id,
      client_name: design.client_name,
      room_name: design.room_name,
      product_name: design.product_name || "",
      image: null,
      pdf: null,
    });
    setCurrentImage({
      path: design.image_path || "",
      alt: design.product_name || "Current Design",
    });
    setShowAddModal(true);
  };

  const handleClientChange = (clientId: string) => {
    const client = clients.find((c) => c.user_id === clientId);
    setFormData((prev) => ({
      ...prev,
      client_id: clientId,
      client_name: client ? client.name : "",
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#295A47] mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading designs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <Filter size={20} />
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option key="all-clients-filter" value="">
                All Clients
              </option>
              {clients.map((client, index) => (
                <option
                  key={client.user_id || `filter-${index}`}
                  value={client.user_id}
                >
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={() =>
              setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))
            }
            className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowUpDown size={20} />
            {sortOrder === "asc" ? "Oldest First" : "Newest First"}
          </button>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#295A47] text-white rounded-lg hover:bg-[#1e3d32] transition"
        >
          <Plus size={20} />
          Add Design
        </button>
      </div>

      {/* Rooms Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-[#D7E7D0]">
              <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">
                Client Name
              </th>
              <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">
                Room Name
              </th>
              <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">
                2D Design
              </th>
              <th className="border border-gray-300 px-2 sm:px-4 py-2 text-center">
                Design 1
              </th>
              <th className="border border-gray-300 px-2 sm:px-4 py-2 text-center hidden sm:table-cell">
                Design 2
              </th>
              <th className="border border-gray-300 px-2 sm:px-4 py-2 text-center hidden sm:table-cell">
                Design 3
              </th>
              <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">
                Status
              </th>
              <th className="border border-gray-300 px-2 sm:px-4 py-2 text-left">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedRooms.map((room) => {
              const revisionCount = room.current_revision_count;
              const canUpload = room.can_upload;

              // Get designs for each revision
              const design1 =
                room.revisions
                  .find((r) => r.revision_number === 1)
                  ?.designs.filter((d) => d.image_path) || [];
              const design2 =
                room.revisions
                  .find((r) => r.revision_number === 2)
                  ?.designs.filter((d) => d.image_path) || [];

              const design3 =
                room.revisions
                  .find((r) => r.revision_number === 3)
                  ?.designs.filter((d) => d.image_path) || [];

              return (
                <tr key={room.room_id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-2 sm:px-4 py-2">
                    {room.client_name}
                  </td>
                  <td className="border border-gray-300 px-2 sm:px-4 py-2 font-medium">
                    {room.room_name}
                  </td>
                  <td className="border border-gray-300 px-2 py-2 text-center">
                    {(() => {
                      const pdfDesign = room.revisions
                        .flatMap((r) => r.designs)
                        .find((d) => d["2d_pdf_path"]);
                      const pdfPath = pdfDesign?.["2d_pdf_path"];
                      if (pdfPath) {
                        return (
                          <a
                            href={`/api/pdfs?path=${encodeURIComponent(
                              pdfPath
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            View PDF
                          </a>
                        );
                      }

                      // ❌ No PDF → show Upload button
                      return (
                        <button
                          onClick={() => {
                            setFormData({
                              client_id: room.client_id,
                              client_name: room.client_name,
                              room_name: room.room_name,
                              product_name: "2D Design",
                              image: null,
                              pdf: null,
                            });

                            setEditingDesign(null); // important: ensure it's in "add mode"
                            setShowAddModal(true);
                          }}
                          className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                        >
                          Upload
                        </button>
                      );
                    })()}
                  </td>
                  {/* Design 1 Column */}
                  <td className="border border-gray-300 px-2 py-2">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {design1.slice(0, 3).map((design, idx) => (
                        <div key={design.id} className="relative group">
                          <img
                            src={`/api/images/resolve?path=${design.image_path}`}
                            alt={`Design ${idx + 1}`}
                            className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80"
                            onClick={() => {
                              setSelectedImageForPreview({
                                path: design.image_path || "",
                                alt: `Design ${idx + 1}`,
                              });
                            }}
                          />
                          {/* Action Buttons - Edit and Delete */}
                          <div className="absolute -bottom-8 -right-8 opacity-0 group-hover:opacity-100 z-50 transition-opacity duration-200 flex gap-1 bg-white p-1 rounded shadow-lg">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditDesign(design);
                              }}
                              title="Edit design"
                              className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(design.id);
                              }}
                              title="Delete design"
                              className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          {/* Chat Icon */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDesignForReview(design);
                              setLoadingReview(true);
                              fetch(
                                `/api/client/designs/${design.id}/comments`,
                                { credentials: "include" }
                              )
                                .then((res) => res.json())
                                .then((data) => {
                                  setReviewComments(data.comments || []);
                                  setLoadingReview(false);
                                })
                                .catch(() => {
                                  setReviewComments([]);
                                  setLoadingReview(false);
                                });
                            }}
                            className="absolute -bottom-1 -right-1 bg-[#295A47] text-white rounded-full p-1 transition-opacity hover:opacity-80"
                            title="View comments"
                          >
                            <MessageCircle size={12} />
                          </button>
                          {comments[design.id] &&
                            comments[design.id].length > 0 && (
                              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                {comments[design.id].length}
                              </div>
                            )}
                        </div>
                      ))}
                      {design1.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{design1.length - 3}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Design 2 Column */}
                  <td className="border border-gray-300 px-2 py-2 hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {design2.slice(0, 3).map((design, idx) => (
                        <div key={design.id} className="relative group">
                          <img
                            src={`/api/images/resolve?path=${design.image_path}`}
                            alt={`Design ${idx + 1}`}
                            className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80"
                            onClick={() => {
                              setSelectedImageForPreview({
                                path: design.image_path || "",
                                alt: `Design ${idx + 1}`,
                              });
                            }}
                          />
                          {/* Action Buttons - Edit and Delete */}
                          <div className="absolute -bottom-8 -right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 bg-white p-1 rounded shadow-lg">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditDesign(design);
                              }}
                              title="Edit design"
                              className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(design.id);
                              }}
                              title="Delete design"
                              className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          {/* Chat Icon */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDesignForReview(design);
                              setLoadingReview(true);
                              fetch(
                                `/api/client/designs/${design.id}/comments`,
                                { credentials: "include" }
                              )
                                .then((res) => res.json())
                                .then((data) => {
                                  setReviewComments(data.comments || []);
                                  setLoadingReview(false);
                                })
                                .catch(() => {
                                  setReviewComments([]);
                                  setLoadingReview(false);
                                });
                            }}
                            className="absolute -bottom-1 -right-1 bg-[#295A47] text-white rounded-full p-1 transition-opacity hover:opacity-80"
                            title="View comments"
                          >
                            <MessageCircle size={12} />
                          </button>
                          {comments[design.id] &&
                            comments[design.id].length > 0 && (
                              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                {comments[design.id].length}
                              </div>
                            )}
                        </div>
                      ))}
                      {design2.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{design2.length - 3}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Design 3 Column */}
                  <td className="border border-gray-300 px-2 py-2 hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {design3.slice(0, 3).map((design, idx) => (
                        <div key={design.id} className="relative group">
                          <img
                            src={`/api/images/resolve?path=${design.image_path}`}
                            alt={`Design ${idx + 1}`}
                            className="w-12 h-12 object-cover rounded border cursor-pointer hover:opacity-80"
                            onClick={() => {
                              setSelectedImageForPreview({
                                path: design.image_path || "",
                                alt: `Design ${idx + 1}`,
                              });
                            }}
                          />
                          {/* Action Buttons - Edit and Delete */}
                          <div className="absolute -bottom-8 -right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex gap-1 bg-white p-1 rounded shadow-lg">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditDesign(design);
                              }}
                              title="Edit design"
                              className="p-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(design.id);
                              }}
                              title="Delete design"
                              className="p-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          {/* Chat Icon */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDesignForReview(design);
                              setLoadingReview(true);
                              fetch(
                                `/api/client/designs/${design.id}/comments`,
                                { credentials: "include" }
                              )
                                .then((res) => res.json())
                                .then((data) => {
                                  setReviewComments(data.comments || []);
                                  setLoadingReview(false);
                                })
                                .catch(() => {
                                  setReviewComments([]);
                                  setLoadingReview(false);
                                });
                            }}
                            className="absolute -bottom-1 -right-1 bg-[#295A47] text-white rounded-full p-1 transition-opacity hover:opacity-80"
                            title="View comments"
                          >
                            <MessageCircle size={12} />
                          </button>
                          {comments[design.id] &&
                            comments[design.id].length > 0 && (
                              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                                {comments[design.id].length}
                              </div>
                            )}
                        </div>
                      ))}
                      {design3.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{design3.length - 3}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="border border-gray-300 px-2 sm:px-4 py-2">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        canUpload
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {canUpload ? "Active" : "Quota Exhausted"}
                    </span>
                  </td>
                  <td className="border border-gray-300 px-2 sm:px-4 py-2">
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditRoom(room)}
                          className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                          title="Edit room entry"
                        >
                          Edit Entry
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room)}
                          className="px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                          title="Delete room entry"
                        >
                          Delete Entry
                        </button>
                      </div>
                      <button
                        onClick={() => {
                          if (canUpload) {
                            setFormData({
                              client_id: room.client_id,
                              client_name: room.client_name,
                              room_name: room.room_name,
                              product_name: "",
                              image: null,
                              pdf: null,
                            });
                            setShowAddModal(true);
                          }
                        }}
                        disabled={!canUpload}
                        className={`px-2 py-1 text-xs rounded transition-colors ${
                          canUpload
                            ? "bg-[#295A47] text-white hover:bg-[#1e3d32]"
                            : "bg-gray-400 text-gray-600 cursor-not-allowed"
                        }`}
                      >
                        {canUpload ? "Upload Revision" : "Max Revisions"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-[#295A47] mb-4">
              {editingDesign ? "Edit Design" : "Add New Design"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client
                </label>
                <select
                  value={formData.client_id}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option key="select-prompt" value="">
                    Select Client
                  </option>
                  {clients.map((client, index) => (
                    <option
                      key={client.user_id || `add-${index}`}
                      value={client.user_id}
                    >
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Name
                </label>
                <input
                  type="text"
                  value={formData.room_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      room_name: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  value={formData.product_name}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      product_name: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>

              {/* Current Image Preview - Show when editing */}
              {editingDesign && currentImage && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Image
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                    <img
                      src={`/api/images/resolve?path=${currentImage.path}`}
                      alt={currentImage.alt}
                      className="w-full h-40 object-cover rounded"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {editingDesign ? "Replace Image (Optional)" : "Image"}
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      image: e.target.files?.[0] || null,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {editingDesign && formData.image && (
                  <p className="text-sm text-green-600 mt-2">
                    ✓ New image selected
                  </p>
                )}
                {editingDesign && !formData.image && (
                  <p className="text-xs text-gray-500 mt-2">
                    Leave empty to keep current image
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  2D Design (PDF)
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      pdf: e.target.files?.[0] || null,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
                {formData.pdf && (
                  <p className="text-sm text-green-600 mt-2">✓ PDF selected</p>
                )}
              </div>

              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingDesign(null);
                    setCurrentEditingDesignId(null);
                    setCurrentImage(null);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  {editingDesign ? "Update" : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 2D Upload Modal */}
      {show2DModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-red-600">
              Upload 2D Design (PDF)
            </h2>

            <form
              onSubmit={async (e) => {
                e.preventDefault();

                if (!formData.pdf) {
                  toast.error("Please upload a PDF file");
                  return;
                }

                const submitData = new FormData();
                submitData.append("client_id", formData.client_id);
                submitData.append("client_name", formData.client_name);
                submitData.append("room_name", formData.room_name);
                submitData.append("product_name", "2D Design");
                submitData.append("pdf", formData.pdf);

                try {
                  const response = await fetch("/api/designer/designs", {
                    method: "POST",
                    body: submitData,
                    credentials: "include",
                  });

                  if (response.ok) {
                    toast.success("2D Design uploaded");
                    setShow2DModal(false);
                    resetForm();
                    fetchRooms();
                  } else {
                    toast.error("Upload failed");
                  }
                } catch (err) {
                  toast.error("Error uploading PDF");
                }
              }}
              className="space-y-4"
            >
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    pdf: e.target.files?.[0] || null,
                  }))
                }
                className="w-full border p-2 rounded"
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShow2DModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded"
                >
                  Upload PDF
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Modal */}
      <DesignRemarkModal
        isOpen={!!selectedDesignForReview}
        comments={reviewComments}
        currentComment=""
        setCurrentComment={() => {}}
        onSave={() => {}}
        onClose={() => {
          setSelectedDesignForReview(null);
          setReviewComments([]);
        }}
        loading={loadingReview}
        viewOnly={true}
      />

      {/* Image Preview Modal */}
      <ImagePreviewModal
        isOpen={!!selectedImageForPreview}
        imagePath={selectedImageForPreview?.path || ""}
        imageAlt={selectedImageForPreview?.alt || "Design"}
        onClose={() => setSelectedImageForPreview(null)}
      />

      {/* Edit Room Modal */}
      <EditRoomModal
        isOpen={showEditRoomModal}
        room={selectedRoom}
        clients={clients}
        onClose={() => {
          setShowEditRoomModal(false);
          setSelectedRoom(null);
        }}
        onSave={() => {
          setShowEditRoomModal(false);
          setSelectedRoom(null);
          fetchRooms();
        }}
      />
    </div>
  );
};

export default UploadDesignsTable;
