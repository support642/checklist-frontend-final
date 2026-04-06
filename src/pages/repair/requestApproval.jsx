import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { authFetch } from '../../utils/authFetch';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  User, 
  Calendar, 
  ShieldCheck, 
  Search,
  History,
  ArrowLeft,
  X,
  RefreshCw,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { formatTimestampToDDMMYYYY } from '../../utils/dateUtils';

const RequestApproval = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [view, setView] = useState('pending'); // 'pending' or 'history'

  const fetchRequestsForApproval = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Conditionally fetch statuses
      const status = view === 'history' 
        ? 'Approved,Rejected' 
        : 'Completed,✅ Completed (कार्य पूर्ण)';
        
      const response = await authFetch(`${import.meta.env.VITE_API_BASE_URL}/repair?status=${encodeURIComponent(status)}`);
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
    fetchRequestsForApproval();
    setSelectedRequest(null); // Reset selection when view changes
  }, [view]);

  // Force refresh manually
  const handleRefresh = () => fetchRequestsForApproval();

  const handleAction = async (id, action) => {
    setIsUpdating(true);
    try {
      const status = action === 'approve' ? 'Approved' : 'Rejected';
      const response = await authFetch(`${import.meta.env.VITE_API_BASE_URL}/repair/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status,
          admin_approval_date: new Date().toISOString(),
          admin_approved_by: localStorage.getItem('user-name') || 'Admin'
        })
      });

      if (response.ok) {
        setRequests(prev => prev.filter(r => r.id !== id));
        setSelectedRequest(null);
      } else {
        const data = await response.json();
        alert(data.error || `Failed to ${action} request`);
      }
    } catch (err) {
      console.error("Action Error:", err);
      alert('Connection error. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredRequests = requests.filter(req => 
    req.machine_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    req.assigned_person.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderRequestDetails = (req, isModal = false) => {
    if (!req) return null;
    
    return (
      <div className={`bg-white rounded-2xl shadow-xl border border-purple-100 overflow-hidden ${isModal ? 'w-full max-w-lg mx-auto' : 'animate-in fade-in slide-in-from-right-4 duration-300'}`}>
        <div className="bg-purple-600 p-6 text-white flex items-center justify-between">
          <div>
            <h3 className="font-bold text-lg">Request Details</h3>
            <p className="text-purple-100 text-xs">Review information before action</p>
          </div>
          {isModal && (
            <button 
              onClick={() => setSelectedRequest(null)}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white"
            >
              <X size={24} />
            </button>
          )}
        </div>
        
        <div className={`p-6 space-y-5 overflow-y-auto ${isModal ? 'max-h-[70vh]' : ''}`}>
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Machine Context</p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="font-bold text-slate-900 leading-tight">{req.machine_name}</p>
                <p className="text-xs text-slate-500 mt-1">{req.machine_division} • {req.machine_department}</p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Problem Statement</p>
              <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-xl min-h-[80px] italic">
                "{req.issue_description}"
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Technician</p>
                <p className="text-sm font-semibold text-slate-800">{req.assigned_person}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Date Created</p>
                <p className="text-sm font-semibold text-slate-800">{formatTimestampToDDMMYYYY(req.submission_date)}</p>
              </div>
            </div>

            {/* Repair Information (Grid) */}
            <div className="pt-4 border-t border-slate-100 space-y-4">
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Part Replaced</p>
                     <p className="text-[13px] font-bold text-slate-900 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">{req.part_replaced || 'None'}</p>
                  </div>
                  <div>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Bill Amount</p>
                     <p className="text-[13px] font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-100">₹{req.bill_amount || '0.00'}</p>
                  </div>
               </div>
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Vendor Name</p>
                  <p className="text-[13px] font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">{req.vendor_name || 'N/A'}</p>
               </div>
            </div>

            {/* Action Taken (Remarks) */}
            <div>
              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">Action Taken (Remarks)</p>
              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 min-h-[60px]">
                <p className="text-xs text-purple-900 font-medium italic">"{req.remarks || 'No technician notes provided.'}"</p>
              </div>
            </div>

            {/* Technical Proof (Photos) */}
            {(req.work_photo_url || req.bill_copy_url) && (
               <div className="space-y-3 pt-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Technical Proof</p>
                  <div className="grid grid-cols-2 gap-3">
                     {req.work_photo_url && (
                        <div className="relative group rounded-xl overflow-hidden border border-slate-200 h-28 bg-slate-50">
                           <img src={req.work_photo_url} alt="Proof" className="w-full h-full object-cover" />
                           <div className="absolute inset-x-0 bottom-0 bg-black/50 p-1.5 backdrop-blur-sm">
                              <p className="text-[8px] text-white font-bold uppercase text-center tracking-tighter">Work Done</p>
                           </div>
                           <a href={req.work_photo_url} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                              <Eye className="text-white h-6 w-6" />
                           </a>
                        </div>
                     )}
                     {req.bill_copy_url && (
                        <div className="relative group rounded-xl overflow-hidden border border-slate-200 h-28 bg-slate-100 flex items-center justify-center">
                           {req.bill_copy_url.match(/\.(jpeg|jpg|gif|png)$/) != null ? (
                              <img src={req.bill_copy_url} alt="Bill" className="w-full h-full object-cover" />
                           ) : (
                              <div className="flex flex-col items-center">
                                 <ShieldCheck className="text-purple-400 h-8 w-8" />
                                 <span className="text-[8px] font-bold text-purple-600 mt-1 uppercase">Scan View</span>
                              </div>
                           )}
                           <div className="absolute inset-x-0 bottom-0 bg-black/50 p-1.5 backdrop-blur-sm">
                              <p className="text-[8px] text-white font-bold uppercase text-center tracking-tighter">Bill Copy</p>
                           </div>
                           <a href={req.bill_copy_url} target="_blank" rel="noreferrer" className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                              <Eye className="text-white h-6 w-6" />
                           </a>
                        </div>
                     )}
                  </div>
               </div>
            )}
          </div>

          {/* History Logic or Action Buttons */}
          <div className="pt-4 mt-2">
            {view === 'history' ? (
              <div className={`p-4 rounded-xl border flex items-center justify-between
                ${req.status === 'Approved' ? 'bg-emerald-50/50 border-emerald-100 text-emerald-900' : 'bg-red-50/50 border-red-100 text-red-900'}`}>
                <div className="flex-1">
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Decision Summary</p>
                   <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${req.status === 'Approved' ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                      <p className="font-bold text-sm tracking-tight">Request {req.status} by {req.admin_approved_by || 'Admin'}</p>
                   </div>
                   <div className="mt-3 grid grid-cols-2 gap-4 border-t border-black/5 pt-3">
                      <div>
                         <p className="text-[9px] font-bold text-slate-400 uppercase">Processed By</p>
                         <p className="text-[11px] font-bold opacity-80">{req.admin_approved_by || 'Senior Authority'}</p>
                      </div>
                      <div>
                         <p className="text-[9px] font-bold text-slate-400 uppercase">Process Date</p>
                         <p className="text-[11px] font-bold opacity-80">{formatTimestampToDDMMYYYY(req.admin_approval_date)}</p>
                      </div>
                   </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleAction(req.id, 'reject')}
                  disabled={isUpdating}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-red-200 text-red-600 font-bold text-sm hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <XCircle size={18} /> Reject
                </button>
                <button
                  onClick={() => handleAction(req.id, 'approve')}
                  disabled={isUpdating}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-600 text-white font-bold text-sm hover:bg-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {isUpdating ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle size={18} /> Approve</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-purple-100 p-2 rounded-lg shadow-sm">
                <ShieldCheck className="text-purple-600 h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">Request Approval</h1>
                <p className="text-sm text-slate-500">Review and authorize repair requests</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
               <button 
                 onClick={() => {
                   setView(view === 'pending' ? 'history' : 'pending');
                   setSelectedRequest(null);
                 }}
                 className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-sm border
                   ${view === 'history' 
                     ? 'bg-purple-50 border-purple-100 text-purple-600' 
                     : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
               >
                 {view === 'history' ? (
                   <><ArrowLeft size={18} /> Back to Pending</>
                 ) : (
                   <><History size={18} /> View History</>
                 )}
               </button>

              <button 
                onClick={handleRefresh}
                className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <RefreshCw size={20} className={isLoading ? 'animate-spin' : ''} />
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search machines..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-sm w-full md:w-48 text-sm"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 p-4 rounded-xl flex items-center gap-3 shadow-sm">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Combined Table & Mobile List Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center p-20 text-slate-400">
                <Loader2 className="animate-spin h-10 w-10 mb-4 text-purple-500" />
                <p className="font-medium text-sm">Fetching requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-20 text-slate-400 text-center">
                <div className="bg-slate-50 p-6 rounded-full mb-4">
                  <ShieldCheck className="h-12 w-12 text-slate-200" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Queue is Clear</h3>
                <p className="max-w-xs mx-auto text-sm">No {view === 'history' ? 'processed' : 'pending'} repair requests found.</p>
              </div>
            ) : (
              <>
                {/* Desktop View Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">ID</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Machine Name</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Problem Statement</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Technician</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date Created</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredRequests.map((req) => (
                        <tr 
                          key={req.id} 
                          onClick={() => setSelectedRequest(req)}
                          className="hover:bg-purple-50/50 cursor-pointer transition-colors group"
                        >
                          <td className="px-6 py-4 font-mono text-purple-600 font-bold text-xs">{req.id}</td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-900 text-sm">{req.machine_name}</span>
                          </td>
                          <td className="px-6 py-4 max-w-xs">
                            <p className="text-xs text-slate-500 italic truncate" title={req.issue_description}>
                              "{req.issue_description}"
                            </p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-[10px] font-bold uppercase border border-slate-200">
                                {req.assigned_person?.charAt(0) || <User size={10} />}
                              </div>
                              <span className="text-xs font-medium text-slate-700">{req.assigned_person}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
                            {formatTimestampToDDMMYYYY(req.submission_date)}
                          </td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex justify-end">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border
                                  ${req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                    req.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                    'bg-purple-50 text-purple-600 border-purple-100'}`}>
                                  {req.status === 'Completed' || req.status === '✅ Completed (कार्य पूर्ण)' ? 'Awaiting Approval' : req.status}
                                </span>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile View List */}
                <div className="md:hidden divide-y divide-slate-50">
                  {filteredRequests.map((req) => (
                    <div 
                      key={req.id} 
                      onClick={() => setSelectedRequest(req)}
                      className="p-5 active:bg-slate-50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-[10px] font-bold text-purple-600 font-mono bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                          {req.id}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border
                          ${req.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                            req.status === 'Rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                            'bg-purple-50 text-purple-600 border-purple-100'}`}>
                          {req.status === 'Completed' || req.status === '✅ Completed (कार्य पूर्ण)' ? 'Pending' : req.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 mb-1">{req.machine_name}</h3>
                      <p className="text-xs text-slate-500 italic line-clamp-2 leading-relaxed mb-3">"{req.issue_description}"</p>
                      <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        <span className="flex items-center gap-1.5"><User size={12} className="text-slate-300" /> {req.assigned_person}</span>
                        <span className="flex items-center gap-1.5"><Calendar size={12} className="text-slate-300" /> {formatTimestampToDDMMYYYY(req.submission_date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          {renderRequestDetails(selectedRequest, true)}
        </div>
      )}
    </AdminLayout>
  );
};

export default RequestApproval;