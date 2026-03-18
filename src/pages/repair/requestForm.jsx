import React, { useState } from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { ClipboardList, User, Database, Settings, CheckSquare } from 'lucide-react';

const RequestForm = () => {
  const [formData, setFormData] = useState({
    assignTo: "",
    machineDivision: "",
    machineDepartment: "",
    machineName: "",
    description: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form Submitted:", formData);
    alert("Repair Request Submitted (Frontend Only)");
  };

  return (
    <AdminLayout>
      <div className="p-4 md:p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-6 flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-lg shadow-md">
              <ClipboardList className="text-white h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-purple-800">Request Form</h1>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-xl shadow-lg border border-purple-100 overflow-hidden">
            <div className="bg-purple-600 px-6 py-4">
              <h2 className="text-white font-semibold flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Submit New Repair Request
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Assign To */}
                <div className="space-y-2">
                  <label htmlFor="assignTo" className="block text-sm font-medium text-purple-700">
                    Assign To
                  </label>
                  <div className="relative">
                    <select
                      id="assignTo"
                      name="assignTo"
                      value={formData.assignTo}
                      onChange={handleChange}
                      required
                      className="w-full rounded-md border border-purple-200 p-2.5 pl-10 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 appearance-none bg-white"
                    >
                      <option value="">Select Assignee</option>
                      <option value="Admin">Admin</option>
                      <option value="Technician 1">Technician 1</option>
                      <option value="Technician 2">Technician 2</option>
                    </select>
                    <User className="absolute left-3 top-2.5 h-5 w-5 text-purple-400" />
                  </div>
                </div>

                {/* Machine Division */}
                <div className="space-y-2">
                  <label htmlFor="machineDivision" className="block text-sm font-medium text-purple-700">
                    Machine Division
                  </label>
                  <div className="relative">
                    <select
                      id="machineDivision"
                      name="machineDivision"
                      value={formData.machineDivision}
                      onChange={handleChange}
                      required
                      className="w-full rounded-md border border-purple-200 p-2.5 pl-10 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 appearance-none bg-white"
                    >
                      <option value="">Select Division</option>
                      <option value="Production">Production</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Packaging">Packaging</option>
                    </select>
                    <Database className="absolute left-3 top-2.5 h-5 w-5 text-purple-400" />
                  </div>
                </div>

                {/* Machine Department */}
                <div className="space-y-2">
                  <label htmlFor="machineDepartment" className="block text-sm font-medium text-purple-700">
                    Machine Department
                  </label>
                  <div className="relative">
                    <select
                      id="machineDepartment"
                      name="machineDepartment"
                      value={formData.machineDepartment}
                      onChange={handleChange}
                      required
                      className="w-full rounded-md border border-purple-200 p-2.5 pl-10 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 appearance-none bg-white"
                    >
                      <option value="">Select Department</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Floor 1">Floor 1</option>
                      <option value="Floor 2">Floor 2</option>
                    </select>
                    <Settings className="absolute left-3 top-2.5 h-5 w-5 text-purple-400" />
                  </div>
                </div>

                {/* Machine Name */}
                <div className="space-y-2">
                  <label htmlFor="machineName" className="block text-sm font-medium text-purple-700">
                    Machine Name
                  </label>
                  <div className="relative">
                    <select
                      id="machineName"
                      name="machineName"
                      value={formData.machineName}
                      onChange={handleChange}
                      required
                      className="w-full rounded-md border border-purple-200 p-2.5 pl-10 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 appearance-none bg-white"
                    >
                      <option value="">Select Machine</option>
                      <option value="CNC Miller">CNC Miller</option>
                      <option value="Lathe Machine">Lathe Machine</option>
                      <option value="Packaging Belt">Packaging Belt</option>
                    </select>
                    <CheckSquare className="absolute left-3 top-2.5 h-5 w-5 text-purple-400" />
                  </div>
                </div>
              </div>

              {/* Request Description */}
              <div className="space-y-2">
                <label htmlFor="description" className="block text-sm font-medium text-purple-700">
                  Request Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Provide detailed information about the issue..."
                  rows={4}
                  required
                  className="w-full rounded-md border border-purple-200 p-3 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:-translate-y-0.5"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default RequestForm;