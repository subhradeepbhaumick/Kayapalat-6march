// components/ContactInfoModal.tsx

"use client";

import React, { useState, useEffect, useRef, FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaInfoCircle } from 'react-icons/fa';
import { ChevronDown } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// --- (Part 1: Interfaces and Data) ---

export interface ContactFormInput {
  name: string;
  email: string;
  address: string;
  additionalNotes: string;
}

// This is the structure that will be submitted to your API
export interface SubmissionPayload {
  name: string;
  email: string;
  phone: string;
  whatsappNumber: string;
  whatsappSameAsPhone: boolean;
  message: string;
  reasonForContact: string;
  city: null;
}

interface ContactInfoModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSubmit: (data: SubmissionPayload) => void;
  mode?: 'card' | 'modal';
}

const countryOptions = [
  { value: '+93', label: 'Afghanistan (+93)' }, { value: '+355', label: 'Albania (+355)' },
  { value: '+213', label: 'Algeria (+213)' }, { value: '+376', label: 'Andorra (+376)' },
  { value: '+244', label: 'Angola (+244)' }, { value: '+54', label: 'Argentina (+54)' },
  { value: '+374', label: 'Armenia (+374)' }, { value: '+61', label: 'Australia (+61)' },
  { value: '+43', label: 'Austria (+43)' }, { value: '+994', label: 'Azerbaijan (+994)' },
  { value: '+973', label: 'Bahrain (+973)' }, { value: '+880', label: 'Bangladesh (+880)' },
  { value: '+32', label: 'Belgium (+32)' }, { value: '+591', label: 'Bolivia (+591)' },
  { value: '+387', label: 'Bosnia and Herzegovina (+387)' }, { value: '+55', label: 'Brazil (+55)' },
  { value: '+359', label: 'Bulgaria (+359)' }, { value: '+237', label: 'Cameroon (+237)' },
  { value: '+1-CA', label: 'Canada (+1)' }, { value: '+56', label: 'Chile (+56)' },
  { value: '+86', label: 'China (+86)' }, { value: '+57', label: 'Colombia (+57)' },
  { value: '+506', label: 'Costa Rica (+506)' }, { value: '+385', label: 'Croatia (+385)' },
  { value: '+53', label: 'Cuba (+53)' }, { value: '+357', label: 'Cyprus (+357)' },
  { value: '+420', label: 'Czech Republic (+420)' }, { value: '+45', label: 'Denmark (+45)' },
  { value: '+20', label: 'Egypt (+20)' }, { value: '+503', label: 'El Salvador (+503)' },
  { value: '+372', label: 'Estonia (+372)' }, { value: '+358', label: 'Finland (+358)' },
  { value: '+33', label: 'France (+33)' }, { value: '+995', label: 'Georgia (+995)' },
  { value: '+49', label: 'Germany (+49)' }, { value: '+30', label: 'Greece (+30)' },
  { value: '+502', label: 'Guatemala (+502)' }, { value: '+852', label: 'Hong Kong (+852)' },
  { value: '+36', label: 'Hungary (+36)' }, { value: '+354', label: 'Iceland (+354)' },
  { value: '+91', label: 'India (+91)' }, { value: '+62', label: 'Indonesia (+62)' },
  { value: '+98', label: 'Iran (+98)' }, { value: '+353', label: 'Ireland (+353)' },
  { value: '+972', label: 'Israel (+972)' }, { value: '+39', label: 'Italy (+39)' },
  { value: '+81', label: 'Japan (+81)' }, { value: '+962', label: 'Jordan (+962)' },
  { value: '+7-Kaza', label: 'Kazakhstan (+7)' }, { value: '+254', label: 'Kenya (+254)' },
  { value: '+82', label: 'South Korea (+82)' }, { value: '+965', label: 'Kuwait (+965)' },
  { value: '+371', label: 'Latvia (+371)' }, { value: '+961', label: 'Lebanon (+961)' },
  { value: '+370', label: 'Lithuania (+370)' }, { value: '+352', label: 'Luxembourg (+352)' },
  { value: '+60', label: 'Malaysia (+60)' }, { value: '+52', label: 'Mexico (+52)' },
  { value: '+373', label: 'Moldova (+373)' }, { value: '+976', label: 'Mongolia (+976)' },
  { value: '+212', label: 'Morocco (+212)' }, { value: '+977', label: 'Nepal (+977)' },
  { value: '+31', label: 'Netherlands (+31)' }, { value: '+64', label: 'New Zealand (+64)' },
  { value: '+234', label: 'Nigeria (+234)' }, { value: '+47', label: 'Norway (+47)' },
  { value: '+968', label: 'Oman (+968)' }, { value: '+92', label: 'Pakistan (+92)' },
  { value: '+507', label: 'Panama (+507)' }, { value: '+51', label: 'Peru (+51)' },
  { value: '+63', label: 'Philippines (+63)' }, { value: '+48', label: 'Poland (+48)' },
  { value: '+351', label: 'Portugal (+351)' }, { value: '+974', label: 'Qatar (+974)' },
  { value: '+40', label: 'Romania (+40)' }, { value: '+7-RUS', label: 'Russia (+7)' },
  { value: '+966', label: 'Saudi Arabia (+966)' }, { value: '+381', label: 'Serbia (+381)' },
  { value: '+65', label: 'Singapore (+65)' }, { value: '+421', label: 'Slovakia (+421)' },
  { value: '+386', label: 'Slovenia (+386)' }, { value: '+27', label: 'South Africa (+27)' },
  { value: '+34', label: 'Spain (+34)' }, { value: '+94', label: 'Sri Lanka (+94)' },
  { value: '+46', label: 'Sweden (+46)' }, { value: '+41', label: 'Switzerland (+41)' },
  { value: '+66', label: 'Thailand (+66)' }, { value: '+90', label: 'Turkey (+90)' },
  { value: '+380', label: 'Ukraine (+380)' }, { value: '+971', label: 'UAE (+971)' },
  { value: '+44', label: 'UK (+44)' }, { value: '+1-US', label: 'USA (+1)' },
  { value: '+598', label: 'Uruguay (+598)' }, { value: '+998', label: 'Uzbekistan (+998)' },
  { value: '+58', label: 'Venezuela (+58)' }, { value: '+84', label: 'Vietnam (+84)' },
];

