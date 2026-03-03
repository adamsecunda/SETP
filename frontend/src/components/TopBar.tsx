export default function TopBar({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="flex justify-between items-center px-6 py-3 border-b border-gray-800 bg-gray-950">
      <div className="text-orange-400 font-bold tracking-widest">
        SETP TERMINAL
      </div>
      <button
        onClick={onLogout}
        className="text-xs px-3 py-1 border border-gray-700 hover:bg-gray-800"
      >
        LOGOUT
      </button>
    </div>
  )
}