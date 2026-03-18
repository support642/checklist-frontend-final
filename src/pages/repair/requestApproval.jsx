import React from 'react'
import AdminLayout from '../../components/layout/AdminLayout'

const RequestApproval = () => {
  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-700 mb-4">Repair Request Approval</h1>
        <div className="bg-white p-6 rounded-lg shadow-md border border-blue-100">
          <p className="text-gray-600">Repair request approval workflow will be implemented here.</p>
        </div>
      </div>
    </AdminLayout>
  )
}

export default RequestApproval