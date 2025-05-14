export default function ScheduleForm() {
  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow p-4 mt-6">
      <h2 className="text-lg font-semibold mb-2">Agendamento</h2>
      <div className="flex flex-col gap-3">
        <input type="time" className="border rounded p-2" />
        <button className="bg-green-500 text-white p-2 rounded hover:bg-green-600">Agendar</button>
      </div>
    </div>
  )
}