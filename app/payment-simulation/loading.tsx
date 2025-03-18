export default function Loading() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="bg-gray-900 rounded-lg border border-red-900 p-6 w-full max-w-md">
        <h1 className="text-xl font-medium text-center text-red-500 mb-6">Loading Payment Page...</h1>

        <div className="flex flex-col items-center justify-center py-8">
          <div className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-center text-white">Preparing payment simulation...</p>
        </div>
      </div>
    </div>
  )
}

