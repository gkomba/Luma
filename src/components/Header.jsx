import { FaLightbulb } from 'react-icons/fa'

export default function Header() {
  return (
    <div className="flex items-center gap-3 mb-8">
      <h1 className="text-4xl font-bold text-gray-800">Luma</h1>
      <FaLightbulb className="text-yellow-500 text-4xl animate-pulse" />
    </div>
  )
}
