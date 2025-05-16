import { useState, useEffect } from "react";
import { ref, set, remove, onValue } from "firebase/database";
import { db } from "../firebaseConfig";

const deviceOptions = {
  "Luz dos Postes": "led",
  "Gerador": "generator",
  "Circuito": "circuito/status",
};

export default function TimerControl() {
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [selectedDevice, setSelectedDevice] = useState("Luz dos Postes");
  const [action, setAction] = useState("on");
  const [actionsList, setActionsList] = useState([]);
  const [timeouts, setTimeouts] = useState({});

  // 🔄 Carregar agendamentos do Firebase ao montar
  useEffect(() => {
    const agendamentosRef = ref(db, "agendamentos");

    const unsubscribe = onValue(agendamentosRef, (snapshot) => {
      const data = snapshot.val() || {};
      const agendamentosArray = Object.entries(data).map(([id, value]) => ({
        id,
        ...value,
      }));
      setActionsList(agendamentosArray);

      // Recriar os timeouts locais (caso seja necessário após reload)
      const newTimeouts = {};
      agendamentosArray.forEach((item) => {
        const remainingTime = item.time * 1000;
        if (!timeouts[item.id]) {
          const timeoutId = setTimeout(() => {
            set(ref(db, item.firebaseKey), item.action);
            remove(ref(db, `agendamentos/${item.id}`));
            setActionsList((prev) =>
              prev.filter((a) => a.id !== item.id)
            );
            setTimeouts((prev) => {
              const updated = { ...prev };
              delete updated[item.id];
              return updated;
            });
          }, remainingTime);
          newTimeouts[item.id] = timeoutId;
        }
      });
      setTimeouts((prev) => ({ ...prev, ...newTimeouts }));
    });

    return () => unsubscribe();
  }, []);

  const addAction = () => {
    const totalSeconds = parseInt(minutes) * 60 + parseInt(seconds);
    if (totalSeconds <= 0) return;

    const id = Date.now().toString();
    const newAction = {
      id,
      device: selectedDevice,
      firebaseKey: deviceOptions[selectedDevice],
      time: totalSeconds,
      action,
    };

    setActionsList((prev) => [...prev, newAction]);

    // Salvar no Firebase
    set(ref(db, `agendamentos/${id}`), newAction);

    // Agendar execução
    const timeoutId = setTimeout(() => {
      set(ref(db, newAction.firebaseKey), newAction.action); // Executa ação no Firebase
      remove(ref(db, `agendamentos/${id}`)); // Remove do Firebase
      setActionsList((prev) => prev.filter((action) => action.id !== id)); // Atualiza local
      setTimeouts((prev) => {
        const updated = { ...prev };
        delete updated[id];
        return updated;
      });
    }, totalSeconds * 1000);

    setTimeouts((prev) => ({ ...prev, [id]: timeoutId }));
  };

  const cancelAction = (id) => {
    setActionsList((prev) => prev.filter((item) => item.id !== id));
    clearTimeout(timeouts[id]);
    remove(ref(db, `agendamentos/${id}`));
    setTimeouts((prev) => {
      const newTimeouts = { ...prev };
      delete newTimeouts[id];
      return newTimeouts;
    });
  };

  const loadToEdit = (item) => {
    setSelectedDevice(item.device);
    setMinutes(Math.floor(item.time / 60));
    setSeconds(item.time % 60);
    setAction(item.action);
    cancelAction(item.id);
  };

  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-4"> Temporizador de Tarefas</h2>

      <div className="flex gap-2 mb-4 flex-wrap">
        <select
          value={selectedDevice}
          onChange={(e) => setSelectedDevice(e.target.value)}
          className="px-2 py-1 rounded text-black"
        >
          {Object.keys(deviceOptions).map((device) => (
            <option key={device} value={device}>
              {device}
            </option>
          ))}
        </select>

        <input
          type="number"
          min="0"
          placeholder="Min"
          value={minutes}
          onChange={(e) => setMinutes(e.target.value)}
          className="w-20 px-2 py-1 rounded text-black"
        />
        <input
          type="number"
          min="0"
          max="59"
          placeholder="Seg"
          value={seconds}
          onChange={(e) => setSeconds(e.target.value)}
          className="w-20 px-2 py-1 rounded text-black"
        />

        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="px-2 py-1 rounded text-black"
        >
          <option value="on">Ligar</option>
          <option value="off">Desligar</option>
        </select>

        <button
          onClick={addAction}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          Adicionar Ação
        </button>
      </div>

      {actionsList.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xl font-semibold mb-2">📋 Ações Agendadas</h3>
          <ul className="list-disc pl-5 space-y-2">
            {actionsList.map((item) => (
              <li key={item.id} className="flex justify-between items-center">
                <span>
                  {item.device} → {item.action.toUpperCase()} em{" "}
                  {Math.floor(item.time / 60)}min {item.time % 60}s
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadToEdit(item)}
                    className="text-yellow-300 hover:text-yellow-500"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => cancelAction(item.id)}
                    className="text-red-400 hover:text-red-600"
                  >
                    Cancelar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
