'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload } from 'lucide-react';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import { RoomWithRevisions, Client } from '@/types';

interface EditRoomModalProps {
  isOpen: boolean;
  room: RoomWithRevisions | null;
  clients: Client[];
  onClose: () => void;
  onSave: () => void;
}

const EditRoomModal: React.FC<EditRoomModalProps> = ({
  isOpen,
  room,
  clients,
  onClose,
  onSave
}) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    client_id: '',
    client_name: '',
    room_name: ''
  });
  const [designUpdates, setDesignUpdates] = useState<Record<number, File | null>>({});

  useEffect(() => {
    if (room) {
      setFormData({
        client_id: room.client_id,
        client_name: room.client_name,
        room_name: room.room_name
      });
      // Reset design updates
      setDesignUpdates({});
    }
  }, [room]);

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.user_id === clientId);
    setFormData(prev => ({
      ...prev,
      client_id: clientId,
      client_name: client ? client.name : ''
    }));
  };

  const handleDesignImageChange = (designId: number, file: File | null) => {
    setDesignUpdates(prev => ({
      ...prev,
      [designId]: file
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;

    setLoading(true);

    try {
      // Update room details if changed
      const roomChanged = formData.client_id !== room.client_id || formData.room_name !== room.room_name;
      if (roomChanged) {
        const roomFormData = new FormData();
        roomFormData.append('client_id', formData.client_id);
        roomFormData.append('room_name', formData.room_name);

        const roomResponse = await fetch(`/api/designer/rooms/${room.room_id}`, {
          method: 'PUT',
          body: roomFormData,
          credentials: 'include'
        });

        if (!roomResponse.ok) {
          const errorData = await roomResponse.json();
          throw new Error(errorData.error || 'Failed to update room');
        }
      }

      // Update design images
      const updatePromises = Object.entries(designUpdates).map(async ([designId, file]) => {
        if (!file) return;

        const designFormData = new FormData();
        designFormData.append('image', file);

        const response = await fetch(`/api/designer/designs/${designId}`, {
          method: 'PUT',
          body: designFormData,
          credentials: 'include'
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to update design ${designId}: ${errorData.error}`);
        }
      });

      await Promise.all(updatePromises);

      toast.success('Room updated successfully');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating room:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update room');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !room) return null;

  // Flatten all designs from all revisions
  const allDesigns = room.revisions.flatMap(revision => revision.designs);

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-2xl font-bold text-[#295A47]">Edit Room Entry</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Room Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
              <select
                value={formData.client_id}
                onChange={(e) => handleClientChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              >
                <option value="">Select Client</option>
                {clients.map(client => (
                  <option key={client.user_id} value={client.user_id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Room Name</label>
              <input
                type="text"
                value={formData.room_name}
                onChange={(e) => setFormData(prev => ({ ...prev, room_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
          </div>

          {/* Designs by Revision */}
          {room.revisions.map((revision) => (
            <div key={revision.revision_id} className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-[#295A47] mb-4">
                Revision {revision.revision_number} ({revision.designs.length} designs)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {revision.designs.map((design) => (
                  <div key={design.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="mb-3">
                      <img
                        src={`/api/images/resolve?path=${design.image_path}`}
                        alt={design.product_name || 'Design'}
                        className="w-full h-32 object-cover rounded"
                      />
                    </div>
                    <div className="text-sm text-gray-600 mb-2">
                      <p><strong>Product:</strong> {design.product_name || 'N/A'}</p>
                      <p><strong>Uploaded:</strong> {new Date(design.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Replace Image (Optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleDesignImageChange(design.id, e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                      {designUpdates[design.id] && (
                        <p className="text-sm text-green-600 mt-1">✓ New image selected</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-4 justify-end pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#295A47] text-white rounded hover:bg-[#1e3d32] disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Room'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditRoomModal;
