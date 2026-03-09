import React, { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  maintenanceData, 
  maintenanceHistoryData, 
  fetchMachinePartsData,
  updateUniqueMaintenanceTask 
} from '../../redux/slice/maintenanceSlice';
import StatsCards from './StatsCards';
import MaintenanceCharts from './MaintenanceCharts';
import MaintenanceTable from './MaintenanceTable';
import { RefreshCw, ClipboardList } from 'lucide-react';

const MaintenanceView = () => {
  const dispatch = useDispatch();
  
  const { 
    maintenance, 
    history, 
    machineParts, 
    loading, 
    error,
    historyTotalCount,
    historyApprovedCount
  } = useSelector((state) => state.maintenance);

  useEffect(() => {
    dispatch(maintenanceData({ page: 1 }));
    dispatch(maintenanceHistoryData());
    dispatch(fetchMachinePartsData());
  }, [dispatch]);

  // --- Aggregate Stats ---
  const stats = useMemo(() => {
    const totalPending = maintenance.length;
    const totalCompleted = historyApprovedCount || 0;
    const totalHistory = historyTotalCount || 0;
    
    // Simple heuristic for overdue: if status is 'overdue' in pending
    const overdueCount = maintenance.filter(t => (t.status || '').toLowerCase() === 'overdue').length;

    return {
      totalMachines: machineParts.length || 0,
      totalTasks: totalPending + totalHistory,
      completedTasks: totalCompleted,
      pendingTasks: totalPending - overdueCount,
      overdueTasks: overdueCount,
      totalCost: '15,000' // Dummy for now
    };
  }, [maintenance, historyTotalCount, historyApprovedCount, machineParts]);

  // --- Derive Frequency Data ---
  const frequencyData = useMemo(() => {
    const allTasks = [...maintenance, ...history];
    const freqMap = {
      'one-time': 0,
      'daily': 0,
      'weekly': 0,
      'monthly': 0,
      'quarterly': 0,
      'half-yearly': 0,
      'yearly': 0
    };

    allTasks.forEach(task => {
      const f = (task.frequency || '').toLowerCase();
      if (freqMap.hasOwnProperty(f)) {
        freqMap[f]++;
      } else if (f.includes('yearly')) {
        freqMap['yearly']++;
      } else if (f.includes('monthly')) {
        freqMap['monthly']++;
      }
    });

    return Object.keys(freqMap).map(key => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      count: freqMap[key]
    }));
  }, [maintenance, history]);

  // --- Handlers ---
  const handleUpdateTask = async (updatedTask) => {
    // We use updateUniqueMaintenanceTask thunk which expects { updatedTask, originalTask }
    // For simplicity here, we'll try to match the API expectation
    const originalTask = [...maintenance, ...history].find(t => (t.task_id || t.id) === (updatedTask.task_id || updatedTask.id));
    
    if (originalTask) {
      return dispatch(updateUniqueMaintenanceTask({ updatedTask, originalTask })).unwrap();
    }
  };

  const handleRefresh = () => {
    dispatch(maintenanceData({ page: 1 }));
    dispatch(maintenanceHistoryData());
  };

  if (error) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800">
        <p className="font-bold">Error loading maintenance data</p>
        <p className="text-sm">{error}</p>
        <button 
          onClick={handleRefresh}
          className="mt-4 btn bg-red-600 text-white hover:bg-red-700 font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header with Refresh */}
      {/* <div className="flex items-center justify-end border-b border-gray-100 dark:border-gray-800 pb-2">
        <button 
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 hover:text-blue-600 transition-colors"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">Refresh Data</span>
        </button>
      </div> */}

      {/* Stats Cards */}
      <StatsCards stats={stats} />

      {/* Charts Section */}
      <MaintenanceCharts frequencyData={frequencyData} />

      {/* Main Table Section */}
      <div className="rounded-lg border border-purple-200 shadow-md bg-white overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple-100 p-4">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-white/50 rounded-lg shadow-sm">
                <ClipboardList className="h-5 w-5 text-purple-600" />
             </div>
             <div>
                <h3 className="text-purple-700 font-bold">Maintenance Task Summary</h3>
                <p className="text-purple-600 text-sm">Overview of maintenance activities and machine health</p>
             </div>
          </div>
        </div>
        <div className="p-4">
          <MaintenanceTable 
            tasks={[...maintenance, ...history]} 
            onUpdateTask={handleUpdateTask}
            isLoading={loading}
            onRefresh={handleRefresh}
          />
        </div>
      </div>
    </div>
  );
};

export default MaintenanceView;
