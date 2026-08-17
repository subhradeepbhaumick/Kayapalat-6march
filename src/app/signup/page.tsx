"use client";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "react-hot-toast";
export default function SignupPage() {
    const router = useRouter();
    const [user, setUser] = useState({
        email: "",
        password: "",
        confirmPassword: "",
        username: "",
        phone: "",
        wp: "",
        // about: "",
        occupation: "",
        address: "",
        joinAs: "", // Default value
    });
    const [buttonDisabled, setButtonDisabled] = useState(true);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [passwordMismatch, setPasswordMismatch] = useState(false);
    const [passwordTooShort, setPasswordTooShort] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isTermsLoading, setIsTermsLoading] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    // Error states for validations
    const [emailError, setEmailError] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [wpError, setWpError] = useState("");
    const [passwordError, setPasswordError] = useState("");
    // Regex patterns for validations
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phonePattern = /^\d{10}$/;
    const options = [
        { value: "", label: "Select your role", icon: null },
        {
            value: "referuser", label: "Refer & Earn Partner", icon: (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            )
        },
        {
            value: "businessBrand", label: "Manufacturer", icon: (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            )
        },
        {
            value: "client", label: "Client", icon: (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            )
        },
        {
            value: "designer", label: "Designer", icon: (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            )
        },
        {
            value: "vendor", label: "Vendor", icon: (
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
            )
        },
        {
            value: "metro_client",
            label: "Metro Management Client",
            icon: (
                <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h.01M15 17h.01"
                    />
                </svg>
            )
        },
    ];
    const selectedOption = options.find(opt => opt.value === user.joinAs);
    // Check password length and mismatch dynamically
    useEffect(() => {
        setPasswordMismatch(
            user.password !== user.confirmPassword && user.confirmPassword.length > 0
        );
        setPasswordTooShort(user.password.length > 0 && user.password.length < 6);
    }, [user.password, user.confirmPassword]);
    // Dynamic validation while typing
    // Disable button if required fields are empty or terms not accepted
    useEffect(() => {
        if (
            user.email &&
            user.password &&
            user.confirmPassword &&
            user.username &&
            user.phone &&
            user.joinAs &&
            user.password === user.confirmPassword &&
            user.password.length >= 6 &&
            user.phone.match(phonePattern) &&
            user.email.match(emailPattern) &&
            // user.wp &&
            // user.address &&
            // user.occupation &&
            !passwordMismatch &&
            !passwordTooShort &&
            termsAccepted &&
            !emailError &&
            !phoneError &&
            !passwordError
        ) {
            setButtonDisabled(false);
        } else {
            setButtonDisabled(true);
        }
    }, [
        user.email,
        user.password,
        user.confirmPassword,
        user.username,
        user.phone,
        user.wp,
        user.address,
        user.occupation,
        user.joinAs,
        passwordMismatch,
        passwordTooShort,
        termsAccepted,
        emailError,
        phoneError,
        wpError,
        passwordError,
    ]);
    const validateEmail = (email: string) => {
        if (email && !email.includes("@")) {
            setEmailError("Email must contain '@' character.");
        } else if (email && !emailPattern.test(email)) {
            setEmailError("Invalid email format.");
        } else {
            setEmailError("");
        }
    };
    const validatePhone = (phone: string) => {
        if (phone && !phonePattern.test(phone)) {
            setPhoneError("Phone number must be 10 digits.");
        } else {
            setPhoneError("");
        }
    };
    const validateWhatsapp = (wp: string) => {
        if (wp && !phonePattern.test(wp)) {
            setWpError("WhatsApp number must be 10 digits.");
        } else {
            setWpError("");
        }
    };
    const validatePassword = (password: string) => {
        if (password && password.length < 6) {
            setPasswordError("Password must be at least 6 characters.");
        } else {
            setPasswordError("");
        }
    };
    const onSignup = async () => {
        if (!termsAccepted) {
            toast.error("You must accept the terms and conditions.");
            return;
        }
        try {
            setLoading(true);
            // Log the form payload to debug
            console.log("Signup payload:", {
                full_name: user.username,
                email: user.email,
                password: user.password,
                phone: user.phone,
                whatsapp: user.wp,
                address: user.address,
                occupation: user.occupation,
                role: user.joinAs
            });
            // const aboutValue =
            // user.about.trim() === ""
            //     ? `Hi, I am ${user.username || "a new user"}. This is my bio.`
            //     : user.about;
            const response = await axios.post("/api/users/signup", {
                full_name: user.username,
                email: user.email,
                password: user.password,
                phone: user.phone,
                whatsapp: user.wp,
                address: user.address,
                occupation: user.occupation,
                role: user.joinAs
            });
            console.log("Signup success", response.data);
            toast.success("🎉 Signup successful! Please log in.");
            router.push("/login");
        } catch (error) {
            if (error instanceof Error) {
                console.error("Signup failed", error.message);
            } else {
                console.error("Signup failed", error);
            }
            if (axios.isAxiosError(error) && error.response?.data?.message) {
                toast.error(error.response.data.message);
            } else {
                toast.error("Signup failed. Try again.");
            }
        } finally {
            setLoading(false);
        }
    };
    const handleTermsAccept = () => {
        setIsTermsLoading(true);
        // Simulate a loading state for 500ms before accepting terms
        setTimeout(() => {
            setTermsAccepted(!termsAccepted);
            setIsTermsLoading(false);
        }, 500);
    };
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#D2EBD0] sm:bg-[#E8F5E9] transition-all duration-300 p-6 py-25 ">
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border border-gray-200 transition-all duration-300">
                <h1 className="text-2xl font-bold text-center mb-4 text-teal-700">
                    {loading ? "Processing..." : "Create Your Account"}
                </h1>
                <p className="text-gray-600 text-center mb-6">
                    Join Kayapalat and explore the best experience!
                </p>
                <div className="flex flex-col">
                    {/* Username */}
                    <label htmlFor="username" className="mb-1 text-sm text-gray-700">
                        Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                        className="p-3 border border-gray-300 rounded-lg mb-4 bg-white text-black focus:outline-none focus:border-teal-500"
                        id="username"
                        type="text"
                        value={user.username}
                        onChange={(e) => setUser({ ...user, username: e.target.value })}
                        placeholder="Enter username"
                    />
                    {/* Join As */}
                    <label htmlFor="joinAs" className="mb-1 text-sm text-gray-700">
                        Join As <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mb-4 group">
                        <div
                            className="appearance-none p-3 pr-10 border border-gray-300 rounded-lg bg-white text-black focus:outline-none focus:border-teal-500 w-full cursor-pointer transition-all duration-300 hover:border-teal-500 hover:shadow-md"
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        >
                            <div className="flex items-center">
                                {selectedOption?.icon}
                                <span className={user.joinAs === "" ? "text-gray-500" : "text-black"}>{selectedOption?.label}</span>
                            </div>
                        </div>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                        </div>
                        {isDropdownOpen && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg overflow-hidden">
                                {options.map((option) => (
                                    <div
                                        key={option.value}
                                        className={`flex items-center p-3 cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${user.joinAs === option.value
                                            ? 'bg-teal-50'
                                            : 'hover:bg-teal-100'
                                            }`}
                                        onClick={() => {
                                            setUser({ ...user, joinAs: option.value });
                                            setIsDropdownOpen(false);
                                        }}
                                    >
                                        {option.icon}
                                        <span>{option.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Email */}
                    <label htmlFor="email" className="mb-1 text-sm text-gray-700">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <input
                        className={`p-3 border ${emailError ? "border-red-500" : "border-gray-300"} rounded-lg mb-4 bg-white text-black focus:outline-none focus:border-teal-500`}
                        id="email"
                        type="email"
                        value={user.email}
                        onChange={(e) => {
                            setUser({ ...user, email: e.target.value });
                            validateEmail(e.target.value);
                        }}
                        placeholder="Enter email"
                    />
                    {emailError && <p className="text-red-500 text-sm mb-4">{emailError}</p>}
                    {/* Phone Number */}
                    <label htmlFor="phone" className="mb-1 text-sm text-gray-700">
                        Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                        className={`p-3 border ${phoneError ? "border-red-500" : "border-gray-300"} rounded-lg mb-4 bg-white text-black focus:outline-none focus:border-teal-500`}
                        id="phone"
                        type="tel"
                        value={user.phone}
                        onChange={(e) => {
                            setUser({ ...user, phone: e.target.value });
                            validatePhone(e.target.value);
                        }}
                        placeholder="Enter phone number"
                    />
                    {phoneError && <p className="text-red-500 text-sm mb-4">{phoneError}</p>}
                    {/* wp Number */}
                    <label htmlFor="phone" className="mb-1 text-sm text-gray-700">
                        Whatsapp Number
                    </label>
                    <input
                        className={`p-3 border ${wpError ? "border-red-500" : "border-gray-300"} rounded-lg mb-4 bg-white text-black focus:outline-none focus:border-teal-500`}
                        id="wp"
                        type="tel"
                        value={user.wp}
                        onChange={(e) => {
                            setUser({ ...user, wp: e.target.value });
                            validateWhatsapp(e.target.value);
                        }}
                        placeholder="Enter whatsapp number"
                    />
                    {wpError && <p className="text-red-500 text-sm mb-4">{wpError}</p>}
                    {/* Occupation */}
                    <label htmlFor="occupation" className="mb-1 text-sm text-gray-700">
                        Occupation
                    </label>
                    <input
                        className="p-3 border border-gray-300 rounded-lg mb-4 bg-white text-black focus:outline-none focus:border-teal-500"
                        id="occupation"
                        type="text"
                        value={user.occupation}
                        onChange={(e) => setUser({ ...user, occupation: e.target.value })}
                        placeholder="Enter occupation"
                    />
                    {/* address */}
                    <label htmlFor="address" className="mb-1 text-sm text-gray-700">
                        Address
                    </label>
                    <input
                        className="p-3 border border-gray-300 rounded-lg mb-4 bg-white text-black focus:outline-none focus:border-teal-500"
                        id="occupation"
                        type="text"
                        value={user.address}
                        onChange={(e) => setUser({ ...user, address: e.target.value })}
                        placeholder="Enter address"
                    />
                    {/* Password */}
                    <label htmlFor="password" className="mb-1 text-sm text-gray-700">
                        Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mb-4">
                        <input
                            className={`p-3 border ${passwordError ? "border-red-500" : "border-gray-300"
                                } rounded-lg w-full bg-white text-black focus:outline-none focus:border-teal-500`}
                            id="password"
                            type={showPassword ? "text" : "password"}
                            value={user.password}
                            onChange={(e) => {
                                setUser({ ...user, password: e.target.value });
                                validatePassword(e.target.value);
                            }}
                            placeholder="Use at least 6 characters and special symbols"
                        />
                        <button
                            type="button"
                            className="absolute cursor-pointer inset-y-0 right-3 flex items-center text-sm text-gray-600 hover:text-teal-500"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? "🙈" : "👁️"}
                        </button>
                        <div className="h-1">
                            {passwordError && (
                                <p className="text-red-500 text-sm mt-1 mb-4">{passwordError}</p>
                            )}
                        </div>
                    </div>
                    {/* Confirm Password */}
                    <label htmlFor="confirmPassword" className="mb-1 text-sm text-gray-700">
                        Re-enter Password <span className="text-red-500">*</span>
                    </label>
                    <input
                        className={`p-3 border ${passwordMismatch ? "border-red-500" : "border-gray-300"
                            } rounded-lg mb-4 bg-white text-black focus:outline-none focus:border-teal-500`}
                        id="confirmPassword"
                        type="password"
                        value={user.confirmPassword}
                        onChange={(e) => {
                            setUser({ ...user, confirmPassword: e.target.value });
                            validatePassword(e.target.value);
                        }}
                        placeholder="Re-enter password"
                    />
                    {passwordMismatch && (
                        <p className="text-red-500 text-sm mb-4">Passwords do not match!</p>
                    )}
                    {/* About Yourself (Optional)
                    <label htmlFor="about" className="mb-1 text-sm text-gray-700">
                        Tell us something about yourself (Optional)
                    </label>
                    <textarea
                        className="p-3 border border-gray-300 rounded-lg mb-4 bg-white text-black focus:outline-none focus:border-teal-500"
                        id="about"
                        value={user.about}
                        onChange={(e) => setUser({ ...user, about: e.target.value })}
                        placeholder="Share a little about yourself..."
                        rows={3}
                    /> */}
                    {/* Terms and Conditions */}
                    <div className="flex items-center mb-4">
                        <label htmlFor="terms" className="relative flex items-center text-sm text-gray-700 cursor-pointer">
                            <input
                                type="checkbox"
                                id="terms"
                                checked={termsAccepted}
                                onChange={handleTermsAccept}
                                className="w-5 h-5 mr-2 cursor-pointer opacity-0 absolute z-10"
                            />
                            {!isTermsLoading && (
                                <div className={`w-5 h-5 border-2 rounded ${termsAccepted ? 'border-teal-500 bg-teal-500' : 'border-gray-300'} flex items-center justify-center transition-all duration-300`}>
                                    {termsAccepted && (
                                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    )}
                                </div>
                            )}
                            {isTermsLoading && (
                                <div className="w-5 h-5 flex items-center justify-center">
                                    <div className="w-4 h-4 border-2 border-t-transparent border-teal-500 rounded-full animate-spin"></div>
                                </div>
                            )}
                            <span className="ml-8">
                                I accept the {" "}
                                <Link
                                    href="/terms"
                                    className="text-teal-600 hover:text-teal-700 font-semibold"
                                >
                                    Terms & Conditions
                                </Link>
                                <span className="text-red-500">*</span>
                            </span>
                        </label>
                    </div>
                    {/* Submit Button */}
                    <button
                        onClick={onSignup}
                        disabled={buttonDisabled || loading}
                        className={`w-full p-3 rounded-lg font-bold text-white transition duration-300 ${buttonDisabled || loading
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-teal-600 hover:bg-teal-700"
                            }`}
                    >
                        {loading ? "Signing Up..." : "Sign Up"}
                    </button>
                    <p className="text-center text-gray-600 mt-4">
                        Already have an account? {" "}
                        <Link
                            href="/login"
                            className="text-teal-600 hover:text-teal-700 font-semibold"
                        >
                            Log in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
