interface Props {
  label: string
  value: number
}

export default function StatBlock({ label, value }: Props) {
  return (
    <div className="p-4 border border-gray-800 bg-gray-950">
      <div className="text-xs text-gray-500 mb-1 uppercase tracking-wide">
        {label}
      </div>
      <div className="text-2xl text-green-400">
        ${value.toFixed(2)}
      </div>
    </div>
  )
}