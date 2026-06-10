export default function Home() {
  return (
    <div className="min-h-screen bg-[#0E0F12] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[#F1F5F9] mb-4">FunnelSwift</h1>
        <p className="text-[#64748B] mb-8">Lead Management System</p>
        <a 
          href="/dashboard" 
          className="inline-block px-6 py-3 bg-[#5B4FFF] text-white rounded-lg hover:bg-[#5B4FFF]/90 transition-colors"
        >
          Go to Dashboard
        </a>
      </div>
    </div>
  );
}
