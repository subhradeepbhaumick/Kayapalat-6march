'use client';

import React, { useState, useEffect } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { getSession } from 'next-auth/react';
import RemarkModal from "../sales-admin/RemarkModal";
import {getToken} from "next-auth/jwt";
type Tab = 'cold' | 'site' | 'booking' | 'booked';

type Remark = {
  id: number;
  date: string;
  time: string;
  comment: string;
};

type Lead = {
  id: string;
  admin_name: string;
  agentId: string;
  agentName: string;
  clientName: string;
  clientContact: string;
  AppoinmentID: string;
  projectName: string;
  projectvalue: string;
  agentshare: string;
  Commission: string;
  propertyAddress: string;
  details: string;
  coldCallDate: string;
  coldCallTime: string;
  coldCallStatus: string;
  siteVisitDate: string;
  siteVisitTime: string;
  siteVisitStatus: string;
  bookingDate: string;
  bookingTime: string;
  bookingStatus: string;
  BookedInNext: string;
  bookingId: string;
  propertyType: string;
  remarks: Remark[];
};

const LeadTab = () => {
  const [activeTab, setActiveTab] = useState<Tab>('cold');
  const [status, setStatus] = useState('all');
  const [showEntries, setShowEntries] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'residential' | 'commercial'>('all');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [seenLeads, setSeenLeads] = useState<Set<string>>(new Set());

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/superadmin/lead', {
        method: 'GET',
        credentials: 'include',
      });
      if (!res.ok) {
        console.error('Failed to fetch leads:', res.status, res.statusText);
        const errorData = await res.json();
        console.error('Error details:', errorData);
        setLoading(false);
        return;
      }
      const data = await res.json();
      console.log('Fetched data:', data); // Debug log
      if (data.leads && Array.isArray(data.leads)) {
        setLeads(data.leads.map((project: any, index: number) => ({
          id: project.appointment_id,
          admin_name: project.admin_name || 'N/A',
          agentId: project.agent_id || 'N/A',
          agentName: project.agent_name || 'N/A',
          clientName: project.client_name || 'N/A',
          clientContact: project.client_phone || 'N/A',
          AppoinmentID: project.appointment_id,
          projectName: project.project_name || 'N/A',
          projectvalue: project.project_value?.toString() || 'N/A',
          agentshare: project.agent_share?.toString() || 'N/A',
          Commission: project.commission?.toString() || 'N/A',
          propertyAddress: project.location || 'N/A',
          details: project.details || 'N/A',
          coldCallDate: project.cold_call_date || 'N/A',
          coldCallTime: project.cold_call_time || 'N/A',
          coldCallStatus: project.cold_call_status || 'N/A',
          siteVisitDate: project.site_visit_date || 'N/A',
          siteVisitTime: project.site_visit_time || 'N/A',
          siteVisitStatus: project.site_visit_status || 'N/A',
          bookingDate: project.booking_date || 'N/A',
          bookingTime: project.booking_time || 'N/A',
          bookingStatus: project.booking_status || 'N/A',
          BookedInNext: project.bookedInNext || 'N/A',
          bookingId: 'N/A', // Not in projects table
          propertyType: project.property_type || 'N/A',
          remarks: [], // Remarks not in projects table
        })));
      } else {
        console.warn('No leads data received');
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);



  const [search, setSearch] = useState('');
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [currentLeadId, setCurrentLeadId] = useState<string | null>(null);
  const [currentComment, setCurrentComment] = useState('');
  

  // Filter leads by tab, status, dates, showEntries, search, and admin
  const filterData = () => {
    let filtered = leads;

    // Tab filter
    if (activeTab === 'cold') {
      filtered = filtered.filter(lead => lead.coldCallStatus !== 'Confirmed');
    } else if (activeTab === 'site') {
      filtered = filtered.filter(lead => lead.coldCallStatus === 'Confirmed' && lead.siteVisitStatus !== 'Confirmed');
    } else if (activeTab === 'booking') {
      filtered = filtered.filter(lead => lead.siteVisitStatus === 'Confirmed');
    } else if (activeTab === 'booked') {
        filtered = filtered.filter(lead => lead.bookingStatus === 'Booked');
}



  // Status filter
  if (status !== 'all' && status !== 'By Time Ascending' && status !== 'By Time Descending') {
    if (activeTab === 'cold') {
      filtered = filtered.filter(lead => lead.coldCallStatus === status);
    } else if (activeTab === 'site') {
      filtered = filtered.filter(lead => lead.siteVisitStatus === status);
    } else if (activeTab === 'booking') {
      filtered = filtered.filter(lead => lead.bookingStatus === status);
    }
  }

    // Date filter
    if (fromDate) {
      filtered = filtered.filter(lead => {
        const date = activeTab === 'cold' ? lead.coldCallDate : activeTab === 'site' ? lead.siteVisitDate : lead.bookingDate;
        return date >= fromDate;
      });
    }
    if (toDate) {
      filtered = filtered.filter(lead => {
        const date = activeTab === 'cold' ? lead.coldCallDate : activeTab === 'site' ? lead.siteVisitDate : lead.bookingDate;
        return date <= toDate;
      });
    }

    // Property type filter for site tab
    if (activeTab === 'site' && filterType !== 'all') {
      filtered = filtered.filter(lead => lead.propertyType.toLowerCase() === filterType);
    }

    // Search filter
    if (search) {
      filtered = filtered.filter((lead) =>
        Object.values(lead).some((val) =>
          val?.toString().toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    // Show entries
    if (showEntries !== 'all') {
      filtered = filtered.slice(0, parseInt(showEntries));
    }

    // Sorting by time
    if (status === 'By Time Ascending') {
      filtered = filtered.sort((a, b) => {
        const aDate = activeTab === 'cold' ? a.coldCallDate : activeTab === 'site' ? a.siteVisitDate : a.bookingDate;
        const aTime = activeTab === 'cold' ? a.coldCallTime : activeTab === 'site' ? a.siteVisitTime : a.bookingTime;
        const bDate = activeTab === 'cold' ? b.coldCallDate : activeTab === 'site' ? b.siteVisitDate : b.bookingDate;
        const bTime = activeTab === 'cold' ? b.coldCallTime : activeTab === 'site' ? b.siteVisitTime : b.bookingTime;
        const aCombined = aDate + ' ' + aTime;
        const bCombined = bDate + ' ' + bTime;
        return aCombined.localeCompare(bCombined);
      });
    } else if (status === 'By Time Descending') {
      filtered = filtered.sort((a, b) => {
        const aDate = activeTab === 'cold' ? a.coldCallDate : activeTab === 'site' ? a.siteVisitDate : a.bookingDate;
        const aTime = activeTab === 'cold' ? a.coldCallTime : activeTab === 'site' ? a.siteVisitTime : a.bookingTime;
        const bDate = activeTab === 'cold' ? b.coldCallDate : activeTab === 'site' ? b.siteVisitDate : b.bookingDate;
        const bTime = activeTab === 'cold' ? b.coldCallTime : activeTab === 'site' ? b.siteVisitTime : b.bookingTime;
        const aCombined = aDate + ' ' + aTime;
        const bCombined = bDate + ' ' + bTime;
        return bCombined.localeCompare(aCombined);
      });
    }

    return filtered;
  };

  const filteredData = filterData();

  // Handle admin input changes
  const handleChange = async (id: string, field: string, value: string) => {
    const session = await getSession();
    const token = session?.token;
    if (!token) {
      console.warn('No token found');
      return;
    }

    // Mark as seen when modified
    setSeenLeads(prev => new Set([...prev, id]));

    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id === id) {
          const updatedLead = { ...lead, [field]: value };
          // Logic to move leads between tabs
          if (field === 'coldCallStatus' && value === 'Confirmed') {
            // Move to Site Visit: set siteVisitStatus to 'Upcoming' if not set
            if (!updatedLead.siteVisitStatus || updatedLead.siteVisitStatus === '') {
              updatedLead.siteVisitStatus = 'Upcoming';
            }
          } else if (field === 'siteVisitStatus' && value === 'Confirmed') {
            // Move to Bookings: set bookingStatus to 'Upcoming' if not set
            if (!updatedLead.bookingStatus || updatedLead.bookingStatus === '') {
              updatedLead.bookingStatus = 'Upcoming';
            }
          }
          return updatedLead;
        }
        return lead;
      })
    );

    // Prepare updates object for API
    const updates: any = {};
    if (field === 'projectName') updates.project_name = value;
    else if (field === 'projectvalue') updates.project_value = parseFloat(value.replace(/[₹,%\s]/g, '').replace(/,/g, '') || '0');
    else if (field === 'Commission') updates.commission = parseFloat(value.replace(/[₹,%\s]/g, '').replace(/,/g, '') || '0');
    else if (field === 'agentshare') updates.agent_share = parseFloat(value.replace(/[₹,%\s]/g, '').replace(/,/g, '') || '0');
    else if (field === 'propertyAddress') updates.location = value;
    else if (field === 'details') updates.details = value;
    else if (field === 'propertyType') updates.property_type = value;
    else if (field === 'coldCallDate') updates.cold_call_date = value;
    else if (field === 'coldCallTime') updates.cold_call_time = value;
    else if (field === 'coldCallStatus') updates.cold_call_status = value;
    else if (field === 'siteVisitDate') updates.site_visit_date = value;
    else if (field === 'siteVisitTime') updates.site_visit_time = value;
    else if (field === 'siteVisitStatus') updates.site_visit_status = value;
    else if (field === 'bookingDate') updates.booking_date = value;
    else if (field === 'bookingTime') updates.booking_time = value;
    else if (field === 'bookingStatus') updates.booking_status = value;
    else if (field === 'BookedInNext') updates.bookedInNext = value;
    else if (field === 'bookingId') updates.booking_id = value;

    try {
    const res = await fetch('/api/superadmin/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // send cookies automatically
      body: JSON.stringify({
        appointment_id: leads.find(lead => lead.id === id)?.AppoinmentID,
        ...updates,
      }),
    });

    if (!res.ok) {
      console.error('Failed to update project');
      // Revert by refetching
      fetchProjects();
    } else {
      console.log('Successfully updated project via PUT');
      // Refetch to get the entire projects table with latest data
      fetchProjects();
    }
  } catch (error) {
    console.error('Error updating project:', error);
    // Revert by refetching
    fetchProjects();
  }
};

  // Stats for site visit
  const totalCount = leads.filter(lead => lead.coldCallStatus === 'Confirmed' && lead.siteVisitStatus !== 'Confirmed').length;
  const residentialCount = leads.filter(lead => lead.coldCallStatus === 'Confirmed' && lead.siteVisitStatus !== 'Confirmed' && lead.propertyType === 'Residential').length;
  const commercialCount = leads.filter(lead => lead.coldCallStatus === 'Confirmed' && lead.siteVisitStatus !== 'Confirmed' && lead.propertyType === 'Commercial').length;

  // Handle remark button click
  const handleRemarkClick = (leadId: string) => {
    setCurrentLeadId(leadId);
    setIsPopupOpen(true);
    setCurrentComment('');
  };
  // Handle book button click
  const handleBookClick = async (id: string) => {
    // const session = await getSession();
    // const token = session?.token;
    // if (!token) {
    //   console.warn('No token found');
    //   return;
    // }

    const lead = leads.find(lead => lead.id === id);
    if (!lead) return;

    // Update local state
    setLeads(prev =>
      prev.map(lead => {
        if (lead.id === id) {
          return {
            ...lead,
            bookingStatus: 'Booked',
            // Optional: ensure consistent dates/times if missing
            bookingDate: lead.bookingDate || new Date().toISOString().slice(0, 10),
            bookingTime: lead.bookingTime || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
          };
        }
        return lead;
      })
    );

    // Prepare updates for API
    const updates: any = {
      booking_status: 'Booked',
    };
    if (!lead.bookingDate) {
      updates.booking_date = new Date().toISOString().slice(0, 10);
    }
    if (!lead.bookingTime) {
      updates.booking_time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    }

    try {
      const res = await fetch('/api/superadmin/lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          appointment_id: lead.AppoinmentID,
          ...updates,
        }),
      });
      if (!res.ok) {
        console.error('Failed to update booking status via PUT');
      } else {
        console.log('Successfully updated booking status via PUT');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
    }
  };
  const handleShareChange = async (id: string, field: string, value: string) => {
  const session = await getSession();
  const token = session?.token;
  if (!token) {
    console.warn('No token found');
    return;
  }

  setLeads((prevLeads) =>
    prevLeads.map((lead) => {
      if (lead.id === id) {
        let updatedLead = { ...lead, [field]: value };

        // Clean inputs: remove ₹, %, commas, and spaces
        const cleanValue = (v: string) =>
          parseFloat(v.replace(/[₹,%\s]/g, '').replace(/,/g, '') || '0');

        const projectValue = cleanValue(updatedLead.projectvalue);
        const commission = cleanValue(updatedLead.Commission);

        // Auto-calculate if both are valid numbers
        if (projectValue > 0 && commission > 0) {
          updatedLead.agentshare = ((projectValue * commission) / 100).toFixed(2);
        } else {
          updatedLead.agentshare = '';
        }

        return updatedLead;
      }
      return lead;
    })
  );

  // Prepare updates object for API
  const updates: any = {};
  if (field === 'projectvalue') updates.project_value = parseFloat(value.replace(/[₹,%\s]/g, '').replace(/,/g, '') || '0');
  else if (field === 'Commission') updates.commission = parseFloat(value.replace(/[₹,%\s]/g, '').replace(/,/g, '') || '0');

  try {
    const res = await fetch('/api/superadmin/lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        appointment_id: leads.find(lead => lead.id === id)?.AppoinmentID,
        ...updates,
      }),
    });
    if (!res.ok) {
      console.error('Failed to update project');
    }
  } catch (error) {
    console.error('Error updating project:', error);
  }
};

  // Handle edit
  const handleEdit = (id: string) => {
    // Placeholder for edit functionality
    alert(`Edit functionality for lead ${id} can be implemented here.`);
  };

  // Handle delete
  const handleDelete = (id: string) => {
    setLeads(prev => prev.filter(lead => lead.id !== id));
  };

  // Handle save remark
  const handleSaveRemark = async () => {
    if (currentLeadId && currentComment.trim()) {
      const session = await getSession();
      const token = session?.token;
      if (!token) {
        console.warn('No token found');
        return;
      }

      const currentLead = leads.find(lead => lead.id === currentLeadId);
      if (!currentLead) return;

      try {
        const res = await fetch('/api/superadmin/remarks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appointment_id: currentLead.AppoinmentID,
            remark: currentComment.trim(),
          }),
        });

        if (res.ok) {
          // Refetch remarks to update the modal
          const fetchRes = await fetch(`/api/superadmin/remarks?appointment_id=${currentLead.AppoinmentID}`, {
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

  // Highlight matching text in the table
  const highlightText = (text: string) => {
    if (!search.trim()) return text;
    const regex = new RegExp(`(${search})`, 'gi');
    return text.split(regex).map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="bg-yellow-300 text-black font-semibold px-1 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
};


  // Close popup
  const closePopup = () => {
    setIsPopupOpen(false);
    setCurrentLeadId(null);
    setCurrentComment('');
  };

  return (
    <>
      {/* Hero Section with Title and Tabs */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold text-[#295A47]">Leads Management</h1>

        {/* Tabs */}
        <div className="flex gap-4">
          <button
            className={`px-2  rounded-3xl ${
              activeTab === "cold" ? "bg-green-900 text-white" : "bg-white border"
            }`}
            onClick={() => setActiveTab("cold")}
          >
            Cold Calling
          </button>
          <button
            className={`px-2 py-1 rounded-3xl ${
              activeTab === "site" ? "bg-green-900 text-white" : "bg-white border"
            }`}
            onClick={() => setActiveTab("site")}
          >
            Site Visit
          </button>
          <button
            className={`px-2 py-1 rounded-3xl ${
              activeTab === "booking"
                ? "bg-green-900 text-white"
                : "bg-white border"
            }`}
            onClick={() => setActiveTab("booking")}
          >
            Hot Client
          </button>
          <button
            className={`px-2 py-1 rounded-3xl ${
              activeTab === "booked"
                ? "bg-green-900 text-white"
                : "bg-white border"
            }`}
            onClick={() => setActiveTab("booked")}
          >
            Booked
          </button>
        </div>
      </div>

      {/* Search Bar in Hero */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative w-full max-w-lg">
          <Search className="absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Search anything..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#295A47]"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm mb-4">
        <div className="flex gap-4 items-center">
          <div>
            <label className="text-sm text-gray-600 block mb-1">Select Status</label>
            <select
              className="border p-2 rounded-md"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Not Responding">Not Responding</option>
              <option value="Not Show">Not Show</option>
              <option value="Booked Somewhere Else">Booked Somewhere Else</option>
              <option value="Booked">Booked</option>
              <option value="By Time Ascending">By Time Ascending</option>
              <option value="By Time Descending">By Time Descending</option>
              <option value="Confirmed">Confirmed</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">From Date</label>
            <input type="date" className="border p-2 rounded-md" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">To Date</label>
            <input type="date" className="border p-2 rounded-md" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-600 block mb-1">Show</label>
          <select
            className="border p-2 rounded-md"
            value={showEntries}
            onChange={(e) => setShowEntries(e.target.value)}
          >
            <option value="all">All</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
          <span className="ml-2 text-sm text-gray-600">entries</span>
        </div>
      </div>

      {/* Stats for Site Visit */}
      {activeTab === "site" && (
        <div className="flex gap-6 mb-6">
          <button
            className="p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50"
            onClick={() => setFilterType('all')}
          >
            <p className="text-gray-500 text-sm">Total upcoming visit: <span className="font-semibold">{totalCount}</span></p>
          </button>
          <button
            className="p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50"
            onClick={() => setFilterType('residential')}
          >
            <p className="text-gray-500 text-sm">Residential upcoming visit: <span className="font-semibold">{residentialCount}</span></p>
          </button>
          <button
            className="p-4 bg-white rounded-lg shadow-sm hover:bg-gray-50"
            onClick={() => setFilterType('commercial')}
          >
            <p className="text-gray-500 text-sm">Commercial upcoming visit: <span className="font-semibold">{commercialCount}</span></p>
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <table className="min-w-full text-sm text-gray-700 border-collapse border border-gray-300 rounded-lg overflow-hidden">
          <thead className="bg-gradient-to-r from-[#295A47] to-[#3a7d5f] text-white">
            <tr>
              <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Sl.No</th>
              <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Admin Name</th>
              <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Agent ID</th>
              <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Agent Name</th>
              <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Client Name</th>
              <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Client Contact</th>
              <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Appointment ID</th>
              <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Project Name</th>
              <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Project Value</th>
              <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Commission(%)</th>
              <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Agent Share</th>
              <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Property Address</th>
              <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Details</th>
              {activeTab === 'cold' && (
                <>
                  <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Property Type</th>
                  <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Cold Call date</th>
                  <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Cold Call time</th>
                  <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Cold Call status</th>
                  <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Actions</th>
                </>
              )}

              {activeTab === 'site' && (
                <>
                  <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Property Type</th>
                  <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Site Visit Date</th>
                  <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Site Visit Time</th>
                  <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Site Visit Status</th>
                  <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Remarks</th>
                </>
              )}
              {activeTab === 'booking' && (
                <>
                  <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Property Type</th>
                  <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Booking Date</th>
                  <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Booking Time</th>
                  <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Booking Status</th>
                  <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Booked In Next</th>
                  <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Booking ID</th>
                  <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Remarks</th>
                  <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">To Book</th>
                </>
              )}
              {activeTab === 'booked' && (
                <>
                  <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Property Type</th>
                  <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Booking Date</th>
                  <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Booking Time</th>
                  <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Booking Status</th>
                  <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Booking ID</th>
                  <th className="p-3 border border-gray-300 min-w-[120px] font-semibold">Remarks</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {filteredData.length > 0 ? (
              filteredData.map((lead, index) => (
                <tr key={lead.id} className="text-center even:bg-gray-50 hover:bg-green-50">
                  <td className="border px-4 py-2">{index + 1}</td>
                  <td className="border px-4 py-2">{highlightText(lead.admin_name)}</td>
                  <td className="border px-4 py-2">{highlightText(lead.agentId)}</td>
                  <td className="border px-4 py-2">{highlightText(lead.agentName)}</td>
                  <td className="border px-4 py-2">{highlightText(lead.clientName)}</td>
                  <td className="border px-4 py-2">{highlightText(lead.clientContact)}</td>
                  <td className="border px-4 py-2">{highlightText(lead.AppoinmentID)}</td>
                  {activeTab === 'cold' && (
                    <>
                    <td className="border px-4 py-2">
                        <input
                          type="text"
                          value={lead.projectName}
                          onChange={(e) => handleChange(lead.id, 'projectName', e.target.value)}
                          className="border p-1 rounded w-full"
                        />
                      </td>
                      <td className="border px-4 py-2">
                        <input
                          type="text"
                          value={lead.projectvalue}
                          onChange={(e) => handleShareChange(lead.id, 'projectvalue', e.target.value)}
                          className="border p-1 rounded w-full"
                        />
                      </td>

                      <td className="border px-4 py-2"> 
                        <input
                          type="text"
                          value={lead.Commission}
                          onChange={(e) => handleShareChange(lead.id, 'Commission', e.target.value)}
                          className="border p-1 rounded w-full"
                        />
                      </td>

                      <td className="border px-4 py-2">
                        <input
                          type="text"
                          value={
                            lead.projectvalue && lead.Commission
                              ? ((parseFloat(lead.projectvalue) * parseFloat(lead.Commission)) / 100).toFixed(2)
                              : ''
                          }
                          readOnly
                          className="border p-1 rounded w-full bg-gray-100 cursor-not-allowed"
                        />
                      </td>

                      <td className="border px-4 py-2">
                        <input
                          type="text"
                          value={lead.propertyAddress}
                          onChange={(e) => handleChange(lead.id, 'propertyAddress', e.target.value)}
                          className="border p-1 rounded w-full"
                        />
                      </td>
                      <td className="border px-4 py-2">
                        <input
                          type="text"
                          value={lead.details}
                          onChange={(e) => handleChange(lead.id, 'details', e.target.value)}
                          className="border p-1 rounded w-full"
                        />
                      </td>
                      <td className="border px-4 py-2">
                        <select
                          value={lead.propertyType}
                          onChange={(e) => handleChange(lead.id, 'propertyType', e.target.value)}
                          className="border p-1 rounded w-full"
                        >
                          {/* <option value="">Select</option> */}
                          <option value="Residential">Residential</option>
                          <option value="Commercial">Commercial</option>
                        </select>
                      </td>

                      <td className="border px-4 py-2">
                        <input
                          type="date"
                          value={lead.coldCallDate}
                          onChange={(e) => handleChange(lead.id, 'coldCallDate', e.target.value)}
                          className="border p-1 rounded w-full"
                        />
                      </td>

                      <td className="border px-4 py-2">
                        <input
                          type="time"
                          value={lead.coldCallTime}
                          onChange={(e) => handleChange(lead.id, 'coldCallTime', e.target.value)}
                          className="border p-1 rounded w-full"
                        />
                      </td>

                      <td className="border px-4 py-2">
                        <select
                          value={lead.coldCallStatus}
                          onChange={(e) => handleChange(lead.id, 'coldCallStatus', e.target.value)}
                          className="border p-1 rounded w-full"
                        >
                          <option>Upcoming</option>
                          <option>Not Responding</option>
                          <option>Not Show</option>
                          <option>Booked Somewhere Else</option>
                          <option>Confirmed</option>
                        </select>
                      </td>
                      <td className="border px-4 py-2 text-center">
                        <button
                          className="bg-[#295A47] text-white px-3 py-1 rounded"
                          onClick={() => handleRemarkClick(lead.id)}
                        >
                          Remark
                        </button>

                      </td>
                    </>
                  )}
                  {activeTab === 'site' && (
                    <>
                      <td className="border px-4 py-2">{highlightText(lead.projectName)}</td>
                      <td className="border px-4 py-2">
                        <input
                          type="text"
                          value={lead.projectvalue}
                          onChange={(e) => handleShareChange(lead.id, 'projectvalue', e.target.value)}
                          className="border p-1 rounded w-full"
                        />
                      </td>

                      <td className="border px-4 py-2"> 
                        <input
                          type="text"
                          value={lead.Commission}
                          onChange={(e) => handleShareChange(lead.id, 'Commission', e.target.value)}
                          className="border p-1 rounded w-full"
                        />
                      </td>

                      <td className="border px-4 py-2">
                        <input
                          type="text"
                          value={
                            lead.projectvalue && lead.Commission
                              ? ((parseFloat(lead.projectvalue) * parseFloat(lead.Commission)) / 100).toFixed(2)
                              : ''
                          }
                          readOnly
                          className="border p-1 rounded w-full bg-gray-100 cursor-not-allowed"
                        />
                      </td>
                      <td className="border px-4 py-2">{highlightText(lead.propertyAddress)}</td>
                      <td className="border px-4 py-2">
                        <input
                          type="text"
                          value={lead.details}
                          onChange={(e) => handleChange(lead.id, 'details', e.target.value)}
                          className="border p-1 rounded w-full"
                        />
                      </td>
                      <td className="border px-4 py-2">
                        <select
                          value={lead.propertyType}
                          onChange={(e) => handleChange(lead.id, 'propertyType', e.target.value)}
                          className="border p-1 rounded w-full"
                        >
                          {/* <option value="">Select</option> */}
                          <option value="Residential">Residential</option>
                          <option value="Commercial">Commercial</option>
                        </select>
                      </td>
                      <td className="border px-4 py-2">
                        <input
                          type="date"
                          value={lead.siteVisitDate}
                          onChange={(e) => handleChange(lead.id, 'siteVisitDate', e.target.value)}
                          className="border p-1 rounded w-full"
                        />
                      </td>

                      <td className="border px-4 py-2">
                        <input
                          type="time"
                          value={lead.siteVisitTime}
                          onChange={(e) => handleChange(lead.id, 'siteVisitTime', e.target.value)}
                          className="border p-1 rounded w-full"
                        />
                      </td>

                      <td className="border px-4 py-2">
                        <select
                          value={lead.siteVisitStatus}
                          onChange={(e) => handleChange(lead.id, 'siteVisitStatus', e.target.value)}
                          className="border p-1 rounded w-full"
                        >
                          <option>Upcoming</option>
                          <option>Not Responding</option>
                          <option>Not Show</option>
                          <option>Booked Somewhere Else</option>
                          <option>Confirmed</option>
                        </select>
                      </td>
                      <td className="border px-4 py-2 text-center">
                        <button
                          className="bg-[#295A47] text-white px-3 py-1 rounded"
                          onClick={() => handleRemarkClick(lead.id)}
                        >
                          Remark
                        </button>

                      </td>
                    </>
                  )}

                  {activeTab === 'booking' && (
                    <>
                      <td className="border px-4 py-2">{highlightText(lead.projectName)}</td>
                      <td className="border px-4 py-2">
                        <input
                          type="text"
                          value={lead.projectvalue}
                          onChange={(e) => handleShareChange(lead.id, 'projectvalue', e.target.value)}
                          className="border p-1 rounded w-full"
                        />
                      </td>

                      <td className="border px-4 py-2"> 
                        <input
                          type="text"
                          value={lead.Commission}
                          onChange={(e) => handleShareChange(lead.id, 'Commission', e.target.value)}
                          className="border p-1 rounded w-full"
                        />
                      </td>

                      <td className="border px-4 py-2">
                        <input
                          type="text"
                          value={
                            lead.projectvalue && lead.Commission
                              ? ((parseFloat(lead.projectvalue) * parseFloat(lead.Commission)) / 100).toFixed(2)
                              : ''
                          }
                          readOnly
                          className="border p-1 rounded w-full bg-gray-100 cursor-not-allowed"
                        />
                      </td>
                      <td className="border px-4 py-2">{highlightText(lead.propertyAddress)}</td>
                      <td className="border px-4 py-2">{lead.details}</td>
                      <td className="border px-4 py-2">
                        <select
                          value={lead.propertyType}
                          onChange={(e) => handleChange(lead.id, 'propertyType', e.target.value)}
                          className="border p-1 rounded w-full"
                        >
                          {/* <option value="">Select</option> */}
                          <option value="Residential">Residential</option>
                          <option value="Commercial">Commercial</option>
                        </select>
                      </td>
                      <td className="border px-4 py-2">
                        <input
                          type="date"
                          value={lead.bookingDate}
                          onChange={(e) => handleChange(lead.id, 'bookingDate', e.target.value)}
                          className="border p-1 rounded w-full"
                        />
                      </td>

                      <td className="border px-4 py-2">
                        <input
                          type="time"
                          value={lead.bookingTime}
                          onChange={(e) => handleChange(lead.id, 'bookingTime', e.target.value)}
                          className="border p-1 rounded w-full"
                        />
                      </td>

                      <td className="border px-4 py-2">
                        <select
                          value={lead.bookingStatus}
                          onChange={(e) => handleChange(lead.id, 'bookingStatus', e.target.value)}
                          className="border p-1 rounded w-full"
                        >
                          <option value="">Select</option>
                          <option>Upcoming</option>
                          <option>Not Responding</option>
                          <option>Not Show</option>
                          <option>Booked Somewhere Else</option>
                          <option>Booked</option>
                          <option>Confirmed</option>
                        </select>
                      </td>
                      <td className="border px-4 py-2">
                        <select
                          value={lead.BookedInNext}
                          onChange={(e) => handleChange(lead.id, 'BookedInNext', e.target.value)}
                          disabled={Boolean(lead.BookedInNext && lead.BookedInNext !== 'N/A')}
                          className={`border p-1 rounded w-full ${lead.BookedInNext && lead.BookedInNext !== 'N/A' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        >
                          <option value="">Select</option>
                          <option value="3days">3 days</option>
                          <option value="5days">5 days</option>
                          <option value="7days">7 days</option>
                          <option value="10days">10 days</option>

                        </select>
                      </td>
                      <td className="border px-4 py-2">
                        <input
                          type="text"
                          value={lead.bookingId}
                          onChange={(e) => handleChange(lead.id, 'bookingId', e.target.value)}
                          className="border p-1 rounded w-full"
                        />
                      </td>
                      <td className="border px-4 py-2 text-center">
                        <button
                          className="bg-[#295A47] text-white px-3 py-1 rounded"
                          onClick={() => handleRemarkClick(lead.id)}
                        >
                          Remark
                        </button>

                      </td>
                      <td className="border px-4 py-2 text-center">
                        <button
                          className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          onClick={() => handleBookClick(lead.id)}
                        >
                          Book
                        </button>
                      </td>
                    </>
                  )}
                  {activeTab === 'booked' && (
                  <>
                    <td className="border px-4 py-2">{highlightText(lead.projectName)}</td>
                    <td className="border px-4 py-2">{highlightText(lead.projectvalue)}</td>
                    <td className="border px-4 py-2">{highlightText(lead.Commission)}</td>
                    <td className="border px-4 py-2">{highlightText(lead.agentshare)}</td>
                    <td className="border px-4 py-2">{highlightText(lead.propertyAddress)}</td>
                    <td className="border px-4 py-2">{lead.details}</td>
                    <td className="border px-4 py-2">
                      <select
                        value={lead.propertyType}
                        disabled
                        className="border p-1 rounded w-full bg-gray-100 cursor-not-allowed"
                      >
                        <option value="">Select</option>
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                      </select>
                    </td>

                    <td className="border px-4 py-2">
                      <input
                        type="date"
                        value={lead.bookingDate}
                        readOnly
                        className="border p-1 rounded w-full bg-gray-100 cursor-not-allowed"
                      />
                    </td>

                    <td className="border px-4 py-2">
                      <input
                        type="time"
                        value={lead.bookingTime}
                        readOnly
                        className="border p-1 rounded w-full bg-gray-100 cursor-not-allowed"
                      />
                    </td>

                    <td className="border px-4 py-2">
                      <select
                        value={lead.bookingStatus}
                        disabled
                        className="bg-green-500 text-red-500 w-20 py-1 rounded opacity-980 cursor-not-allowed"
                      >
                        <option value="">Select</option>
                        <option>Upcoming</option>
                        <option>Not Responding</option>
                        <option>Not Show</option>
                        <option>Booked Somewhere Else</option>
                        <option>Booked</option>
                        <option>By Time Ascending</option>
                        <option>By Time Descending</option>
                        <option>Confirmed</option>
                      </select>
                    </td>

                    <td className="border px-4 py-2">
                      <input
                        type="text"
                        value={lead.bookingId}
                        readOnly
                        className="border p-1 rounded w-full bg-gray-100 cursor-not-allowed"
                      />
                    </td>

                    <td className="border px-4 py-2 text-center">
                      <button
                        className="bg-[#295A47] text-white px-3 py-1 rounded"
                        onClick={() => handleRemarkClick(lead.id)}
                      >
                        Remark
                      </button>
                    </td>
                  </>

                )}

                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={activeTab === 'booking' ? 14 : 13} className="text-center py-6 text-gray-500 italic">
                  No leads found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <RemarkModal
        isOpen={isPopupOpen}
        remarks={
          currentLeadId
            ? leads.find((lead) => lead.id === currentLeadId)?.remarks || []
            : []
        }
        currentComment={currentComment}
        setCurrentComment={setCurrentComment}
        onSave={() => {
          handleSaveRemark();
          closePopup();
        }}
        onClose={closePopup}
      />

    </>
  );
};

export default LeadTab;
