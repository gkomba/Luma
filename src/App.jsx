import { useEffect, useState } from "react";
import DeviceCard from "./components/DeviceCard";
import TimerControl from "./components/TimerControl";
import PosteControl from "./components/PosteControl";
import CircuitoStatus from "./components/CircuitoStatus";
import DefaultDeviceControl from "./components/DefaultDeviceControl";
import { ref, set, onValue } from "firebase/database";
import { db } from "./firebaseConfig";

const firebaseKeys = {
  "Luz dos Postes": "led/status",
  "Temporizar Tarefas": "timer",
  "Gerador": "generator",
  "Circuito": "circuito/status",
};

const devices = [
  { name: "Luz dos Postes", icon: "💡" },
  { name: "Temporizar Tarefas", icon: "🕒" },
  { name: "Gerador", icon: "🔋" },
  { name: "Circuito", icon: "⚡" },
];

export default function App() {
  const [selectedDevice, setSelectedDevice] = useState(null);

  const [deviceStates, setDeviceStates] = useState({
    "Luz dos Postes": false,
    "Temporizar Tarefas": false,
    "Gerador": false,
    "Circuito": false,
  });

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
      await set(ref(db, "led/type"), "root");
    } catch (error) {
      console.error(`Erro ao alternar ${deviceName}:`, error);
    }
  };

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
            selectedDevice.name === "Temporizar Tarefas" ? (
              <TimerControl />
            ) : selectedDevice.name === "Circuito" ? (
              <CircuitoStatus
                isOn={deviceStates["Circuito"]}
                onToggle={() => toggleDevice("Circuito")}
              />
            ) : selectedDevice.name === "Luz dos Postes" ? (
              <PosteControl
                isOn={deviceStates["Luz dos Postes"]}
                onToggle={() => toggleDevice("Luz dos Postes")}
              />
            ) : (
              <DefaultDeviceControl
                name={selectedDevice.name}
                isOn={deviceStates[selectedDevice.name]}
                onToggle={() => toggleDevice(selectedDevice.name)}
              />
            )
          ) : (
            <p className="italic text-white">Selecione um dispositivo à esquerda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
