import { useEffect, useState } from "react";
import DeviceCard from "./components/DeviceCard";
import { ref, set, onValue } from "firebase/database";
import { db } from "./firebaseConfig";

// Nome amigável => Chave no Firebase
const firebaseKeys = {
  "Luz dos Postes": "led",
  "Luz do Jardin": "led2",
  "Temporizar Tarefas": "timer",
  "Paineis Solares": "solar",
  "Consumo Total de Energia": "energy",
};

const devices = [
  { name: "Luz dos Postes", icon: "💡" },
  { name: "Luz do Jardin", icon: "🌳" },
  { name: "Temporizar Tarefas", icon: "🔔" },
  { name: "Paineis Solares", icon: "🌞" },
  { name: "Consumo Total de Energia", icon: "⚡" },
];

export default function App() {
  const [selectedDevice, setSelectedDevice] = useState(null);

  const [deviceStates, setDeviceStates] = useState({
    "Luz dos Postes": false,
    "Luz do Jardin": false,
    "Temporizar Tarefas": false,
    "Paineis Solares": false,
    "Consumo Total de Energia": false,
  });

  // Alternar estado do dispositivo no Firebase
  const toggleDevice = async (deviceName) => {
    const estadoAtual = deviceStates[deviceName];
    const novoEstado = estadoAtual ? "off" : "on";
    const firebaseKey = firebaseKeys[deviceName];

    console.log("Dispositivo selecionado:", selectedDevice);
    console.log("Estado atual:", deviceStates[deviceName]);
    console.log("Chave Firebase:", firebaseKey);


    try {
      await set(ref(db, firebaseKey), novoEstado);
      setDeviceStates((prev) => ({
        ...prev,
        [deviceName]: novoEstado === "on",
      }));
    } catch (error) {
      console.error(`Erro ao alternar ${deviceName}:`, error);
    }
  };

  // Escutar atualizações em tempo real
  useEffect(() => {
    const unsubscribes = Object.entries(firebaseKeys).map(([name, key]) => {
      const deviceRef = ref(db, key);
      return onValue(deviceRef, (snapshot) => {
        const value = snapshot.val();
        setDeviceStates((prev) => ({
          ...prev,
          [name]: value === "on",
        }));
      });
    });

    return () => unsubscribes.forEach((unsub) => unsub && unsub());
  }, []);

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/bg.png')" }}
    >
      <h1 className="text-3xl font-bold mb-8 text-center flex justify-center items-center gap-2 drop-shadow text-white">
        Luma <span role="img" aria-label="lamp">💡</span>
      </h1>

      <div className="flex gap-10">
        <div className="flex flex-col gap-4 w-1/3">
          {devices.map((device) => (
            <DeviceCard
              key={device.name}
              name={device.name}
              icon={device.icon}
              onClick={() => setSelectedDevice(device)}
              isSelected={selectedDevice?.name === device.name}
            />
          ))}
        </div>

        <div className="w-2/3 p-6 bg-white bg-opacity-20 rounded-lg shadow-lg">
          {selectedDevice ? (
            <>
              <h2 className="text-2xl font-bold mb-4 text-white">
                {selectedDevice.icon} {selectedDevice.name}
              </h2>
              <p className="text-2xl font-bold mb-4 text-white">
                Status:{" "}
                <span className="font-semibold">
                  {deviceStates[selectedDevice.name] ? "Ligado" : "Desligado"}
                </span>
              </p>
              <button
                className={`mt-4 px-4 py-2 rounded transition ${
                  deviceStates[selectedDevice.name]
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-green-600 hover:bg-green-700"
                }`}
                onClick={() => toggleDevice(selectedDevice.name)}
              >
                {deviceStates[selectedDevice.name] ? "Desligar" : "Ligar"}
              </button>
            </>
          ) : (
            <p className="italic text-white">
              Selecione um dispositivo à esquerda.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
