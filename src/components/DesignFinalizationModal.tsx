import React, { useEffect, useState } from "react";
import { Design } from "@/types";

interface RoomWithLatestRevision {
  room_id: number;
  room_name: string;
  latest_revision: {
    revision_id: number;
    revision_number: number;
    designs: Design[];
  };
}

interface Props {
  isOpen: boolean;
  rooms: RoomWithLatestRevision[];
  onClose: () => void;
  onFinalized: () => void;
}

const DesignFinalizationModal: React.FC<Props> = ({
  isOpen,
  rooms,
  onClose,
  onFinalized,
}) => {
  const [selections, setSelections] = useState<Record<number, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [designsByRoom, setDesignsByRoom] = useState<Record<number, Design[]>>(
    {}
  );
  const [loadingRooms, setLoadingRooms] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (!isOpen) {
      setSelections({});
      setError(null);
      setSubmitting(false);
      setDesignsByRoom({});
      setLoadingRooms({});
    }
  }, [isOpen]);

  // When modal opens, fetch all designs for each room (across revisions)
  useEffect(() => {
    if (!isOpen) return;

    const fetchForRoom = async (roomId: number) => {
      setLoadingRooms((prev) => ({ ...prev, [roomId]: true }));
      try {
        const res = await fetch(
          `/api/client/rooms/${roomId}/revisions?includeLatest=true`,
          { credentials: "include" }
        );
        if (!res.ok) throw new Error("Failed to fetch revisions");
        const data = await res.json();
        const designs: Design[] = (data.revisions || []).flatMap(
          (rev: any) => rev.designs || []
        );
        setDesignsByRoom((prev) => ({ ...prev, [roomId]: designs }));
      } catch (err) {
        console.error("Error fetching room designs for finalization:", err);
        // fallback to latest_revision designs will be used
      } finally {
        setLoadingRooms((prev) => ({ ...prev, [roomId]: false }));
      }
    };

    rooms.forEach((r) => {
      // Trigger fetch for each room
      fetchForRoom(r.room_id);
    });
  }, [isOpen, rooms]);

  // Note: prefetched object URLs were causing intermittent blob-not-found
  // errors in dev. Rely on the image resolver endpoint directly and keep
  // aspect-ratio CSS to avoid flashing/clipping.

  const handleSelect = (roomId: number, designId: number) => {
    setSelections((prev) => ({ ...prev, [roomId]: designId }));
  };

  const allSelected =
    rooms.length > 0 && rooms.every((r) => !!selections[r.room_id]);

  const handleSubmit = async () => {
    if (!allSelected) {
      setError("Please select one design for each room");
      return;
    }

    const confirmFinal = window.confirm(
      "Are you sure you want to proceed with your selected designs?"
    );
    if (!confirmFinal) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        selections: Object.entries(selections).map(([room_id, design_id]) => ({
          room_id: Number(room_id),
          design_id: Number(design_id),
        })),
      };
      const res = await fetch("/api/client/finalize-designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        onFinalized();
        onClose();
      } else {
        const data = await res.json();
        setError(data?.error || "Failed to finalize designs");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to finalize designs");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center p-4 overflow-auto">
      <div className="bg-white max-w-4xl w-full rounded-xl p-6 shadow-lg mt-12">
        <div className="flex items-start justify-between">
          <h3 className="text-xl font-semibold text-[#295A47]">
            Select one design per room
          </h3>
          <button onClick={onClose} className="text-gray-600">
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-700 mt-2 mb-4">
          Finalizing your design cannot be reverted or modified later. Please
          select exactly one image from each room.
        </p>

        <div className="space-y-6 max-h-[60vh] overflow-auto pr-2">
          {rooms.map((room) => (
            <div key={room.room_id} className="border rounded-lg p-4">
              <h4 className="font-semibold text-[#295A47] mb-3">
                {room.room_name}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {(designsByRoom[room.room_id] || room.latest_revision.designs)
                  .filter((design) => String(design.product_name) !== "2D Design")
                  .map((design) => (
                    <label
                      key={design.id}
                      className={`border rounded overflow-hidden cursor-pointer ${
                        selections[room.room_id] === design.id
                          ? "ring-4 ring-[#295A47]/40"
                          : ""
                      }`}
                    >
                      <div className="aspect-square relative flex items-center justify-center bg-gray-50">
                        <img
                          src={`/api/images/resolve?path=${encodeURIComponent(
                            design.image_path!
                          )}`}
                          alt={design.product_name}
                          className="max-w-full max-h-full object-contain"
                          draggable={false}
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            if (!target.dataset.fallback) {
                              target.dataset.fallback = "1";
                              target.src =
                                "/company_logo/B001_1767961175788.png";
                            }
                          }}
                        />
                      </div>
                      <div className="p-2 text-xs flex items-center justify-between">
                        <span className="truncate">{design.product_name}</span>
                        <input
                          type="radio"
                          name={`room_${room.room_id}`}
                          checked={selections[room.room_id] === design.id}
                          onChange={() => handleSelect(room.room_id, design.id)}
                        />
                      </div>
                    </label>
                  ))}
              </div>
            </div>
          ))}
        </div>

        {error && <div className="text-red-600 mt-4">{error}</div>}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!allSelected || submitting}
            className="px-4 py-2 bg-[#295A47] text-white rounded hover:bg-[#1e3d32] disabled:opacity-60"
          >
            {submitting ? "Finalizing..." : "Finalize"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesignFinalizationModal;
