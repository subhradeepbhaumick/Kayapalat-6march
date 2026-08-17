"use client";
import { useEffect, useState } from "react";
import {
    Building2,
    Home,
    Landmark,
    Phone,
    ShieldCheck,
    Star,
    TrendingUp,
} from "lucide-react";
import SalesPage from "./client-site-visit";
const properties = [
    "SouthWinds",
    "Glenmore Park",
    "Sunrise Aura",
    "Merlin Skygaze",
    "Arti Aqua",
    "Siddha Suburbia",
    "Srijan Botanica",
    "Devalok Sonarcity",
    "Sugam Prakriti",
    "Nav Mayukkh",
    "Happy Home Blooms Berry",
    "Prudent Antara",
    "Prudent Gokulam",
    "Verdant Unicorn",
    "Southern Woods",
    "Avalon Heights",
];
const propertyImages = [
    "https://lh3.googleusercontent.com/gps-cs-s/APNQkAE8rT8GHroPMnudDAOzIjVqFJi4tEP5AbtYYmlKGGZMt3NB21YjQD3VnxTZr2zVFtKSxM4Lk7AO-ANiCLJSPSG52kPrw1Rur9kzu2m9fW-vipCZLmFQutisYgMFHF_Kr2fhkZM=s1360-w1360-h1020-rw",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c",
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994",
    "https://images.unsplash.com/photo-1600585154526-990dced4db0d",
    "https://images.unsplash.com/photo-1460317442991-0ec209397118",
];
export default function PropertySiteVisitPage() {
    const [currentImage, setCurrentImage] = useState(0);
    const [successMessage, setSuccessMessage] = useState("");
    const [highlightForm, setHighlightForm] = useState(false);
    const [showSiteVisitStatus, setShowSiteVisitStatus] = useState(false);
    const [formData, setFormData] = useState({
        client_name: "",
        email: "",
        phone: "",
        client_id: "",
        property_name: "",
        budget: "",
        contact_from_datetime: "",
        contact_to_datetime: "",
    });
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentImage((prev) =>
                prev === propertyImages.length - 1 ? 0 : prev + 1
            );
        }, 4000);
        return () => clearInterval(interval);
    }, []);
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch(
                    "/api/metro/metro_client/site_visit"
                );
                const result = await response.json();
                console.log("SITE VISIT API RESPONSE:", result);
                if (result.success && result.data.length > 0) {
                    const user = result.data[0];
                    setFormData((prev) => ({
                        ...prev,
                        client_id: user.user_id || "",
                        client_name: user.name || "",
                        email: user.email || "",
                        phone: user.phone || "",
                    }));
                }
            } catch (error) {
                console.error("Failed to fetch user details:", error);
            }
        };
        fetchUserData();
    }, []);
    useEffect(() => {
        if (successMessage) {
            const timer = setTimeout(() => {
                setSuccessMessage("");
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [successMessage]);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };
    const handleFreeSiteVisitClick = () => {
        setHighlightForm(true);
        const formSection = document.getElementById("site-visit-form");
        if (formSection) {
            formSection.scrollIntoView({
                behavior: "smooth",
                block: "start",
            });
        }
        setTimeout(() => {
            setHighlightForm(false);
        }, 4000);
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(
                "/api/metro/metro_client/site_visit",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(formData),
                }
            );
            const result = await response.json();
            if (result.success) {
                setSuccessMessage(
                    `🎉 Congratulations! Your property inquiry has been submitted successfully. Appointment ID: ${result.appointment_id}. Our Property Advisor will contact you within your selected time slot.`
                );
                setFormData((prev) => ({
                    ...prev,
                    property_name: "",
                    budget: "",
                    contact_from_datetime: "",
                    contact_to_datetime: "",
                }));
                window.scrollTo({
                    top: 0,
                    behavior: "smooth",
                });
            } else {
                alert(result.message);
            }
        } catch (error) {
            console.error(error);
            alert("Something went wrong");
        }
    };
    return (
        /* FIX 1: Added max-w-[100vw] to strictly prevent the container from 
          growing wider than the mobile screen. Changed to 100dvh for mobile address bars. 
        */
        <div className="relative min-h-dvh w-full max-w-[100vw] overflow-x-hidden flex flex-col">
            {/* Background Image */}
            <div
                className="fixed inset-0 w-full h-full bg-cover bg-center transition-all duration-1000 z-0 pointer-events-none"
                style={{
                    backgroundImage: `url(${propertyImages[currentImage]})`,
                }}
            />
            {/* Overlay */}
            <div className="fixed inset-0 w-full h-full bg-black/65 z-0 pointer-events-none" />
            {/* Content Wrapper */}
            <div className="relative z-10 w-full max-w-[100vw] flex-1 flex flex-col">
                {/* FIX 2: Explicitly hid overflow on the marquee parent 
                  to stop the animation from stretching the mobile DOM 
                */}
                <div className="w-full max-w-[100vw] overflow-hidden bg-[#295A47] text-white font-bold py-3 sm:py-4 shadow-lg text-sm sm:text-base">
                    <div className="marquee-container">
                        <div className="marquee-content">
                            {[...properties, ...properties].map((property, index) => (
                                <div
                                    key={index}
                                    className="mx-2 sm:mx-6 px-3 sm:px-4 py-1 bg-white/20 border border-white/20 backdrop-blur-md rounded-full text-white text-xs sm:text-sm font-semibold whitespace-nowrap"
                                >
                                    🏢 {property}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                {/* Main Content */}
                <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 sm:py-12 w-full max-w-[100vw] box-border">
                    <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                        {/* Left Section */}
                        <div className="text-white text-center lg:text-left w-full overflow-hidden">
                            <div className="flex flex-col sm:flex-row gap-3 mb-5 items-center lg:items-start">
                                <button
                                    onClick={() => setShowSiteVisitStatus(true)}
                                    className="bg-red-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-full font-semibold text-sm sm:text-base transition-all"
                                >
                                    Site Visit Status
                                </button>
                                <button
                                    onClick={handleFreeSiteVisitClick}
                                    className="inline-block bg-green-500 px-4 py-2 rounded-full font-semibold animate-pulse text-sm sm:text-base hover:bg-green-600 transition-all cursor-pointer"
                                >
                                    FREE Property Site Visit
                                </button>
                            </div>
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                                Find Your
                                <span className="block text-yellow-400 mt-1">
                                    Dream Property
                                </span>
                            </h1>
                            <p className="mt-6 text-base sm:text-lg text-gray-200">
                                Explore luxury flats, premium apartments, independent
                                houses, and commercial properties with expert
                                assistance.
                            </p>
                            {/* Features */}
                            <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-8">
                                <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-xl flex flex-col items-center lg:items-start text-sm sm:text-base">
                                    <ShieldCheck className="mb-2" size={20} />
                                    Verified Properties
                                </div>
                                <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-xl flex flex-col items-center lg:items-start text-sm sm:text-base">
                                    <Star className="mb-2" size={20} />
                                    Premium Locations
                                </div>
                                <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-xl flex flex-col items-center lg:items-start text-sm sm:text-base">
                                    <TrendingUp className="mb-2" size={20} />
                                    Best Investment
                                </div>
                                <div className="bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-xl flex flex-col items-center lg:items-start text-sm sm:text-base">
                                    <Phone className="mb-2" size={20} />
                                    Expert Guidance
                                </div>
                            </div>
                            {/* Statistics */}
                            <div className="grid grid-cols-3 gap-2 sm:gap-4 mt-8 sm:mt-10 text-center lg:text-left">
                                <div className="flex flex-col items-center lg:items-start">
                                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-yellow-400">
                                        500+
                                    </h2>
                                    <p className="text-xs sm:text-sm text-gray-300 mt-1">Properties</p>
                                </div>
                                <div className="flex flex-col items-center lg:items-start">
                                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-yellow-400">
                                        1200+
                                    </h2>
                                    <p className="text-xs sm:text-sm text-gray-300 mt-1">Happy Clients</p>
                                </div>
                                <div className="flex flex-col items-center lg:items-start">
                                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-yellow-400">
                                        50+
                                    </h2>
                                    <p className="text-xs sm:text-sm text-gray-300 mt-1">Locations</p>
                                </div>
                            </div>
                            {/* Property Types */}
                            <div className="flex flex-wrap justify-center lg:justify-start gap-4 sm:gap-6 mt-8 sm:mt-10">
                                <div className="flex items-center gap-2 text-sm sm:text-base">
                                    <Building2 size={20} />
                                    Flats
                                </div>
                                <div className="flex items-center gap-2 text-sm sm:text-base">
                                    <Home size={20} />
                                    Bungalows
                                </div>
                                <div className="flex items-center gap-2 text-sm sm:text-base">
                                    <Landmark size={20} />
                                    Commercial
                                </div>
                            </div>
                        </div>
                        {/* Form */}
                        <div
                            id="site-visit-form"
                            className={`bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 sm:p-8 w-full box-border transition-all duration-500 ${highlightForm
                                ? "ring-4 ring-yellow-400 shadow-[0_0_40px_10px_rgba(250,204,21,0.9)] animate-pulse"
                                : "shadow-2xl"
                                }`}
                        >
                            <h2 className="text-2xl sm:text-3xl font-bold text-white text-center">
                                Book Site Visit
                            </h2>
                            <p className="text-center text-sm sm:text-base text-gray-200 mt-2 mb-8">
                                Schedule a visit and get exclusive offers.
                            </p>
                            {successMessage && (
                                <div className="mb-6 rounded-xl border border-green-400 bg-green-500/20 p-4 text-green-100 text-center">
                                    {successMessage}
                                </div>
                            )}
                            {highlightForm && (
                                <div className="mb-4 bg-yellow-400 text-black font-bold text-center p-3 rounded-xl animate-bounce">
                                    👇 Fill this form to book your FREE Property Site Visit
                                </div>
                            )}
                            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                                <input
                                    type="text"
                                    name="client_name"
                                    placeholder="Client Name"
                                    value={formData.client_name}
                                    readOnly
                                    required
                                    className="w-full p-3 sm:p-4 rounded-xl bg-white/90 text-black text-sm sm:text-base outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <input
                                    type="email"
                                    name="email"
                                    placeholder="Email Address"
                                    value={formData.email}
                                    readOnly
                                    required
                                    className="w-full p-3 sm:p-4 rounded-xl bg-white/90 text-black text-sm sm:text-base outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <input
                                    type="tel"
                                    name="phone"
                                    placeholder="Phone Number"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3 sm:p-4 rounded-xl bg-white/90 text-black text-sm sm:text-base outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <input
                                    type="text"
                                    name="client_id"
                                    placeholder="Client ID"
                                    value={formData.client_id}
                                    readOnly
                                    required
                                    className="w-full p-3 sm:p-4 rounded-xl bg-white/90 text-black text-sm sm:text-base outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <input
                                    type="text"
                                    name="property_name"
                                    placeholder="Property Name(If you have any preference or leave blank)"
                                    value={formData.property_name}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-3 sm:p-4 rounded-xl bg-white/90 text-black text-sm sm:text-base outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <input
                                    type="number"
                                    name="budget"
                                    placeholder="Budget (₹)"
                                    value={formData.budget}
                                    onChange={handleChange}
                                    required
                                    onWheel={(e) => e.currentTarget.blur()}
                                    className="w-full p-3 sm:p-4 rounded-xl bg-white/90 text-black text-sm sm:text-base outline-none focus:ring-2 focus:ring-green-500 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none [-moz-appearance:textfield]"
                                />
                                <div className="text-red-500 font-semibold text-sm mb-2">
                                    Property Advisor Contact Availability
                                </div>
                                <div>
                                    <label className="block text-white text-sm font-medium mb-2">
                                        Preferred Contact Time From
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="contact_from_datetime"
                                        value={formData.contact_from_datetime}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-3 sm:p-4 rounded-xl bg-white/90 text-black text-sm sm:text-base outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-white text-sm font-medium mb-2">
                                        Preferred Contact Time To
                                    </label>
                                    <input
                                        type="datetime-local"
                                        name="contact_to_datetime"
                                        value={formData.contact_to_datetime}
                                        onChange={handleChange}
                                        required
                                        className="w-full p-3 sm:p-4 rounded-xl bg-white/90 text-black text-sm sm:text-base outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                </div>
                                <p className="text-xs sm:text-sm text-gray-300 mt-2">
                                    Our Metro Property Advisor will try to contact you between the selected "From" and "To" date & time regarding your property inquiry.
                                </p>
                                <button
                                    type="submit"
                                    className="w-full bg-[#295A47] text-white font-bold py-3 sm:py-4 rounded-xl transition-all duration-300 hover:scale-105 hover:bg-[#214838] shadow-[0_8px_30px_rgba(41,90,71,0.4)] text-sm sm:text-base mt-2"
                                >
                                    🚀 Book Free Site Visit
                                </button>
                            </form>
                            <div className="mt-6 text-center text-gray-200 text-xs sm:text-sm">
                                ⭐ Limited-Time Offer: Free Property Consultation
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <style jsx>{`
                .marquee-container {
                    overflow: hidden;
                    white-space: nowrap;
                    box-sizing: border-box;
                    width: 100%;
                    max-width: 100vw;
                }
                .marquee-content {
                    display: inline-flex;
                    animation: marquee 30s linear infinite;
                    will-change: transform;
                }
                .marquee-content:hover {
                    animation-play-state: paused;
                }
                @keyframes marquee {
                    0% {
                        transform: translate3d(0, 0, 0);
                    }
                    100% {
                        transform: translate3d(-50%, 0, 0);
                    }
                }
                @media (max-width: 640px) {
                    .marquee-content {
                        animation-duration: 20s;
                    }
                }
            `}</style>
            {showSiteVisitStatus && (
                <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-y-auto relative">
                        <button
                            onClick={() => setShowSiteVisitStatus(false)}
                            className="absolute top-4 right-4 z-50 bg-red-500 text-white w-8 h-8 rounded-full hover:bg-red-600"
                        >
                            ✕
                        </button>
                        <div className="p-4">
                            <SalesPage />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}