import React from "react";

export default function DefaultDeviceControl({ name, isOn, onToggle }) {
  return (
    <>
      <h2 className="text-2xl font-bold mb-4 text-white">{name}</h2>
      <p className="text-2xl font-bold mb-4 text-white">
        Status:{" "}
        <span className="font-semibold">{isOn ? "Ligado" : "Desligado"}</span>
      </p>
      <button
        className={`mt-4 px-4 py-2 rounded transition ${
          isOn ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
        }`}
        onClick={onToggle}
      >
        {isOn ? "Desligar" : "Ligar"}
      </button>
    </>
  );
}