// --- (Part 2: Reusable Combobox Component) ---

interface ComboboxProps {
  options: { value: string; label: string }[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  className?: string;
}

const Combobox: FC<ComboboxProps> = ({ options, value, onValueChange, placeholder, searchTerm, onSearchTermChange, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const comboboxRef = useRef(null);
  const displayLabel = options.find((option) => option.value === value)?.label || placeholder;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(event.target)) {
        setIsOpen(false);
        onSearchTermChange('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onSearchTermChange]);

  const handleItemClick = (optionValue: string) => {
    onValueChange(optionValue);
    setIsOpen(false);
    onSearchTermChange('');
  };

  const filteredOptions = options.filter(option => option.label.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className={`relative ${className}`} ref={comboboxRef}>
      <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex justify-between items-center w-full h-full px-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#00423D] text-left">
        <span>{displayLabel}</span>
        <ChevronDown size={18} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-md mt-1 z-50 max-h-60 overflow-y-auto">
          <input type="text" placeholder="Search..." value={searchTerm} onChange={(e) => onSearchTermChange(e.target.value)} onClick={(e) => e.stopPropagation()} autoFocus className="p-2 w-full border-b border-gray-200 sticky top-0 bg-white z-20 focus:outline-none" />
          <ul role="listbox" className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li key={option.value} onClick={() => handleItemClick(option.value)} role="option" aria-selected={option.value === value} className="p-2 cursor-pointer hover:bg-gray-100 transition-colors duration-100">{option.label}</li>
              ))
            ) : (<li className="p-2 text-gray-500">No results found.</li>)}
          </ul>
        </div>
      )}
    </div>
  );
};

// --- (Part 3: The Main Polished Component) ---

