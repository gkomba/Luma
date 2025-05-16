import { useEffect, useState } from "react";
import { ref, onValue, set } from "firebase/database";
import { db } from "../firebaseConfig";

export default function CircuitoStatus({ isOn, onToggle }) {
    const [circuitData, setCircuitData] = useState({
        consumo: 0,
        saude: "normal",
        limiteCarga: 1500,
    });

    useEffect(() => {
        const circuitoRef = ref(db, "circuito");
        const unsubscribe = onValue(circuitoRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setCircuitData({
                    consumo: data.consumo ?? 0,
                    saude: data.saude ?? "desconhecido",
                    limiteCarga: data.limiteCarga ?? 1500,
                });
            }
        });
        return () => unsubscribe();
    }, []);

    const atualizarLimite = (novoLimite) => {
        set(ref(db, "circuito/limiteCarga"), novoLimite);
    };

    useEffect(() => {
        if (circuitData.consumo > circuitData.limiteCarga) {
            set(ref(db, "circuito/saude"), "Sobrecarga");
        }
        else if (circuitData.consumo < circuitData.limiteCarga) {
            set(ref(db, "circuito/saude"), "Normal");
        }
    }, [circuitData.consumo, circuitData.limiteCarga]);

    return (
        <div className="space-y-4 text-white">
            <h2 className="text-2xl font-bold"> Informacões do Circuito </h2>

            <p>
                Estado: <strong>{isOn ? "Ligado" : "Desligado"}</strong>
            </p>

            <p>
                Consumo atual: <strong>{circuitData.consumo} W</strong>
            </p>

            <p>
                Saúde: <strong>{circuitData.saude}</strong>
            </p>

            <button
                className={`px-4 py-2 rounded ${isOn ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                    }`}
                onClick={onToggle}
            >
                {isOn ? "Desligar" : "Ligar"}
            </button>

            <div className="mt-4">
                <label className="block mb-1">Limite de carga (W):</label>
                <input
                    type="number"
                    value={circuitData.limiteCarga === 0 ? "" : circuitData.limiteCarga}
                    onChange={(e) => {
                        const value = e.target.value === "" ? 0 : Number(e.target.value);
                        atualizarLimite(value);
                    }}
                    className="text-black px-2 py-1 rounded"
                />
            </div>

            {circuitData.consumo > circuitData.limiteCarga && (
                <div className="p-4 bg-red-500 rounded mt-4">
                    🚨 <strong>Alerta:</strong> Consumo acima do limite! Corte o circuito se necessário.
                </div>
            )}
        </div>
    );
}
