'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Eye, EyeOff } from 'lucide-react';

interface ProfileData {
  name: string;
  profilePic: string | null;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  occupation: string;
  representativeId: string;
  agentId: string;
  password: string;
  confirmPassword: string;
}

const MyProfilePage: React.FC = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<ProfileData>({
    name: '',
    profilePic: null,
    email: '',
    phone: '',
    whatsapp: '',
    address: '',
    occupation: '',
    representativeId: '',
    agentId: session?.user?.id || '',
    password: '',
    confirmPassword: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [agentDBInfo, setAgentDBInfo] = useState<any>(null); // <-- NEW STATE
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (status === 'loading' || !session?.user?.id) return;

    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/referuser/profile", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: 'include',
        });

        if (res.status === 401) {
          console.log("Unauthorized, session expired");
          signOut({ callbackUrl: '/login' });
          return;
        }

        const data = await res.json();

        // 🔥 store DB agent details for new section
        setAgentDBInfo(data.agent || null);

        if (data.agent) {
          const a = data.agent;

          setFormData({
            name: a.name || a.agent_name || "",
            email: a.email || "",
            phone: a.phone || "",
            whatsapp: a.whatsapp || "",
            address: a.address || "",
            occupation: a.occupation || "",
            representativeId: a.representativeId || a.admin_id || "",
            agentId: a.agent_id || session.user.id,
            profilePic: a.profilePic || null,
            password: "",
            confirmPassword: "",
          });
        }

      } catch (error) {
        console.error("Error fetching profile:", error);
        signOut({ callbackUrl: '/login' });
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [session?.user?.id, status]);



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      const fileURL = URL.createObjectURL(file);
      setFormData((prev) => ({ ...prev, profilePic: fileURL }));
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone || !formData.whatsapp || !formData.address || !formData.occupation || !formData.representativeId) {
      alert('All profile fields are required.');
      return;
    }

    // Only validate password fields if they are provided
    if (formData.password || formData.confirmPassword) {
      if (formData.password !== formData.confirmPassword) {
        alert('Passwords do not match.');
        return;
      }
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('whatsapp', formData.whatsapp);
      formDataToSend.append('address', formData.address);
      formDataToSend.append('occupation', formData.occupation);
      formDataToSend.append('representativeId', formData.representativeId || '');

      if (selectedFile) {
        formDataToSend.append('profilePic', selectedFile);
      }

      const res = await fetch('/api/referuser/profile', {
        method: 'PUT',
        body: formDataToSend,
        credentials: 'include',
      });

      if (res.status === 401) {
        alert('Session expired, please login again.');
        signOut({ callbackUrl: '/login' });
        return;
      }

      if (!res.ok) {
        alert('Failed to save profile.');
        return;
      }

      setShowSuccessModal(true);
      setIsEditing(false);
      setSelectedFile(null); // Reset selected file after successful save
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile.');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading profile...</div>;

  return (
    <div className="p-8 bg-gray-50 min-h-screen flex-col">
      <h1 className="text-2xl font-bold text-center text-[#295A47] mb-6 mt-2">My Profile</h1>

      {/* 🔥 USER DETAILS SECTION (FETCHED FROM AGENTS) - SHOW ONLY WHEN NOT EDITING */}
      {!isEditing && agentDBInfo && (
        <div className="max-w-xl mx-auto bg-white shadow-md rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold text-[#295A47] mb-3 text-center">
            Agent Details
          </h2>

          <div className="space-y-2 text-gray-700">
            <p><strong>Name:</strong> {agentDBInfo.name}</p>
            <p><strong>Email:</strong> {agentDBInfo.email}</p>
            <p><strong>Phone:</strong> {agentDBInfo.phone}</p>
            <p><strong>WhatsApp:</strong> {agentDBInfo.whatsapp}</p>
            <p><strong>Address:</strong> {agentDBInfo.address}</p>
            <p><strong>Occupation:</strong> {agentDBInfo.occupation}</p>
            <p><strong>Representative ID:</strong> {agentDBInfo.representativeId}</p>
            <p><strong>Agent ID:</strong> {formData.agentId}</p>
          </div>
        </div>
      )}
      {/* END USER DETAILS SECTION */}

      {/* EDIT FORM - SHOW ONLY WHEN EDITING */}
      {isEditing && (
        <div className="w-200 mx-auto bg-white shadow-md rounded-lg p-6 flex-1">
        <form className="space-y-6">
          <div className="flex items-start space-x-6">
            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Agent ID</label>
              <input
                name="agentId"
                type="text"
                value={formData.agentId}
                className="border rounded-md p-2 bg-gray-100 cursor-not-allowed"
                disabled
              />
            </div>

            <div className="flex-1">
              <label className="block text-sm text-gray-600 mb-1">Profile Picture</label>
              <div className="flex items-center space-x-4">
                {formData.profilePic ? (
                  <img
                    src={formData.profilePic}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border border-gray-300"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                    No Image
                  </div>
                )}
                {isEditing && (
                  <div>
                    <input
                      id="profilePic"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="profilePic"
                      className="cursor-pointer bg-[#295A47] text-white px-4 py-2 rounded-md hover:bg-[#1e3d32] transition"
                    >
                      Upload Photo
                    </label>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              { label: 'Name', name: 'name', type: 'text', placeholder: 'Enter your name' },
              { label: 'Email', name: 'email', type: 'email', placeholder: 'Enter your email' },
              { label: 'Phone', name: 'phone', type: 'tel', placeholder: 'Enter your phone number' },
              { label: 'WhatsApp', name: 'whatsapp', type: 'tel', placeholder: 'Enter your WhatsApp number' },
              { label: 'Occupation', name: 'occupation', type: 'text', placeholder: 'Enter your occupation' },
              { label: 'Address', name: 'address', type: 'textarea', placeholder: 'Enter your address' },
              { label: 'Representative ID', name: 'representativeId', type: 'text', placeholder: 'Enter your representative ID', readOnly: true },
              { label: 'New Password', name: 'password', type: 'password', placeholder: 'Enter new password' },
              { label: 'Confirm Password', name: 'confirmPassword', type: 'password', placeholder: 'Confirm new password' },
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm text-gray-600 mb-1">{field.label}</label>
                {field.type === 'textarea' ? (
                  <textarea
                    name={field.name}
                    value={formData[field.name as keyof ProfileData] || ''}
                    onChange={handleChange}
                    className={`w-full border rounded-md p-2 ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    rows={3}
                    readOnly={!isEditing}
                    placeholder={isEditing ? field.placeholder : ''}
                  />
                ) : field.type === 'password' ? (
                  <div className="relative">
                    <input
                      name={field.name}
                      type={
                        field.name === 'password'
                          ? showPassword
                            ? 'text'
                            : 'password'
                          : showConfirmPassword
                          ? 'text'
                          : 'password'
                      }
                      value={formData[field.name as keyof ProfileData] || ''}
                      onChange={handleChange}
                      className={`w-full border rounded-md p-2 pr-10 ${!isEditing ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                      readOnly={!isEditing}
                      placeholder={
                        isEditing
                          ? field.placeholder
                          : (field.name === 'password' || field.name === 'confirmPassword')
                            ? ''
                            : !formData[field.name as keyof ProfileData]
                              ? field.placeholder
                              : ''
                      }
                    />
                    {isEditing && (
                      <button
                        type="button"
                        onClick={() =>
                          field.name === 'password'
                            ? setShowPassword(!showPassword)
                            : setShowConfirmPassword(!showConfirmPassword)
                        }
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      >
                        {field.name === 'password'
                          ? showPassword
                            ? <EyeOff className="h-5 w-5 text-gray-400" />
                            : <Eye className="h-5 w-5 text-gray-400" />
                          : showConfirmPassword
                          ? <EyeOff className="h-5 w-5 text-gray-400" />
                          : <Eye className="h-5 w-5 text-gray-400" />}
                      </button>
                    )}
                  </div>
                ) : (
                  <input
                    name={field.name}
                    type={field.type}
                    value={formData[field.name as keyof ProfileData] || ''}
                    onChange={handleChange}
                    className={`w-full border rounded-md p-2 ${!isEditing || field.readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                    readOnly={field.readOnly || !isEditing}
                    placeholder={isEditing ? field.placeholder : ''}
                  />
                )}
              </div>
            ))}
          </div>
        </form>
        </div>
      )}

      <footer className="mt-8 flex justify-center space-x-4">
        {isEditing ? (
          <>
            <button
              onClick={handleSave}
              className="bg-[#295A47] text-white px-6 py-2 rounded-md hover:bg-[#1e3d32] transition"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600 transition"
            >
              Exit
            </button>
          </>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-[#295A47] text-white px-6 py-2 rounded-md hover:bg-[#1e3d32] transition"
          >
            Edit
          </button>
        )}
      </footer>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Updated Successfully</h3>
            <p className="text-gray-600 mb-6">Refresh to see changes</p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-4 py-2 bg-[#295A47] text-white rounded-lg hover:bg-[#1e3d32] transition-colors"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default MyProfilePage;
