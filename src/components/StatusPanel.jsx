export default function StatusPanel() {
  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow p-4 mb-6">
      <h2 className="text-lg font-semibold mb-2">Estado Atual</h2>
      <p className="text-gray-700">Luz: <span className="text-green-600 font-bold">Ligada</span></p>
      <p className="text-gray-700">Modo: Automático</p>
    </div>
  )
}
