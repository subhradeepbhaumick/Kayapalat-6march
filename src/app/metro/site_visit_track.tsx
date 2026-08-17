'use client';
import React, { useState, useEffect } from 'react';
import toast from "react-hot-toast";
import { Search, UserPlus, Edit, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import RemarkModal from "../sales-admin/RemarkModal";
import AddLeadModal from "./AddLeadModal";
import { useSession } from 'next-auth/react';
import ShareLeadModal from './ShareLeadModal';
type Tab = 'cold' | 'site' | 'booking' | 'booked';
type Remark = {
    id: number;
    date: string;
    time: string;
    comment: string;
};
type Lead = {
    id: number;
    leadId: string;
    agentId: string;
    clientName: string;
    clientContact: string;
    AppoinmentID: string;
    projectName: string;
    projectvalue: string;
    propertyAddress: string;
    propertyType: string;
    details: string;
    coldCallFrom: string;
    coldCallTo: string;
    coldCallStatus: string;
    siteVisitFrom: string;
    siteVisitTo: string;
    siteVisitStatus: string;
    bookingDateFrom: string;
    bookingTimeTo: string;
    bookingStatus: string;
    BookedInNext: string;
    bookingId: string;
    remarks: Remark[];
};
const LeadsTab = () => {
    const { data: session, status: sessionStatus } = useSession();
    const [activeTab, setActiveTab] = useState<Tab>('cold');
    const [status, setStatus] = useState('all');
    const [showEntries, setShowEntries] = useState('10');
    const [fromDate, setFromDate] = useState('');
    const [isShareLeadModalOpen, setIsShareLeadModalOpen] = useState(false);
    const [toDate, setToDate] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'residential' | 'commercial'>('all');
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [seenLeads, setSeenLeads] = useState<Set<number>>(new Set());
    const [showBookedPopup, setShowBookedPopup] = useState(false);
    const [isAddLeadModalOpen, setIsAddLeadModalOpen] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    useEffect(() => {
        if (sessionStatus === 'loading') return;
        if (!session || !session.user) {
            console.warn('No session found');
            setLoading(false);
            return;
        }
        const fetchProjects = async () => {
            try {
                const res = await fetch('/api/metro/projects', {
                    method: 'GET',
                    credentials: 'include',
                });
                const data = await res.json();
                console.log("API DATA:", data);
                if (data.projects) {
                    setLeads(
                        data.projects.map((project: any, index: number) => ({
                            id: project.appointment_id || index + 1,
                            leadId: project.lead_id || 'L' + Date.now(),
                            agentId: project.agent_id || 'N/A',
                            clientName: project.client_name || 'N/A',
                            clientContact: project.client_phone || 'N/A',
                            AppoinmentID: project.appointment_id || 'N/A',
                            projectName: project.project_name || 'N/A',
                            projectvalue: project.budget?.toString() || '0',
                            propertyAddress: project.location || 'N/A',
                            details: project.details || 'N/A',
                            propertyType: project.property_type || 'N/A',
                            coldCallFrom: project.cold_call_from || '',
                            coldCallTo: project.cold_call_to || '',
                            coldCallStatus: project.cold_call_status || 'Upcoming',
                            siteVisitFrom: project.site_visit_from || '',
                            siteVisitTo: project.site_visit_to || '',
                            siteVisitStatus: project.site_visit_status || 'Upcoming',
                            bookingDateFrom: project.booking_date_from || '',
                            bookingTimeTo: project.booking_time_to || '',
                            bookingStatus: project.booking_status || 'Upcoming',
                            BookedInNext: project.bookedInNext || 'N/A',
                            bookingId: project.booking_id || 'N/A',
                            paymentStatus: project.payment_status || 'N/A',
                            remarks: [],
                        }))
                    );
                }
            } catch (error) {
                console.error('Failed to fetch projects:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, [sessionStatus, session]);
    const [search, setSearch] = useState('');
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [currentLeadId, setCurrentLeadId] = useState<number | null>(null);
    const [currentComment, setCurrentComment] = useState('');
    const [remarksLoading, setRemarksLoading] = useState(false);
    const [editingClientName, setEditingClientName] = useState<number | null>(null);
    const [editingClientContact, setEditingClientContact] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    useEffect(() => {
        if (isPopupOpen && currentLeadId) {
            const fetchRemarks = async () => {
                const currentLead = leads.find(lead => lead.id === currentLeadId);
                if (!currentLead) return;
                try {
                    const res = await fetch(`/api/metro/remarks?appointment_id=${currentLead.AppoinmentID}`, {
                        method: 'GET',
                        credentials: 'include',
                    });
                    const data = await res.json();
                    if (data.remarks) {
                        setLeads(prev => prev.map(lead => lead.id === currentLeadId ? { ...lead, remarks: data.remarks } : lead));
                    }
                } catch (error) {
                    console.error('Error fetching remarks:', error);
                } finally {
                    setRemarksLoading(false);
                }
            };
            fetchRemarks();
        }
    }, [isPopupOpen, currentLeadId]);
    const formatDateForInput = (dateStr: string) => {
        if (!dateStr || dateStr === 'N/A') return '';
        return dateStr.split('T')[0];
    };
    const filterData = () => {
        let filtered = leads;
        if (activeTab === 'cold') {
            filtered = filtered.filter(lead => lead.coldCallStatus !== 'Confirmed');
        } else if (activeTab === 'site') {
            filtered = filtered.filter(lead => lead.coldCallStatus === 'Confirmed' && lead.siteVisitStatus !== 'Confirmed');
        } else if (activeTab === 'booking') {
            filtered = filtered.filter(lead => lead.siteVisitStatus === 'Confirmed');
        } else if (activeTab === 'booked') {
            filtered = filtered.filter(lead => lead.bookingStatus === 'Booked');
        }
        if (status !== 'all' && status !== 'By Time Ascending' && status !== 'By Time Descending') {
            if (activeTab === 'cold') {
                filtered = filtered.filter(lead => lead.coldCallStatus === status);
            } else if (activeTab === 'site') {
                filtered = filtered.filter(lead => lead.siteVisitStatus === status);
            } else if (activeTab === 'booking') {
                filtered = filtered.filter(lead => lead.bookingStatus === status);
            }
        }
        if (fromDate) {
            filtered = filtered.filter(lead => {
                const date = activeTab === 'cold' ? lead.coldCallFrom : activeTab === 'site' ? lead.siteVisitFrom : lead.bookingDateFrom;
                return date.split(' ')[0] >= fromDate;
            });
        }
        if (toDate) {
            filtered = filtered.filter(lead => {
                const date = activeTab === 'cold' ? lead.coldCallFrom : activeTab === 'site' ? lead.siteVisitFrom : lead.bookingDateFrom;
                return date.split(' ')[0] <= toDate;
            });
        }
        if (activeTab === 'site' && filterType !== 'all') {
            filtered = filtered.filter(lead => lead.propertyType.toLowerCase() === filterType);
        }
        if (search) {
            filtered = filtered.filter((lead) =>
                Object.values(lead).some((val) =>
                    val?.toString().toLowerCase().includes(search.toLowerCase())
                )
            );
        }
        if (status === 'By Time Ascending') {
            filtered = filtered.sort((a, b) => {
                const aFrom = activeTab === 'cold' ? a.coldCallFrom : activeTab === 'site' ? a.siteVisitFrom : a.bookingDateFrom;
                const bFrom = activeTab === 'cold' ? b.coldCallFrom : activeTab === 'site' ? b.siteVisitFrom : b.bookingDateFrom;
                return aFrom.localeCompare(bFrom);
            });
        } else if (status === 'By Time Descending') {
            filtered = filtered.sort((a, b) => {
                const aDate = activeTab === 'cold' ? a.coldCallFrom : activeTab === 'site' ? a.siteVisitFrom : a.bookingDateFrom;
                const aTime = activeTab === 'cold' ? a.coldCallTo : activeTab === 'site' ? a.siteVisitTo : a.bookingTimeTo;
                const bDate = activeTab === 'cold' ? b.coldCallFrom : activeTab === 'site' ? b.siteVisitFrom : b.bookingDateFrom;
                const bTime = activeTab === 'cold' ? b.coldCallTo : activeTab === 'site' ? b.siteVisitTo : b.bookingTimeTo;
                const aCombined = aDate + ' ' + aTime;
                const bCombined = bDate + ' ' + bTime;
                return bCombined.localeCompare(aCombined);
            });
        }
        return filtered;
    };
    const filteredData = filterData();
    const itemsPerPage = showEntries === 'all' ? filteredData.length : parseInt(showEntries);
    const totalPages = itemsPerPage > 0 ? Math.ceil(filteredData.length / itemsPerPage) : 1;
    const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, status, fromDate, toDate, filterType, search, showEntries]);
    const handleChange = async (id: number, field: string, value: string) => {
        setSeenLeads(prev => new Set([...prev, id]));
        setLeads((prev) =>
            prev.map((lead) => {
                if (lead.id === id) {
                    const updatedLead = { ...lead, [field]: value };
                    if (field === 'coldCallStatus' && value === 'Confirmed') {
                        if (!updatedLead.siteVisitStatus || updatedLead.siteVisitStatus === '') {
                            updatedLead.siteVisitStatus = 'Upcoming';
                        }
                    } else if (field === 'siteVisitStatus' && value === 'Confirmed') {
                        if (!updatedLead.bookingStatus || updatedLead.bookingStatus === '') {
                            updatedLead.bookingStatus = 'Upcoming';
                        }
                    }
                    return updatedLead;
                }
                return lead;
            })
        );
        const updates: any = {};
        if (field === 'projectName') updates.project_name = value;
        else if (field === 'leadId') updates.lead_id = value;
        else if (field === 'projectvalue') updates.budget = parseInt(value.replace(/[₹,%\s,]/g, '') || '0');
        else if (field === 'propertyAddress') updates.location = value;
        else if (field === 'details') updates.details = value;
        else if (field === 'propertyType') updates.property_type = value;
        else if (field === 'coldCallFrom') updates.cold_call_from = value;
        else if (field === 'coldCallTo') updates.cold_call_to = value;
        else if (field === 'coldCallStatus') updates.cold_call_status = value;
        else if (field === 'siteVisitFrom') updates.site_visit_from = value;
        else if (field === 'siteVisitTo') updates.site_visit_to = value;
        else if (field === 'siteVisitStatus') updates.site_visit_status = value;
        else if (field === 'bookingDateFrom') updates.booking_date_from = value;
        else if (field === 'bookingTimeTo') updates.booking_time_to = value;
        else if (field === 'bookingStatus') updates.booking_status = value;
        else if (field === 'BookedInNext') updates.bookedInNext = value;
        else if (field === 'bookingId') updates.booking_id = value;
        else if (field === 'clientName') updates.client_name = value;
        else if (field === 'clientContact') updates.client_phone = value;
        try {
            const res = await fetch('/api/metro/projects', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    appointment_id: leads.find(lead => lead.id === id)?.AppoinmentID,
                    updates,
                }),
            });
            const data = await res.json();

            if (res.ok) {
                toast.success("Lead updated successfully.");
            } else {
                toast.error(data.message || "Failed to update lead.");
            }
        } catch (error) {
            console.error('Error updating project:', error);
            toast.error("Something went wrong.");
        }
    };
    const totalCount = leads.filter(lead => lead.coldCallStatus === 'Confirmed' && lead.siteVisitStatus !== 'Confirmed').length;
    const residentialCount = leads.filter(lead => lead.coldCallStatus === 'Confirmed' && lead.siteVisitStatus !== 'Confirmed' && lead.propertyType === 'Residential').length;
    const commercialCount = leads.filter(lead => lead.coldCallStatus === 'Confirmed' && lead.siteVisitStatus !== 'Confirmed' && lead.propertyType === 'Commercial').length;
    const handleRemarkClick = (leadId: number) => {
        setCurrentLeadId(leadId);
        setIsPopupOpen(true);
        setCurrentComment('');
        setRemarksLoading(true);
        setLeads(prev => prev.map(lead => lead.id === leadId ? { ...lead, remarks: [] } : lead));
    };
    const handleBookClick = async (id: number) => {
        const lead = leads.find(lead => lead.id === id);
        if (!lead) return;
        setLeads(prev =>
            prev.map(lead => {
                if (lead.id === id) {
                    return {
                        ...lead,
                        bookingStatus: 'Booked',
                        bookingDateFrom: lead.bookingDateFrom || new Date().toISOString().replace('T', ' ').slice(0, 19),
                        bookingTimeTo: lead.bookingTimeTo || new Date().toISOString().replace('T', ' ').slice(0, 19),
                    };
                }
                return lead;
            })
        );
        const updates: any = {
            booking_status: 'Booked',
        };
        if (!lead.bookingDateFrom) {
            updates.booking_date = new Date().toISOString().slice(0, 10);
        }
        if (!lead.bookingDateFrom) {
            updates.booking_time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        }
        try {
            const res = await fetch('/api/metro/projects', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    appointment_id: lead.AppoinmentID,
                    updates,
                }),
            });
            if (!res.ok) {
                console.error('Failed to update booking status');
            }
        } catch (error) {
            console.error('Error updating booking status:', error);
        }
        setShowBookedPopup(true);
    };
    const handleEditClientName = (id: number) => {
        setEditingClientName(id);
    };
    const handleSaveClientName = (id: number, newName: string) => {
        if (newName.trim() !== '') {
            handleChange(id, 'clientName', newName.trim());
        }
        setEditingClientName(null);
    };
    const handleEditClientContact = (id: number) => {
        setEditingClientContact(id);
    };
    const handleSaveClientContact = (id: number, newContact: string) => {
        if (newContact.trim() !== '') {
            handleChange(id, 'clientContact', newContact.trim());
        }
        setEditingClientContact(null);
    };
    const handleSaveRemark = async () => {
        if (currentLeadId && currentComment.trim()) {
            const currentLead = leads.find(lead => lead.id === currentLeadId);
            if (!currentLead) return;
            try {
                const res = await fetch('/api/metro/remarks', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        appointment_id: currentLead.AppoinmentID,
                        remark: currentComment.trim(),
                    }),
                });
                if (res.ok) {
                    const fetchRes = await fetch(`/api/metro/remarks?appointment_id=${currentLead.AppoinmentID}`, {
                        method: 'GET',
                        credentials: 'include',
                    });
                    const data = await fetchRes.json();
                    if (data.remarks) {
                        setLeads(prev => prev.map(lead => lead.id === currentLeadId ? { ...lead, remarks: data.remarks } : lead));
                    }
                    setCurrentComment('');
                } else {
                    console.error('Failed to save remark');
                }
            } catch (error) {
                console.error('Error saving remark:', error);
            }
        }
    };
    const formatDateTimeForInput = (value: string | null | undefined) => {
        if (!value || value === "N/A") return "";
        const date = new Date(value);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    };
    const handleLeadAdded = async () => {
        setIsAddLeadModalOpen(false);
        setShowSuccessPopup(true);
        try {
            const fetchRes = await fetch('/api/metro/projects', {
                method: 'GET',
                credentials: 'include',
            });
            const data = await fetchRes.json();
            if (data.projects) {
                setLeads(data.projects.map((project: any, index: number) => ({
                    id: project.appointment_id || index + 1,
                    leadId: project.lead_id || 'L' + Date.now(),
                    agentId: project.agent_id || 'N/A',
                    clientName: project.client_name || 'N/A',
                    clientContact: project.client_phone || 'N/A',
                    AppoinmentID: project.appointment_id || 'N/A',
                    projectName: project.project_name || 'N/A',
                    projectvalue: project.budget?.toString() || '0',
                    propertyAddress: project.location || 'N/A',
                    propertyType: project.property_type || 'N/A',
                    details: project.details || 'N/A',
                    coldCallFrom: project.cold_call_from || '',
                    coldCallTo: project.cold_call_to || '',
                    coldCallStatus: project.cold_call_status || 'N/A',
                    siteVisitFrom: project.site_visit_from || '',
                    siteVisitTo: project.site_visit_to || '',
                    siteVisitStatus: project.site_visit_status || 'N/A',
                    bookingDateFrom: project.booking_date_from || '',
                    bookingTimeTo: project.booking_time_to || '',
                    bookingStatus: project.booking_status || 'N/A',
                    BookedInNext: project.bookedInNext || 'N/A',
                    bookingId: 'N/A',
                    remarks: [],
                })));
            }
        } catch (error) {
            console.error('Error refreshing leads:', error);
        }
    };
    const highlightText = (text: string) => {
        if (!search.trim()) return text;
        const regex = new RegExp(`(${search})`, 'gi');
        return text.split(regex).map((part, i) =>
            regex.test(part) ? (
                <span key={i} className="bg-yellow-200 text-gray-900 font-semibold px-1 rounded">
                    {part}
                </span>
            ) : (
                part
            )
        );
    };
    const closePopup = () => {
        setIsPopupOpen(false);
        setCurrentLeadId(null);
        setCurrentComment('');
        setRemarksLoading(false);
        if (currentLeadId) {
            setLeads(prev => prev.map(lead => lead.id === currentLeadId ? { ...lead, remarks: [] } : lead));
        }
    };
    const StatusBadge = ({ value }: { value: string }) => {
        const statusColors: Record<string, string> = {
            'Upcoming': 'bg-blue-100 text-blue-800',
            'Confirmed': 'bg-green-100 text-green-800',
            'Not Responding': 'bg-red-100 text-red-800',
            'Not Show': 'bg-orange-100 text-orange-800',
            'Booked Somewhere Else': 'bg-purple-100 text-purple-800',
            'Booked': 'bg-emerald-100 text-emerald-800',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[value] || 'bg-gray-100 text-gray-800'}`}>
                {value}
            </span>
        );
    };
    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 overflow-y-auto overflow-x-hidden">
            {/* HERO SECTION */}
            <div className="bg-linear-to-r from-[#295A47] to-[#1f4335] text-white rounded-xl p-6 mb-6 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold mb-2">
                            Site Visit Tracker
                        </h1>
                        <p className="text-gray-100 text-base md:text-lg">
                            Manage cold calls, site visits, bookings and track leads efficiently
                        </p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm px-6 py-4 rounded-lg border border-white/30 w-full md:w-auto">
                        <p className="text-white/80 text-sm mb-1">Total Leads</p>
                        <h2 className="text-3xl md:text-4xl font-bold text-white">
                            {filteredData.length}
                        </h2>
                    </div>
                </div>
                {/* TABS */}
                <div className="flex flex-wrap gap-2 mt-6">
                    {['cold', 'site', 'booking', 'booked'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as Tab)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${activeTab === tab
                                ? 'bg-white text-[#295A47] shadow-lg'
                                : 'bg-white/20 text-white hover:bg-white/30 border border-white/30'
                                }`}
                        >
                            {tab === 'cold' && 'Cold Calling'}
                            {tab === 'site' && 'Site Visit'}
                            {tab === 'booking' && 'Hot Client'}
                            {tab === 'booked' && 'Booked'}
                        </button>
                    ))}
                </div>
            </div>
            {/* SEARCH & ADD LEAD */}
            <div className="flex flex-col gap-4 mb-4">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            placeholder="Search by name, phone, project, or ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent outline-none transition-all"
                        />
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsShareLeadModalOpen(true)}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                        ><UserPlus size={20} />
                            <span>Share Lead</span>
                        </button>
                        <button
                            onClick={() => setIsAddLeadModalOpen(true)}
                            className="bg-[#295A47] hover:bg-[#1f4335] text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-medium transition-all shadow-md hover:shadow-lg whitespace-nowrap"
                        >
                            <UserPlus size={20} />
                            <span>Add Lead</span>
                        </button>
                    </div>
                </div>
                {/* FILTERS TOGGLE */}
                <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 text-[#295A47] hover:text-[#1f4335] font-medium transition-colors md:hidden"
                >
                    <Filter size={18} />
                    <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
                </button>
            </div>
            {/* FILTERS */}
            <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 ${showFilters ? 'block' : 'hidden md:grid'}`}>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent outline-none transition-all"
                    >
                        <option value="all">All Status</option>
                        <option value="Upcoming">Upcoming</option>
                        <option value="Not Responding">Not Responding</option>
                        <option value="Not Show">Not Show</option>
                        <option value="Responding">Responding</option>
                        <option value="Not Interested">Not Interested</option>
                        <option value="Prospect">Prospect</option>
                        <option value="Interested">Interested</option>
                        <option value="Booked Somewhere Else">Booked Somewhere Else</option>
                        <option value="Booked">Booked</option>
                        <option value="By Time Ascending">By Time Ascending</option>
                        <option value="By Time Descending">By Time Descending</option>
                        <option value="Confirmed">Confirmed</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent outline-none transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Show Entries</label>
                    <select
                        value={showEntries}
                        onChange={(e) => setShowEntries(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#295A47] focus:border-transparent outline-none transition-all"
                    >
                        <option value="10">10 per page</option>
                        <option value="25">25 per page</option>
                        <option value="50">50 per page</option>
                        <option value="100">100 per page</option>
                        <option value="all">All</option>
                    </select>
                </div>
            </div>
            {/* STATS CARDS */}
            {activeTab === 'site' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    {[
                        { title: 'Total Visits', count: totalCount, action: 'all' },
                        { title: 'Residential Visits', count: residentialCount, action: 'residential' },
                        { title: 'Commercial Visits', count: commercialCount, action: 'commercial' }
                    ].map((stat) => (
                        <button
                            key={stat.action}
                            onClick={() => setFilterType(stat.action as any)}
                            className={`p-3 rounded-lg border-2 transition-all ${filterType === stat.action
                                ? 'bg-[#295A47] text-white border-[#295A47]'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-[#295A47]'
                                }`}
                        >
                            <p className="text-xs font-medium opacity-80 mb-0.5">
                                {stat.title}
                            </p>
                            <p className="text-xl font-bold">{stat.count}</p>
                        </button>
                    ))}
                </div>
            )}
            {/* TABLE CONTAINER: COMPACTED TO FIT "TYPE" DIRECTLY INTO THE PRIMARY GRID */}
            <div className="w-full min-w-0 overflow-x-auto overflow-y-hidden bg-white rounded-xl shadow-md border border-gray-200">
                <table className="w-full text-sm table-auto min-w-[1250px]">
                    <thead>
                        <tr className="bg-linear-to-r from-[#295A47] to-[#1f4335] text-white border-b-2 border-gray-200">
                            <th className="px-2 py-3 text-left font-semibold whitespace-nowrap w-12 max-w-[48px]">Sl.No</th>
                            <th className="px-3 py-3 text-left font-semibold whitespace-nowrap w-28 max-w-[110px]">Lead ID</th>
                            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Client Name</th>
                            <th className="px-3 py-3 text-left font-semibold whitespace-nowrap w-32 max-w-[125px]">Contact</th>
                            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Apt ID</th>
                            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Project</th>
                            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Budget</th>
                            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Location</th>
                            <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Type</th>
                            {activeTab === 'cold' && (
                                <>
                                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">From</th>
                                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">To</th>
                                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Status</th>
                                    <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Action</th>
                                </>
                            )}
                            {activeTab === 'site' && (
                                <>
                                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">From</th>
                                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">To</th>
                                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Status</th>
                                    <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Notes</th>
                                </>
                            )}
                            {activeTab === 'booking' && (
                                <>
                                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">From</th>
                                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">To</th>
                                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Status</th>
                                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Next</th>
                                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Booking ID</th>
                                    <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Notes</th>
                                    <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Action</th>
                                </>
                            )}
                            {activeTab === 'booked' && (
                                <>
                                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Date</th>
                                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Time</th>
                                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Status</th>
                                    <th className="px-4 py-3 text-left font-semibold whitespace-nowrap">Booking ID</th>
                                    <th className="px-4 py-3 text-center font-semibold whitespace-nowrap">Notes</th>
                                </>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {paginatedData.length === 0 ? (
                            <tr>
                                <td colSpan={14} className="px-4 py-8 text-center text-gray-500">
                                    <p className="text-lg font-medium">No leads found</p>
                                    <p className="text-sm">Try adjusting your filters or add a new lead</p>
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((lead, index) => (
                                <tr key={lead.id} className="hover:bg-blue-50 transition-colors">
                                    <td className="px-2 py-3 font-medium text-gray-900 whitespace-nowrap text-center w-12 max-w-[48px]">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="px-3 py-3 w-28 max-w-[110px] whitespace-nowrap">
                                        <input
                                            type="text"
                                            value={lead.leadId}
                                            onChange={(e) => handleChange(lead.id, 'leadId', e.target.value)}
                                            className="w-full px-1.5 py-1 border border-gray-200 rounded bg-blue-50 font-mono text-xxs scale-95 focus:ring-1 focus:ring-[#295A47] outline-none"
                                        />
                                    </td>
                                    <td className="px-4 py-3 min-w-[150px] whitespace-nowrap">
                                        {editingClientName === lead.id ? (
                                            <div className="flex gap-1 items-center">
                                                <input
                                                    type="text"
                                                    value={lead.clientName}
                                                    onChange={(e) => {
                                                        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, clientName: e.target.value } : l));
                                                    }}
                                                    className="flex-1 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-[#295A47] outline-none"
                                                    autoFocus
                                                />
                                                <button onClick={() => handleSaveClientName(lead.id, lead.clientName)} className="text-green-600 hover:text-green-700 font-bold px-1">✓</button>
                                                <button onClick={() => setEditingClientName(null)} className="text-red-600 hover:text-red-700 font-bold px-1">✕</button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900">{highlightText(lead.clientName)}</span>
                                                {/* <button onClick={() => handleEditClientName(lead.id)} className="text-gray-400 hover:text-[#295A47]">
                                                    <Edit size={14} />
                                                </button> */}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-3 py-3 w-32 max-w-[125px] whitespace-nowrap">
                                        {editingClientContact === lead.id ? (
                                            <div className="flex gap-1 items-center">
                                                <input
                                                    type="text"
                                                    value={lead.clientContact}
                                                    onChange={(e) => {
                                                        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, clientContact: e.target.value } : l));
                                                    }}
                                                    className="flex-1 px-1.5 py-0.5 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-[#295A47] outline-none"
                                                    autoFocus
                                                />
                                                <button onClick={() => handleSaveClientContact(lead.id, lead.clientContact)} className="text-green-600 hover:text-green-700 font-bold text-xs px-0.5">✓</button>
                                                <button onClick={() => setEditingClientContact(null)} className="text-red-600 hover:text-red-700 font-bold text-xs px-0.5">✕</button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-between gap-1">
                                                <span className="text-gray-900 text-xs tracking-tight">{highlightText(lead.clientContact)}</span>
                                                {/* <button onClick={() => handleEditClientContact(lead.id)} className="text-gray-400 hover:text-[#295A47] flex-shrink-0">
                                                    <Edit size={13} />
                                                </button> */}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 font-mono text-xs text-gray-600 whitespace-nowrap">{highlightText(lead.AppoinmentID)}</td>
                                    <td className="px-4 py-3 min-w-[140px] whitespace-nowrap">
                                        <input
                                            type="text"
                                            value={lead.projectName}
                                            onChange={(e) => handleChange(lead.id, 'projectName', e.target.value)}
                                            className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-[#295A47] outline-none text-sm"
                                            placeholder="Project name"
                                        />
                                    </td>
                                    <td className="px-4 py-3 max-w-[100px] whitespace-nowrap">
                                        <input
                                            type="text"
                                            value={lead.projectvalue}
                                            onChange={(e) => handleChange(lead.id, 'projectvalue', e.target.value)}
                                            className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-[#295A47] outline-none text-sm"
                                            placeholder="Budget"
                                        />
                                    </td>
                                    <td className="px-4 py-3 min-w-[140px] whitespace-nowrap">
                                        <input
                                            type="text"
                                            value={lead.propertyAddress}
                                            onChange={(e) => handleChange(lead.id, 'propertyAddress', e.target.value)}
                                            className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-[#295A47] outline-none text-sm"
                                            placeholder="Location"
                                        />
                                    </td>
                                    <td className="px-4 py-3 min-w-[170px] whitespace-nowrap">
                                        <select
                                            value={lead.propertyType}
                                            onChange={(e) => handleChange(lead.id, 'propertyType', e.target.value)}
                                            className="w-full px-1 py-1 border border-gray-300 rounded font-medium text-gray-700 bg-gray-50 focus:ring-1 focus:ring-[#295A47] outline-none text-xs"
                                        >
                                            <option value="Residential">Residential</option>
                                            <option value="Commercial">Commercial</option>
                                        </select>
                                    </td>
                                    {activeTab === 'cold' && (
                                        <>
                                            <td className="px-4 py-3 min-w-[170px] whitespace-nowrap">
                                                <input
                                                    type="datetime-local"
                                                    value={formatDateTimeForInput(lead.coldCallFrom)}
                                                    onChange={(e) => handleChange(lead.id, "coldCallFrom", e.target.value.replace("T", " ") + ":00")}
                                                    className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-[#295A47] outline-none text-sm"
                                                />
                                            </td>
                                            <td className="px-4 py-3 min-w-[170px] whitespace-nowrap">
                                                <input
                                                    type="datetime-local"
                                                    value={formatDateTimeForInput(lead.coldCallTo)}
                                                    onChange={(e) => handleChange(lead.id, "coldCallTo", e.target.value.replace("T", " ") + ":00")}
                                                    className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-[#295A47] outline-none text-sm"
                                                />
                                            </td>
                                            <td className="px-4 py-3 min-w-[140px] whitespace-nowrap">
                                                <select
                                                    value={lead.coldCallStatus}
                                                    onChange={(e) => handleChange(lead.id, 'coldCallStatus', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-[#295A47] outline-none text-sm"
                                                >
                                                    <option>Upcoming</option>
                                                    <option value="Not Interested">Not Interested</option>
                                                    <option value="Prospect">Prospect</option>
                                                    <option value="Interested">Interested</option>
                                                    <option>Not Responding</option>
                                                    <option>Responding</option>
                                                    <option>Not Show</option>
                                                    <option>Booked Somewhere Else</option>
                                                    <option>Confirmed</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <button
                                                    onClick={() => handleRemarkClick(lead.id)}
                                                    className="bg-[#295A47] hover:bg-[#1f4335] text-white px-3 py-1 rounded text-sm font-medium transition-all"
                                                >
                                                    Remarks
                                                </button>
                                            </td>
                                        </>
                                    )}
                                    {activeTab === 'site' && (
                                        <>
                                            <td className="px-4 py-3 min-w-[170px] whitespace-nowrap">
                                                <input
                                                    type="datetime-local"
                                                    value={formatDateTimeForInput(lead.siteVisitFrom)}
                                                    onChange={(e) => handleChange(lead.id, "siteVisitFrom", e.target.value.replace("T", " ") + ":00")}
                                                    className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-[#295A47] outline-none text-sm"
                                                />
                                            </td>
                                            <td className="px-4 py-3 min-w-[170px] whitespace-nowrap">
                                                <input
                                                    type="datetime-local"
                                                    value={formatDateTimeForInput(lead.siteVisitTo)}
                                                    onChange={(e) => handleChange(lead.id, "siteVisitTo", e.target.value.replace("T", " ") + ":00")}
                                                    className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-[#295A47] outline-none text-sm"
                                                />
                                            </td>
                                            <td className="px-4 py-3 min-w-[140px] whitespace-nowrap">
                                                <select
                                                    value={lead.siteVisitStatus}
                                                    onChange={(e) => handleChange(lead.id, 'siteVisitStatus', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-[#295A47] outline-none text-sm"
                                                >
                                                    <option>Upcoming</option>
                                                    <option>Not Responding</option>
                                                    <option value="Not Interested">Not Interested</option>
                                                    <option value="Prospect">Prospect</option>
                                                    <option value="Interested">Interested</option>
                                                    <option>Responding</option>
                                                    <option>Not Show</option>
                                                    <option>Booked Somewhere Else</option>
                                                    <option>Confirmed</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <button
                                                    onClick={() => handleRemarkClick(lead.id)}
                                                    className="bg-[#295A47] hover:bg-[#1f4335] text-white px-3 py-1 rounded text-sm font-medium transition-all"
                                                >
                                                    Remarks
                                                </button>
                                            </td>
                                        </>
                                    )}
                                    {activeTab === 'booking' && (
                                        <>
                                            <td className="px-4 py-3 min-w-[170px] whitespace-nowrap">
                                                <input
                                                    type="datetime-local"
                                                    value={formatDateTimeForInput(lead.bookingDateFrom)}
                                                    onChange={(e) => handleChange(lead.id, "bookingDateFrom", e.target.value.replace("T", " ") + ":00")}
                                                    className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-[#295A47] outline-none text-sm"
                                                />
                                            </td>
                                            <td className="px-4 py-3 min-w-[170px] whitespace-nowrap">
                                                <input
                                                    type="datetime-local"
                                                    value={formatDateTimeForInput(lead.bookingTimeTo)}
                                                    onChange={(e) => handleChange(lead.id, "bookingTimeTo", e.target.value.replace("T", " ") + ":00")}
                                                    className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-[#295A47] outline-none text-sm"
                                                />
                                            </td>
                                            <td className="px-4 py-3 min-w-[140px] whitespace-nowrap">
                                                <select
                                                    value={lead.bookingStatus}
                                                    onChange={(e) => handleChange(lead.id, 'bookingStatus', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-[#295A47] outline-none text-sm"
                                                >
                                                    <option>Upcoming</option>
                                                    <option>Responding</option>
                                                    <option value="Not Interested">Not Interested</option>
                                                    <option value="Prospect">Prospect</option>
                                                    <option value="Interested">Interested</option>
                                                    <option>Not Responding</option>
                                                    <option>Not Show</option>
                                                    <option>Booked Somewhere Else</option>
                                                    <option>Booked</option>
                                                    <option>Confirmed</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 min-w-[110px] whitespace-nowrap">
                                                <select
                                                    value={lead.BookedInNext}
                                                    onChange={(e) => handleChange(lead.id, 'BookedInNext', e.target.value)}
                                                    disabled={Boolean(lead.BookedInNext && lead.BookedInNext !== 'N/A')}
                                                    className={`w-full px-2 py-1 border rounded focus:ring-2 focus:ring-[#295A47] outline-none text-sm ${lead.BookedInNext && lead.BookedInNext !== 'N/A' ? 'bg-gray-100 cursor-not-allowed border-gray-300' : 'border-gray-200'}`}
                                                >
                                                    <option value="">Select</option>
                                                    <option value="3days">3 days</option>
                                                    <option value="5days">5 days</option>
                                                    <option value="7days">7 days</option>
                                                    <option value="10days">10 days</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-3 min-w-[130px] whitespace-nowrap">
                                                <input
                                                    type="text"
                                                    value={lead.bookingId}
                                                    onChange={(e) => handleChange(lead.id, 'bookingId', e.target.value)}
                                                    className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-2 focus:ring-[#295A47] outline-none text-sm"
                                                    placeholder="Booking ID"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <button
                                                    onClick={() => handleRemarkClick(lead.id)}
                                                    className="bg-[#295A47] hover:bg-[#1f4335] text-white px-3 py-1 rounded text-sm font-medium transition-all"
                                                >
                                                    Remarks
                                                </button>
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <button
                                                    onClick={() => handleBookClick(lead.id)}
                                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium transition-all"
                                                >
                                                    Book
                                                </button>
                                            </td>
                                        </>
                                    )}
                                    {activeTab === 'booked' && (
                                        <>
                                            <td className="px-4 py-3 min-w-[130px] whitespace-nowrap">
                                                <input
                                                    type="date"
                                                    value={formatDateForInput(lead.bookingDateFrom)}
                                                    readOnly
                                                    className="w-full px-2 py-1 bg-gray-100 border border-gray-200 rounded text-sm cursor-not-allowed"
                                                />
                                            </td>
                                            <td className="px-4 py-3 min-w-[110px] whitespace-nowrap">
                                                <input
                                                    type="time"
                                                    value={lead.bookingTimeTo === 'N/A' ? '' : lead.bookingTimeTo.substring(11, 16)}
                                                    readOnly
                                                    className="w-full px-2 py-1 bg-gray-100 border border-gray-200 rounded text-sm cursor-not-allowed"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <StatusBadge value="Booked" />
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-gray-600 min-w-[130px] whitespace-nowrap">
                                                {lead.bookingId}
                                            </td>
                                            <td className="px-4 py-3 text-center whitespace-nowrap">
                                                <button
                                                    onClick={() => handleRemarkClick(lead.id)}
                                                    className="bg-[#295A47] hover:bg-[#1f4335] text-white px-3 py-1 rounded text-sm font-medium transition-all"
                                                >
                                                    Remarks
                                                </button>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            {/* PAGINATION */}
            {filteredData.length > 0 && showEntries !== 'all' && (
                <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 bg-white p-4 rounded-lg border border-gray-200">
                    <div className="text-sm text-gray-600 font-medium">
                        Showing <span className="text-[#295A47] font-bold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-[#295A47] font-bold">{Math.min(currentPage * itemsPerPage, filteredData.length)}</span> of <span className="text-[#295A47] font-bold">{filteredData.length}</span> entries
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-sm font-medium text-gray-700">
                                Page <span className="text-[#295A47] font-bold">{currentPage}</span> of <span className="text-[#295A47] font-bold">{totalPages}</span>
                            </span>
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}
            {/* MODALS */}
            <RemarkModal
                isOpen={isPopupOpen}
                remarks={currentLeadId ? leads.find((lead) => lead.id === currentLeadId)?.remarks || [] : []}
                currentComment={currentComment}
                setCurrentComment={setCurrentComment}
                onSave={() => {
                    handleSaveRemark();
                    closePopup();
                }}
                onClose={closePopup}
            />
            <AddLeadModal
                isOpen={isAddLeadModalOpen}
                onClose={() => setIsAddLeadModalOpen(false)}
                onSuccess={handleLeadAdded}
            />
            <ShareLeadModal
                isOpen={isShareLeadModalOpen}
                onClose={() => setIsShareLeadModalOpen(false)}
            />
            {/* SUCCESS POPUPS */}
            {showBookedPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm border border-gray-200">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">✓</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Lead Booked!</h2>
                            <p className="text-gray-600 mb-6">
                                Your lead has been successfully booked. You can now view it in the <strong>Booked</strong> tab.
                            </p>
                            <button
                                onClick={() => setShowBookedPopup(false)}
                                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition-all"
                            >
                                Awesome!
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {showSuccessPopup && (
                <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm border border-gray-200">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-3xl">✓</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h2>
                            <p className="text-gray-600 mb-6">
                                You have successfully added a new lead.
                            </p>
                            <button
                                onClick={() => setShowSuccessPopup(false)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-all"
                            >
                                Got It!
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default LeadsTab;