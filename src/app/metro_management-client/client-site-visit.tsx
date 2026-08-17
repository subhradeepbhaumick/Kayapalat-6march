"use client";
import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { ChevronLeft, ChevronRight } from 'lucide-react';
type Tab = "cold" | "site" | "booking" | "booked";
interface ProjectData {
    appointment_id: number;
    lead_id: string;
    client_name: string;
    client_phone: string;
    project_name: string;
    budget: number;
    commission: number;
    agent_share: number;
    property_type: string;
    cold_call_from: string;
    cold_call_to: string;
    cold_call_status: string;
    site_visit_from: string;
    site_visit_to: string;
    site_visit_status: string;
    booking_date_from: string;
    booking_time_to: string;
    booking_status: string;
    booking_id: string;
    agent_name: string;
    address?: string;
    lead_date?: string;
    created_at?: string;
}
interface SalesPageProps {
    agentId?: string;
}
const SalesPage: React.FC<SalesPageProps> = ({ agentId }) => {
    const { data: session } = useSession();
    const [activeTab, setActiveTab] = useState<Tab>("cold");
    const [status, setStatus] = useState("all");
    const [showEntries, setShowEntries] = useState("all");
    const [filterType, setFilterType] = useState<'all' | 'residential' | 'commercial'>('all');
    const [projectsData, setProjectsData] = useState<ProjectData[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                if (!session) {
                    console.error('No session found');
                    return;
                }
                const response = await fetch('/api/metro/metro_client/projects', {
                    credentials: 'include',
                });
                if (response.ok) {
                    const data = await response.json();
                    console.log("API Response:", data);
                    setProjectsData(data.projects || []);
                } else {
                    console.error('Failed to fetch projects');
                }
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoading(false);
            }
        };
        if (session) {
            fetchProjects();
        }
    }, [session]);
    const filteredData = projectsData.filter((project) => {
        const matchesType = filterType === 'all' || project.property_type.toLowerCase() === filterType;
        let matchesStatus = false;
        switch (activeTab) {
            case 'cold':
                matchesStatus = project.cold_call_status !== 'Confirmed';
                break;
            case 'site':
                matchesStatus = project.cold_call_status === 'Confirmed' && project.site_visit_status !== 'Confirmed';
                break;
            case 'booking':
                matchesStatus = project.site_visit_status === 'Confirmed';
                break;
            case 'booked':
                matchesStatus = project.booking_status === 'Booked';
                break;
        }
        return matchesType && matchesStatus;
    });
    const siteVisitData = projectsData.filter(
        item => item.cold_call_status === "Confirmed"
    );
    const totalCount = siteVisitData.length;
    const residentialCount = siteVisitData.filter(
        item => item.property_type === "Residential"
    ).length;
    const commercialCount = siteVisitData.filter(
        item => item.property_type === "Commercial"
    ).length;
    // Pagination Logic
    const itemsPerPage = showEntries === 'all' ? filteredData.length : parseInt(showEntries);
    const totalPages = itemsPerPage > 0 ? Math.ceil(filteredData.length / itemsPerPage) : 1;
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, status, showEntries, filterType]);
    const renderTable = () => {
        if (loading) {
            return <div className="text-center mt-4">Loading...</div>;
        }
        switch (activeTab) {
            case "cold":
                return (
                    <table className="min-w-full border mt-4">
                        <thead className="bg-[#295A47] text-white whitespace-nowrap">
                            <tr>
                                <th className="p-2 border">Sl.No</th>
                                <th className="p-2 border">Req ID</th>
                                <th className="p-2 border">Name</th>
                                <th className="p-2 border">Property</th>
                                <th className="p-2 border">Budget</th>
                                <th className="p-2 border">Cold Call From</th>
                                <th className="p-2 border">Cold Call To</th>
                                <th className="p-2 border">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((item, index) => (
                                <tr key={item.appointment_id}>
                                    <td className="p-2 border text-center">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="p-2 border">{item.appointment_id}</td>
                                    <td className="p-2 border">{item.client_name}</td>
                                    <td className="p-2 border">{item.project_name}</td>
                                    <td className="p-2 border">
                                        ₹{item.budget?.toLocaleString()}
                                    </td>
                                    <td className="p-2 border">
                                        {item.cold_call_from
                                            ? new Date(item.cold_call_from).toLocaleString()
                                            : "-"}
                                    </td>
                                    <td className="p-2 border">
                                        {item.cold_call_to
                                            ? new Date(item.cold_call_to).toLocaleString()
                                            : "-"}
                                    </td>
                                    <td className="p-2 border">{item.cold_call_status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
            case "site":
                return (
                    <table className="min-w-full border mt-4">
                        <thead className="bg-[#295A47] text-white whitespace-nowrap">
                            <tr>
                                <th className="p-2 border">Sl.No</th>
                                <th className="p-2 border">Req ID</th>
                                <th className="p-2 border">Name</th>
                                <th className="p-2 border">Property</th>
                                <th className="p-2 border">Budget</th>
                                <th className="p-2 border">Site Visit From</th>
                                <th className="p-2 border">Site Visit To</th>
                                <th className="p-2 border">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((item, index) => (
                                <tr key={item.appointment_id}>
                                    <td className="p-2 border text-center">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="p-2 border">{item.appointment_id}</td>
                                    <td className="p-2 border">{item.client_name}</td>
                                    <td className="p-2 border">{item.project_name}</td>
                                    <td className="p-2 border">
                                        ₹{item.budget?.toLocaleString()}
                                    </td>
                                    <td className="p-2 border">
                                        {item.site_visit_from
                                            ? new Date(item.site_visit_from).toLocaleString()
                                            : "-"}
                                    </td>
                                    <td className="p-2 border">
                                        {item.site_visit_to
                                            ? new Date(item.site_visit_to).toLocaleString()
                                            : "-"}
                                    </td>
                                    <td className="p-2 border">{item.site_visit_status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
            case "booking":
                return (
                    <table className="min-w-full border mt-4">
                        <thead className="bg-[#295A47] text-white whitespace-nowrap">
                            <tr>
                                <th className="p-2 border">Sl.No</th>
                                <th className="p-2 border">Req ID</th>
                                <th className="p-2 border">Name</th>
                                <th className="p-2 border">Property</th>
                                <th className="p-2 border">Budget</th>
                                <th className="p-2 border">Booking Time From</th>
                                <th className="p-2 border">Booking Time To</th>
                                <th className="p-2 border">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((item, index) => (
                                <tr key={item.appointment_id}>
                                    <td className="p-2 border text-center">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="p-2 border">{item.appointment_id}</td>
                                    <td className="p-2 border">{item.client_name}</td>
                                    <td className="p-2 border">{item.project_name}</td>
                                    <td className="p-2 border">
                                        ₹{item.budget?.toLocaleString()}
                                    </td>
                                    <td className="p-2 border">
                                        {item.booking_date_from
                                            ? new Date(item.booking_date_from).toLocaleString()
                                            : "-"}
                                    </td>
                                    <td className="p-2 border">
                                        {item.booking_time_to
                                            ? new Date(item.booking_time_to).toLocaleString()
                                            : "-"}
                                    </td>
                                    <td className="p-2 border">{item.booking_status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
            case "booked":
                return (
                    <table className="min-w-full border mt-4">
                        <thead className="bg-[#295A47] text-white whitespace-nowrap">
                            <tr>
                                <th className="p-2 border">Sl.No</th>
                                <th className="p-2 border">Req ID</th>
                                <th className="p-2 border">Name</th>
                                <th className="p-2 border">Property</th>
                                <th className="p-2 border">Budget</th>
                                <th className="p-2 border">Booking Time From</th>
                                <th className="p-2 border">Booking Time To</th>
                                <th className="p-2 border">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((item, index) => (
                                <tr key={item.appointment_id}>
                                    <td className="p-2 border text-center">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="p-2 border">{item.appointment_id}</td>
                                    <td className="p-2 border">{item.client_name}</td>
                                    <td className="p-2 border">{item.project_name}</td>
                                    <td className="p-2 border">
                                        ₹{item.budget?.toLocaleString()}
                                    </td>
                                    <td className="p-2 border">
                                        {item.booking_date_from
                                            ? new Date(item.booking_date_from).toLocaleString()
                                            : "-"}
                                    </td>
                                    <td className="p-2 border">
                                        {item.booking_time_to
                                            ? new Date(item.booking_time_to).toLocaleString()
                                            : "-"}
                                    </td>
                                    <td className="p-2 border">{item.booking_status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                );
        }
    };
    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Hero Section with Title and Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                <h1 className="text-2xl font-semibold text-green-900">Sales</h1>
                {/* Tabs */}
                <div className="flex gap-2 md:gap-4 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 whitespace-nowrap">
                    <button
                        className={`px-4 py-2 rounded-3xl ${activeTab === "cold" ? "bg-green-900 text-white" : "bg-white border"
                            }`}
                        onClick={() => setActiveTab("cold")}
                    >
                        Cold Calling
                    </button>
                    <button
                        className={`px-4 py-2 rounded-3xl ${activeTab === "site" ? "bg-green-900 text-white" : "bg-white border"
                            }`}
                        onClick={() => setActiveTab("site")}
                    >
                        Site Visit
                    </button>
                    <button
                        className={`px-4 py-2 rounded-3xl ${activeTab === "booking"
                            ? "bg-green-900 text-white"
                            : "bg-white border"
                            }`}
                        onClick={() => setActiveTab("booking")}
                    >
                        Prospect
                    </button>
                    <button
                        className={`px-4 py-2 rounded-3xl ${activeTab === "booked"
                            ? "bg-green-900 text-white"
                            : "bg-white border"
                            }`}
                        onClick={() => setActiveTab("booked")}
                    >
                        Booked
                    </button>
                </div>
            </div>
            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <label className="text-sm text-gray-600 block mb-1">Select Status</label>
                    <select
                        className="border p-2 rounded-md w-full"
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                    >
                        <option value="all">All</option>
                        <option value="upcoming">Upcoming</option>
                        <option value="not_responding">Not Responding</option>
                        <option value="no_show">Not Show</option>
                        <option value="not_interested">Not Interested</option>
                        <option value="booked">Booked</option>
                        <option value="time_asc">By Time Ascending</option>
                        <option value="time_desc">By Time Descending</option>
                        <option value="confirmed">Confirmed</option>
                    </select>
                </div>
                <div>
                    <label className="text-sm text-gray-600 block mb-1">From Date</label>
                    <input type="date" className="border p-2 rounded-md w-full" />
                </div>
                <div>
                    <label className="text-sm text-gray-600 block mb-1">To Date</label>
                    <input type="date" className="border p-2 rounded-md w-full" />
                </div>
                <div>
                    <label className="text-sm text-gray-600 block mb-1">Show</label>
                    <div className="flex items-center gap-2">
                        <select
                            className="border p-2 rounded-md w-full"
                            value={showEntries}
                            onChange={(e) => setShowEntries(e.target.value)}
                        >
                            <option value="10">10</option>
                            <option value="25">25</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                            <option value="all">All</option>
                        </select>
                        <span className="text-sm text-gray-600 whitespace-nowrap">entries</span>
                    </div>
                </div>
            </div>
            {/* Stats for Site Visit */}
            {activeTab === "site" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                    <button
                        className="p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 text-left"
                        onClick={() => setFilterType('all')}
                    >
                        <p className="text-gray-500 text-sm">Total upcoming visit: <span className="font-semibold">{totalCount}</span></p>
                    </button>
                    <button
                        className="p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 text-left"
                        onClick={() => setFilterType('residential')}
                    >
                        <p className="text-gray-500 text-sm">Residential upcoming visit: <span className="font-semibold">{residentialCount}</span></p>
                    </button>
                    <button
                        className="p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50 text-left"
                        onClick={() => setFilterType('commercial')}
                    >
                        <p className="text-gray-500 text-sm">Commercial upcoming visit: <span className="font-semibold">{commercialCount}</span></p>
                    </button>
                </div>
            )}
            {/* Table */}
            <div className="bg-white mt-4 p-4 rounded-lg shadow-sm overflow-x-auto">
                {renderTable()}
            </div>
            {/* Pagination Controls */}
            {filteredData.length > 0 && showEntries !== 'all' && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">
                    <div className="text-sm text-gray-600">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length} entries
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="flex items-center px-2 text-sm font-medium">
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
export default SalesPage;