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

  // --- Filtering Logic ---
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Time filter
    if (timeFilter !== 'all') {
      const now = new Date();
      const todayStart = new Date(now.setHours(0, 0, 0, 0));
      
      result = result.filter(task => {
        const taskDate = new Date(task.planned_date || task.dueDate);
        if (timeFilter === 'today') {
          return taskDate.toDateString() === todayStart.toDateString();
        }
        if (timeFilter === 'week') {
          const weekAgo = new Date(todayStart);
          weekAgo.setDate(weekAgo.getDate() - 7);
          return taskDate >= weekAgo;
        }
        if (timeFilter === 'month') {
          const monthAgo = new Date(todayStart);
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return taskDate >= monthAgo;
        }
        return true;
      });
    }

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(task => 
        (task.machine_name || '').toLowerCase().includes(query) ||
        (task.part_name || '').toLowerCase().includes(query) ||
        (task.task_description || '').toLowerCase().includes(query) ||
        (task.doer || '').toLowerCase().includes(query)
      );
    }

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

      {/* Table Container - Matching staff-table-container */}
      <div 
        className="rounded-md border border-gray-200 overflow-auto"
        style={{ maxHeight: "500px" }}
      >
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task Seq</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Machine Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Area</th>
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
                       {task.part_name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {task.part_area || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                       {task.givenBy || task.given_by || 'Admin'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <div className="text-sm font-medium text-gray-900">{task.doer || '-'}</div>
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

      {/* Pagination Container - Matching Staff style */}
      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between py-2 px-1">
          <p className="text-xs text-gray-500">
            Showing <span className="font-medium text-purple-600">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-purple-600">{Math.min(currentPage * itemsPerPage, filteredTasks.length)}</span> of <span className="font-medium text-purple-600">{filteredTasks.length}</span> results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
            >
              <ChevronLeft className="h-5 w-5 text-gray-500" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 rounded text-xs font-bold transition-all ${
                    currentPage === i + 1 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-gray-200 disabled:opacity-30 hover:bg-gray-50"
            >
              <ChevronRight className="h-5 w-5 text-gray-500" />
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
