export default function DeviceCard({ name, icon, onClick, isSelected }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 p-4 rounded-lg shadow-md transition ${
        isSelected ? "bg-green-600" : "bg-white bg-opacity-20"
      } hover:bg-green-700`}
    >
      <span className="text-2xl">{icon}</span>
      <span className="font-semibold text-white">{name}</span>
    </button>
  );
}
