import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { db } from "../firebaseConfig";

export default function CircuitoStatus({ isOn, onToggle }) {
    const [circuitData, setCircuitData] = useState(null);

    useEffect(() => {
        const circuitoRef = ref(db, "circuito");
        const unsubscribe = onValue(circuitoRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                setCircuitData(data);
            } else {
                setCircuitData(null);
            }
        });

        return () => unsubscribe();
    }, []);

    if (!circuitData) {
        return <p className="text-white">Carregando dados do circuito...</p>;
    }

    return (
        <div className="space-y-4 text-white">
            <h2 className="text-2xl font-bold">Informações do Circuito</h2>

            <p>
                Estado: <strong>{isOn ? "Ligado" : "Desligado"}</strong>
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

            {circuitData.saude == "ALERT" && (
                <div className="p-4 bg-red-500 rounded mt-4">
                    🚨 <strong>Alerta:</strong> {circuitData.info} .
                </div>
            )}
        </div>
    );
}