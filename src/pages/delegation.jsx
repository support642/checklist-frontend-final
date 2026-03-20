"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  CheckCircle2,
  Upload,
  X,
  Search,
  LayoutDashboard,
} from "lucide-react";
import AdminLayout from "../components/layout/AdminLayout";
import { hasModifyAccess } from "../utils/permissionUtils";
import { useDispatch, useSelector } from "react-redux";
import {
  delegationData,
} from "../redux/slice/delegationSlice";

import { insertDelegationDoneAndUpdate } from "../redux/api/delegationApi";

// Configuration object
const CONFIG = {
  PAGE_CONFIG: {
    title: "DELEGATION Tasks",
    description: "Showing all pending tasks",
  },
};

// Debounce hook for search optimization
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

function DelegationDataPage() {
  const [uploadedImages, setUploadedImages] = useState({});
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [remarksData, setRemarksData] = useState({});
  const [statusData, setStatusData] = useState({});
  const [nextTargetDate, setNextTargetDate] = useState({});
  const [userRole, setUserRole] = useState("");
  const [username, setUsername] = useState("");
  const [dateFilter, setDateFilter] = useState("all");

  const filterOptions = [
    { value: "all", label: "All Tasks" },
    { value: "overdue", label: "Overdue" },
    { value: "today", label: "Today" },
    { value: "upcoming", label: "Upcoming" },
  ];

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const { loading, delegation } = useSelector(
    (state) => state.delegation
  );
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(delegationData());
  }, [dispatch]);

  const formatDateTimeToDDMMYYYY = useCallback((date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
  }, []);

  const formatDateToDDMMYYYY = useCallback((date) => {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  useEffect(() => {
    const role = localStorage.getItem("role");
    const user = localStorage.getItem("user-name");
    setUserRole(role || "");
    setUsername(user || "");
  }, []);

  const parseGoogleSheetsDateTime = useCallback(
    (dateTimeStr) => {
      if (!dateTimeStr) return "";

      if (
        typeof dateTimeStr === "string" &&
        dateTimeStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{1,2}:\d{1,2}$/)
      ) {
        const [datePart, timePart] = dateTimeStr.split(" ");
        const [day, month, year] = datePart.split("/");
        const [hours, minutes, seconds] = timePart.split(":");

        return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year} ${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`;
      }

      if (
        typeof dateTimeStr === "string" &&
        dateTimeStr.match(/^\d{1,2}\/\d{1,2}\/\d{4}$/)
      ) {
        const parts = dateTimeStr.split("/");
        if (parts.length === 3) {
          return `${parts[0].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[2]} 00:00:00`;
        }
        return dateTimeStr + " 00:00:00";
      }

      try {
        const date = new Date(dateTimeStr);
        if (!isNaN(date.getTime())) {
          if (typeof dateTimeStr === 'string' && (dateTimeStr.includes(":") || dateTimeStr.includes("T"))) {
            return formatDateTimeToDDMMYYYY(date);
          } else {
            return formatDateToDDMMYYYY(date) + " 00:00:00";
          }
        }
      } catch (error) {
        console.error("Error parsing datetime:", error);
      }

      return dateTimeStr;
    },
    [formatDateTimeToDDMMYYYY, formatDateToDDMMYYYY]
  );

  const formatDateTimeForDisplay = useCallback(
    (dateTimeStr) => {
      if (!dateTimeStr) return "—";
      return parseGoogleSheetsDateTime(dateTimeStr) || "—";
    },
    [parseGoogleSheetsDateTime]
  );

  const getRowColor = useCallback((colorCode) => {
    if (!colorCode) return "bg-white";
    const code = colorCode.toString().toLowerCase();
    switch (code) {
      case "red": return "bg-red-50 border-l-4 border-red-400";
      case "yellow": return "bg-yellow-50 border-l-4 border-yellow-400";
      case "green": return "bg-green-50 border-l-4 border-green-400";
      case "blue": return "bg-blue-50 border-l-4 border-blue-400";
      default: return "bg-white";
    }
  }, []);

  const filteredDelegationTasks = useMemo(() => {
    if (!delegation) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return delegation.filter((task) => {
      const matchesSearch = debouncedSearchTerm
        ? Object.values(task).some(
          (value) => value && value.toString().toLowerCase().includes(debouncedSearchTerm.toLowerCase())
        )
        : true;

      let matchesDateFilter = true;
      if (dateFilter !== "all" && task.planned_date) {
        const plannedDate = new Date(task.planned_date);
        plannedDate.setHours(0, 0, 0, 0);

        switch (dateFilter) {
          case "overdue": matchesDateFilter = plannedDate < today; break;
          case "today": matchesDateFilter = plannedDate.getTime() === today.getTime(); break;
          case "upcoming": matchesDateFilter = plannedDate > today; break;
          default: matchesDateFilter = true;
        }
      }

      return matchesSearch && matchesDateFilter;
    });
  }, [delegation, debouncedSearchTerm, dateFilter]);

  const unifiedData = useMemo(() => {
    return filteredDelegationTasks.map(task => ({
      ...task,
      unifiedType: 'pending',
      unifiedId: `p-${task.task_id}`
    })).sort((a, b) => (b.task_id || 0) - (a.task_id || 0));
  }, [filteredDelegationTasks]);

  const StatusBadge = ({ status }) => {
    const lowerStatus = (status || "").toString().toLowerCase().trim();
    switch (lowerStatus) {
      case 'pending': return <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm bg-yellow-100 text-yellow-700 border border-yellow-200">Pending</span>;
      case 'partial done':
      case 'partial_done': return <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm bg-blue-100 text-blue-700 border border-blue-200">Partial Done</span>;
      case 'completed':
      case 'done': return <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm bg-green-100 text-green-700 border border-green-200">Done</span>;
      case 'extend date':
      case 'extend': return <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm bg-purple-100 text-purple-700 border border-purple-200">Extended</span>;
      default: return <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase shadow-sm bg-gray-100 text-gray-500 border border-gray-200">{status || "Pending"}</span>;
    }
  };

  const handleSelectItem = useCallback((id, isChecked) => {
    setSelectedItems((prev) => {
      const newSelected = new Set(prev);
      if (isChecked) {
        newSelected.add(id);
        setStatusData((prevStatus) => ({ ...prevStatus, [id]: "Done" }));
        // Pre-fill remark with the latest from history if needed - feature removed to simplify
      } else {
        newSelected.delete(id);
        setStatusData((prevStatus) => {
          const newStatusData = { ...prevStatus };
          delete newStatusData[id];
          return newStatusData;
        });
        setNextTargetDate((prevDate) => {
          const newDateData = { ...prevDate };
          delete newDateData[id];
          return newDateData;
        });
      }
      return newSelected;
    });
  }, []);

  const handleImageUpload = useCallback((id, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadedImages((prev) => ({ ...prev, [id]: file }));
  }, []);

  const handleStatusChange = useCallback((id, value) => {
    setStatusData((prev) => ({ ...prev, [id]: value }));
    if (value === "Done") {
      setNextTargetDate((prev) => {
        const newDates = { ...prev };
        delete newDates[id];
        return newDates;
      });
    }
  }, []);

  const handleNextTargetDateChange = useCallback((id, value) => {
    setNextTargetDate((prev) => ({ ...prev, [id]: value }));
  }, []);

  const fileToBase64 = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }, []);

  const handleSubmit = async () => {
    const selectedItemsArray = Array.from(selectedItems);
    if (selectedItemsArray.length === 0) {
      alert("Please select at least one task");
      return;
    }

    if (selectedItemsArray.some(id => !statusData[id])) {
      alert("Please select status for all selected items.");
      return;
    }

    if (selectedItemsArray.some(id => statusData[id] === "Extend date" && !nextTargetDate[id])) {
      alert("Please select next target date for extended tasks.");
      return;
    }

    const missingRequiredImages = selectedItemsArray.filter((id) => {
      const item = delegation.find((account) => account.task_id === id);
      return item.require_attachment?.toUpperCase() === "YES" && !uploadedImages[id] && !item.image;
    });

    if (missingRequiredImages.length > 0) {
      alert("Please upload images for required attachments.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const selectedData = await Promise.all(
        selectedItemsArray.map(async (id) => {
          const item = delegation.find((x) => x.task_id === id);
          const file = uploadedImages[id];
          let base64Image = file ? await fileToBase64(file) : null;

          return {
            task_id: item.task_id,
            department: item.department,
            given_by: item.given_by,
            name: item.name,
            task_description: item.task_description,
            task_start_date: item.task_start_date,
            planned_date: item.planned_date,
            status: statusData[id] === "Done" ? "done" : 
                   statusData[id] === "Partial Done" ? "partial_done" : 
                   statusData[id] === "Extend date" ? "extend" : null,
            next_extend_date: statusData[id] === "Extend date" ? nextTargetDate[id] : null,
            reason: remarksData[id] || "",
            image_base64: base64Image,
          };
        })
      );

      const result = await dispatch(insertDelegationDoneAndUpdate({ selectedDataArray: selectedData }));
      if (result.meta.requestStatus === "fulfilled") {
        setSuccessMessage(`✅ Successfully submitted ${selectedItemsArray.length} tasks!`);
        setSelectedItems(new Set());
        setRemarksData({});
        setNextTargetDate({});
        setStatusData({});
        setUploadedImages({});
        setTimeout(() => {
          dispatch(delegationData());
        }, 2000);
      } else {
        throw new Error(result.payload || "Submission failed");
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSuccessMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectAll = useCallback((isChecked) => {
    if (isChecked) {
      setSelectedItems(new Set(filteredDelegationTasks.map(t => t.task_id)));
    } else {
      setSelectedItems(new Set());
    }
  }, [filteredDelegationTasks]);

  const isRowSelected = useCallback((item) => selectedItems.has(item.task_id), [selectedItems]);

  const toggleRowSelection = useCallback((item, isChecked) => handleSelectItem(item.task_id, isChecked), [handleSelectItem]);

  return (
    <AdminLayout>
      <div className="space-y-6 p-2 sm:p-4 pb-20">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-purple-700">
              {CONFIG.PAGE_CONFIG.title}
            </h1>
            <p className="text-gray-500 text-sm italic">{CONFIG.PAGE_CONFIG.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-purple-200 rounded-md focus:ring-2 focus:ring-purple-500 text-sm"
              />
            </div>
            
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="border border-gray-300 rounded-md px-2 py-1 text-xs bg-white focus:ring-2 focus:ring-purple-500 outline-none"
            >
              {filterOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>

            {hasModifyAccess('delegation') && (
              <button
                onClick={handleSubmit}
                disabled={selectedItems.size === 0 || isSubmitting}
                className="rounded-md bg-purple-600 py-2 px-3 text-white hover:bg-purple-700 disabled:opacity-50 text-xs font-medium whitespace-nowrap"
              >
                {isSubmitting ? "..." : `Submit Tasks (${selectedItems.size})`}
              </button>
            )}
          </div>
        </div>

        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-3 rounded-md flex items-center justify-between text-sm sm:text-base">
            <div className="flex items-center">
              <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-green-500 flex-shrink-0" />
              <span className="break-words">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage("")} className="text-green-500 hover:text-green-700 ml-2 flex-shrink-0">
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        )}

        <div className="rounded-lg border border-purple-200 shadow-md bg-white overflow-hidden">
          <div className="bg-linear-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-3 sm:p-4 flex justify-between items-center">
            <h2 className="text-purple-700 font-bold text-sm sm:text-lg flex items-center gap-2">
              <LayoutDashboard size={18} className="text-purple-500" />
              My Pending Tasks
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-10">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-4"></div>
              <p className="text-purple-600 text-sm sm:text-base">Loading...</p>
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-auto" style={{ maxHeight: 'calc(100vh - 300px)' }}>
              {/* Desktop Table */}
              <table className="min-w-full divide-y divide-gray-200 hidden sm:table">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Seq No.</th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Admin Remarks</th>
                    <th className="px-3 py-3 text-left">
                       <div className="flex flex-col gap-1 items-start">
                         <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</span>
                         <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          checked={unifiedData.length > 0 && unifiedData.every(item => isRowSelected(item))}
                        />
                       </div>
                    </th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Remarks</th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Given by</th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Unit</th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Division</th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Target Date</th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Submit Date</th>
                    <th className="px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Task ID</th>
                    <th className="px-3 py-3 text-center text-[10px] font-bold text-gray-500 uppercase tracking-wider">Proof</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {unifiedData.length > 0 ? (
                    unifiedData.map((item, index) => {
                      const isSelected = isRowSelected(item);
                      return (
                        <tr key={item.unifiedId} className={`${isSelected ? "bg-purple-50" : "hover:bg-gray-50"} ${getRowColor(item.color_code_for)} transition-colors border-b`}>
                          <td className="px-3 py-4 text-xs text-gray-500">{index + 1}</td>
                          <td className="px-3 py-4 text-xs text-gray-600 max-w-[150px] truncate" title={item.adminremarks}>{item.adminremarks || "—"}</td>
                          <td className="px-3 py-4">
                            <div className="flex flex-col gap-1 items-start">
                              <StatusBadge status="pending" />
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                                checked={isSelected}
                                onChange={(e) => toggleRowSelection(item, e.target.checked)}
                              />
                            </div>
                          </td>
                          <td className="px-3 py-4 min-w-[180px]">
                            {isSelected ? (
                              <div className="space-y-1">
                                <select
                                  value={statusData[item.task_id] || "Done"}
                                  onChange={(e) => handleStatusChange(item.task_id, e.target.value)}
                                  className="border border-gray-300 rounded px-1 py-0.5 w-full text-[10px]"
                                >
                                  <option value="Done">Done</option>
                                  <option value="Extend date">Extend</option>
                                </select>
                                {statusData[item.task_id] === 'Extend date' && (
                                  <input
                                    type="datetime-local"
                                    value={nextTargetDate[item.task_id] || ""}
                                    onChange={(e) => handleNextTargetDateChange(item.task_id, e.target.value)}
                                    className="border border-gray-300 rounded px-1 py-0.5 w-full text-[10px]"
                                  />
                                )}
                                <textarea
                                  placeholder="Remarks"
                                  value={remarksData[item.task_id] || ""}
                                  onChange={(e) => setRemarksData(prev => ({ ...prev, [item.task_id]: e.target.value }))}
                                  className="w-full border rounded p-1 text-[10px] h-12 focus:ring-1 focus:ring-purple-500 outline-none"
                                />
                              </div>
                            ) : (
                              <div className="text-[10px] text-gray-500 italic truncate max-w-[150px]">{item.remarks || "—"}</div>
                            )}
                          </td>
                          <td className="px-3 py-4 text-xs text-gray-700">{item.name}</td>
                          <td className="px-3 py-4 text-xs text-gray-700">{item.given_by || "—"}</td>
                          <td className="px-3 py-4 text-[10px] text-gray-600">{item.unit || "—"}</td>
                          <td className="px-3 py-4 text-[10px] text-gray-600">{item.division || "—"}</td>
                          <td className="px-3 py-4 text-[10px] text-gray-700 max-w-[200px] truncate" title={item.task_description}>{item.task_description}</td>
                          <td className="px-3 py-4 text-[10px] text-gray-600 whitespace-nowrap">{formatDateTimeForDisplay(item.planned_date)}</td>
                          <td className="px-3 py-4 text-[10px] text-gray-600 whitespace-nowrap">{formatDateTimeForDisplay(item.submission_date)}</td>
                          <td className="px-3 py-4 text-[10px] font-medium text-gray-700">{item.task_id}</td>
                          <td className="px-3 py-4 text-center">
                            {isSelected ? (
                              <label className="cursor-pointer text-purple-600 hover:text-purple-800 flex items-center justify-center gap-1">
                                <Upload size={14} />
                                <span className="text-[10px] font-bold uppercase">{uploadedImages[item.task_id] ? "Done" : "Upload"}</span>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(item.task_id, e)} />
                              </label>
                            ) : (
                              item.image && (
                                <button onClick={() => window.open(item.image, "_blank")} className="text-purple-500 hover:text-purple-700"><Upload size={16} /></button>
                              )
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan={10} className="px-6 py-10 text-center text-gray-400 italic">No pending tasks found.</td></tr>
                  )}
                </tbody>
              </table>

              {/* Mobile Card View */}
              <div className="sm:hidden space-y-3 p-3">
                {unifiedData.length > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-purple-50 border border-purple-200 rounded-lg">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      checked={unifiedData.length > 0 && unifiedData.every(item => isRowSelected(item))}
                    />
                    <span className="text-xs font-medium text-purple-700">Select All ({unifiedData.length})</span>
                  </div>
                )}
                {unifiedData.map((item, index) => {
                  const isSelected = isRowSelected(item);
                  return (
                    <div key={item.unifiedId} className={`p-3 border rounded-lg shadow-sm ${isSelected ? "bg-purple-50 border-purple-200" : "bg-white border-gray-200"}`}>
                      <div className="flex justify-between items-center mb-2">
                         <div className="flex items-center gap-2">
                           <input type="checkbox" checked={isSelected} onChange={(e) => toggleRowSelection(item, e.target.checked)} className="h-4 w-4 rounded cursor-pointer" />
                           <span className="text-xs font-bold text-gray-400">#{index+1}</span>
                         </div>
                         <StatusBadge status="pending" />
                      </div>
                       <div className="text-sm font-medium mb-1">{item.task_description}</div>
                       <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[10px] text-gray-500 mb-2">
                          <div><span className="font-semibold text-gray-400">ID:</span> {item.task_id}</div>
                          <div><span className="font-semibold text-gray-400">Target:</span> {formatDateTimeForDisplay(item.planned_date)}</div>
                          <div><span className="font-semibold text-gray-400">Unit:</span> {item.unit || "—"}</div>
                          <div><span className="font-semibold text-gray-400">Div:</span> {item.division || "—"}</div>
                          <div><span className="font-semibold text-gray-400">Given By:</span> {item.given_by || "—"}</div>
                          <div><span className="font-semibold text-gray-400">Admin Rem:</span> {item.adminremarks || "—"}</div>
                       </div>
                      {isSelected && (
                        <div className="pt-2 border-t space-y-2">
                            <select value={statusData[item.task_id] || "Done"} className="w-full border rounded text-xs p-1" onChange={(e) => handleStatusChange(item.task_id, e.target.value)}>
                              <option value="Done">Done</option>
                              <option value="Extend date">Extend</option>
                            </select>
                            {statusData[item.task_id] === 'Extend date' && (
                              <input type="datetime-local" value={nextTargetDate[item.task_id] || ""} onChange={(e) => handleNextTargetDateChange(item.task_id, e.target.value)} className="w-full border rounded text-xs p-1" />
                            )}
                            <textarea className="w-full border rounded text-xs p-1" rows="2" placeholder="Remarks..." value={remarksData[item.task_id] || ""} onChange={(e) => setRemarksData(prev => ({ ...prev, [item.task_id]: e.target.value }))} />
                            <div className="mt-2 text-center border border-dashed border-gray-300 rounded p-2 bg-gray-50">
                             <label className="cursor-pointer text-purple-600 hover:text-purple-800 flex items-center justify-center gap-1">
                               <Upload size={14} />
                               <span className="text-xs font-bold uppercase">{uploadedImages[item.task_id] ? "Done" : "Upload image"}</span>
                               <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(item.task_id, e)} />
                             </label>
                           </div>
                        </div>
                      )}
                      {!isSelected && item.image && (
                        <div className="mt-2 flex justify-end">
                          <button onClick={() => window.open(item.image, "_blank")} className="text-purple-500 flex items-center gap-1 text-xs font-medium"><Upload size={14} /> View Proof</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default DelegationDataPage;
