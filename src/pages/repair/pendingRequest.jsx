import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { authFetch } from '../../utils/authFetch';
import useAuthStore from '../../store/authStore';
import { 
  ClipboardList, 
  User, 
  Calendar, 
  Wrench, 
  Clock, 
  ChevronRight, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  X,
  Save,
  CheckCircle,
  PlayCircle,
  Upload,
  ImagePlus,
  FileText
} from 'lucide-react';
import { formatTimestampToDDMMYYYY, formatTaskStartDate } from '../../utils/dateUtils';

const RenderDescription = ({ text }) => {
  return (
    <div className="flex flex-col gap-1">
      {text && <p className="text-gray-700 leading-tight">{text}</p>}
    </div>
  );
};

const PendingRequest = () => {
  const { currentUser } = useAuthStore();
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    status: "",
    part_replaced: "",
    vendor_name: "",
    bill_amount: "",
    remarks: "",
    work_photo_url: null,
    bill_copy_url: null
  });

  // Selection State
  const [selectedIds, setSelectedIds] = useState([]);

  const fetchPendingRequests = async () => {
    setIsLoading(true);
    setError(null);
    setSelectedIds([]); // Clear selection on refresh
    try {
      // Fetch all ongoing tasks (Exclude Completed, Approved, and Rejected)
      const exclude = 'Completed,✅ Completed (कार्य पूर्ण),Approved,Rejected';
      const response = await authFetch(`${import.meta.env.VITE_API_BASE_URL}/repair?status_exclude=${encodeURIComponent(exclude)}`);
      const data = await response.json();
      if (response.ok) {
        setRequests(data.repairs || []);
      } else {
        setError(data.error || 'Failed to fetch requests');
      }
    } catch (err) {
      console.error("Fetch Error:", err);
      setError('Connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const filteredRequests = requests.filter(req => 
    req.machine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.issue_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.assigned_person.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleProcessClick = (req) => {
    setSelectedTask(req);
    setUpdateForm({
      status: req.status || "⏳ Pending (लंबित कार्य)",
      part_replaced: req.part_replaced || "",
      vendor_name: req.vendor_name || "",
      bill_amount: req.bill_amount || "",
      remarks: req.remarks || "",
      work_photo_url: req.work_photo_url || null,
      bill_copy_url: req.bill_copy_url || null
    });
    setIsModalOpen(true);
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUpdateForm({ ...updateForm, [field]: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;

    // Validate mandatory fields for Completed status
    if (updateForm.status === 'Completed' || updateForm.status === '✅ Completed (कार्य पूर्ण)') {
      if (!updateForm.work_photo_url) {
        alert("Please upload a photo of the work done.");
        return;
      }
      if (!updateForm.bill_copy_url) {
        alert("Please upload the bill copy.");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await authFetch(`${import.meta.env.VITE_API_BASE_URL}/repair/${selectedTask.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateForm)
      });

      if (response.ok) {
        setIsModalOpen(false);
        fetchPendingRequests(); // Refresh table
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update ticket");
      }
    } catch (err) {
      console.error("Update Error:", err);
      alert("Connection error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Selection Handlers
  const handleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (isAllSelected) => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRequests.map(r => r.id));
    }
  };

  const isAllSelected = filteredRequests.length > 0 && selectedIds.length === filteredRequests.length;

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Observation':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Temporary':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Cancelled':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'Completed':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'Approved':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'Rejected':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        // Handle legacy labels or fallback
        if (status?.includes('Completed')) return 'bg-emerald-100 text-emerald-700 border-emerald-200';
        if (status?.includes('Pending')) return 'bg-amber-100 text-amber-700 border-amber-200';
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-lg shadow-sm">
                <Clock className="text-amber-600 h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Pending Requests</h1>
                <p className="text-sm text-slate-500">Manage and track ongoing repair tasks</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={fetchPendingRequests}
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
                title="Refresh Table"
              >
                <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm w-full md:w-64"
                />
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl flex items-center gap-3">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          )}

          {/* content Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                <Loader2 className="animate-spin h-10 w-10 mb-4 text-purple-500" />
                <p className="font-medium">Loading repair requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-slate-400 text-center">
                <div className="bg-slate-50 p-6 rounded-full mb-4">
                  <ClipboardList className="h-12 w-12 text-slate-200" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">No Pending Requests</h3>
                <p className="max-w-xs mx-auto">Great! All repair tasks have been processed or scheduled.</p>
              </div>
            ) : (
              <>
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="px-4 py-4 w-10">
                         <input 
                            type="checkbox" 
                            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                            checked={isAllSelected}
                            onChange={() => handleSelectAll(isAllSelected)}
                         />
                      </th>
                      <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                      <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Time</th>
                      <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">ID</th>
                      <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Detail</th>
                      <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Given By</th>
                      <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned</th>
                      <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Machine</th>
                      <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                      <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Remark</th>
                      <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Part</th>
                      <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor</th>
                      <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-sm">
                    {filteredRequests.map((req) => (
                      <tr 
                        key={req.id} 
                        className={`transition-colors group ${selectedIds.includes(req.id) ? 'bg-purple-50/40' : 'hover:bg-slate-50/50'}`}
                        onClick={() => handleSelectRow(req.id)}
                      >
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                           <input 
                              type="checkbox" 
                              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                              checked={selectedIds.includes(req.id)}
                              onChange={() => handleSelectRow(req.id)}
                           />
                        </td>
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => handleProcessClick(req)}
                            disabled={!selectedIds.includes(req.id)}
                            className={`py-1.5 px-3 rounded text-[10px] uppercase flex items-center gap-1.5 transition-all shadow-sm font-bold
                              ${selectedIds.includes(req.id) 
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer active:scale-95' 
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60 grayscale'
                              }`}
                          >
                            <CheckCircle size={12} /> Process
                          </button>
                        </td>
                        <td className="px-4 py-4 text-[11px] text-slate-600">
                          {formatTaskStartDate(req.submission_date)}
                        </td>
                        <td className="px-4 py-4 font-mono text-purple-600 font-bold text-xs">{req.id}</td>
                        <td className="px-4 py-4 max-w-[200px]">
                           <p className="text-xs text-slate-700 line-clamp-2 italic">"{req.issue_description}"</p>
                        </td>
                        <td className="px-4 py-4 text-xs font-medium text-slate-700">
                          {req.filled_by}
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                             <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-[10px] font-bold uppercase shrink-0">
                               {req.assigned_person?.charAt(0) || <User size={10} />}
                             </div>
                             <span className="text-xs text-slate-700 font-medium whitespace-nowrap">{req.assigned_person}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4">
                           <div className="font-bold text-slate-900 text-xs whitespace-nowrap">{req.machine_name}</div>
                        </td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(req.status)}`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-[11px] text-slate-600 max-w-[200px]">
                          <p className="line-clamp-2" title={req.remarks}>{req.remarks || "—"}</p>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-600">
                          {req.part_replaced || "—"}
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-600">
                          {req.vendor_name || "—"}
                        </td>
                        <td className="px-4 py-4 text-xs font-bold text-slate-900">
                          {req.bill_amount ? `₹${req.bill_amount}` : "—"}
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-600">
                          {req.duration || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>

                {/* Mobile View Cards */}
                <div className="md:hidden flex flex-col divide-y divide-slate-100">
                   {filteredRequests.map((req) => (
                      <div 
                        key={req.id} 
                        className={`p-4 transition-all ${selectedIds.includes(req.id) ? 'bg-purple-50/40 ring-1 ring-inset ring-purple-100' : 'bg-white active:bg-slate-50'}`}
                      >
                         <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-2">
                               <input 
                                  type="checkbox" 
                                  className="w-5 h-5 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                                  checked={selectedIds.includes(req.id)}
                                  onChange={() => handleSelectRow(req.id)}
                               />
                               <span className="font-mono text-xs font-bold text-purple-600">{req.id}</span>
                            </div>
                             <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(req.status)}`}>
                               {req.status}
                             </span>
                         </div>
                         
                         <div className="space-y-3 mb-4" onClick={() => handleSelectRow(req.id)}>
                            <div>
                               <h4 className="font-bold text-slate-800 text-sm mb-1">{req.machine_name}</h4>
                               <p className="text-xs text-slate-500 italic line-clamp-2 leading-relaxed">"{req.issue_description}"</p>
                            </div>
                            
                            <div className="flex flex-row items-center justify-between bg-slate-50 rounded-lg p-2.5">
                               <div className="flex flex-col gap-1.5">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Given By</span>
                                  <div className="flex items-center gap-2">
                                     <div className="h-5 w-5 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 text-[10px] font-bold uppercase shrink-0">
                                        {req.filled_by?.charAt(0) || 'U'}
                                     </div>
                                     <span className="text-[11px] font-medium text-slate-700">{req.filled_by || "—"}</span>
                                  </div>
                               </div>

                               <div className="flex flex-col items-end gap-1.5">
                                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Assigned To</span>
                                  <div className="flex items-center gap-2 flex-row-reverse">
                                     <div className="h-5 w-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 text-[10px] font-bold uppercase shrink-0">
                                        {req.assigned_person?.charAt(0) || <User size={8} />}
                                     </div>
                                     <span className="text-[11px] font-medium text-slate-700">{req.assigned_person || "—"}</span>
                                  </div>
                               </div>
                            </div>

                            <div className="flex justify-between items-center px-1">
                               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submitted</span>
                               <span className="text-[10px] text-slate-500 font-mono font-medium">{formatTaskStartDate(req.submission_date)}</span>
                            </div>
                         </div>

                         <button 
                            onClick={() => handleProcessClick(req)}
                            disabled={!selectedIds.includes(req.id)}
                            className={`w-full py-2.5 rounded-lg flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all shadow-sm
                              ${selectedIds.includes(req.id) 
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white active:scale-[0.98]' 
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                              }`}
                         >
                            <CheckCircle size={14} /> Process Ticket
                         </button>
                      </div>
                   ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Update Ticket Modal */}
      {isModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto animate-fade-in border border-purple-100 flex flex-col">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-purple-100 flex justify-between items-center">
              <h3 className="text-[12px] font-bold text-purple-800 uppercase tracking-wider">Update Ticket {selectedTask.id}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-purple-400 hover:text-purple-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateSubmit} className="p-6 overflow-y-auto">
              {/* Task Details Block */}
              <div className="bg-purple-50/50 rounded-xl border border-purple-100 p-4 mb-5 flex gap-7 text-sm">
                <div className="flex-1">
                  <span className="block text-[10px] font-bold text-purple-400 uppercase mb-1 tracking-widest">Machine</span>
                  <span className="text-slate-800 font-bold text-sm">{selectedTask.machine_name}</span>
                </div>
                <div className="flex-[2]">
                  <span className="block text-[10px] font-bold text-purple-400 uppercase mb-1 tracking-widest">Issue</span>
                  <div className="text-slate-600 font-medium italic text-xs">
                    <RenderDescription text={selectedTask.issue_description} />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {/* Status Select */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 uppercase mb-1.5 tracking-wider">
                    Status <span className="text-red-500 font-normal ml-0.5">*</span>
                  </label>
                  <select 
                    className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none bg-white transition-all font-medium text-slate-700 cursor-pointer shadow-sm" 
                    value={updateForm.status} 
                    onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
                  >
                    <option value="">Select Status...</option>
                    <option value="Completed">Completed</option>
                    <option value="Pending">Pending</option>
                    <option value="Observation">Observation</option>
                    <option value="Temporary">Temporary</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Conditional Fields for Completed Status */}
                {(updateForm.status === 'Completed' || updateForm.status === '✅ Completed (कार्य पूर्ण)') && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="grid grid-cols-2 gap-5">
                      {/* Part Replaced */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-800 uppercase mb-1.5 tracking-wider">Part Replaced</label>
                        <select 
                          className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium bg-white text-slate-700 shadow-sm" 
                          value={updateForm.part_replaced} 
                          onChange={(e) => setUpdateForm({ ...updateForm, part_replaced: e.target.value })}
                        >
                          <option value="">Select Option...</option>
                          <option value="Part Replaced">Part Replaced</option>
                          <option value="Repairing">Repairing</option>
                          <option value="Service/Maintenance">Service/Maintenance</option>
                          <option value="Installation">Installation</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      {/* Vendor Name */}
                      <div>
                        <label className="block text-[11px] font-bold text-slate-800 uppercase mb-1.5 tracking-wider">Vendor Name</label>
                        <input 
                          className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium text-slate-700 shadow-sm" 
                          value={updateForm.vendor_name} 
                          onChange={(e) => setUpdateForm({ ...updateForm, vendor_name: e.target.value })} 
                          placeholder="Enter vendor name..."
                        />
                      </div>
                    </div>

                    {/* Bill Amount */}
                    <div className="w-full">
                      <label className="block text-[11px] font-bold text-slate-800 uppercase mb-1.5 tracking-wider">Bill Amount (₹)</label>
                      <input 
                        type="number" 
                        className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all font-medium text-slate-700 shadow-sm" 
                        value={updateForm.bill_amount} 
                        onChange={(e) => setUpdateForm({ ...updateForm, bill_amount: e.target.value })} 
                        placeholder="Enter bill amount..."
                      />
                    </div>
                  </div>
                )}

                {/* Remarks (Always Show) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-800 uppercase mb-1.5 tracking-wider">Remarks</label>
                  <textarea 
                    className="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all min-h-[80px] text-slate-700 shadow-sm" 
                    rows="2" 
                    value={updateForm.remarks} 
                    onChange={(e) => setUpdateForm({ ...updateForm, remarks: e.target.value })}
                    placeholder="Enter remarks..."
                  ></textarea>
                </div>

                {/* Conditional Uploads for Completed Status */}
                {(updateForm.status === 'Completed' || updateForm.status === '✅ Completed (कार्य पूर्ण)') && (
                  <div className="grid grid-cols-2 gap-5 animate-fade-in pb-2">
                    {/* Photo of Work Done */}
                    <div className="relative">
                      <label className="block text-[11px] font-bold text-slate-800 uppercase mb-1.5 tracking-wider">
                        Photo <span className="text-red-500 font-normal ml-0.5">*</span>
                      </label>
                      <label className="border-2 border-dashed border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-all group h-28 relative overflow-hidden bg-slate-50/30 shadow-inner">
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'work_photo_url')} />
                        {updateForm.work_photo_url ? (
                          <div className="absolute inset-0 w-full h-full">
                            <img src={updateForm.work_photo_url} alt="Work done" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <Upload className="text-white w-6 h-6" />
                            </div>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-slate-300 group-hover:text-purple-500 mb-1 transition-colors" />
                            <span className="text-[10px] font-bold text-slate-400 group-hover:text-purple-600 transition-colors uppercase tracking-tight">Upload Photo</span>
                          </>
                        )}
                      </label>
                    </div>
                    {/* Bill Copy */}
                    <div className="relative">
                      <label className="block text-[11px] font-bold text-slate-800 uppercase mb-1.5 tracking-wider">
                        Bill Copy <span className="text-red-500 font-normal ml-0.5">*</span>
                      </label>
                      <label className="border-2 border-dashed border-slate-100 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/30 transition-all group h-28 relative overflow-hidden bg-slate-50/30 shadow-inner">
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e, 'bill_copy_url')} />
                        {updateForm.bill_copy_url ? (
                          <div className="flex flex-col items-center">
                             <FileText className="w-7 h-7 text-purple-500 mb-1" />
                             <span className="text-[9px] text-purple-600 font-bold uppercase tracking-wider">Uploaded</span>
                          </div>
                        ) : (
                          <>
                            <Upload className="w-6 h-6 text-slate-300 group-hover:text-purple-500 mb-1 transition-colors" />
                            <span className="text-[10px] font-bold text-slate-400 group-hover:text-purple-600 transition-colors uppercase tracking-tight">Upload Bill</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-5 mt-2 border-t border-slate-50">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-5 py-2 border border-slate-200 text-slate-700 font-bold rounded-lg hover:bg-slate-50 text-[11px] uppercase tracking-widest transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="px-7 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-[11px] uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-purple-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default PendingRequest;