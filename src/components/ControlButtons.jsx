export default function ControlButtons() {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-md">

          <button className="bg-yellow-500 hover:bg-yellow-600 text-white p-4 rounded-2xl shadow-md">Lampadas</button>
          <button className="bg-yellow-500 hover:bg-yellow-600 text-white p-4 rounded-2xl shadow-md">Consumo de energia</button>
          <button className="bg-yellow-500 hover:bg-yellow-600 text-white p-4 rounded-2xl shadow-md">Status</button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-md mt-4">
      </div>
    </>
  )
}
