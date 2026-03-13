import React, { useEffect, useState } from 'react';
// import { Plus, User, Building, X, Save, Edit, Trash2, Settings, Search, ChevronDown, Calendar, RefreshCw } from 'lucide-react';
import { Plus, User, Building, X, Save, Edit, Trash2, Settings, Search, ChevronDown, Calendar, RefreshCw, Eye, EyeOff } from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import { useDispatch, useSelector } from 'react-redux';
import { createDepartment, createUser, deleteUser, departmentOnlyDetails, givenByDetails, departmentDetails, updateDepartment, updateUser, userDetails, machineDetails, createMachineThunk, updateMachineThunk, deleteMachineThunk } from '../redux/slice/settingSlice';
import { extendTaskApi } from '../redux/api/settingApi';
import { uniqueDoerNameData } from '../redux/slice/assignTaskSlice';
import { hasPageAccess, hasModifyAccess } from '../utils/permissionUtils';
// import supabase from '../SupabaseClient';
import { SYSTEM_PERMISSIONS, PAGE_PERMISSIONS, PAGE_PERMISSION_GROUPS, PAGE_SYSTEM_MAP } from '../constants/permissions';


const Setting = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [currentDeptId, setCurrentDeptId] = useState(null);
  const [usernameFilter, setUsernameFilter] = useState('');
  const [usernameDropdownOpen, setUsernameDropdownOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [activeDeptSubTab, setActiveDeptSubTab] = useState('departments');
  // Leave Management State
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [remark, setRemark] = useState('');
  const [leaveUsernameFilter, setLeaveUsernameFilter] = useState('');
  const [showPasswords, setShowPasswords] = useState({}); // Track which passwords are visible
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showGivenByModal, setShowGivenByModal] = useState(false);
  const [givenByInput, setGivenByInput] = useState('');
  
  // Task Delegation Modal State
  const [showDelegationModal, setShowDelegationModal] = useState(false);
  const [selectedDoer, setSelectedDoer] = useState('');
  
  // Leave Transfer Popup State
  const [showLeavePopup, setShowLeavePopup] = useState(false);
  const [currentLeaveUser, setCurrentLeaveUser] = useState(null);
  const [popupLeaveStartDate, setPopupLeaveStartDate] = useState('');
  const [popupLeaveEndDate, setPopupLeaveEndDate] = useState('');
  const [popupDoer, setPopupDoer] = useState('');
  const [popupRemarks, setPopupRemarks] = useState('');

  // Extend Task State
  const [showExtendTaskPopup, setShowExtendTaskPopup] = useState(false);
  const [currentExtendUser, setCurrentExtendUser] = useState(null);
  const [extendStartDate, setExtendStartDate] = useState('');
  const [extendEndDate, setExtendEndDate] = useState('');
  const [extendUserTasks, setExtendUserTasks] = useState([]);
  const [extendLoading, setExtendLoading] = useState(false);
  const [newStartDates, setNewStartDates] = useState({});
  
  // Individual Task Assignment State
  const [userTasks, setUserTasks] = useState([]);
  const [taskAssignments, setTaskAssignments] = useState({});
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);
  const [fetchError, setFetchError] = useState('');

  // Machine Management State
  const [showMachineModal, setShowMachineModal] = useState(false);
  const [machineForm, setMachineForm] = useState({
    machine_name: '',
    part_name: [],
    machine_area: '',
    machine_department: '',
    machine_division: ''
  });

  const [isEditingMachine, setIsEditingMachine] = useState(false);
  const [currentMachineId, setCurrentMachineId] = useState(null);
  const [partInput, setPartInput] = useState('');
  
  // Permission State
  const [systemAccess, setSystemAccess] = useState([]);
  const [pageAccess, setPageAccess] = useState([]);

  const togglePermission = (type, permission) => {
    if (type === 'system') {
      setSystemAccess(prev =>
        prev.includes(permission)
          ? prev.filter(p => p !== permission)
          : [...prev, permission]
      );
    }
    if (type === 'page_view') {
      // Toggle view; removing view also removes modify
      const viewKey = `${permission}_view`;
      const modifyKey = `${permission}_modify`;
      setPageAccess(prev =>
        prev.includes(viewKey)
          ? prev.filter(p => p !== viewKey && p !== modifyKey)
          : [...prev, viewKey]
      );
    }
    if (type === 'page_modify') {
      // Selecting modify automatically implies view
      const viewKey = `${permission}_view`;
      const modifyKey = `${permission}_modify`;
      setPageAccess(prev => {
        if (prev.includes(modifyKey)) {
          // Deselect modify (keep view)
          return prev.filter(p => p !== modifyKey);
        } else {
          // Select modify + ensure view is also present
          const withView = prev.includes(viewKey) ? prev : [...prev, viewKey];
          return [...withView, modifyKey];
        }
      });
    }
  };

  // Derived: does user have modify access to Settings (for gating UI buttons)
  const canModifySettings = hasModifyAccess('settings');

  
  
  const { userData, department, departmentsOnly, givenBy, machines, loading, error } = useSelector((state) => state.setting);
  const { doerName } = useSelector((state) => state.assignTask);
  // Get current logged-in user to check for super_admin role
  const { userData: currentUser } = useSelector((state) => state.login);
  // Fallback to localStorage when Redux resets after page reload
  const currentUserRole = (currentUser && !Array.isArray(currentUser))
    ? currentUser.role
    : localStorage.getItem('role');
  const dispatch = useDispatch();
  const canManageSettings = hasPageAccess('settings_admin');

  const togglePasswordVisibility = (userId) => {
  setShowPasswords(prev => ({
    ...prev,
    [userId]: !prev[userId]
  }));
};

const fetchDeviceLogsAndUpdateStatus = async () => {
  return
  try {
    setIsRefreshing(true);
    // const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/logs/device-sync`);
    const data = await response.json();
    console.log(data.message);
    dispatch(userDetails());
  } catch (error) {
    console.error('Error syncing device logs:', error);
  } finally {
    setIsRefreshing(false);
  }
};



useEffect(() => {
  const intervalId = setInterval(fetchDeviceLogsAndUpdateStatus, 10000);

  return () => clearInterval(intervalId);
}, []);

  // Add real-time subscription
  // useEffect(() => {
  //   // Subscribe to users table changes
  //   const subscription = supabase
  //     .channel('users-changes')
  //     .on(
  //       'postgres_changes',
  //       {
  //         event: '*',
  //         schema: 'public',
  //         table: 'users'
  //       },
  //       (payload) => {
  //         // console.log('Real-time update received:', payload);
  //         // Refresh user data when any change occurs
  //         dispatch(userDetails());
  //       }
  //     )
  //     .subscribe();

  //   // Set up interval to check device logs every 30 seconds
  //   const intervalId = setInterval(fetchDeviceLogsAndUpdateStatus, 30000);

  //   // Initial fetch of device logs
  //   fetchDeviceLogsAndUpdateStatus();

  //   return () => {
  //     subscription.unsubscribe();
  //     clearInterval(intervalId);
  //   };
  // }, [dispatch]);

  // Add this function to debug a specific user
const debugUserStatus = async () => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_name', 'Hem Kumar Jagat');
    
    if (error) {
      console.error('Error fetching user:', error);
      return;
    }
    
    if (users && users.length > 0) {
      const user = users[0];
      // console.log('🔍 DEBUG - Hem Kumar Jagat:', {
      //   id: user.id,
      //   username: user.user_name,
      //   employee_id: user.employee_id,
      //   current_status: user.status,
      //   last_punch_time: user.last_punch_time,
      //   last_punch_device: user.last_punch_device
      // });
    } else {
      console.log('User "Hem Kumar Jagat" not found');
    }
  } catch (error) {
    console.error('Error in debug:', error);
  }
};

// Call this to check the current status
// debugUserStatus();

  // Add manual refresh button handler
  // const handleManualRefresh = () => {
  //   fetchDeviceLogsAndUpdateStatus();
  // };

  // Your existing functions remain the same...
  const handleLeaveUsernameFilter = (username) => {
    setLeaveUsernameFilter(username);
  };

  const clearLeaveUsernameFilter = () => {
    setLeaveUsernameFilter('');
  };

  const handleUsernameFilterSelect = (username) => {
    setUsernameFilter(username);
    setUsernameDropdownOpen(false);
  };

  const clearUsernameFilter = () => {
    setUsernameFilter('');
    setUsernameDropdownOpen(false);
  };

  const toggleUsernameDropdown = () => {
    setUsernameDropdownOpen(!usernameDropdownOpen);
  };


  const handleAddButtonClick = () => {
    if (activeTab === 'users') {
      resetUserForm();
      setShowUserModal(true);
    } else if (activeTab === 'departments') {
      resetDeptForm();
      setShowDeptModal(true);
    } else if (activeTab === 'machines') {
      resetMachineForm();
      setShowMachineModal(true);
    }
    // No action for leave tab
  };



  const handleUserSelection = (userId, isSelected) => {
    if (isSelected) {
      // Open popup form when checkbox is checked
      const user = userData.find(u => u.id === userId);
      setCurrentLeaveUser(user);
      setShowLeavePopup(true);
      // Set today's date as default
      const today = new Date().toISOString().split('T')[0];
      setPopupLeaveStartDate(today);
      setPopupLeaveEndDate(today);
    } else {
      // Close popup and clear selection when unchecked
      setShowLeavePopup(false);
      setCurrentLeaveUser(null);
      setPopupLeaveStartDate('');
      setPopupLeaveEndDate('');
      setPopupDoer('');
      setPopupRemarks('');
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUsers(userData.map(user => user.id));
    } else {
      setSelectedUsers([]);
    }
  };

const handleSubmitLeave = async () => {
  if (selectedUsers.length === 0 || !leaveStartDate || !leaveEndDate) {
    alert('Please select at least one user and provide both start and end dates');
    return;
  }

  // Validate date range
  const startDate = new Date(leaveStartDate);
  const endDate = new Date(leaveEndDate);
  
  if (startDate > endDate) {
    alert('End date cannot be before start date');
    return;
  }

  // Show delegation modal instead of directly submitting
  setShowDelegationModal(true);
};

