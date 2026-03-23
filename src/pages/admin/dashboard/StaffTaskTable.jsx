"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { Download, FileText, Search, X, User, ExternalLink, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from "lucide-react"
import { fetchStaffTasksDataApi, getStaffTasksCountApi, getTotalUsersCountApi, fetchStaffDetailsApi } from "../../../redux/api/dashboardApi"
import Papa from "papaparse"
import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

export default function StaffTasksTable({
  dashboardType,
  dashboardStaffFilter,
  departmentFilter,
  parseTaskStartDate,
  startDate,
  endDate
}) {
  const [staffMembers, setStaffMembers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalStaffCount, setTotalStaffCount] = useState(0)
  const [totalUsersCount, setTotalUsersCount] = useState(0)
  const [selectedMonthYear, setSelectedMonthYear] = useState("")
  const [tillDate, setTillDate] = useState(new Date().toLocaleDateString('en-CA'))
  const [monthYearOptions, setMonthYearOptions] = useState([])
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedStaffName, setSelectedStaffName] = useState("")
  const [staffTaskDetails, setStaffTaskDetails] = useState([])
  const [isModalLoading, setIsModalLoading] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  const [isMobile, setIsMobile] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportRange, setReportRange] = useState({
    from: startDate || "",
    to: endDate || new Date().toISOString().split('T')[0]
  })

  // Sync report range with props
  useEffect(() => {
    if (startDate || endDate) {
      setReportRange({
        from: startDate || "",
        to: endDate || new Date().toISOString().split('T')[0]
      });
    }
  }, [startDate, endDate]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Generate month-year options (last 12 months + current month)
  const generateMonthYearOptions = useCallback(() => {
    const options = []
    const today = new Date()
    const currentMonth = today.getMonth() // 0-11
    const currentYear = today.getFullYear()
    
    // Add current month as default
    const currentMonthYear = `${today.toLocaleString('default', { month: 'long' })} ${currentYear}`
    
    // Generate options for last 12 months (including current)
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1)
      const monthName = date.toLocaleString('default', { month: 'long' })
      const year = date.getFullYear()
      const monthYear = `${monthName} ${year}`
      
      options.push({
        value: `${year}-${(date.getMonth() + 1).toString().padStart(2, '0')}`,
        label: monthYear,
        isCurrent: i === 0 // Current month
      })
    }
    
    setMonthYearOptions(options)
    
    // Set default selection to current month
    if (options.length > 0 && !selectedMonthYear) {
      const currentOption = options.find(opt => opt.isCurrent)
      if (currentOption) {
        setSelectedMonthYear(currentOption.value)
      }
    }
  }, [selectedMonthYear])

  useEffect(() => {
    generateMonthYearOptions()
  }, [generateMonthYearOptions])

  // Reset when filters change
  useEffect(() => {
    setStaffMembers([])
    setTotalStaffCount(0)
  }, [dashboardType, dashboardStaffFilter, departmentFilter, selectedMonthYear, tillDate, startDate, endDate])

  const handleOpenModal = useCallback(async (staffName) => {
    setSelectedStaffName(staffName)
    setIsModalOpen(true)
    setIsModalLoading(true)
    setStaffTaskDetails([])
    setCurrentPage(1)

    try {
      const details = await fetchStaffDetailsApi(
        dashboardType,
        staffName,
        selectedMonthYear,
        tillDate,
        startDate,
        endDate
      )
      setStaffTaskDetails(details || [])
    } catch (error) {
      console.error("Error fetching staff details:", error)
    } finally {
      setIsModalLoading(false)
    }
  }, [dashboardType, selectedMonthYear, tillDate])

  const handleDownloadCSV = () => {
    if (!staffTaskDetails.length) return;
    
    const data = staffTaskDetails.map((task, idx) => ({
      "Seq No": idx + 1,
      "Status": task.status || 'Pending',
      "Given By": task.given_by || '—',
      "Task Description": task.task_description,
      "Division": task.division || '—',
      "Department": task.department || '—',
      "Name": task.name,
      "Start Date": task.start_date,
      "Submission Date": task.submission_date || '—'
    }));

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${selectedStaffName}_Work_Report_${new Date().toLocaleDateString()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    if (!staffTaskDetails.length) return;
    
    const doc = new jsPDF('l', 'mm', 'a4'); 
    
    doc.setFontSize(18);
    doc.setTextColor(124, 58, 237);
    doc.text(`${selectedStaffName}'s Work Report`, 14, 15);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Type: ${dashboardType === 'checklist' ? 'Checklist' : 'Delegation'}`, 14, 22);
    doc.text(`Period: ${selectedMonthYear || 'N/A'} (Till: ${tillDate})`, 14, 27);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 32);
    
    const tableColumn = ["Seq", "Status", "Given By", "Task Description", "Division", "Department", "Name", "Start Date", "Submission Date"];
    const tableRows = staffTaskDetails.map((task, idx) => [
      idx + 1,
      task.status || 'Pending',
      task.given_by || '—',
      task.task_description,
      task.division || '—',
      task.department || '—',
      task.name,
      task.start_date,
      task.submission_date || '—'
    ]);

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [124, 58, 237], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 20 },
        2: { cellWidth: 25 },
        3: { cellWidth: 'auto' },
        4: { cellWidth: 25 },
        5: { cellWidth: 25 },
        6: { cellWidth: 30 },
        7: { cellWidth: 25 },
      }
    });
    
    doc.save(`${selectedStaffName}_Work_Report_${new Date().toLocaleDateString()}.pdf`);
  };

  const getVisiblePages = () => {
    const totalPages = Math.ceil(staffTaskDetails.length / pageSize);
    const visibleCount = isMobile ? 2 : 5;
    
    if (totalPages <= visibleCount) {
      return [...Array(totalPages).keys()].map(i => i + 1);
    }
    
    let start = Math.max(1, currentPage - (isMobile ? 0 : 2));
    let end = start + visibleCount - 1;
    
    if (end > totalPages) {
      end = totalPages;
      start = Math.max(1, end - visibleCount + 1);
    }
    
    if (start < 1) {
      start = 1;
      end = Math.min(totalPages, start + visibleCount - 1);
    }
    
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  // Hold-to-paginate timer refs
  const holdTimerRef = useRef(null)
  const holdIntervalRef = useRef(null)

  const startAutoPaginate = (direction) => {
    // Stop any existing timers first
    stopAutoPaginate();
    
    holdTimerRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(() => {
        setCurrentPage(prev => {
          const totalPages = Math.ceil(staffTaskDetails.length / pageSize);
          if (direction === 1) {
            if (prev >= totalPages) {
              stopAutoPaginate();
              return prev;
            }
            return prev + 1;
          } else {
            if (prev <= 1) {
              stopAutoPaginate();
              return prev;
            }
            return prev - 1;
          }
        });
      }, 100); // 100ms repeating
    }, 500); // 2s delay as requested
  };

  const stopAutoPaginate = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdTimerRef.current = null;
    holdIntervalRef.current = null;
  };

// Function to load staff data from server
const loadStaffData = useCallback(async () => {
  if (isLoading) return;

  try {
    setIsLoading(true)

    // Fetch ALL staff data (using a high limit to get everything at once)
    const data = await fetchStaffTasksDataApi(
      dashboardType,
      dashboardStaffFilter,
      1,
      1000, // Very high limit to show all
      selectedMonthYear,
      tillDate,
      startDate,
      endDate
    )

    // Get total counts
    const [staffCount, usersCount] = await Promise.all([
      getStaffTasksCountApi(dashboardType, dashboardStaffFilter),
      getTotalUsersCountApi()
    ]);
    setTotalStaffCount(staffCount)
    setTotalUsersCount(usersCount)

    if (!data || data.length === 0) {
      setStaffMembers([])
      return
    }

    // Filter data by selected month-year if specified
    let filteredData = data
    if (selectedMonthYear) {
      const [year, month] = selectedMonthYear.split('-').map(Number)
      filteredData = data.filter(staff => {
        // Placeholder filter logic
        return true 
      })
    }

    setStaffMembers(filteredData)

  } catch (error) {
    console.error('Error loading staff data:', error)
  } finally {
    setIsLoading(false)
  }
}, [dashboardType, dashboardStaffFilter, departmentFilter, selectedMonthYear, tillDate, startDate, endDate])

  // Initial load when component mounts or dependencies change
  useEffect(() => {
    loadStaffData()
  }, [loadStaffData]) // Added loadStaffData to dependency array


  const renderOnTimeScore = (score) => {
    let bgColor = "bg-red-100"
    let textColor = "text-red-800"
    
    if (score >= 80) {
      bgColor = "bg-green-100"
      textColor = "text-green-800"
    } else if (score >= 20) {
      bgColor = "bg-yellow-100"
      textColor = "text-yellow-800"
    }
    
    return (
      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
        {score}%
      </span>
    )
  }

  // Role check for export button
  const userRole = localStorage.getItem("role") || "";
  const canExportReport = ["super_admin", "admin", "div_admin"].includes(userRole.toLowerCase());

  const handleExportCSV = async (customRange = null) => {
    try {
      setIsLoading(true);
      const exportFrom = customRange?.from || reportRange.from || startDate;
      const exportTo = customRange?.to || reportRange.to || endDate || tillDate;

      // Fetch data with a very large limit to get all filtered records for export
      const allData = await fetchStaffTasksDataApi(
        dashboardType,
        dashboardStaffFilter,
        1,
        10000, 
        selectedMonthYear,
        tillDate,
        exportFrom,
        exportTo
      );
      if (!allData || allData.length === 0) {
        alert("No data available to export.");
        return;
      }

      // Define CSV headers
      const headers = ["SEQ NO.", "NAME", "DIVISION", "DEPARTMENT", "TOTAL TASKS", "COMPLETED", "PENDING", "OVERDUE", "DONE ON TIME", "WORK DONE SCORE"];
      
      // Map data to rows
      const rows = allData.map((staff, index) => {
        const score = staff.completedTasks > 0 ? Math.round((staff.completedTasks / staff.totalTasks) * 100) : 0;
        return [
          index + 1,
          staff.name,
          staff.division || "N/A",
          staff.department || "N/A",
          staff.totalTasks,
          staff.completedTasks,
          staff.pendingTasks,
          staff.overdueTasks || 0,
          staff.doneOnTime || 0,
          `${score}%`
        ];
      });

      // Assemble CSV content
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.map(value => `"${value}"`).join(","))
      ].join("\n");

      // Create blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `Work_Done_Report_${dashboardType}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting CSV:", error);
      alert("Failed to export report.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportPDF = async (customRange = null) => {
    try {
      setIsLoading(true);
      const exportFrom = customRange?.from || reportRange.from || startDate;
      const exportTo = customRange?.to || reportRange.to || endDate || tillDate;

      // Fetch data with a very large limit to get all filtered records for export
      const allData = await fetchStaffTasksDataApi(
        dashboardType,
        dashboardStaffFilter,
        1,
        10000, 
        selectedMonthYear,
        tillDate,
        exportFrom,
        exportTo
      );
      if (!allData || allData.length === 0) {
        alert("No data available to export.");
        return;
      }

      const doc = new jsPDF('l', 'mm', 'a4'); 
      
      // Header
      doc.setFontSize(18);
      doc.setTextColor(37, 99, 235); // Blue-600
      doc.text(`Work Done Summary Report - ${dashboardType.toUpperCase()}`, 14, 15);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Period: ${selectedMonthYear || 'All Months'} (Till: ${tillDate || 'N/A'})`, 14, 22);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 27);
      
      // Define table headers
      const tableColumn = ["Seq", "Name", "Division", "Department", "Total", "Done", "Pending", "Overdue", "On Time", "Score"];
      
      // Map data to rows
      const tableRows = allData.map((staff, index) => {
        const score = staff.completedTasks > 0 ? Math.round((staff.completedTasks / staff.totalTasks) * 100) : 0;
        return [
          index + 1,
          staff.name,
          staff.division || "N/A",
          staff.department || "N/A",
          staff.totalTasks,
          staff.completedTasks,
          staff.pendingTasks,
          staff.overdueTasks || 0,
          staff.doneOnTime || 0,
          `${score}%`
        ];
      });

      // Generate table
      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 35,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 249, 255] },
        margin: { top: 35 }
      });
      
      doc.save(`Work_Done_Report_${dashboardType}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert("Failed to export PDF report.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Show total count and active filters */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-3 md:space-y-0">
        <div className="flex flex-col space-y-2">
          {/* Month-Year Dropdown */}
          <div className="flex items-center space-x-2">
            <label htmlFor="monthYearFilter" className="text-sm font-medium text-gray-700">
              Filter by Month:
            </label>
            <select
              id="monthYearFilter"
              value={selectedMonthYear}
              onChange={(e) => setSelectedMonthYear(e.target.value)}
              className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Months</option>
              {monthYearOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label} {option.isCurrent && "(Current)"}
                </option>
              ))}
            </select>
          </div>

          {/* Till Date Filter */}
          <div className="flex items-center space-x-2">
            <label htmlFor="tillDateFilter" className="text-sm font-medium text-gray-700">
              Till Date:
            </label>
            <input
              type="date"
              id="tillDateFilter"
              value={tillDate}
              onChange={(e) => setTillDate(e.target.value)}
              className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            {tillDate && (
              <button
                onClick={() => setTillDate("")}
                className="text-xs text-red-500 hover:text-red-700 font-medium"
              >
                Clear
              </button>
            )}
          </div>
          
          {totalStaffCount > 0 && (
            <div className="text-sm text-gray-600">
              Total users: {totalUsersCount} | Showing: {staffMembers.length}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-3">
          {canExportReport && (
            <div className="relative">
              <button
                disabled={isLoading}
                onClick={() => setIsReportModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium disabled:opacity-50"
              >
                <Download size={18} />
                Work done report
              </button>
            </div>
          )}

          {/* Show active filters */}
          <div className="flex flex-wrap gap-2 justify-end">
            {dashboardStaffFilter !== "all" && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                Staff: {dashboardStaffFilter}
              </span>
            )}
            {departmentFilter !== "all" && dashboardType === "checklist" && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                Dept Filter: {departmentFilter}
              </span>
            )}
            {selectedMonthYear && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                Month: {monthYearOptions.find(opt => opt.value === selectedMonthYear)?.label || selectedMonthYear}
              </span>
            )}
            {tillDate && (
              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                Till: {tillDate}
              </span>
            )}
          </div>
        </div>
      </div>

      {staffMembers.length === 0 && !isLoading ? (
        <div className="text-center p-8 text-gray-500">
          <p>No staff data found for the selected filters.</p>
          {selectedMonthYear && (
            <p className="text-sm mt-2">Try selecting "All Months" to see more results.</p>
          )}
          {dashboardStaffFilter !== "all" && (
            <p className="text-sm mt-2">Try selecting "All Staff Members" to see more results.</p>
          )}
        </div>
      ) : (
        <div
          className="staff-table-container rounded-md border border-gray-200 overflow-auto"
          style={{ maxHeight: "400px" }}
        >
          <table className="min-w-full divide-y divide-gray-200 hidden md:table">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Seq No.
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Division
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Tasks
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Overdue
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Done on Time
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Work Done Score
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staffMembers.map((staff, index) => (
                <tr key={`${staff.name}-${index}`} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div 
                      className="cursor-pointer group flex items-center gap-2"
                      onClick={() => handleOpenModal(staff.name)}
                    >
                      <div className="bg-purple-100 p-1.5 rounded-full text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                        <User size={14} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900 group-hover:text-purple-700 transition-colors border-b border-transparent group-hover:border-purple-200">
                          {staff.name}
                        </div>
                        {staff.email && !staff.email.includes('example.com') && (
                          <div className="text-xs text-gray-500">{staff.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.division || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.department || "N/A"}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.totalTasks}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.completedTasks}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.pendingTasks}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-500">{staff.overdueTasks || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {staff.doneOnTime || 0}
                    {staff.completedTasks > 0 && (
                      <span className="text-xs text-gray-500 ml-1">
                        ({Math.round((staff.doneOnTime / staff.completedTasks) * 100)}%)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderOnTimeScore(staff.completedTasks > 0 ? Math.round((staff.completedTasks / staff.totalTasks) * 100) : 0)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 p-3">
            {staffMembers.map((staff, index) => (
              <div key={`mobile-${staff.name}-${index}`} className="p-3 border rounded-lg shadow-sm bg-white border-gray-200">
                <div className="flex justify-between items-center mb-2">
                   <div className="flex items-center gap-2">
                     <span className="text-xs font-bold text-gray-400">#{index + 1}</span>
                   </div>
                   <div>
                     {renderOnTimeScore(staff.completedTasks > 0 ? Math.round((staff.completedTasks / staff.totalTasks) * 100) : 0)}
                   </div>
                </div>
                
                <div 
                  className="text-sm font-medium mb-1 text-gray-800 cursor-pointer hover:text-purple-700 flex items-center gap-1"
                  onClick={() => handleOpenModal(staff.name)}
                >
                  <User size={12} className="text-purple-600" />
                  {staff.name} 
                  <span className="text-[10px] text-gray-500 font-normal ml-1">
                    ({staff.division || "N/A"} - {staff.department || "N/A"})
                  </span>
                  <ExternalLink size={10} className="text-gray-400 ml-auto" />
                </div>
                
                {staff.email && !staff.email.includes('example.com') && (
                  <div className="text-[10px] text-gray-500 mb-2 truncate">{staff.email}</div>
                )}

                <div className="flex justify-between text-[10px] text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                   <div className="text-center">
                      <div className="font-semibold text-gray-800">{staff.totalTasks}</div>
                      <div>Total</div>
                   </div>
                   <div className="text-center">
                      <div className="font-semibold text-green-600">{staff.completedTasks}</div>
                      <div>Completed</div>
                   </div>
                   <div className="text-center">
                      <div className="font-semibold text-yellow-600">{staff.pendingTasks}</div>
                      <div>Pending</div>
                   </div>
                   <div className="text-center">
                      <div className="font-semibold text-red-500">{staff.overdueTasks || 0}</div>
                      <div>Overdue</div>
                   </div>
                </div>
                
                <div className="flex justify-between text-[10px] mt-2 px-1">
                   <span className="text-gray-600">Done on Time:</span>
                   <span className="font-medium text-gray-800">
                      {staff.doneOnTime || 0}
                      {staff.completedTasks > 0 && (
                        <span className="text-gray-500 ml-1 whitespace-nowrap">
                          ({Math.round((staff.doneOnTime / staff.completedTasks) * 100)}%)
                        </span>
                      )}
                   </span>
                </div>
              </div>
            ))}
          </div>

          {isLoading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <p className="text-sm text-gray-500 mt-2">Loading staff data...</p>
            </div>
          )}
        </div>
      )}

      {/* Report Date Selection Modal */}
      {isReportModalOpen && createPortal(
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 overflow-hidden border border-gray-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-200">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">Generate Report</h3>
                  <p className="text-xs text-gray-500 font-medium">Configure your work done report</p>
                </div>
              </div>
              <button 
                onClick={() => setIsReportModalOpen(false)}
                className="p-2 hover:bg-red-50 hover:text-red-600 rounded-full transition-all text-gray-400 active:scale-95"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-600">Select the date range for your report calculations.</p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="reportFrom" className="text-xs font-bold text-gray-500 uppercase">From</label>
                  <input
                    type="date"
                    id="reportFrom"
                    value={reportRange.from}
                    onChange={(e) => setReportRange(prev => ({ ...prev, from: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="reportTo" className="text-xs font-bold text-gray-500 uppercase">To</label>
                  <input
                    type="date"
                    id="reportTo"
                    value={reportRange.to}
                    onChange={(e) => setReportRange(prev => ({ ...prev, to: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  onClick={() => {
                    handleExportPDF();
                    setIsReportModalOpen(false);
                  }}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  <FileText size={18} />
                  Download PDF Report
                </button>
                <button
                  onClick={() => {
                    handleExportCSV();
                    setIsReportModalOpen(false);
                  }}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  <Download size={18} />
                  Download CSV Report
                </button>
              </div>

              <div className="text-center">
                <button
                  onClick={() => {
                    // Export with current dashboard filters
                    handleExportPDF({ from: "", to: "" });
                    setIsReportModalOpen(false);
                  }}
                  className="text-xs text-gray-400 hover:text-blue-600 font-medium transition-colors"
                >
                  Or download using current dashboard filters
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Task Detail Modal */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-2 sm:p-4 bg-gray-900/70 backdrop-blur-md">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-white">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600 p-2 rounded-lg text-white">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedStaffName}'s Tasks</h3>
                  <p className="text-xs text-gray-500">
                    Showing {staffTaskDetails.length} tasks for {dashboardType === 'checklist' ? 'Checklist' : 'Delegation'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {staffTaskDetails.length > 0 && (
                  <div className="relative group">
                    <button className="flex items-center gap-2 px-3 py-1.5 bg-white border border-purple-200 text-purple-700 rounded-lg text-xs font-bold hover:bg-purple-50 transition-all shadow-sm">
                      <Download size={14} />
                      <span className="hidden sm:inline">Work Report</span>
                    </button>
                    <div className="absolute right-0 mt-1 w-40 bg-white border border-gray-100 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[1001] py-1">
                      <button 
                        onClick={handleDownloadCSV}
                        className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-purple-50 transition-colors flex items-center gap-2"
                      >
                        <FileText size={14} className="text-green-600" />
                        Export as CSV
                      </button>
                      <button 
                        onClick={handleDownloadPDF}
                        className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-purple-50 transition-colors flex items-center gap-2 border-t border-gray-50"
                      >
                        <FileText size={14} className="text-red-600" />
                        Export as PDF
                      </button>
                    </div>
                  </div>
                )}
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-auto p-4">
              {isModalLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-4"></div>
                  <p className="text-gray-500 font-medium">Fetching task details...</p>
                </div>
              ) : staffTaskDetails.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                  <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500 font-medium text-lg">No tasks found for this period</p>
                  <p className="text-gray-400 text-sm">Either no tasks were assigned or they are outside the selected filter.</p>
                </div>
              ) : (
                <>
                  {/* Desktop View Table */}
                  <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">#</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Given By</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider min-w-[200px]">Task Description</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Division</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Department</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Name</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Start Date</th>
                          <th className="px-3 py-2 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider">Submission Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {staffTaskDetails.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((task, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-2 whitespace-nowrap text-[11px] text-gray-400">{(currentPage - 1) * pageSize + idx + 1}</td>
                            <td className="px-3 py-2 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                task.status?.toLowerCase() === 'yes' || task.status?.toLowerCase() === 'done'
                                  ? 'bg-green-100 text-green-700 border border-green-200' 
                                  : task.status?.toLowerCase() === 'no'
                                  ? 'bg-red-100 text-red-700 border border-red-200'
                                  : 'bg-amber-100 text-amber-700 border border-amber-200'
                              }`}>
                                {task.status || 'Pending'}
                              </span>
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-[11px] font-medium text-gray-700">{task.given_by || '—'}</td>
                            <td className="px-3 py-2 text-[11px] text-gray-600 max-w-[200px] truncate" title={task.task_description}>{task.task_description}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[11px] text-gray-600">{task.division || '—'}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[11px] text-gray-600">{task.department || '—'}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[11px] font-semibold text-gray-900">{task.name}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[11px] text-gray-500">{task.start_date}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-[11px] text-gray-500 font-medium">{task.submission_date || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile View Cards */}
                  <div className="md:hidden space-y-4">
                    {staffTaskDetails.slice((currentPage - 1) * pageSize, currentPage * pageSize).map((task, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all active:scale-[0.98]">
                        <div className="flex justify-between items-start mb-3">
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                            task.status?.toLowerCase() === 'yes' || task.status?.toLowerCase() === 'done'
                              ? 'bg-green-100 text-green-700'
                              : task.status?.toLowerCase() === 'no'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-600'
                          }`}>
                            {task.status || 'Pending'}
                          </span>
                          <div className="text-[10px] text-gray-500 font-medium bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                            {task.given_by ? `By: ${task.given_by}` : '—'}
                          </div>
                        </div>
                        
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 leading-snug">
                          {task.task_description}
                        </h4>
                        
                        <div className="grid grid-cols-2 gap-y-3 gap-x-2 mt-2 pt-3 border-t border-gray-50">
                          <div>
                            <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Department</p>
                            <p className="text-xs text-gray-700 font-medium mt-0.5 truncate">{task.department || '—'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Division</p>
                            <p className="text-xs text-gray-700 font-medium mt-0.5 truncate">{task.division || '—'}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Start Date</p>
                            <p className="text-xs text-gray-600 mt-0.5">{task.start_date}</p>
                          </div>
                          <div>
                            <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">Submission Date</p>
                            <p className="text-xs text-purple-600 font-bold mt-0.5">{task.submission_date || '—'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex flex-col xl:flex-row items-center justify-between gap-4">
              <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-2">
                {/* First Page Button */}
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  title="First Page"
                  className="p-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
                >
                  <ChevronsLeft size={16} />
                </button>

                {/* Previous Button with Hold Behavior */}
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  onMouseDown={() => startAutoPaginate(-1)}
                  onMouseUp={stopAutoPaginate}
                  onMouseLeave={stopAutoPaginate}
                  onTouchStart={() => startAutoPaginate(-1)}
                  onTouchEnd={stopAutoPaginate}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm flex items-center gap-1"
                >
                  <ChevronLeft size={14} />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-1">
                  {getVisiblePages().map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                        currentPage === page
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  {Math.ceil(staffTaskDetails.length / pageSize) > (isMobile ? 2 : 5) && currentPage < Math.ceil(staffTaskDetails.length / pageSize) - (isMobile ? 0 : 2) && (
                    <span className="text-gray-400 px-1 font-bold">...</span>
                  )}
                </div>

                {/* Next Button with Hold Behavior */}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(staffTaskDetails.length / pageSize), prev + 1))}
                  onMouseDown={() => startAutoPaginate(1)}
                  onMouseUp={stopAutoPaginate}
                  onMouseLeave={stopAutoPaginate}
                  onTouchStart={() => startAutoPaginate(1)}
                  onTouchEnd={stopAutoPaginate}
                  disabled={currentPage === Math.ceil(staffTaskDetails.length / pageSize)}
                  className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm flex items-center gap-1"
                >
                  <span>Next</span>
                  <ChevronRight size={14} />
                </button>

                {/* Last Page Button */}
                <button
                  onClick={() => setCurrentPage(Math.ceil(staffTaskDetails.length / pageSize))}
                  disabled={currentPage === Math.ceil(staffTaskDetails.length / pageSize)}
                  title="Last Page"
                  className="p-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-all shadow-sm"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
              
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-full sm:w-auto px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-bold transition-all shadow-md active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}