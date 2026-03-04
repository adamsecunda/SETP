import React, { useState } from "react"

const BalancePanel = React.memo(function BalancePanel({
  token,
  onDepositComplete
}: {
  token: string
  onDepositComplete?: () => void
}) {
  const [amount, setAmount] = useState("")
  const [mode, setMode] = useState<"DEPOSIT" | "WITHDRAW">("DEPOSIT")
  const [loading, setLoading] = useState(false)

  const handleTransaction = async () => {
    const numAmount = Number(amount)
    if (!amount || numAmount <= 0) return
    
    setLoading(true)
    const endpoint = mode === "DEPOSIT" ? "deposit" : "withdraw"
    
    try {
      const res = await fetch(`http://127.0.0.1:8000/api/${endpoint}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: numAmount })
      })

      if (res.ok) {
        setAmount("")
        onDepositComplete?.()
      }
    } catch (e) {
      console.error("Transaction Error:", e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 font-mono text-sm text-orange-400 space-y-4 bg-black">
      <div className="flex border border-gray-800 rounded overflow-hidden h-8">
        <button 
          onClick={() => setMode("DEPOSIT")}
          className={`flex-1 text-[10px] font-bold transition-colors ${mode === "DEPOSIT" ? "bg-orange-500 text-black" : "text-gray-500 hover:bg-gray-900"}`}
        >
          DEPOSIT.LOG
        </button>
        <button 
          onClick={() => setMode("WITHDRAW")}
          className={`flex-1 text-[10px] font-bold transition-colors ${mode === "WITHDRAW" ? "bg-red-500 text-black" : "text-gray-500 hover:bg-gray-900"}`}
        >
          WITHDRAW.LOG
        </button>
      </div>

      <div className="space-y-1">
        <input
          type="number"
          step="0.01"
          className="w-full bg-black border border-gray-800 p-2 outline-none focus:border-orange-500 text-orange-400 placeholder:opacity-30"
          placeholder="0.00_UNIT"
          value={amount}
          onChange={e => setAmount(e.target.value)}
        />
      </div>

      <button
        onClick={handleTransaction}
        disabled={loading}
        className={`w-full border py-2 text-xs font-bold transition-all ${
          mode === "DEPOSIT" 
            ? "border-green-500 text-green-500 hover:bg-green-500/10" 
            : "border-red-500 text-red-500 hover:bg-red-500/10"
        } ${loading ? "opacity-20 cursor-wait" : ""}`}
      >
        {loading ? "EXECUTING..." : `EXECUTE_${mode}`}
      </button>
    </div>
  )
})

export default BalancePanel