// New function to handle actual delegation after doer selection
const handleConfirmDelegation = async () => {
  if (!selectedDoer) {
    alert('Please select a doer to delegate tasks to');
    return;
  }

  try {
    // Call API to transfer tasks
    const transferPromises = selectedUsers.map(async (userId) => {
      const user = userData.find(u => u.id === userId);
      if (user && user.user_name) {
        try {
          const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/leave/transfer-tasks`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: user.user_name,
              delegateTo: selectedDoer,
              startDate: leaveStartDate,
              endDate: leaveEndDate
            })
          });

          const result = await response.json();
          
          if (!response.ok) {
            console.error('Error transferring tasks:', result.message);
          } else {
            console.log(`Transferred ${result.tasksTransferred} tasks from ${user.user_name} to ${selectedDoer}`);
          }
        } catch (error) {
          console.error('Error in task transfer:', error);
        }
      }
    });

    await Promise.all(transferPromises);

    // Close modal and reset form
    setShowDelegationModal(false);
    setSelectedDoer('');
    setSelectedUsers([]);
    setLeaveStartDate('');
    setLeaveEndDate('');
    setRemark('');

    // Refresh data
    // setTimeout(() => window.location.reload(), 1000);
    alert('Tasks transferred successfully to delegation');
  } catch (error) {
    console.error('Error submitting delegation:', error);
    alert('Error submitting delegation');
  }
};

  // Fetch user tasks when dates are selected
  useEffect(() => {
    const fetchUserTasks = async () => {
      if (!currentLeaveUser || !popupLeaveStartDate || !popupLeaveEndDate) {
        setUserTasks([]);
        setTaskAssignments({});
        return;
      }

      // Validate date range
      const startDate = new Date(popupLeaveStartDate);
      const endDate = new Date(popupLeaveEndDate);
      
      if (startDate > endDate) {
        setFetchError('End date cannot be before start date');
        setUserTasks([]);
        return;
      }

      setIsLoadingTasks(true);
      setFetchError('');

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/leave/user-tasks?username=${encodeURIComponent(currentLeaveUser.user_name)}&startDate=${popupLeaveStartDate}&endDate=${popupLeaveEndDate}`
        );

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch tasks');
        }

        setUserTasks(result.tasks || []);
        // Initialize task assignments with empty values
        const initialAssignments = {};
        (result.tasks || []).forEach(task => {
          initialAssignments[task.task_id] = '';
        });
        setTaskAssignments(initialAssignments);
      } catch (error) {
        console.error('Error fetching tasks:', error);
        setFetchError(error.message);
        setUserTasks([]);
      } finally {
        setIsLoadingTasks(false);
      }
    };

    fetchUserTasks();
  }, [currentLeaveUser, popupLeaveStartDate, popupLeaveEndDate]);

  // Handler for individual task assignment
  const handleTaskAssignment = (taskId, assignedUser) => {
    setTaskAssignments(prev => ({
      ...prev,
      [taskId]: assignedUser
    }));
  };

  // Handler for Leave Transfer Popup submission
  const handleLeaveTransferSubmit = async () => {
    if (!popupLeaveStartDate || !popupLeaveEndDate) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate date range
    const startDate = new Date(popupLeaveStartDate);
    const endDate = new Date(popupLeaveEndDate);
    
    if (startDate > endDate) {
      alert('End date cannot be before start date');
      return;
    }

    // If there are tasks to assign individually
    if (userTasks.length > 0) {
      // Validate all tasks have assigned users
      const unassignedTasks = userTasks.filter(task => !taskAssignments[task.task_id]);
      
      // If there are unassigned tasks, ask for confirmation
      if (unassignedTasks.length > 0) {
        const confirmDelete = window.confirm(`${unassignedTasks.length} tasks are unassigned and will be PERMANENTLY DELETED from the checklist. Are you sure you want to continue?`);
        if (!confirmDelete) {
          return;
        }
      }

      // Build assignments array
      const assignments = userTasks.map(task => ({
        task_id: task.task_id,
        username: task.name,
        delegateTo: taskAssignments[task.task_id],
        task_description: task.task_description,
        department: task.department,
        given_by: task.given_by,
        frequency: task.frequency,
        task_start_date: task.task_start_date,
        planned_date: task.planned_date
      }));

      try {
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/leave/assign-individual-tasks`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignments })
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || 'Failed to assign tasks');
        }

        // Close popup and reset form
        setShowLeavePopup(false);
        setCurrentLeaveUser(null);
        setPopupLeaveStartDate('');
        setPopupLeaveEndDate('');
        setPopupDoer('');
        setPopupRemarks('');
        setUserTasks([]);
        setTaskAssignments({});
        setSelectedUsers([]);

        alert(`Successfully transferred ${result.tasksTransferred || 0} tasks with individual assignments!`);
        
        // Refresh data
        // setTimeout(() => window.location.reload(), 1000);
      } catch (error) {
        console.error('Error assigning tasks:', error);
        alert(`Error: ${error.message}`);
      }
    } else {
      alert('No tasks found in the selected date range');
    }
  };

  // EXTEND TASK HANDLERS
  
  const handleExtendUserSelection = (userId, isSelected) => {
    if (isSelected) {
      // Open popup form when checkbox is checked
      const user = userData.find(u => u.id === userId);
      setCurrentExtendUser(user);
      setShowExtendTaskPopup(true);
      // Set today's date as default
      const today = new Date().toISOString().split('T')[0];
      setExtendStartDate(today);
      setExtendEndDate(today);
    } else {
      // Close popup and clear selection when unchecked
      setShowExtendTaskPopup(false);
      setCurrentExtendUser(null);
      setExtendStartDate('');
      setExtendEndDate('');
      setExtendUserTasks([]);
      setNewStartDates({});
      setSelectedUsers(prev => prev.filter(id => id !== userId));
    }
  };

  // Fetch tasks for Extend Task Popup
  useEffect(() => {
    const fetchExtendTasks = async () => {
      if (!currentExtendUser || !extendStartDate || !extendEndDate) {
        setExtendUserTasks([]);
        return;
      }

      // Validate date range
      const startDate = new Date(extendStartDate);
      const endDate = new Date(extendEndDate);
      
      if (startDate > endDate) {
        // Just return, don't show error yet or show in UI
        setExtendUserTasks([]);
        return;
      }

      setExtendLoading(true);

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/leave/user-tasks?username=${encodeURIComponent(currentExtendUser.user_name)}&startDate=${extendStartDate}&endDate=${extendEndDate}`
        );

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.message || 'Failed to fetch tasks');
        }

        setExtendUserTasks(result.tasks || []);
      } catch (error) {
        console.error('Error fetching tasks for extend:', error);
        setExtendUserTasks([]);
      } finally {
        setExtendLoading(false);
      }
    };

    fetchExtendTasks();
  }, [currentExtendUser, extendStartDate, extendEndDate]);

  const handleUpdateTaskDate = async (taskId) => {
    const newDate = newStartDates[taskId];
    if (!newDate) {
      alert('Please select a new start date');
      return;
    }

    try {
      // Use the direct import extendTaskApi since it might not be in the slice
      // Importing manually at top of file or use fetch directly if needed
      // Assuming extendTaskApi calls the backend endpoint we created
      const result = await extendTaskApi(taskId, newDate);
      
      if (result && result.success) {
        alert('Task extended successfully!');
        // Refresh the list
        const updatedTasks = extendUserTasks.map(task => 
          task.task_id === taskId 
            ? { ...task, task_start_date: newDate, planned_date: newDate } // Update local state to reflect change
            : task
        );
        setExtendUserTasks(updatedTasks);
        // Clear the input
        setNewStartDates(prev => {
          const newState = { ...prev };
          delete newState[taskId];
          return newState;
        });
      } else {
        alert('Failed to extend task: ' + (result?.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error updating task date:', error);
      alert('Error updating task date');
    }
  };

  // Add to your existing handleTabChange function
  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'users') {
      dispatch(userDetails());
      dispatch(departmentDetails()); // Ensure departments are fetched
    } else if (tab === 'departments') {
      dispatch(departmentDetails());
    } else if (tab === 'leave') {
      dispatch(userDetails());
      dispatch(uniqueDoerNameData()); // Fetch all doer names for delegation
    } else if (tab === 'extendTask') {
      dispatch(userDetails());
    } else if (tab === 'machines') {
      dispatch(machineDetails());
    }
  };

  // Add to your handleAddButtonClick function

  // Handle Add Given By submission
  const handleAddGivenBy = async (e) => {
    e.preventDefault();
    if (!givenByInput.trim()) {
      alert('Please enter a Given By value');
      return;
    }
    try {
      const newEntry = { givenBy: givenByInput.trim() };
      await dispatch(createDepartment(newEntry)).unwrap();
      setGivenByInput('');
      setShowGivenByModal(false);
      dispatch(departmentDetails());
      // setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error adding given by:', error);
    }
  };





  // Sample data
  // const [users, setUsers] = useState([
  //   {
  //     id: '1',
  //     username: 'john_doe',
  //     email: 'john@example.com',
  //     password: '********',
  //     department: 'IT',
  //     givenBy: 'admin',
  //     phone: '1234567890',
  //     role: 'user',
  //     status: 'active'
  //   },
  //   {
  //     id: '2',
  //     username: 'jane_smith',
  //     email: 'jane@example.com',
  //     password: '********',
  //     department: 'HR',
  //     givenBy: 'admin',
  //     phone: '0987654321',
  //     role: 'admin',
  //     status: 'active'
  //   }
  // ]);

  // const [departments, setDepartments] = useState([
  //   { id: '1', name: 'IT', givenBy: 'super_admin' },
  //   { id: '2', name: 'HR', givenBy: 'super_admin' },
  //   { id: '3', name: 'Finance', givenBy: 'admin' }
  // ]);

  // Form states
const [userForm, setUserForm] = useState({
  username: '',
  email: '',
  password: '',
  phone: '',
  unit: '',
  division: '',
  department: '',
  givenBy: '',
  role: 'user',
  status: 'active'
});

  const [deptForm, setDeptForm] = useState({
    name: '',
    givenBy: ''
  });

  // Multi-row department form state for Create New Department
  const [deptRows, setDeptRows] = useState([
    { unit: '', division: '', department: '' }
  ]);

  useEffect(() => {
    dispatch(userDetails());
    dispatch(departmentDetails()); // Fetch departments on mount
  }, [dispatch])

  // In your handleAddUser function:
  // Modified handleAddUser
const handleAddUser = async (e) => {
  e.preventDefault();
  const newUser = {
    ...userForm,
    user_access: userForm.department, // Department name for user access
    department: userForm.department,
    unit: userForm.unit,
    division: userForm.division,
    system_access: systemAccess,
    page_access: pageAccess
  };

  try {
    await dispatch(createUser(newUser)).unwrap();
    resetUserForm();
    setShowUserModal(false);
    // setTimeout(() => window.location.reload(), 1000);
  } catch (error) {
    console.error('Error adding user:', error);
  }
};

  // Modified handleUpdateUser
const handleUpdateUser = async (e) => {
  e.preventDefault();
  
  // Prepare updated user data
  const updatedUser = {
    user_name: userForm.username,
    email_id: userForm.email,
    number: userForm.phone,
    role: userForm.role,
    status: userForm.status,
    user_access: userForm.department, // Department name for user access
    department: userForm.department,
    unit: userForm.unit,
    division: userForm.division,
    system_access: systemAccess,
    page_access: pageAccess
  };

  console.log('DEBUG: handleUpdateUser payload:', { id: currentUserId, updatedUser });



  // Only include password if it's not empty
  if (userForm.password.trim() !== '') {
    updatedUser.password = userForm.password;
  }

  try {
    const result = await dispatch(updateUser({ id: currentUserId, updatedUser })).unwrap();
    
    // If the updated user is the currently logged-in user, refresh localStorage
    const currentLoggedInUsername = localStorage.getItem('user-name');
    if (result && result.user_name === currentLoggedInUsername) {
      console.log('🔄 Updating local permissions for current user');
      localStorage.setItem('role', (result.role || "").toLowerCase());
      localStorage.setItem('user_access', result.user_access || "");
      localStorage.setItem('system_access', JSON.stringify(result.system_access || []));
      localStorage.setItem('page_access', JSON.stringify(result.page_access || []));
    }

    resetUserForm();
    setShowUserModal(false);
    // setTimeout(() => window.location.reload(), 1000);
  } catch (error) {
    console.error('Error updating user:', error);
  }
};

  // Modified handleAddDepartment - now handles multiple rows
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    
    // Filter out empty rows (all 3 fields empty)
    const validRows = deptRows.filter(row => 
      row.unit.trim() !== '' || row.division.trim() !== '' || row.department.trim() !== ''
    );

    if (validRows.length === 0) {
      alert('Please fill in at least one row');
      return;
    }

    try {
      // Submit each row as a separate department entry
      for (const row of validRows) {
        const newDept = {
          name: row.department,
          unit: row.unit,
          division: row.division,
          // givenBy: '' // Given By is commented out for now
        };
        await dispatch(createDepartment(newDept)).unwrap();
      }
      resetDeptForm();
      setShowDeptModal(false);
      // setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error adding department:', error);
    }
  };

  // Modified handleUpdateDepartment
  const handleUpdateDepartment = async (e) => {
    e.preventDefault();
    const updatedDept = {
      department: deptForm.name,
      given_by: deptForm.givenBy
    };

    try {
      await dispatch(updateDepartment({ id: currentDeptId, updatedDept })).unwrap();
      resetDeptForm();
      setShowDeptModal(false);
      // setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error updating department:', error);
    }
  };

  // Modified handleDeleteUser
  const handleDeleteUser = async (userId) => {
    try {
      await dispatch(deleteUser(userId)).unwrap();
      // setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };


  // User form handlers
const handleUserInputChange = (e) => {
  const { name, value } = e.target;
  setUserForm(prev => ({ ...prev, [name]: value }));
};

// Cascading dropdown handlers for Unit → Division → Department
const handleUnitChange = (value) => {
  setUserForm(prev => ({ ...prev, unit: value, division: '', department: '' }));
};

const handleDivisionChange = (value) => {
  setUserForm(prev => ({ ...prev, division: value, department: '' }));
};

const handleDepartmentChange = (value) => {
  setUserForm(prev => ({ ...prev, department: value }));
};

// Get unique units from department data
const availableUnits = React.useMemo(() => {
  if (department && department.length > 0) {
    return [...new Set(department.map(dept => dept.unit).filter(u => u && u.trim() !== ''))].sort();
  }
  return [];
}, [department]);

// Get divisions filtered by selected unit
const availableDivisions = React.useMemo(() => {
  if (department && department.length > 0 && userForm.unit) {
    return [...new Set(
      department
        .filter(dept => dept.unit === userForm.unit)
        .map(dept => dept.division)
        .filter(d => d && d.trim() !== '')
    )].sort();
  }
  return [];
}, [department, userForm.unit]);

// Get departments filtered by selected unit and division
const availableDepartments = React.useMemo(() => {
  if (department && department.length > 0) {
    let filtered = department;
    if (userForm.unit) {
      filtered = filtered.filter(dept => dept.unit === userForm.unit);
    }
    if (userForm.division) {
      filtered = filtered.filter(dept => dept.division === userForm.division);
    }
    return [...new Set(filtered.map(dept => dept.department).filter(d => d && d.trim() !== ''))].sort();
  }
  return [];
}, [department, userForm.unit, userForm.division]);

useEffect(() => {
  const handleClickOutside = (event) => {
    if (showDeptDropdown && !event.target.closest('.relative')) {
      setShowDeptDropdown(false);
    }
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, [showDeptDropdown]);

  // const handleAddUser = (e) => {
  //   e.preventDefault();
  //   const newUser = {
  //     ...userForm,
  //     id: (users.length + 1).toString(),
  //     password: '********'
  //   };
  //   setUsers([...users, newUser]);
  //   resetUserForm();
  //   setShowUserModal(false);
  // };
const handleEditUser = (userId) => {
  const user = userData.find(u => u.id === userId);
  console.log('DEBUG: handleEditUser source user:', user);
  const deptName = (user?.user_access || user?.department)?.split(',')[0]?.trim();
  const deptRecord = department?.find(d => d.department?.toLowerCase() === deptName?.toLowerCase());
  
  setUserForm({
    username: user.user_name || '',
    email: user.email_id || '',
    password: user.password || '',
    phone: user.number || '',
    unit: user?.unit || deptRecord?.unit || '',
    division: user?.division || deptRecord?.division || '',
    department: user?.department || user?.user_access || '',
    role: user.role || 'user',
    status: user.status || 'active'
  });
  
  // Load existing permissions
  try {
    const sAccess = typeof user.system_access === 'string' ? JSON.parse(user.system_access) : (user.system_access || []);
    const pAccess = typeof user.page_access === 'string' ? JSON.parse(user.page_access) : (user.page_access || []);
    setSystemAccess(sAccess);
    setPageAccess(pAccess);
  } catch (e) {
    console.error("Error parsing user permissions:", e);
    setSystemAccess([]);
    setPageAccess([]);
  }

  setCurrentUserId(userId);
  setIsEditing(true);
  setShowUserModal(true);
};

  const handleEditDepartment = (deptId) => {
    const dept = department.find(d => d.id === deptId);
    setDeptForm({
      name: dept.department,  // Match your API response field names
      givenBy: dept.given_by,
      unit: dept.unit || '',
      division: dept.division || ''
    });
    setCurrentDeptId(deptId);
    setShowDeptModal(true);
  };
  // const handleUpdateUser = (e) => {
  //   e.preventDefault();
  //   setUsers(users.map(user => 
  //     user.id === currentUserId ? { ...userForm, id: currentUserId } : user
  //   ));
  //   resetUserForm();
  //   setShowUserModal(false);
  // };



const resetUserForm = () => {
  setUserForm({
    username: '',
    email: '',
    password: '',
    phone: '',
    unit: '',
    division: '',
    department: '',
    givenBy: '',
    role: 'user',
    status: 'active'
  });
  setSystemAccess([]);
  setPageAccess([]);
  setIsEditing(false);

  setCurrentUserId(null);
};

  // Department form handlers
  const handleDeptInputChange = (e) => {
    const { name, value } = e.target;
    setDeptForm(prev => ({ ...prev, [name]: value }));
  };

  // Multi-row department form handlers
  const handleDeptRowChange = (index, field, value) => {
    setDeptRows(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const addDeptRow = () => {
    setDeptRows(prev => [...prev, { unit: '', division: '', department: '' }]);
  };

  const removeDeptRow = (index) => {
    if (deptRows.length === 1) return; // Keep at least one row
    setDeptRows(prev => prev.filter((_, i) => i !== index));
  };

  // const handleAddDepartment = (e) => {
  //   e.preventDefault();
  //   const newDept = {
  //     ...deptForm,
  //     id: (departments.length + 1).toString()
  //   };
  //   setDepartments([...departments, newDept]);
  //   resetDeptForm();
  //   setShowDeptModal(false);
  // };


  //   const handleUpdateDepartment = (e) => {
  //     e.preventDefault();
  //     setDepartments(departments.map(dept => 
  //       dept.id === currentDeptId ? { ...deptForm, id: currentDeptId } : dept
  //     ));
  //     resetDeptForm();
  //     setShowDeptModal(false);
  //   };


  // const handleDeleteDepartment = (deptId) => {
  //   setDepartments(department.filter(dept => dept.id !== deptId));
  // };

  const resetDeptForm = () => {
    setDeptForm({
      name: '',
      givenBy: '',
      unit: '',
      division: ''
    });
    setDeptRows([{ unit: '', division: '', department: '' }]);
    setCurrentDeptId(null);
  };

  // Machine form handlers
  const handleMachineInputChange = (e) => {
    const { name, value } = e.target;
    setMachineForm(prev => ({ ...prev, [name]: value }));
  };



  const handleAddMachine = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createMachineThunk(machineForm)).unwrap();
      resetMachineForm();
      setShowMachineModal(false);
      dispatch(machineDetails());
    } catch (error) {
      console.error('Error adding machine:', error);
    }
  };

  const handleEditMachine = (machineId) => {
    const machine = machines.find(m => m.id === machineId);
    if (machine) {
      setMachineForm({
        machine_name: machine.machine_name || '',
        part_name: Array.isArray(machine.part_name) ? machine.part_name : (machine.part_name ? [machine.part_name] : []),
        machine_area: machine.machine_area || '',
        machine_department: machine.machine_department || '',
        machine_division: machine.machine_division || ''
      });
      setCurrentMachineId(machineId);
      setIsEditingMachine(true);
      setShowMachineModal(true);
    }
  };

  const handleUpdateMachine = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateMachineThunk({ id: currentMachineId, updatedMachine: machineForm })).unwrap();
      resetMachineForm();
      setShowMachineModal(false);
      dispatch(machineDetails());
    } catch (error) {
      console.error('Error updating machine:', error);
    }
  };

  const handleDeleteMachine = async (machineId) => {
    if (!window.confirm('Are you sure you want to delete this machine?')) return;
    try {
      await dispatch(deleteMachineThunk(machineId)).unwrap();
      dispatch(machineDetails());
    } catch (error) {
      console.error('Error deleting machine:', error);
    }
  };

  const resetMachineForm = () => {
    setMachineForm({
      machine_name: '',
      part_name: [],
      machine_area: '',
      machine_department: '',
      machine_division: ''
    });
    setIsEditingMachine(false);
    setCurrentMachineId(null);
    setShowMachineModal(false);
  };

  // Add this filtered users calculation for leave tab
  const filteredLeaveUsers = userData?.filter(user => {
    const matchesSearch = !leaveUsernameFilter || user.user_name.toLowerCase().includes(leaveUsernameFilter.toLowerCase());
    
    // Admin department filtering
    const userRole = localStorage.getItem('role');
    const userAccess = localStorage.getItem('user_access') || '';
    const userDepartments = userAccess ? userAccess.split(',').map(d => d.trim().toLowerCase()) : [];
    
    if (userRole === 'admin' && userDepartments.length > 0) {
      const uDept = (user.user_access || user.department || '').split(',')[0].trim().toLowerCase();
      return matchesSearch && userDepartments.includes(uDept);
    }
    
    return matchesSearch;
  });


  const getStatusColor = (status) => {
    return status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'bg-blue-100 text-blue-800';
      case 'manager': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <AdminLayout>
      <div className="space-y-2">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
          {/* Top Row: Title and Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
            <div>
              <h1 className="text-lg font-bold text-gray-800">User Management System</h1>
              <p className="text-xs text-gray-500">Manage users, departments, and leave</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={fetchDeviceLogsAndUpdateStatus}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                <span className="hidden sm:inline">{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              
              {(activeTab === 'users' || activeTab === 'departments' || activeTab === 'machines') && canManageSettings && canModifySettings && (
                <>
                  <button
                    onClick={handleAddButtonClick}
                    className="flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-purple-600 text-white hover:bg-purple-700"
                  >
                    <Plus size={16} />
                    <span>{activeTab === 'users' ? 'Add User' : activeTab === 'machines' ? 'Add Machine' : 'Add Department'}</span>
                  </button>
                  {activeTab === 'departments' && (
                    <button
                      onClick={() => { setGivenByInput(''); setShowGivenByModal(true); }}
                      className="flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-purple-600 text-white hover:bg-indigo-700"
                    >
                      <Plus size={16} />
                      <span>Add Given By</span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* Bottom Row: Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'users' 
                  ? 'border-purple-600 text-purple-600 bg-purple-50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => {
                handleTabChange('users');
                dispatch(userDetails());
              }}
            >
              <User size={18} />
              Users
            </button>
            <button
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'departments' 
                  ? 'border-purple-600 text-purple-600 bg-purple-50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => {
                handleTabChange('departments');
                dispatch(departmentOnlyDetails());
                dispatch(givenByDetails());
              }}
            >
              <Building size={18} />
              Departments
            </button>
            <button
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'leave' 
                  ? 'border-purple-600 text-purple-600 bg-purple-50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => {
                handleTabChange('leave');
                dispatch(userDetails());
              }}
            >
              <Calendar size={18} />
              Leave
            </button>
            <button
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'extendTask' 
                  ? 'border-purple-600 text-purple-600 bg-purple-50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => {
                handleTabChange('extendTask');
              }}
            >
              <Calendar size={18} />
              Extend Task
            </button>
            <button
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'machines' 
                  ? 'border-purple-600 text-purple-600 bg-purple-50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
              onClick={() => {
                handleTabChange('machines');
              }}
            >
              <Settings size={18} />
              Machines
            </button>
          </div>
        </div>
{/* <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <h3 className="text-sm font-medium text-yellow-800">Debug Info</h3>
        <p className="text-xs text-yellow-700">
          Total Users: {userData?.length || 0} | 
          Active: {userData?.filter(u => u.status === 'active').length || 0} | 
          Inactive: {userData?.filter(u => u.status === 'inactive').length || 0}
        </p>
        <p className="text-xs text-yellow-700">
          Employee IDs in DB: {userData?.map(u => u.employee_id).filter(Boolean).join(', ') || 'None'}
        </p>
      </div> */}
        

        {/* Leave Management Tab */}
        {activeTab === 'leave' && (
          <div className="bg-white shadow rounded-lg overflow-hidden border border-purple-200">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple px-6 py-4 border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-purple-700">Leave Management</h2>

              <div className="flex items-center gap-4">
                {/* Username Search Filter for Leave Tab */}
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        list="leaveUsernameOptions"
                        placeholder="Filter by username..."
                        value={leaveUsernameFilter}
                        onChange={(e) => setLeaveUsernameFilter(e.target.value)}
                        className="w-48 pl-10 pr-8 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                      <datalist id="leaveUsernameOptions">
                        {userData?.map(user => (
                          <option key={user.id} value={user.user_name} />
                        ))}
                      </datalist>

                      {/* Clear button for input */}
                      {leaveUsernameFilter && (
                        <button
                          onClick={clearLeaveUsernameFilter}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                {/* Submit Button */}
                {/* Submit Button */}
                {canManageSettings && (
                <button
                  onClick={handleSubmitLeave}
                  className="rounded-md bg-green-600 py-2 px-4 text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  Submit Leave
                </button>
                )}
              </div>
            </div>


            {/* Users List for Leave Selection */}
<div className="h-[calc(100vh-400px)] overflow-auto">
  {/* Mobile Card View */}
  <div className="sm:hidden space-y-3 p-3">
    {filteredLeaveUsers?.map((user) => (
      <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedUsers.includes(user.id)}
              onChange={(e) => handleUserSelection(user.id, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <p className="text-sm font-medium text-gray-900">{user.user_name}</p>
          </div>
          {canManageSettings && (
            <button
              onClick={() => {
                if(window.confirm(`Are you sure you want to clear leave for ${user.user_name}?`)) {
                  dispatch(updateUser({
                    id: user.id,
                    updatedUser: { leave_date: null, leave_end_date: null, remark: null }
                  })).then(() => {
                    setTimeout(() => window.location.reload(), 500);
                  });
                }
              }}
              className="text-red-600" title="Clear Leave"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div><span className="text-gray-500">Leave Start:</span> <span className="font-medium">{user.leave_date ? new Date(user.leave_date).toLocaleDateString() : 'No leave set'}</span></div>
          <div><span className="text-gray-500">Leave End:</span> <span className="font-medium">{user.leave_end_date ? new Date(user.leave_end_date).toLocaleDateString() : 'No end date'}</span></div>
          <div className="col-span-2"><span className="text-gray-500">Remarks:</span> <span className="font-medium">{user.remark || 'No remarks'}</span></div>
        </div>
      </div>
    ))}
  </div>

  {/* Desktop Table View */}
  <table className="min-w-full divide-y divide-gray-200 hidden sm:table">
    <thead className="bg-gray-50">
      <tr>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
          <input
            type="checkbox"
            onChange={handleSelectAll}
            checked={selectedUsers.length === filteredLeaveUsers?.length && filteredLeaveUsers?.length > 0}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
        </th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Leave Start Date</th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Leave End Date</th>
        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Remarks</th>
        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
      </tr>
    </thead>
    <tbody className="bg-white divide-y divide-gray-200">
      {filteredLeaveUsers?.map((user) => (
        <tr key={user.id} className="hover:bg-gray-50">
          <td className="px-6 py-4 whitespace-nowrap">
            <input
              type="checkbox"
              checked={selectedUsers.includes(user.id)}
              onChange={(e) => handleUserSelection(user.id, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm font-medium text-gray-900">{user.user_name}</div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-900">
              {user.leave_date ? new Date(user.leave_date).toLocaleDateString() : 'No leave set'}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-900">
              {user.leave_end_date ? new Date(user.leave_end_date).toLocaleDateString() : 'No end date set'}
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            <div className="text-sm text-gray-900">{user.remark || 'No remarks'}</div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
            {canManageSettings && (
              <button
                onClick={() => {
                  if(window.confirm(`Are you sure you want to clear leave for ${user.user_name}?`)) {
                     dispatch(updateUser({
                      id: user.id,
                      updatedUser: {
                        leave_date: null,
                        leave_end_date: null,
                        remark: null
                      }
                    })).then(() => {
                      setTimeout(() => window.location.reload(), 500);
                    });
                  }
                }}
                className="text-red-600 hover:text-red-900"
                title="Clear Leave (Does NOT delete user)"
              >
                <Trash2 size={18} />
              </button>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>
          </div>
        )}


        {/* Users Tab */}
        {/* Users Tab */}
{activeTab === 'users' && (
  <div className="bg-white shadow rounded-lg overflow-hidden border border-purple-200">
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple px-6 py-4 border-gray-200 flex justify-between items-center">
      <h2 className="text-lg font-medium text-purple-700">User List</h2>

      {/* Username Filter */}
      <div className="relative">
        <div className="flex items-center gap-2">
          {/* Input with datalist for autocomplete */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              list="usernameOptions"
              placeholder="Filter by username..."
              value={usernameFilter}
              onChange={(e) => setUsernameFilter(e.target.value)}
              className="w-48 pl-10 pr-8 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
            />
            <datalist id="usernameOptions">
              {userData?.map((user, idx) => (
                <option key={`${user.id}-${idx}`} value={user.user_name} />
              ))}
            </datalist>

            {/* Clear button for input */}
            {usernameFilter && (
              <button
                onClick={clearUsernameFilter}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Dropdown button */}
          <button
            onClick={toggleUsernameDropdown}
            className="flex items-center gap-1 px-3 py-2 border border-purple-200 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50"
          >
            <ChevronDown size={16} className={`transition-transform ${usernameDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Dropdown menu */}
        {usernameDropdownOpen && (
          <div className="absolute z-50 mt-1 w-56 rounded-md bg-white shadow-lg border border-gray-200 max-h-60 overflow-auto top-full right-0">
            <div className="py-1">
              <button
                onClick={clearUsernameFilter}
                className={`block w-full text-left px-4 py-2 text-sm ${!usernameFilter ? 'bg-purple-100 text-purple-900' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                All Usernames
              </button>
              {userData?.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleUsernameFilterSelect(user.user_name)}
                  className={`block w-full text-left px-4 py-2 text-sm ${usernameFilter === user.user_name ? 'bg-purple-100 text-purple-900' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  {user.user_name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>

    <div className="h-[calc(100vh-275px)] overflow-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
      {/* Mobile Card View */}
      <div className="sm:hidden space-y-3 p-3">
        {(() => {
          const userRole = localStorage.getItem('role');
          const userAccess = localStorage.getItem('user_access') || '';
          const userDepartments = userAccess ? userAccess.split(',').map(d => d.trim().toLowerCase()) : [];
          
          let displayedUsers = userData;
          if (userRole === 'admin' && userDepartments.length > 0) {
            displayedUsers = userData?.filter(u => {
              const uDept = (u.user_access || u.department || '').split(',')[0].trim().toLowerCase();
              return userDepartments.includes(uDept);
            });
          }
          
          return displayedUsers
            ?.filter(user => !usernameFilter || user.user_name.toLowerCase().includes(usernameFilter.toLowerCase()))
            .map((user, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user?.status)}`}>
                    {user?.status}
                  </span>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user?.role)}`}>
                    {user?.role}
                  </span>
                </div>
                <div className="flex space-x-2">
                  {canManageSettings && (
                    <>
                      <button onClick={() => handleEditUser(user?.id)} className="text-blue-600" title="Edit">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDeleteUser(user?.id)} className="text-red-600" title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <p className="text-sm font-medium text-gray-900 mb-2">{user?.user_name}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><span className="text-gray-500">Email:</span> <span className="font-medium">{user?.email_id || "—"}</span></div>
                <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{user?.number || "—"}</span></div>
                <div><span className="text-gray-500">Dept:</span> <span className="font-medium">{user?.user_access || user?.department || "N/A"}</span></div>
                <div><span className="text-gray-500">Unit:</span> <span className="font-medium">{(() => {
                  if (user?.unit) return user.unit;
                  const deptName = (user?.user_access || user?.department)?.split(',')[0]?.trim();
                  const match = department?.find(d => d.department?.toLowerCase() === deptName?.toLowerCase());
                  return match?.unit || "—";
                })()}</span></div>
                <div><span className="text-gray-500">Division:</span> <span className="font-medium">{(() => {
                  if (user?.division) return user.division;
                  const deptName = (user?.user_access || user?.department)?.split(',')[0]?.trim();
                  const match = department?.find(d => d.department?.toLowerCase() === deptName?.toLowerCase());
                  return match?.division || "—";
                })()}</span></div>
              </div>
            </div>
          ));
        })()}
      </div>

      {/* Desktop Table View */}
      <table className="min-w-full divide-y divide-gray-200 hidden sm:table">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Username
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Password
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Phone No.
            </th>

            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Department
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Unit
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Division
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Role
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
             {(() => {
                const userRole = localStorage.getItem('role');
                const userAccess = localStorage.getItem('user_access') || '';
                const userDepartments = userAccess ? userAccess.split(',').map(d => d.trim().toLowerCase()) : [];
                
                let displayedUsers = userData;
                if (userRole === 'admin' && userDepartments.length > 0) {
                  displayedUsers = userData?.filter(u => {
                    const uDept = (u.user_access || u.department || '').split(',')[0].trim().toLowerCase();
                    return userDepartments.includes(uDept);
                  });
                }
                
                return displayedUsers
                  ?.filter(user => !usernameFilter || user.user_name.toLowerCase().includes(usernameFilter.toLowerCase()))
                  .map((user, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="text-sm font-medium text-gray-900">{user?.user_name}</div>
                  </div>
                </td>
               <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono">
                        {showPasswords[user.id] ? user?.password : '••••••••'}
                      </span>
                      <button
                        onClick={() => togglePasswordVisibility(user.id)}
                        className="text-gray-500 hover:text-blue-600 text-xs"
                        title={showPasswords[user.id] ? "Hide Password" : "Show Password"}
                      >
                        {showPasswords[user.id] ? '👁️‍🗨️' : '👁️'}
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(user?.password || '');
                          alert('Password copied to clipboard!');
                        }}
                        className="text-blue-600 hover:text-blue-800 text-xs bg-blue-50 px-2 py-1 rounded"
                        title="Copy Password"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user?.email_id}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user?.number}</div>
                </td>

                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{user?.user_access || user?.department || 'N/A'}</div>
                </td>

                {/* Unit Cell */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{(() => {
                    if (user?.unit) return user.unit;
                    const deptName = (user?.user_access || user?.department)?.split(',')[0]?.trim();
                    const match = department?.find(d => d.department?.toLowerCase() === deptName?.toLowerCase());
                    return match?.unit || '—';
                  })()}</div>
                </td>

                {/* Division Cell */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{(() => {
                    if (user?.division) return user.division;
                    const deptName = (user?.user_access || user?.department)?.split(',')[0]?.trim();
                    const match = department?.find(d => d.department?.toLowerCase() === deptName?.toLowerCase());
                    return match?.division || '—';
                  })()}</div>
                </td>
                
                {/* Status Cell */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(user?.status || 'active')}`}>
                      {user?.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Active'}
                    </span>
                    {(user?.status === 'active' || !user?.status) && (
                      <span className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Live Status"></span>
                    )}
                  </div>
                </td>
                
                {/* Role Cell */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleColor(user?.role)}`}>
                    {user?.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {canManageSettings && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditUser(user?.id)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit User"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user?.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete User"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ));
        })()}
        </tbody>
      </table>
    </div>
  </div>
)}

        {/* Departments Tab */}
       {/* Departments Tab */}
{/* Departments Tab */}
{activeTab === 'departments' && (
  <div className="bg-white shadow rounded-lg overflow-hidden border border-purple-200">
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple px-4 sm:px-6 py-4 border-gray-200">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h2 className="text-lg font-medium text-purple-700">Department Management</h2>
        
        {/* Sub-tabs for Departments and Given By */}
        <div className="flex border border-purple-200 rounded-md overflow-hidden w-full sm:w-auto">
          <button
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm font-medium ${activeDeptSubTab === 'departments' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
            onClick={() => setActiveDeptSubTab('departments')}
          >
            Departments
          </button>
          <button
            className={`flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm font-medium ${activeDeptSubTab === 'givenBy' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
            onClick={() => setActiveDeptSubTab('givenBy')}
          >
            Given By
          </button>
        </div>
      </div>
    </div>

    {/* Loading State */}
    {loading && (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    )}

    {/* Error State */}
    {error && (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md m-4">
        <p className="text-red-600">Error: {error}</p>
      </div>
    )}

    {/* Departments Sub-tab - Show only department names */}
    {activeDeptSubTab === 'departments' && !loading && (
      <div className="h-[calc(100vh-275px)] overflow-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {/* Mobile Card View */}
        <div className="sm:hidden space-y-3 p-3">
          {department && department.length > 0 ? (
            Array.from(new Map(department.map(dept => [dept.department, dept])).values())
              .filter(dept => dept?.department && dept.department.trim() !== '')
              .map((dept, index) => (
                <div key={dept.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-sm font-medium text-gray-900">#{index + 1} {dept.department}</p>
                    {canManageSettings && (
                      <button onClick={() => handleEditDepartment(dept.id)} className="text-blue-600" title="Edit">
                        <Edit size={16} />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-gray-500">Unit:</span> <span className="font-medium">{dept.unit || '—'}</span></div>
                    <div><span className="text-gray-500">Division:</span> <span className="font-medium">{dept.division || '—'}</span></div>
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center py-6 text-gray-500 text-sm">No departments found</div>
          )}
        </div>

        {/* Desktop Table View */}
        <table className="min-w-full divide-y divide-gray-200 hidden sm:table">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department Name</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Division</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {department && department.length > 0 ? (
              Array.from(new Map(department.map(dept => [dept.department, dept])).values())
                .filter(dept => dept?.department && dept.department.trim() !== '')
                .map((dept, index) => (
                  <tr key={dept.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.department}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dept.unit || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{dept.division || '—'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        {canManageSettings && (
                        <button onClick={() => handleEditDepartment(dept.id)} className="text-blue-600 hover:text-blue-900">
                          <Edit size={18} />
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">No departments found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}

    {/* Given By Sub-tab - Show only given_by values */}
    {activeDeptSubTab === 'givenBy' && !loading && (
      <div className="h-[calc(100vh-275px)] overflow-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {/* Mobile Card View */}
        <div className="sm:hidden space-y-3 p-3">
          {department && department.length > 0 ? (
            Array.from(new Map(department.map(dept => [dept.given_by, dept])).values())
              .filter(dept => dept?.given_by && dept.given_by.trim() !== '')
              .map((dept, index) => (
                <div key={dept.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-medium text-gray-900">#{index + 1} {dept.given_by}</p>
                    {canManageSettings && (
                      <button onClick={() => handleEditDepartment(dept.id)} className="text-blue-600" title="Edit">
                        <Edit size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))
          ) : (
            <div className="text-center py-6 text-gray-500 text-sm">No given by data found</div>
          )}
        </div>

        {/* Desktop Table View */}
        <table className="min-w-full divide-y divide-gray-200 hidden sm:table">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Given By</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {department && department.length > 0 ? (
              Array.from(new Map(department.map(dept => [dept.given_by, dept])).values())
                .filter(dept => dept?.given_by && dept.given_by.trim() !== '')
                .map((dept, index) => (
                  <tr key={dept.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.given_by}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        {canManageSettings && (
                        <button onClick={() => handleEditDepartment(dept.id)} className="text-blue-600 hover:text-blue-900">
                          <Edit size={18} />
                        </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
            ) : (
              <tr>
                <td colSpan="3" className="px-6 py-4 text-center text-sm text-gray-500">No given by data found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}

        {/* Given By Modal */}
        {showGivenByModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-md sm:w-full sm:p-6">
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Add Given By
                    </h3>
                    <button
                      onClick={() => { setShowGivenByModal(false); setGivenByInput(''); }}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="mt-6">
                    <form onSubmit={handleAddGivenBy}>
                      <div>
                        <label htmlFor="givenByInput" className="block text-sm font-medium text-gray-700">
                          Given By
                        </label>
                        <input
                          type="text"
                          id="givenByInput"
                          value={givenByInput}
                          onChange={(e) => setGivenByInput(e.target.value)}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          placeholder="Enter Given By name"
                          autoFocus
                        />
                      </div>

                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => { setShowGivenByModal(false); setGivenByInput(''); }}
                          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Save size={18} className="mr-2" />
                          Save
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Extend Task Tab */}
        {activeTab === 'extendTask' && (
          <div className="bg-white shadow rounded-lg overflow-hidden border border-purple-200">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple px-6 py-4 border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-purple-700">Extend Task Management</h2>

              <div className="flex items-center gap-4">
                {/* Username Search Filter */}
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        list="leaveUsernameOptions"
                        placeholder="Filter by username..."
                        value={leaveUsernameFilter}
                        onChange={(e) => setLeaveUsernameFilter(e.target.value)}
                        className="w-48 pl-10 pr-8 py-2 border border-purple-200 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      />
                      <datalist id="leaveUsernameOptions">
                        {userData?.map(user => (
                          <option key={user.id} value={user.user_name} />
                        ))}
                      </datalist>

                      {leaveUsernameFilter && (
                        <button
                          onClick={clearLeaveUsernameFilter}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Users List for Extend Task Selection */}
            <div className="h-[calc(100vh-400px)] overflow-auto">
              {/* Mobile Card View */}
              <div className="sm:hidden space-y-3 p-3">
                {filteredLeaveUsers?.map((user) => (
                  <div key={user.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={(e) => handleExtendUserSelection(user.id, e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.user_name}</p>
                        <p className="text-xs text-gray-500">Pending Tasks: -</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <table className="min-w-full divide-y divide-gray-200 hidden sm:table">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Select</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending Tasks</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeaveUsers?.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={(e) => handleExtendUserSelection(user.id, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{user.user_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">-</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Machines Tab */}
        {activeTab === 'machines' && (
          <div className="bg-white shadow rounded-lg overflow-hidden border border-purple-200">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-purple px-6 py-4 border-gray-200 flex justify-between items-center">
              <h2 className="text-lg font-medium text-purple-700">Machine Management</h2>
            </div>

            {loading && (
              <div className="p-8 text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <p className="mt-2 text-gray-600">Loading...</p>
              </div>
            )}

            {!loading && (
              <div className="h-[calc(100vh-275px)] overflow-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3 p-3">
                  {machines && machines.length > 0 ? (
                    machines.map((machine, index) => (
                      <div key={machine.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-medium text-gray-900">#{index + 1} {machine.machine_name || '—'}</p>
                          {canManageSettings && (
                            <div className="flex gap-2">
                              <button onClick={() => handleEditMachine(machine.id)} className="text-blue-600" title="Edit">
                                <Edit size={16} />
                              </button>
                              <button onClick={() => handleDeleteMachine(machine.id)} className="text-red-600" title="Delete">
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-gray-500">Part:</span> <span className="font-medium">{Array.isArray(machine.part_name) ? machine.part_name.join(', ') : (machine.part_name || '—')}</span></div>
                          <div><span className="text-gray-500">Area:</span> <span className="font-medium">{machine.machine_area || '—'}</span></div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-gray-500 text-sm">No machines found</div>
                  )}
                </div>

                {/* Desktop Table View */}
                <table className="min-w-full divide-y divide-gray-200 hidden sm:table">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Machine Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Machine Area</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Division</th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {machines && machines.length > 0 ? (
                      machines.map((machine, index) => (
                        <tr key={machine.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">{machine.machine_name || '—'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{machine.machine_area || '—'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{Array.isArray(machine.part_name) ? machine.part_name.join(', ') : (machine.part_name || '—')}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{machine.machine_department || '—'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">{machine.machine_division || '—'}</span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end gap-3 text-gray-400">
                              <button 
                                onClick={() => handleEditMachine(machine.id)} 
                                className="hover:text-blue-600 transition-colors"
                              >
                                <Edit size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeleteMachine(machine.id)} 
                                className="hover:text-red-600 transition-colors"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-10 text-center text-gray-500">
                          <Settings className="mx-auto h-8 w-8 text-gray-400 mb-2 opacity-50" />
                          <p className="text-sm">No machines found.</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Machine Modal */}
        {showMachineModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className={`inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle ${isEditingMachine ? 'sm:max-w-md' : 'sm:max-w-2xl'} sm:w-full sm:p-6`}>
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {isEditingMachine ? 'Edit Machine' : 'Add New Machine'}
                    </h3>
                    <button
                      onClick={() => { setShowMachineModal(false); resetMachineForm(); }}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="mt-6">
                    <form onSubmit={isEditingMachine ? handleUpdateMachine : handleAddMachine}>
                      {isEditingMachine ? (
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="machine_name" className="block text-sm font-medium text-gray-700">Machine Name</label>
                            <input
                              type="text"
                              id="machine_name"
                              value={machineForm.machine_name}
                              onChange={(e) => setMachineForm({ ...machineForm, machine_name: e.target.value })}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="machine_area" className="block text-sm font-medium text-gray-700">Machine Area</label>
                            <input
                              type="text"
                              id="machine_area"
                              value={machineForm.machine_area}
                              onChange={(e) => setMachineForm({ ...machineForm, machine_area: e.target.value })}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="part_name_edit" className="block text-sm font-medium text-gray-700">Part Names</label>
                            <div className="mt-1 flex flex-wrap gap-1 p-2 border border-gray-300 rounded-md min-h-[42px]">
                              {machineForm.part_name.map((part, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                                  {part}
                                  <button type="button" onClick={() => setMachineForm(prev => ({ ...prev, part_name: prev.part_name.filter((_, i) => i !== idx) }))} className="text-purple-600 hover:text-purple-900">&times;</button>
                                </span>
                              ))}
                              <input
                                type="text"
                                id="part_name_edit"
                                value={partInput}
                                onChange={(e) => setPartInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if ((e.key === 'Enter' || e.key === ',') && partInput.trim()) {
                                    e.preventDefault();
                                    if (!machineForm.part_name.includes(partInput.trim())) {
                                      setMachineForm(prev => ({ ...prev, part_name: [...prev.part_name, partInput.trim()] }));
                                    }
                                    setPartInput('');
                                  }
                                }}
                                placeholder={machineForm.part_name.length === 0 ? "Type part name, press Enter" : "Add more..."}
                                className="flex-1 min-w-[120px] outline-none text-sm py-1"
                              />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Press Enter or comma to add each part</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="machine_department" className="block text-sm font-medium text-gray-700">Department</label>
                              <input
                                type="text"
                                id="machine_department"
                                name="machine_department"
                                value={machineForm.machine_department}
                                onChange={handleMachineInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label htmlFor="machine_division" className="block text-sm font-medium text-gray-700">Division</label>
                              <input
                                type="text"
                                id="machine_division"
                                name="machine_division"
                                value={machineForm.machine_division}
                                onChange={handleMachineInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div>
                            <label htmlFor="machine_name" className="block text-sm font-medium text-gray-700">Machine Name</label>
                            <input
                              type="text"
                              id="machine_name"
                              value={machineForm.machine_name}
                              onChange={(e) => setMachineForm({ ...machineForm, machine_name: e.target.value })}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="machine_area" className="block text-sm font-medium text-gray-700">Machine Area</label>
                            <input
                              type="text"
                              id="machine_area"
                              value={machineForm.machine_area}
                              onChange={(e) => setMachineForm({ ...machineForm, machine_area: e.target.value })}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label htmlFor="part_name_add" className="block text-sm font-medium text-gray-700">Part Names</label>
                            <div className="mt-1 flex flex-wrap gap-1 p-2 border border-gray-300 rounded-md min-h-[42px]">
                              {machineForm.part_name.map((part, idx) => (
                                <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                                  {part}
                                  <button type="button" onClick={() => setMachineForm(prev => ({ ...prev, part_name: prev.part_name.filter((_, i) => i !== idx) }))} className="text-purple-600 hover:text-purple-900">&times;</button>
                                </span>
                              ))}
                              <input
                                type="text"
                                id="part_name_add"
                                value={partInput}
                                onChange={(e) => setPartInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if ((e.key === 'Enter' || e.key === ',') && partInput.trim()) {
                                    e.preventDefault();
                                    if (!machineForm.part_name.includes(partInput.trim())) {
                                      setMachineForm(prev => ({ ...prev, part_name: [...prev.part_name, partInput.trim()] }));
                                    }
                                    setPartInput('');
                                  }
                                }}
                                placeholder={machineForm.part_name.length === 0 ? "Type part name, press Enter" : "Add more..."}
                                className="flex-1 min-w-[120px] outline-none text-sm py-1"
                              />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">Press Enter or comma to add each part</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="machine_department_add" className="block text-sm font-medium text-gray-700">Department</label>
                              <input
                                type="text"
                                id="machine_department_add"
                                name="machine_department"
                                value={machineForm.machine_department}
                                onChange={handleMachineInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                              />
                            </div>
                            <div>
                              <label htmlFor="machine_division_add" className="block text-sm font-medium text-gray-700">Division</label>
                              <input
                                type="text"
                                id="machine_division_add"
                                name="machine_division"
                                value={machineForm.machine_division}
                                onChange={handleMachineInputChange}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => { setShowMachineModal(false); resetMachineForm(); }}
                          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                        >
                          {isEditingMachine ? 'Update' : 'Submit'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Extend Task Modal Popup */}
        {showExtendTaskPopup && currentExtendUser && (
          <div className="fixed z-20 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setShowExtendTaskPopup(false)}>
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Extend Tasks for: <span className="text-purple-600">{currentExtendUser.user_name}</span>
                  </h3>
                  <button
                    onClick={() => setShowExtendTaskPopup(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      value={extendStartDate}
                      onChange={(e) => setExtendStartDate(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      value={extendEndDate}
                      onChange={(e) => setExtendEndDate(e.target.value)}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    />
                  </div>
                </div>

                <div className="overflow-auto max-h-[60vh]">
                  {extendLoading ? (
                    <div className="text-center py-4">Loading tasks...</div>
                  ) : extendUserTasks.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">No tasks found for selected date range.</div>
                  ) : (
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Start Date</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Start Date</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {extendUserTasks.map((task) => (
                          <tr key={task.task_id}>
                            <td className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate" title={task.task_description}>
                              {task.task_description}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-500">
                              {new Date(task.task_start_date).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap">
                              <input
                                type="date"
                                value={newStartDates[task.task_id] || ''}
                                onChange={(e) => setNewStartDates(prev => ({ ...prev, [task.task_id]: e.target.value }))}
                                className="block w-full border border-gray-300 rounded-md shadow-sm py-1 px-2 text-xs focus:ring-purple-500 focus:border-purple-500"
                                min={new Date().toISOString().split('T')[0]}
                              />
                            </td>
                            <td className="px-4 py-2 whitespace-nowrap text-right">
                              <button
                                onClick={() => handleUpdateTaskDate(task.task_id)}
                                disabled={!newStartDates[task.task_id]}
                                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Update
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* User Modal */}
        {showUserModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {isEditing ? 'Edit User' : 'Create New User'}
                    </h3>
                    <button
                      onClick={() => setShowUserModal(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="mt-6 max-h-[70vh] overflow-y-auto">
                    <form onSubmit={isEditing ? handleUpdateUser : handleAddUser}>
                      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                        <div className="sm:col-span-3">
                          <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            Username
                          </label>
                          <input
                            type="text"
                            name="username"
                            id="username"
                            value={userForm.username}

                            onChange={handleUserInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>

  {/* In the User Modal form */}
<div className="sm:col-span-3">
  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
    Password
  </label>
  <div className="relative mt-1">
    <input
      type={showModalPassword ? "text" : "password"}
      name="password"
      id="password"
      value={userForm.password}

      onChange={handleUserInputChange}
      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-10"
      placeholder={isEditing ? "Leave empty to keep current password" : "Enter password"}
    />
    <button
      type="button"
      onClick={() => setShowModalPassword(!showModalPassword)}
      className="absolute inset-y-0 right-0 pr-3 flex items-center"
    >
      {showModalPassword ? (
        <EyeOff size={18} className="text-gray-400 hover:text-gray-600" />
      ) : (
        <Eye size={18} className="text-gray-400 hover:text-gray-600" />
      )}
    </button>
  </div>
  {isEditing && (
    <p className="mt-1 text-xs text-gray-500">
      Leave empty to keep current password
    </p>
  )}
</div>

                        <div className="sm:col-span-3">
                          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                          </label>
                          <input
                            type="email"
                            name="email"
                            id="email"
                            value={userForm.email}

                            onChange={handleUserInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>

                        {!isEditing && (
                          <div className="sm:col-span-3">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                              Password
                            </label>
                            <input
                              type="password"
                              name="password"
                              id="password"
                              value={userForm.password}

                              onChange={handleUserInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                        )}

                        <div className="sm:col-span-3">
                          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                            Phone
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            id="phone"
                             value={userForm.phone}

                            onChange={handleUserInputChange}
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                        </div>





                        <div className="sm:col-span-3">
                          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                            Role
                          </label>
                          <select
                            id="role"
                            name="role"
                            value={userForm.role}

                            onChange={handleUserInputChange}
                            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                            {/* Only show/allow super_admin option if current user is super_admin (or you can decide policy) */}
                            {canManageSettings && <option value="super_admin">Super Admin</option>}
                          </select>
                        </div>

                      {/* Cascading Unit → Division → Department fields */}
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Unit
                          </label>
                          <select
                             value={userForm.unit}

                            onChange={(e) => handleUnitChange(e.target.value)}
                            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="">Select Unit</option>
                            {availableUnits.map((unit, idx) => (
                              <option key={idx} value={unit}>{unit}</option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Division
                          </label>
                          <select
                             value={userForm.division}

                            onChange={(e) => handleDivisionChange(e.target.value)}
                            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="">Select Division</option>
                            {availableDivisions.map((div, idx) => (
                              <option key={idx} value={div}>{div}</option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Department
                          </label>
                          <select
                             value={userForm.department}

                            onChange={(e) => handleDepartmentChange(e.target.value)}
                            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="">Select Department</option>
                            {availableDepartments.map((dept, idx) => (
                              <option key={idx} value={dept}>{dept}</option>
                            ))}
                          </select>
                        </div>

                        <div className="sm:col-span-3">
                          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                            Status
                          </label>
                          <select
                            id="status"
                            name="status"
                             value={userForm.status}

                            onChange={handleUserInputChange}
                            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        </div>

                        {/* Manual Permission Selection for super_admin */}
                        {currentUserRole === 'super_admin' && (
                          <div className="sm:col-span-6 mt-4 pt-4 border-t border-gray-200">
                            <h4 className="text-sm font-bold text-gray-800 mb-1">Manual Permission Selection</h4>
                            <p className="text-xs text-gray-500 italic mb-4">
                              If no manual permissions are selected, role-based defaults apply automatically.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                              {/* System Access Section */}
                              <div className="space-y-3">
                                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                  System Access
                                </label>
                                <div className="space-y-2 bg-gray-50 p-3 rounded-md border border-gray-200">
                                  {SYSTEM_PERMISSIONS.map(permission => (
                                    <label key={permission} className="flex items-center gap-2 cursor-pointer group">
                                      <input
                                        type="checkbox"
                                        checked={systemAccess.includes(permission)}
                                        onChange={() => togglePermission('system', permission)}
                                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-4 w-4"
                                      />
                                      <span className="text-sm text-gray-700 group-hover:text-purple-700 transition-colors">
                                        {permission.charAt(0).toUpperCase() + permission.slice(1).replace('_', ' ')}
                                      </span>
                                    </label>
                                  ))}
                                </div>
                              </div>

                              {/* Page Access Section — View / Modify per page */}
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Page Access
                                  </label>
                                  <div className="flex gap-4 text-xs font-semibold text-gray-400 uppercase mr-1">
                                    <span className="w-12 text-center">View</span>
                                    <span className="w-14 text-center">Modify</span>
                                  </div>
                                </div>
                                <div className="space-y-1 bg-gray-50 p-3 rounded-md border border-gray-200">
                                  {PAGE_PERMISSION_GROUPS.filter(group => {
                                    const allowedSystems = PAGE_SYSTEM_MAP[group.key] || [];
                                    // If no system access is selected, show nothing to encourage selection
                                    return systemAccess.some(sys => allowedSystems.includes(sys));
                                  }).map(({ key, label }) => {
                                    const viewKey = `${key}_view`;
                                    const modifyKey = `${key}_modify`;
                                    const hasView = pageAccess.includes(viewKey) || pageAccess.includes(modifyKey);
                                    const hasModify = pageAccess.includes(modifyKey);
                                    return (
                                      <div key={key} className="flex items-center justify-between py-1 group">
                                        <span className="text-sm text-gray-700 flex-1 group-hover:text-purple-700 transition-colors">
                                          {label}
                                        </span>
                                        <div className="flex gap-4 mr-1">
                                          {/* View checkbox */}
                                          <div className="w-12 flex justify-center">
                                            <input
                                              type="checkbox"
                                              checked={hasView}
                                              onChange={() => togglePermission('page_view', key)}
                                              className="rounded border-gray-300 text-blue-500 focus:ring-blue-400 h-4 w-4 cursor-pointer"
                                              title="View only"
                                            />
                                          </div>
                                          {/* Modify checkbox */}
                                          <div className="w-14 flex justify-center">
                                            <input
                                              type="checkbox"
                                              checked={hasModify}
                                              onChange={() => togglePermission('page_modify', key)}
                                              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 h-4 w-4 cursor-pointer"
                                              title="Full modify access (implies view)"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                                <p className="text-xs text-gray-400">
                                  <span className="text-blue-500 font-semibold">View</span> = read-only &nbsp;|&nbsp;
                                  <span className="text-purple-600 font-semibold">Modify</span> = full access (implies view)
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>


                      <div className="mt-6 flex justify-end space-x-3">
                        <button
                          type="button"
                          onClick={() => setShowUserModal(false)}
                          className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <Save size={18} className="mr-2" />
                          {isEditing ? 'Update User' : 'Save User'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Department Modal */}
        {showDeptModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full sm:p-6">
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      {currentDeptId ? 'Edit Department' : 'Create New Department'}
                    </h3>
                    <button
                      onClick={() => setShowDeptModal(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X size={24} />
                    </button>
                  </div>

                  {/* Edit mode - single row form (existing behavior) */}
                  {currentDeptId ? (
                    <div className="mt-6">
                      <form onSubmit={handleUpdateDepartment}>
                        <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                          <div className="sm:col-span-6">
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                              Department Name
                            </label>
                            <input
                              type="text"
                              name="name"
                              id="name"
                              value={deptForm.name}
                              onChange={handleDeptInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>
                          
                          <div className="sm:col-span-3">
                            <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                              Unit
                            </label>
                            <input
                              type="text"
                              name="unit"
                              id="unit"
                              value={deptForm.unit || ''}
                              onChange={handleDeptInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>

                          <div className="sm:col-span-3">
                            <label htmlFor="division" className="block text-sm font-medium text-gray-700">
                              Division
                            </label>
                            <input
                              type="text"
                              name="division"
                              id="division"
                              value={deptForm.division || ''}
                              onChange={handleDeptInputChange}
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                          </div>

                          {/* Given By - Commented out for now, will be separated into its own button later */}
                          {/* <div className="sm:col-span-6">
                            <label htmlFor="givenBy" className="block text-sm font-medium text-gray-700">
                              Given By
                            </label>
                            <input
                              type="text"
                              id="givenBy"
                              name="givenBy"
                              value={deptForm.givenBy}
                              onChange={handleDeptInputChange}
                              className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="Enter Given By"
                            />
                          </div> */}
                        </div>

                        <div className="mt-6 flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setShowDeptModal(false)}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Save size={18} className="mr-2" />
                            Update Department
                          </button>
                        </div>
                      </form>
                    </div>
                  ) : (
                    /* Create mode - multi-row form with Unit, Division, Department */
                    <div className="mt-6">
                      <form onSubmit={handleAddDepartment}>
                        {/* Column Headers */}
                        <div className="grid grid-cols-12 gap-3 mb-2">
                          <div className="col-span-1">
                            <span className="block text-xs font-semibold text-gray-500 uppercase">#</span>
                          </div>
                          <div className="col-span-3">
                            <span className="block text-xs font-semibold text-gray-500 uppercase">Unit</span>
                          </div>
                          <div className="col-span-3">
                            <span className="block text-xs font-semibold text-gray-500 uppercase">Division</span>
                          </div>
                          <div className="col-span-4">
                            <span className="block text-xs font-semibold text-gray-500 uppercase">Department</span>
                          </div>
                          <div className="col-span-1">
                            <span className="block text-xs font-semibold text-gray-500 uppercase"></span>
                          </div>
                        </div>

                        {/* Dynamic Rows */}
                        <div className="max-h-[50vh] overflow-y-auto space-y-3">
                          {deptRows.map((row, index) => (
                            <div key={index} className="grid grid-cols-12 gap-3 items-center bg-gray-50 p-3 rounded-lg border border-gray-200">
                              {/* Row Number */}
                              <div className="col-span-1 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-500 bg-white w-7 h-7 rounded-full flex items-center justify-center border border-gray-300">
                                  {index + 1}
                                </span>
                              </div>

                              {/* Unit */}
                              <div className="col-span-3">
                                <input
                                  type="text"
                                  value={row.unit}
                                  onChange={(e) => handleDeptRowChange(index, 'unit', e.target.value)}
                                  placeholder="Enter Unit"
                                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                              </div>

                              {/* Division */}
                              <div className="col-span-3">
                                <input
                                  type="text"
                                  value={row.division}
                                  onChange={(e) => handleDeptRowChange(index, 'division', e.target.value)}
                                  placeholder="Enter Division"
                                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                              </div>

                              {/* Department */}
                              <div className="col-span-4">
                                <input
                                  type="text"
                                  value={row.department}
                                  onChange={(e) => handleDeptRowChange(index, 'department', e.target.value)}
                                  placeholder="Enter Department"
                                  className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                />
                              </div>

                              {/* Remove Row Button */}
                              <div className="col-span-1 flex items-center justify-center">
                                {deptRows.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeDeptRow(index)}
                                    className="text-red-400 hover:text-red-600 transition-colors"
                                    title="Remove this row"
                                  >
                                    <X size={18} />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Row Button */}
                        <div className="mt-3">
                          <button
                            type="button"
                            onClick={addDeptRow}
                            className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-purple-600 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors"
                          >
                            <Plus size={16} />
                            Add Another Row
                          </button>
                        </div>

                        {/* Given By - Commented out for now, will be separated into its own button later */}
                        {/* <div className="mt-4">
                          <label htmlFor="givenBy" className="block text-sm font-medium text-gray-700">
                            Given By
                          </label>
                          <input
                            type="text"
                            id="givenBy"
                            name="givenBy"
                            value={deptForm.givenBy}
                            onChange={handleDeptInputChange}
                            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            placeholder="Enter Given By"
                          />
                        </div> */}

                        {/* Submit / Cancel Buttons */}
                        <div className="mt-6 flex justify-end space-x-3">
                          <button
                            type="button"
                            onClick={() => setShowDeptModal(false)}
                            className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            <Save size={18} className="mr-2" />
                            Submit
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Task Delegation Modal */}
        {showDelegationModal && (
          <div className="fixed z-10 inset-0 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Delegate Tasks
                    </h3>
                    <button
                      onClick={() => {
                        setShowDelegationModal(false);
                        setSelectedDoer('');
                      }}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Leave Start Date
                        </label>
                        <input
                          type="date"
                          value={leaveStartDate}
                          readOnly
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 cursor-not-allowed text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Leave End Date
                        </label>
                        <input
                          type="date"
                          value={leaveEndDate}
                          readOnly
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 cursor-not-allowed text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Delegate To (Doer Name) <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={selectedDoer}
                          onChange={(e) => setSelectedDoer(e.target.value)}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        >
                          <option value="">Select a doer...</option>
                          {doerName && doerName.length > 0 ? (
                            doerName
                              .filter(name => {
                                const userRole = localStorage.getItem('role');
                                const userAccess = localStorage.getItem('user_access') || '';
                                const userDepartments = userAccess ? userAccess.split(',').map(d => d.trim().toLowerCase()) : [];
                                if (userRole === 'admin' && userDepartments.length > 0) {
                                  // find user object by name to check department
                                  const user = userData?.find(u => u.user_name === name);
                                  if (user) {
                                    const uDept = (user.user_access || user.department || '').split(',')[0].trim().toLowerCase();
                                    return userDepartments.includes(uDept);
                                  }
                                  return false;
                                }
                                return true;
                              })
                              .map((name, index) => (
                                <option key={index} value={name}>
                                  {name}
                                </option>
                              ))
                          ) : (
                            <option value="" disabled>No doers available</option>
                          )}
                        </select>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-xs text-blue-800">
                          <strong>Note:</strong> Tasks from the selected date range will be transferred to the delegation system and assigned to the selected doer.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDelegationModal(false);
                        setSelectedDoer('');
                      }}
                      className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmDelegation}
                      className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:text-sm"
                    >
                      Submit Delegation
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leave Transfer Popup Modal */}
        {showLeavePopup && currentLeaveUser && (
          <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="leave-transfer-modal" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={() => {
                setShowLeavePopup(false);
                setCurrentLeaveUser(null);
                setSelectedUsers([]);
              }}></div>
              
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              
              <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
                <div>
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Transfer Tasks for {currentLeaveUser.user_name}
                    </h3>
                    <button
                      onClick={() => {
                        setShowLeavePopup(false);
                        setCurrentLeaveUser(null);
                        setSelectedUsers([]);
                      }}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      <X size={24} />
                    </button>
                  </div>
                  <div className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Leave Start Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={popupLeaveStartDate}
                          onChange={(e) => setPopupLeaveStartDate(e.target.value)}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Leave End Date <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={popupLeaveEndDate}
                          onChange={(e) => setPopupLeaveEndDate(e.target.value)}
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        />
                      </div>
                      
                      {/* Tasks Table Section */}
                      {popupLeaveStartDate && popupLeaveEndDate && (
                        <div className="mt-4">
                          {isLoadingTasks ? (
                            <div className="text-center py-4">
                              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-2"></div>
                              <p className="text-sm text-gray-600">Loading tasks...</p>
                            </div>
                          ) : fetchError ? (
                            <div className="bg-red-50 border border-red-200 rounded-md p-3">
                              <p className="text-sm text-red-800">{fetchError}</p>
                            </div>
                          ) : userTasks.length === 0 ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                              <p className="text-sm text-yellow-800">No tasks found for {currentLeaveUser.user_name} in the selected date range.</p>
                            </div>
                          ) : (
                            <div>
                              <h4 className="text-sm font-medium text-gray-900 mb-2">
                                Tasks to Assign ({userTasks.length})
                              </h4>
                              <div className="border border-gray-300 rounded-md overflow-hidden">
                                <div className="max-h-64 overflow-y-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50 sticky top-0">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task ID</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assign To <span className="text-red-500">*</span></th>
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {userTasks.map((task) => (
                                        <tr key={task.task_id} className="hover:bg-gray-50">
                                          <td className="px-3 py-2 text-xs text-gray-900">{task.task_id}</td>
                                          <td className="px-3 py-2 text-xs text-gray-900" title={task.task_description}>
                                            <div className="max-w-xs truncate">{task.task_description}</div>
                                          </td>
                                          <td className="px-3 py-2 text-xs text-gray-900">
                                            {task.task_start_date ? new Date(task.task_start_date).toLocaleDateString() : '-'}
                                          </td>
                                          <td className="px-3 py-2">
                                            <select
                                              value={taskAssignments[task.task_id] || ''}
                                              onChange={(e) => handleTaskAssignment(task.task_id, e.target.value)}
                                              className="w-full text-xs border border-gray-300 rounded-md shadow-sm py-1 px-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                                            >
                                              <option value="">Select user...</option>
                                               {userData && userData.length > 0 ? (
                                                userData
                                                  .filter(u => {
                                                    const userRole = localStorage.getItem('role');
                                                    const userAccess = localStorage.getItem('user_access') || '';
                                                    const userDepartments = userAccess ? userAccess.split(',').map(d => d.trim().toLowerCase()) : [];
                                                    if (userRole === 'admin' && userDepartments.length > 0) {
                                                      const uDept = (u.user_access || u.department || '').split(',')[0].trim().toLowerCase();
                                                      return userDepartments.includes(uDept);
                                                    }
                                                    return true;
                                                  })
                                                  .map((user) => (
                                                    <option key={user.id} value={user.user_name}>
                                                      {user.user_name}
                                                    </option>
                                                  ))
                                              ) : (
                                                <option value="" disabled>No users available</option>
                                              )}
                                            </select>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Shift Doer Name field removed - now using individual task assignments */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Remarks
                        </label>
                        <textarea
                          value={popupRemarks}
                          onChange={(e) => setPopupRemarks(e.target.value)}
                          placeholder="Enter remarks (optional)"
                          rows="3"
                          className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                        />
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                        <p className="text-xs text-blue-800">
                          <strong>Note:</strong> This will delete {currentLeaveUser.user_name}'s tasks from the checklist for the selected dates and assign them to the chosen doer in the delegation system.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setShowLeavePopup(false);
                        setCurrentLeaveUser(null);
                        setSelectedUsers([]);
                      }}
                      className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleLeaveTransferSubmit}
                      className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-purple-600 text-base font-medium text-white hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 sm:text-sm"
                    >
                      Transfer Tasks
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Setting;










// <div className="space-y-8">
//   {/* Header and Tabs */}
//   <div className="my-5">
//     {/* Header */}
//     <div className="flex justify-between items-center mb-6">
//       <h1 className="text-xl md:text-2xl font-bold text-purple-600">User Management System</h1>
//     </div>

//     {/* Tabs and Add Button Container */}
//     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
//       {/* Tabs */}
//       <div className="flex border border-purple-200 rounded-md overflow-hidden self-start w-full sm:w-auto">
//         <button
//           className={`flex flex-1 justify-center items-center px-3 py-2 md:px-4 md:py-3 text-sm font-medium ${activeTab === 'users' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
//           onClick={() => {
//             handleTabChange('users');
//             dispatch(userDetails());
//           }}
//         >
//           <User size={16} className="mr-1 md:mr-2" />
//           <span className="hidden xs:inline">Users</span>
//         </button>
//         <button
//           className={`flex flex-1 justify-center items-center px-3 py-2 md:px-4 md:py-3 text-sm font-medium ${activeTab === 'departments' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
//           onClick={() => {
//             handleTabChange('departments');
//             dispatch(departmentOnlyDetails());
//             dispatch(givenByDetails());
//           }}
//         >
//           <Building size={16} className="mr-1 md:mr-2" />
//           <span className="hidden xs:inline">Departments</span>
//         </button>
//         <button
//           className={`flex flex-1 justify-center items-center px-3 py-2 md:px-4 md:py-3 text-sm font-medium ${activeTab === 'leave' ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 hover:bg-purple-50'}`}
//           onClick={() => {
//             handleTabChange('leave');
//             dispatch(userDetails());
//           }}
//         >
//           <Calendar size={16} className="mr-1 md:mr-2" />
//           <span className="hidden xs:inline">Leave</span>
//         </button>
//       </div>

//       {/* Add button - hide for leave tab */}
//       {activeTab !== 'leave' && (
//         <button
//           onClick={handleAddButtonClick}
//           className="rounded-md gradient-bg py-2 px-3 md:px-4 text-white hover:from-blue-600 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full sm:w-auto"
//         >
//           <div className="flex items-center justify-center">
//             <Plus size={16} className="mr-1 md:mr-2" />
//             <span className="text-sm">
//               {activeTab === 'users' ? 'Add User' : 'Add Department'}
//             </span>
//           </div>
//         </button>
//       )}
//     </div>
//   </div>
