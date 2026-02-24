'use client';

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaSpinner } from 'react-icons/fa';

const HelpSupport = () => {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const formFields = [
    { key: 'name' as const, label: 'Name', type: 'text' as const, placeholder: 'Enter your name' },
    { key: 'email' as const, label: 'Email', type: 'email' as const, placeholder: 'Enter your email' },
    { key: 'phone' as const, label: 'Phone', type: 'tel' as const, placeholder: 'Enter your phone number' },
    { key: 'subject' as const, label: 'Subject', type: 'text' as const, placeholder: 'Enter subject' },
    { key: 'message' as const, label: 'Message', type: 'textarea' as const, placeholder: 'Describe your issue' }
  ];

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key as keyof typeof prev]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      setExpandedCard(null);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    }, 3000);
  };

  return (
    <>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#295A47] mb-4">
          Help & Support
        </h1>
        <p className="text-gray-600 text-lg mb-6">
          Get assistance with your referral program and account management.
        </p>

        {/* Contact Information in Hero */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center mb-4">
            <HelpCircle className="w-8 h-8 text-[#295A47] mr-3" />
            <h2 className="text-xl font-semibold text-[#295A47]">Contact Us</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-[#295A47] mb-2">Address</h3>
              <p className="text-sm text-gray-600">
                179-A, Survey Park Rd<br />
                Purba Diganta, Santoshpur<br />
                Kolkata - 700075, WB, India
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-[#295A47] mb-2">Phone</h3>
              <p className="text-sm text-gray-600">60260-26026</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-[#295A47] mb-2">Email</h3>
              <p className="text-sm text-gray-600">info@kayapalat.co</p>
              <p className="text-sm text-gray-600">care@kayapalat.co</p>
            </div>
          </div>
        </div>
      </div>

      {/* Support Options */}
      <div className="grid grid-cols-1 gap-6 mb-6">
        
        <div className="bg-gray-50  rounded-lg p-6">
          <h3 className="text-lg font-semibold text-[#295A47] mb-4">Submit a Ticket</h3>
          <p className="text-gray-600 mb-4">Need personalized help? Create a support ticket.</p>
          <button onClick={() => setExpandedCard('message')} className="bg-[#295A47] text-white px-4 py-2 rounded-lg hover:bg-[#1e3d32] transition-colors">
            Raise Ticket
          </button>
        </div>
      </div>

      {/* Support Hours */}
      <div className="bg-[#D7E7D0] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-[#295A47] mb-4">Support Hours</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-semibold text-[#295A47] mb-2">Business Hours</h4>
            <p className="text-sm text-gray-600">Monday - Saturday: 11:00 AM - 6:00 PM IST</p>
          </div>
          <div>
            <h4 className="font-semibold text-[#295A47] mb-2">Response Time</h4>
            <p className="text-sm text-gray-600">24-48 hours for all inquiries</p>
          </div>
        </div>
      </div>

      {/* Popup Modal */}
      <AnimatePresence>
        {expandedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setExpandedCard(null)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-4xl w-full mx-4 z-[1001]"
              onClick={(e) => e.stopPropagation()}
            >
              {expandedCard === 'message' && (
                <div className="bg-white p-6 rounded-lg shadow-md max-w-sm mx-auto relative max-h-96 overflow-y-auto">
                  {/* Close button */}
                  <button
                    onClick={() => setExpandedCard(null)}
                    className="absolute top-2 left-2 text-black hover:text-gray-600 transition-colors"
                  >
                    <FaTimes size={20} />
                  </button>

                  <h2 className="font-extrabold font-serif text-xl mb-2 mt-6">Send Us a Message</h2>
                  <p className="text-gray-700 mb-4 text-sm font-semibold">
                    Fill out the form below and we&apos;ll get back to you within 24 hours
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    {formFields.map((field) => (
                      <div key={field.key}>
                        <label className="block text-black font-bold mb-1 text-sm">{field.label}</label>
                        {field.type === 'textarea' ? (
                          <textarea
                            rows="3"
                            placeholder={field.placeholder}
                            value={formData[field.key]}
                            onChange={(e) => handleInputChange(field.key, e.target.value)}
                            className="w-full border-0 border-b-2 border-gray-700 text-medium font-medium focus:outline-none focus:border-blue-500 bg-transparent py-2 text-sm"
                            required
                          />
                        ) : (
                          <input
                            type={field.type}
                            placeholder={field.placeholder}
                            value={formData[field.key]}
                            onChange={(e) => handleInputChange(field.key, e.target.value)}
                            className="w-full border-0 border-b-2 border-gray-700 text-medium font-medium focus:outline-none focus:border-blue-500 bg-transparent py-2 text-sm"
                            required
                          />
                        )}
                      </div>
                    ))}

                    <div className="mt-3">
                      <motion.button
                        type="submit"
                        className="bg-black text-white py-2 px-4 rounded-md text-sm font-bold hover:bg-white hover:text-black border border-black transition-all duration-300 flex items-center gap-2"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <FaSpinner className="animate-spin" />
                            Sending...
                          </>
                        ) : (
                          'Send Message'
                        )}
                      </motion.button>
                    </div>

                    <AnimatePresence>
                      {isSuccess && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="text-center text-green-800 font-bold mt-3 text-sm"
                        >
                          Your query is sent. We will get in touch soon.
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </form>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default HelpSupport;
