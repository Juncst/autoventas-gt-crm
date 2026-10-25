
import { useState } from "react";
import Clientes from "./components/Clientes/Clientes";
import Prospectos from "./components/Prospectos/Prospectos";

function App() {
  const [pantalla, setPantalla] = useState("prospectos");

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "12px",
          padding: "15px 24px",
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <button
          type="button"
          onClick={() => setPantalla("clientes")}
          style={{
            padding: "12px 20px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            backgroundColor:
              pantalla === "clientes" ? "#082b7a" : "#e8eef8",
            color: pantalla === "clientes" ? "white" : "#082b7a",
          }}
        >
          Clientes
        </button>

        <button
          type="button"
          onClick={() => setPantalla("prospectos")}
          style={{
            padding: "12px 20px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            backgroundColor:
              pantalla === "prospectos" ? "#082b7a" : "#e8eef8",
            color: pantalla === "prospectos" ? "white" : "#082b7a",
          }}
        >
          Prospectos
        </button>
      </div>

      {pantalla === "clientes" ? <Clientes /> : <Prospectos />}
    </div>
  );
}

export default App;
