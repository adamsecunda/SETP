export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-gray-200 font-mono">
      {children}
    </div>
  )
}