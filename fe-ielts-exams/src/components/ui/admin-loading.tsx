'use client'

export function AdminLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-sm border">
        <div className="flex flex-col items-center space-y-4">
          {/* Spinner */}
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>

          {/* Loading text */}
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Đang xác thực quyền truy cập
            </h3>
            <p className="text-sm text-gray-500">
              Vui lòng chờ trong giây lát...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AdminPageLoading() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        <p className="text-sm text-gray-500">Đang tải dữ liệu...</p>
      </div>
    </div>
  )
}