import { useEffect, useState } from "react";
import { ref, set, push, onValue, remove, update } from "firebase/database";
import { db } from "../firebaseConfig";

export default function PosteControl() {
  const [isOn, setIsOn] = useState(false);
  const [schedule, setSchedule] = useState([]);
  const [newSchedule, setNewSchedule] = useState("");
  const [editKey, setEditKey] = useState(null);
  const [editTime, setEditTime] = useState("");

  const [turnOffSchedule, setTurnOffSchedule] = useState([]);
  const [newTurnOffSchedule, setNewTurnOffSchedule] = useState("");

  const togglePoste = async () => {
    const newState = isOn ? "off" : "on";
    await set(ref(db, "led"), newState);
    setIsOn(newState === "on");
  };

  const addSchedule = async () => {
    if (!newSchedule) return;
    const scheduleRef = ref(db, "led/schedule");
    await push(scheduleRef, newSchedule);
    setNewSchedule("");
  };

  const addTurnOffSchedule = async () => {
    if (!newTurnOffSchedule) return;
    const scheduleRef = ref(db, "led/turnOffSchedule");
    await push(scheduleRef, newTurnOffSchedule);
    setNewTurnOffSchedule("");
  };

  const deleteSchedule = async (key) => {
    await remove(ref(db, `led/schedule/${key}`));
  };

  const deleteTurnOffSchedule = async (key) => {
    await remove(ref(db, `led/turnOffSchedule/${key}`));
  };

  const saveEdit = async () => {
    if (!editKey || !editTime) return;
    await update(ref(db, `led/schedule`), {
      [editKey]: editTime,
    });
    setEditKey(null);
    setEditTime("");
  };

  useEffect(() => {
    const ledRef = ref(db, "led");
    const unsub = onValue(ledRef, (snapshot) => {
      const value = snapshot.val();
      setIsOn(value === "on");
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const scheduleRef = ref(db, "led/schedule");
    const unsub = onValue(scheduleRef, (snapshot) => {
      const data = snapshot.val() || {};
      const result = Object.entries(data).map(([key, time]) => ({ key, time }));
      setSchedule(result);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const scheduleRef = ref(db, "led/turnOffSchedule");
    const unsub = onValue(scheduleRef, (snapshot) => {
      const data = snapshot.val() || {};
      const result = Object.entries(data).map(([key, time]) => ({ key, time }));
      setTurnOffSchedule(result);
    });
    return () => unsub();
  }, []);

  // Verificador automático de horário
  useEffect(() => {
    const interval = setInterval(() => {
      const agora = new Date();
      const horaAtual = agora.toTimeString().slice(0, 5);

      schedule.forEach(async ({ time }) => {
        if (time === horaAtual) {
          await set(ref(db, "led"), "on");
          setIsOn(true);
        }
      });

      turnOffSchedule.forEach(async ({ time }) => {
        if (time === horaAtual) {
          await set(ref(db, "led"), "off");
          setIsOn(false);
        }
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [schedule, turnOffSchedule]);

  return (
    <div className="text-white">
      <h2 className="text-2xl font-bold mb-4">💡 Luz dos Postes</h2>
      <p className="mb-2">Status: {isOn ? "Ligado" : "Desligado"}</p>
      <button
        onClick={togglePoste}
        className={`px-4 py-2 mb-4 rounded transition ${
          isOn ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
        }`}
      >
        {isOn ? "Desligar" : "Ligar"}
      </button>

      <div>
        <h3 className="text-lg font-semibold mb-2">Agendamento Diário (Ligar)</h3>
        <div className="flex gap-2 mb-2">
          <input
            type="time"
            value={newSchedule}
            onChange={(e) => setNewSchedule(e.target.value)}
            className="px-2 py-1 rounded text-black"
          />
          <button
            onClick={addSchedule}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
          >
            Adicionar
          </button>
        </div>
        <ul className="list-disc list-inside">
          {schedule.map(({ key, time }) => (
            <li key={key} className="flex items-center gap-2 mb-1">
              {editKey === key ? (
                <>
                  <input
                    type="time"
                    value={editTime}
                    onChange={(e) => setEditTime(e.target.value)}
                    className="text-black px-2 py-1 rounded"
                  />
                  <button
                    onClick={saveEdit}
                    className="bg-green-600 hover:bg-green-700 px-2 py-1 rounded text-sm"
                  >
                    Salvar
                  </button>
                </>
              ) : (
                <>
                  <span>{time}</span>
                  <button
                    onClick={() => {
                      setEditKey(key);
                      setEditTime(time);
                    }}
                    className="bg-yellow-600 hover:bg-yellow-700 px-2 py-1 rounded text-sm"
                  >
                    Editar
                  </button>
                </>
              )}
              <button
                onClick={() => deleteSchedule(key)}
                className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Agendamento Diário (Desligar)</h3>
        <div className="flex gap-2 mb-2">
          <input
            type="time"
            value={newTurnOffSchedule}
            onChange={(e) => setNewTurnOffSchedule(e.target.value)}
            className="px-2 py-1 rounded text-black"
          />
          <button
            onClick={addTurnOffSchedule}
            className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded"
          >
            Adicionar</button>
        </div>
        <ul className="list-disc list-inside">
          {turnOffSchedule.map(({ key, time }) => (
            <li key={key} className="flex items-center gap-2 mb-1">
              <span>{time}</span>
              <button
                onClick={() => deleteTurnOffSchedule(key)}
                className="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
