import React, { useState, useMemo } from 'react';
import { 
  Search, Filter, Edit2, Save, X, Eye, 
  ChevronLeft, ChevronRight, Image as ImageIcon,
  MoreVertical, CheckCircle2, AlertCircle, Clock, ClipboardList
} from 'lucide-react';

const MaintenanceTable = ({ 
  tasks, 
  onUpdateTask, 
  isLoading,
  onRefresh
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [timeFilter, setTimeFilter] = useState('all');
  const [editingRowId, setEditingRowId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- Helpers ---
  const parseDate = (dateStr) => {
    if (!dateStr || typeof dateStr !== "string") return new Date(NaN);
    
    // 1. ISO format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)
    if (dateStr.includes("-") && dateStr.match(/^\d{4}-\d{2}-\d{2}/)) {
      // Split by ' ' or 'T' to get date and time parts
      const parts = dateStr.split(/[ T]/);
      const datePart = parts[0];
      const timePart = parts[1] ? parts[1].split(/[+-Z]/)[0] : "00:00:00";
      
      const [y, m, d] = datePart.split("-").map(Number);
      const tUnits = timePart.split(":").map(Number);
      
      // Create a local date object using individual components
      // This ignores the UTC offset if any and treats it as local time
      return new Date(y, m - 1, d, tUnits[0] || 0, tUnits[1] || 0, tUnits[2] || 0);
    }
    
    // 2. Regional format (DD/MM/YYYY or DD/MM/YYYY HH:mm:ss)
    if (dateStr.includes("/")) {
      const parts = dateStr.split(" ");
      const datePart = parts[0];
      const dateComponents = datePart.split("/");
      if (dateComponents.length !== 3) return new Date(NaN);
      
      const [day, month, year] = dateComponents.map(Number);
      const date = new Date(year, month - 1, day);
      
      if (parts.length > 1) {
        const timeParts = parts[1].split(":");
        if (timeParts.length >= 2) {
          date.setHours(Number(timeParts[0]) || 0, Number(timeParts[1]) || 0, Number(timeParts[2]) || 0);
        }
      } else {
        date.setHours(0, 0, 0, 0);
      }
      return date;
    }
    
    return new Date(dateStr);
  };

  // --- Filtering Logic ---
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      result = result.filter(task => {
        const dStr = task.planned_date || task.dueDate || task.task_start_date;
        const taskDate = parseDate(dStr);
        
        if (isNaN(taskDate.getTime())) return false;

        if (timeFilter === 'today') {
          return taskDate.getFullYear() === now.getFullYear() &&
                 taskDate.getMonth() === now.getMonth() &&
                 taskDate.getDate() === now.getDate();
        }
        
        if (timeFilter === 'week') {
          // Current Week: Monday to Sunday
          const monday = new Date(todayStart);
          const day = monday.getDay();
          const diff = (day === 0 ? -6 : 1 - day);
          monday.setDate(monday.getDate() + diff);
          
          const sunday = new Date(monday);
          sunday.setDate(monday.getDate() + 6);
          sunday.setHours(23, 59, 59, 999);
          
          return taskDate >= monday && taskDate <= sunday;
        }

        if (timeFilter === 'month') {
          // Current Calendar Month
          return taskDate.getMonth() === now.getMonth() && taskDate.getFullYear() === now.getFullYear();
        }
        
        return true;
      });
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task => 
        (task.machine_name || '').toLowerCase().includes(query) ||
        (Array.isArray(task.part_name) ? task.part_name.join(', ') : (task.part_name || '')).toLowerCase().includes(query) ||
        (task.task_description || '').toLowerCase().includes(query) ||
        (task.name || '').toLowerCase().includes(query)
      );
    }

    // Status filter removed to allow both pending and history tasks to show up
    // result = result.filter(task => (task.status || '').toLowerCase() === 'pending');

    // Sort: Earliest first (Ascending) - Current date followed by future tasks
    result.sort((a, b) => {
      const dStrA = a.planned_date || a.dueDate || a.submission_date || a.task_start_date;
      const dStrB = b.planned_date || b.dueDate || b.submission_date || b.task_start_date;
      const dateA = parseDate(dStrA);
      const dateB = parseDate(dStrB);
      
      const timeA = isNaN(dateA.getTime()) ? 0 : dateA.getTime();
      const timeB = isNaN(dateB.getTime()) ? 0 : dateB.getTime();
      
      if (timeA !== timeB) return timeA - timeB;
      
      // Fallback to task_id ascending
      const idA = Number(a.task_id || a.id) || 0;
      const idB = Number(b.task_id || b.id) || 0;
      return idA - idB;
    });

    return result;
  }, [tasks, timeFilter, searchQuery]);

  // --- Pagination ---
  const paginatedTasks = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTasks.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTasks, currentPage]);

  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);

  // --- Inline Editing ---
  const handleEditClick = (task) => {
    setEditingRowId(task.task_id || task.id);
    setEditFormData({ ...task });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = async () => {
    try {
      await onUpdateTask(editFormData);
      setEditingRowId(null);
    } catch (error) {
      alert("Failed to update task");
    }
  };

  const handleCancelEdit = () => {
    setEditingRowId(null);
    setEditFormData({});
  };

  // --- Helpers ---
  const getStatusBadge = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'approved' || s === 'completed') {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3" /> Approved
        </span>
      );
    }
    if (s === 'pending approval') {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          <Clock className="h-3 w-3" /> Pending Approval
        </span>
      );
    }
    if (s === 'overdue') {
      return (
        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
          <AlertCircle className="h-3 w-3" /> Overdue
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
        <Clock className="h-3 w-3" /> Pending
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Section */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0 px-1">
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Filter by Time:</span>
            <div className="flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
              {['today', 'week', 'month', 'all'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => { setTimeFilter(filter); setCurrentPage(1); }}
                  className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                    timeFilter === filter 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search tasks..."
                className="block w-64 pl-9 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
           <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-[10px] font-bold uppercase">
              Showing: {filteredTasks.length} Tasks
           </span>
        </div>
      </div>

      {/* Desktop Table View */}
      <div 
        className="hidden md:block rounded-md border border-gray-200 overflow-auto"
        style={{ maxHeight: "500px" }}
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Seq</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Machine Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Area</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dept</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Div</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assign From</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Description</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">Start Date & Time</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Freq</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td colSpan="11" className="px-6 py-4 animate-pulse bg-gray-50/50"></td>
                </tr>
              ))
            ) : paginatedTasks.length === 0 ? (
              <tr>
                <td colSpan="11" className="px-6 py-12 text-center text-gray-500">
                   <div className="flex flex-col items-center gap-2">
                     <p className="text-sm font-medium">No maintenance data found for the selected filters.</p>
                   </div>
                </td>
              </tr>
            ) : (
              paginatedTasks.map((task, index) => {
                const isEditing = editingRowId === (task.task_id || task.id);
                return (
                  <tr 
                    key={task.task_id || task.id} 
                    onDoubleClick={() => !isEditing && handleEditClick(task)}
                    className={`hover:bg-gray-50 transition-colors ${isEditing ? 'bg-purple-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          name="machine_name"
                          value={editFormData.machine_name || ''}
                          onChange={handleEditChange}
                          className="w-full px-2 py-1 text-xs border border-purple-300 rounded focus:ring-1 focus:ring-purple-500 focus:outline-none"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{task.machine_name || '-'}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {Array.isArray(task.part_name) ? task.part_name.join(', ') : (task.part_name || '-')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {task.part_area || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          name="machine_department"
                          value={editFormData.machine_department || ''}
                          onChange={handleEditChange}
                          className="w-full px-2 py-1 text-xs border border-purple-300 rounded focus:ring-1 focus:ring-purple-500 focus:outline-none"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{task.machine_department || '-'}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <input
                          name="machine_division"
                          value={editFormData.machine_division || ''}
                          onChange={handleEditChange}
                          className="w-full px-2 py-1 text-xs border border-purple-300 rounded focus:ring-1 focus:ring-purple-500 focus:outline-none"
                        />
                      ) : (
                        <div className="text-sm text-gray-900">{task.machine_division || '-'}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {task.givenBy || task.given_by || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm font-medium text-gray-900">{task.name || '-'}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      {isEditing ? (
                        <textarea
                          name="task_description"
                          value={editFormData.task_description || ''}
                          onChange={handleEditChange}
                          rows={2}
                          className="w-full px-2 py-1 text-xs border border-purple-300 rounded focus:ring-1 focus:ring-purple-500 focus:outline-none"
                        />
                      ) : (
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{task.task_description}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.planned_date || task.dueDate || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-[10px] leading-4 font-semibold rounded-full bg-blue-100 text-blue-800 uppercase">
                        {task.frequency || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(task.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        {isEditing ? (
                          <>
                            <button onClick={handleSaveEdit} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded" title="Save">
                              <Save className="h-4 w-4" />
                            </button>
                            <button onClick={handleCancelEdit} className="p-1 text-rose-600 hover:bg-rose-50 rounded" title="Cancel">
                              <X className="h-4 w-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => handleEditClick(task)} className="p-1 text-blue-500 hover:bg-blue-50 rounded" title="Edit">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            {task.image_url && (
                              <button onClick={() => setSelectedImage(task.image_url)} className="p-1 text-purple-500 hover:bg-purple-50 rounded" title="View Evidence">
                                <Eye className="h-4 w-4" />
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-gray-100 animate-pulse space-y-3">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-100 rounded w-3/4"></div>
              <div className="h-8 bg-gray-50 rounded w-full"></div>
            </div>
          ))
        ) : paginatedTasks.length === 0 ? (
          <div className="py-12 bg-gray-50 rounded-xl text-center text-gray-500 border border-dashed border-gray-200">
            No maintenance records found.
          </div>
        ) : (
          paginatedTasks.map((task, index) => {
            const isEditing = editingRowId === (task.task_id || task.id);
            return (
              <div 
                key={task.task_id || task.id} 
                className={`bg-white p-4 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md ${
                  isEditing ? 'border-purple-300 ring-1 ring-purple-100' : 'border-gray-100'
                }`}
              >
                {/* Card Header: Seq & Machine */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">#{ (currentPage - 1) * itemsPerPage + index + 1 }</span>
                    {isEditing ? (
                      <input
                        name="machine_name"
                        value={editFormData.machine_name || ''}
                        onChange={handleEditChange}
                        className="mt-1 px-2 py-1 text-sm font-bold border border-purple-300 rounded focus:ring-1 focus:ring-purple-500 focus:outline-none"
                      />
                    ) : (
                      <h4 className="font-bold text-gray-900">
                        {task.machine_name || 'Unnamed Machine'}
                      </h4>
                    )}
                  </div>
                  {getStatusBadge(task.status)}
                </div>

                {/* Card Details Grid */}
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-4">
                  <div className="space-y-0.5">
                    <p className="text-[10px] uppercase text-gray-400 font-bold">Part & Area</p>
                    <p className="text-xs font-medium text-gray-700 truncate">
                      {Array.isArray(task.part_name) ? task.part_name.join(', ') : (task.part_name || '-')} 
                      <span className="text-gray-400 mx-1">|</span> {task.part_area || '-'}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] uppercase text-gray-400 font-bold">Dept / Div</p>
                    <p className="text-xs font-medium text-gray-700 truncate">
                      {task.machine_department || '-'} / {task.machine_division || '-'}
                    </p>
                  </div>
                  <div className="space-y-0.5 col-span-2">
                    <p className="text-[10px] uppercase text-gray-400 font-bold">Assigned To (From: {task.givenBy || task.given_by || '—'})</p>
                    <p className="text-xs font-semibold text-purple-700">{task.name || '-'}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] uppercase text-gray-400 font-bold">Planned Date</p>
                    <p className="text-xs font-medium text-gray-600 flex items-center gap-1 text-[10px]">
                      <Clock className="h-3 w-3" /> {task.planned_date || task.dueDate || '-'}
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-[10px] uppercase text-gray-400 font-bold">Frequency</p>
                    <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                      {task.frequency || '-'}
                    </span>
                  </div>
                </div>

                {/* Task Description */}
                <div className="mb-4 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">Task Description</p>
                  {isEditing ? (
                    <textarea
                      name="task_description"
                      value={editFormData.task_description || ''}
                      onChange={handleEditChange}
                      rows={2}
                      className="w-full px-2 py-1 text-xs border border-purple-300 rounded focus:ring-1 focus:ring-purple-500 focus:outline-none bg-white"
                    />
                  ) : (
                    <p className="text-xs text-gray-600 italic line-clamp-2 leading-relaxed">
                      {task.task_description || 'No description provided'}
                    </p>
                  )}
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <>
                        <button onClick={handleSaveEdit} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white rounded-lg shadow-sm font-bold text-xs active:scale-95 transition-all">
                          <Save className="h-3.5 w-3.5" /> Save
                        </button>
                        <button onClick={handleCancelEdit} className="flex items-center gap-1 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg font-bold text-xs active:scale-95 transition-all">
                          <X className="h-3.5 w-3.5" /> Cancel
                        </button>
                      </>
                    ) : (
                      <button onClick={() => handleEditClick(task)} className="flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-bold text-xs hover:bg-blue-100 active:scale-95 transition-all">
                        <Edit2 className="h-3.5 w-3.5" /> Quick Edit
                      </button>
                    )}
                  </div>
                  {task.image_url && (
                    <button 
                      onClick={() => setSelectedImage(task.image_url)} 
                      className="flex items-center gap-1 px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg font-bold text-xs hover:bg-purple-100 active:scale-95 transition-all"
                    >
                      <ImageIcon className="h-3.5 w-3.5" /> Evidence
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Container - Matching Staff style */}
      {!isLoading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center sm:justify-between gap-4 py-4 px-2 border-t border-gray-100 mt-2">
          <p className="text-xs text-gray-500 order-2 sm:order-1">
            Showing <span className="font-medium text-purple-600">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-purple-600">{Math.min(currentPage * itemsPerPage, filteredTasks.length)}</span> of <span className="font-medium text-purple-600">{filteredTasks.length}</span> results
          </p>
          <div className="flex items-center gap-2 order-1 sm:order-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 bg-white shadow-sm transition-all active:scale-95"
            >
              <ChevronLeft className="h-4 w-4 text-gray-500" />
            </button>
            <div className="flex items-center gap-1">
              {/* Mobile View with 3 pages max */}
              <div className="flex sm:hidden items-center gap-1">
               {(() => {
                  const max = 3;
                  let start = Math.max(1, currentPage - Math.floor(max / 2));
                  let end = Math.min(totalPages, start + max - 1);
                  if (end - start < max - 1) start = Math.max(1, end - max + 1);
                  const pages = [];
                  for (let i = start; i <= end; i++) pages.push(i);
                  return pages.map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                        currentPage === page 
                        ? 'bg-purple-600 text-white shadow-md' 
                        : 'text-gray-500 hover:bg-gray-100 border border-transparent'
                      }`}
                    >
                      {page}
                    </button>
                  ));
                })()}
              </div>

              {/* Desktop View with 5 pages max */}
              <div className="hidden sm:flex items-center gap-1">
                {(() => {
                  const max = 5;
                  let start = Math.max(1, currentPage - Math.floor(max / 2));
                  let end = Math.min(totalPages, start + max - 1);
                  if (end - start < max - 1) start = Math.max(1, end - max + 1);
                  const pages = [];
                  for (let i = start; i <= end; i++) pages.push(i);
                  return pages.map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center ${
                        currentPage === page 
                        ? 'bg-purple-600 text-white shadow-md' 
                        : 'text-gray-500 hover:bg-gray-100 border border-transparent'
                      }`}
                    >
                      {page}
                    </button>
                  ));
                })()}
              </div>
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 bg-white shadow-sm transition-all active:scale-95"
            >
              <ChevronRight className="h-4 w-4 text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-gray-900 p-2 rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-red-400 transition-colors"
            >
              <X className="h-8 w-8" />
            </button>
            <img 
              src={selectedImage} 
              alt="Evidence" 
              className="w-auto h-auto max-w-full max-h-[85vh] rounded-lg object-contain"
            />
            <div className="mt-2 text-center pb-2">
              <a href={selectedImage} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline text-sm font-medium">Open Original Image in New Tab</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceTable;
