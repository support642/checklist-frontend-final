"use client"

import { useState, useEffect, useCallback } from "react"
import { Download, FileText, Search } from "lucide-react"
import { fetchStaffTasksDataApi, getStaffTasksCountApi, getTotalUsersCountApi } from "../../../redux/api/dashboardApi"

export default function StaffTasksTable({
  dashboardType,
  dashboardStaffFilter,
  departmentFilter,
  parseTaskStartDate
}) {
  const [staffMembers, setStaffMembers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalStaffCount, setTotalStaffCount] = useState(0)
  const [totalUsersCount, setTotalUsersCount] = useState(0)
  const [selectedMonthYear, setSelectedMonthYear] = useState("")
  const [tillDate, setTillDate] = useState(new Date().toLocaleDateString('en-CA'))
  const [monthYearOptions, setMonthYearOptions] = useState([])

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
  }, [dashboardType, dashboardStaffFilter, departmentFilter, selectedMonthYear, tillDate])

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
      tillDate
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
}, [dashboardType, dashboardStaffFilter, departmentFilter, selectedMonthYear, tillDate])

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

  const handleExportCSV = async () => {
    try {
      setIsLoading(true);
      // Fetch data with a very large limit to get all filtered records for export
      const allData = await fetchStaffTasksDataApi(
        dashboardType,
        dashboardStaffFilter,
        1,
        10000, 
        selectedMonthYear,
        tillDate
      );

      if (!allData || allData.length === 0) {
        alert("No data available to export.");
        return;
      }

      // Define CSV headers
      const headers = ["SEQ NO.", "NAME", "TOTAL TASKS", "COMPLETED", "PENDING", "DONE ON TIME", "WORK DONE SCORE"];
      
      // Map data to rows
      const rows = allData.map((staff, index) => {
        const score = staff.completedTasks > 0 ? Math.round((staff.completedTasks / staff.totalTasks) * 100) : 0;
        return [
          index + 1,
          staff.name,
          staff.totalTasks,
          staff.completedTasks,
          staff.pendingTasks,
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
            <button
              onClick={handleExportCSV}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors shadow-sm text-sm font-medium disabled:opacity-50"
            >
              <Download size={18} />
              Work done report
            </button>
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
                  Total Tasks
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completed
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pending
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
                    <div>
                      <div className="text-sm font-medium text-gray-900">{staff.name}</div>
                      {staff.email && !staff.email.includes('example.com') && (
                        <div className="text-xs text-gray-500">{staff.email}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.totalTasks}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.completedTasks}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{staff.pendingTasks}</td>
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
                
                <div className="text-sm font-medium mb-1 text-gray-800">{staff.name}</div>
                
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
    </div>
  )
}