const ContactInfoModal: FC<ContactInfoModalProps> = ({
  isOpen = false,
  onClose = () => { },
  onSubmit,
  mode = 'modal',
}) => {
  // State for fields NOT sent to the backend
  const [otherInfo, setOtherInfo] = useState({
    address: '',
    additionalNotes: '',
  });

  // State for fields that ARE sent to the backend
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [countrySearchTerm, setCountrySearchTerm] = useState('');
  const [whatsappSameAsPhone, setWhatsappSameAsPhone] = useState(true);
  const [whatsappNumber, setWhatsappNumber] = useState('');

  // State for validation and submission logic
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP states
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneResendTimer, setPhoneResendTimer] = useState(0);
  const [sendingPhoneOtp, setSendingPhoneOtp] = useState(false);
  const [verifyingPhoneOtp, setVerifyingPhoneOtp] = useState(false);

  // Timer effect for resend OTP
  useEffect(() => {
    if (phoneResendTimer > 0) {
      const timer = setTimeout(() => setPhoneResendTimer(phoneResendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [phoneResendTimer]);

  // Real-time validation effect
  useEffect(() => {
    const validateForm = () => {
      const isNameValid = name.trim().length > 0;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const isEmailValid = emailRegex.test(email);
      const isPhoneValid = /^\d{10}$/.test(phone) && phoneVerified;
      const isWhatsappValid = whatsappSameAsPhone || /^\d{10}$/.test(whatsappNumber);
      return isNameValid && isEmailValid && isPhoneValid && isWhatsappValid;
    };
    setIsValid(validateForm());
  }, [name, email, phone, whatsappSameAsPhone, whatsappNumber, phoneVerified]);

  const sendPhoneOtp = async () => {
    if (!phone || !/^\d{10}$/.test(phone)) {
      toast.error("Please enter a valid 10-digit phone number first.");
      return;
    }
    setSendingPhoneOtp(true);
    try {
      const response = await fetch('/api/send-otp-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `${countryCode}${phone}` }),
      });
      if (!response.ok) throw new Error('Failed to send OTP');
      setPhoneOtpSent(true);
      setPhoneResendTimer(60);
      toast.success("OTP sent to your phone!");
    } catch (error) {
      toast.error("Failed to send OTP. Please try again.");
    } finally {
      setSendingPhoneOtp(false);
    }
  };

  const verifyPhoneOtp = async () => {
    if (!phoneOtp || phoneOtp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP.");
      return;
    }
    setVerifyingPhoneOtp(true);
    try {
      const response = await fetch('/api/verify-otp-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: `${countryCode}${phone}`, otp: phoneOtp }),
      });
      if (!response.ok) throw new Error('Invalid OTP');
      setPhoneVerified(true);
      toast.success("Phone verified successfully!");
    } catch (error) {
      toast.error("Invalid OTP. Please try again.");
    } finally {
      setVerifyingPhoneOtp(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isValid || isSubmitting) {
      toast.error("Please fill all required fields correctly and ensure phone verification is complete.");
      return;
    }
    setIsSubmitting(true);

    // Prepare the payload with the exact structure for your database
    const payload: SubmissionPayload = {
      name: name.trim(),
      email: email.trim(),
      phone: `${countryCode} ${phone}`,
      whatsappNumber: !whatsappSameAsPhone ? `${countryCode} ${whatsappNumber}` : '',
      whatsappSameAsPhone: whatsappSameAsPhone,
      message: `${name.trim()} was calculating own estimate.`,
      reasonForContact: "Get Estimate",
      city: null,
    };

    try {
      // Simulate API call to your backend
      const response = await fetch('/api/submit-callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Submission failed. Please try again.');
      }

      toast.success("Estimate request sent successfully!");
      onSubmit(payload); // Pass data to parent component
      onClose(); // Close modal on success

    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <div className="space-y-6 py-6">
      {/* Name */}
      <div>
        <label className="block text-gray-700 mb-2">Full Name *</label>
        <div className="relative">
          <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00423D]" />
        </div>
      </div>

      {/* Email */}
      <div>
        <label className="block text-gray-700 mb-2">Email Address *</label>
        <div className="relative">
          <FaEnvelope className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 border-gray-300 focus:ring-[#00423D]" />
        </div>
        
       
      </div>

      {/* Phone with Country Code */}
      <div>
        <label className="block text-gray-700 mb-2">Phone Number *</label>
        <div className="flex gap-2">
          <Combobox options={countryOptions} value={countryCode} onValueChange={setCountryCode} placeholder="Country" className="w-1/3" searchTerm={countrySearchTerm} onSearchTermChange={setCountrySearchTerm} />
          <input type="text" placeholder="Phone (10 digits) *" value={phone} onChange={(e) => setPhone(e.target.value)} className="p-3 border border-gray-300 rounded-lg w-2/3 focus:outline-none focus:ring-2 focus:ring-[#295A47]" />
        </div>
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={sendPhoneOtp}
            disabled={sendingPhoneOtp || phoneResendTimer > 0 || !phone || !/^\d{10}$/.test(phone)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {sendingPhoneOtp ? 'Sending...' : phoneResendTimer > 0 ? `Resend in ${phoneResendTimer}s` : 'Send OTP'}
          </button>
          {phoneOtpSent && !phoneVerified && (
            <>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={phoneOtp}
                onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="px-4 py-2 border rounded-lg flex-1"
                maxLength={6}
              />
              <button
                type="button"
                onClick={verifyPhoneOtp}
                disabled={verifyingPhoneOtp || phoneOtp.length !== 6}
                className="px-4 py-2 bg-green-500 text-white rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {verifyingPhoneOtp ? 'Verifying...' : 'Verify'}
              </button>
            </>
          )}
          {phoneVerified && <span className="text-green-600 font-medium">✓ Verified</span>}
        </div>
      </div>

      {/* WhatsApp Checkbox and Input */}
      <div className="flex items-center gap-2">
        <input type="checkbox" id="whatsappSame" checked={whatsappSameAsPhone} onChange={(e) => setWhatsappSameAsPhone(e.target.checked)} className="h-4 w-4 text-[#00423D] focus:ring-[#00423D] border-gray-300 rounded" />
        <label htmlFor="whatsappSame" className="text-gray-700 text-sm">WhatsApp is same as phone</label>
      </div>

      <AnimatePresence>
        {!whatsappSameAsPhone && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="pt-2">
              <label className="block text-gray-700 mb-2">WhatsApp Number *</label>
              <input type="tel" placeholder="10-digit number" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value.replace(/\D/g, ''))} maxLength={10} className="p-3 border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-[#00423D]" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Address (Not submitted) */}
      <div>
        <label className="block text-gray-700 mb-2">Address</label>
        <div className="relative">
          <FaMapMarkerAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input type="text" value={otherInfo.address} onChange={(e) => setOtherInfo(prev => ({ ...prev, address: e.target.value }))} className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00423D]" />
        </div>
      </div>

      {/* Additional Notes (Not submitted) */}
      <div>
        <label className="block text-gray-700 mb-2">Additional Notes</label>
        <textarea value={otherInfo.additionalNotes} onChange={(e) => setOtherInfo(prev => ({ ...prev, additionalNotes: e.target.value }))} rows={3} className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00423D]" placeholder="Any additional information you'd like to share..." />
      </div>

      {/* Info Box */}
      <div className="p-4 bg-[#F0F9F0] rounded-lg">
        <div className="flex items-start space-x-3">
          <FaInfoCircle className="text-[#00423D] mt-1 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-[#00423D] mb-1">Privacy Notice</h4>
            <p className="text-sm text-gray-600">Your contact information will be used solely for project communication and estimation purposes. We respect your privacy.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const actionButtons = (
    <div className="flex justify-end space-x-4">

      <button
        type="button"
        onClick={() => handleSubmit()}
        disabled={!isValid || isSubmitting}
        className="px-6 py-3 bg-[#00423D] text-white rounded-lg transition duration-300 font-medium disabled:bg-gray-400 disabled:cursor-not-allowed enabled:hover:bg-[#00332D]"
      >
        {isSubmitting ? 'Submitting...' : 'Get Estimate'}
      </button>
    </div>
  );

  const mainContent = (
    <div className="w-full max-w-2xl bg-white/95 rounded-xl shadow-lg p-8">
      <h2 className="text-2xl font-semibold text-[#00423D] text-left mb-6">Contact Information</h2>
      {formContent}
      {actionButtons}
    </div>
  );

  if (mode === 'modal') {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl p-0 border-0 bg-transparent">
          {mainContent}
        </DialogContent>
      </Dialog>
    );
  }

  // Card mode
  return mainContent;
};

export default ContactInfoModal;