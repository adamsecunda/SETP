interface Props {
  onLogout: () => void
  balance?: number
}

export default function TopBar({ onLogout, balance }: Props) {
  return (
    <div className="flex justify-between items-center px-6 py-3 border-b border-gray-800 bg-black text-orange-400 font-mono text-xs">
      <div className="tracking-widest">
        SETP TERMINAL
      </div>

      <div className="flex items-center gap-6">
        <span>
          BALANCE: ${balance?.toFixed(2) ?? "0.00"}
        </span>

        <button
          onClick={onLogout}
          className="text-red-400 hover:text-red-200 transition"
        >
          LOGOUT
        </button>
      </div>
    </div>
  )
}