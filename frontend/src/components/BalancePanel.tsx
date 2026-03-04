import { useState } from "react"

export default function BalancePanel({
  token,
  onDepositComplete
}: {
  token: string
  onDepositComplete?: () => void
}) {

  const [amount, setAmount] = useState("")

  const submitDeposit = async () => {
    if (!amount || Number(amount) <= 0) return

    try {
      await fetch("http://127.0.0.1:8000/api/deposit/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          amount: Number(amount)
        })
      })

      setAmount("")
      onDepositComplete?.()

    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="p-4 font-mono text-sm text-orange-400 space-y-4">

      <div className="font-bold">DEPOSIT FUNDS</div>

      <input
        className="w-full bg-black border border-gray-800 p-2"
        placeholder="AMOUNT"
        value={amount}
        onChange={e => setAmount(e.target.value)}
      />

      <button
        onClick={submitDeposit}
        className="w-full border border-green-500 text-green-400 py-2 hover:bg-green-500 hover:text-black"
      >
        DEPOSIT
      </button>

    </div>
  )
}