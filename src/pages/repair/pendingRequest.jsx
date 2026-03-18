import React from 'react'
import AdminLayout from '../../components/layout/AdminLayout'

const PendingRequest = () => {
  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-700 mb-4">Pending Repair Requests</h1>
        <div className="bg-white p-6 rounded-lg shadow-md border border-blue-100">
          <p className="text-gray-600">Pending repair requests will be listed here.</p>
        </div>
      </div>
    </AdminLayout>
  )
}

export default PendingRequest