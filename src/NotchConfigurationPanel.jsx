import React from 'react';

const NotchConfigurationPanel = ({ 
  tempNotchPositions, 
  hasChanges, 
  onUpdateNotchEnd, 
  onApplyChanges, 
  onCancelChanges 
}) => {
  return (
    <div style={{
      backgroundColor: "#333",
      padding: "20px",
      borderRadius: "8px",
      marginBottom: "20px",
      border: "1px solid #555"
    }}>
      <h2 style={{ color: "#fff", marginTop: 0, marginBottom: "15px" }}>
        Configuración de Muescas
      </h2>
      <p style={{ color: "#ccc", marginBottom: "15px" }}>
        Modifica el valor "end" de cada muesca y presiona "Aplicar Cambios".
      </p>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
        {tempNotchPositions.map((notch, index) => (
          <div key={index} style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <label style={{ color: "#fff", fontSize: "14px", fontWeight: "bold" }}>
              {notch.name}:
            </label>
            <div style={{ display: "flex", gap: "5px", alignItems: "center" }}>
              <span style={{ color: "#ccc", fontSize: "12px" }}>Start: {notch.start}"</span>
              <span style={{ color: "#ccc", fontSize: "12px" }}>→</span>
              <input
                type="number"
                value={notch.end}
                onChange={(e) => onUpdateNotchEnd(index, e.target.value)}
                step="0.01"
                min="0"
                max="8"
                style={{
                  padding: "8px",
                  borderRadius: "4px",
                  border: hasChanges ? "1px solid #ff9800" : "1px solid #555",
                  backgroundColor: "#222",
                  color: "#fff",
                  fontSize: "14px",
                  width: "80px"
                }}
                placeholder="End"
              />
              <span style={{ color: "#ccc", fontSize: "12px" }}>"</span>
            </div>
            <span style={{ 
              color: "#4CAF50",
              fontSize: "12px"
            }}>
              Posición: {((notch.end) * 25.4).toFixed(1)}mm
            </span>
          </div>
        ))}
      </div>

      {/* Botones de control */}
      <div style={{ 
        marginTop: "20px", 
        display: "flex", 
        gap: "10px", 
        justifyContent: "center",
        flexWrap: "wrap"
      }}>
        <button
          onClick={onApplyChanges}
          disabled={!hasChanges}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            backgroundColor: hasChanges ? "#4CAF50" : "#666",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: hasChanges ? "pointer" : "not-allowed",
            fontWeight: "bold"
          }}
        >
          ✅ Aplicar Cambios
        </button>
        <button
          onClick={onCancelChanges}
          disabled={!hasChanges}
          style={{
            padding: "12px 24px",
            fontSize: "16px",
            backgroundColor: hasChanges ? "#f44336" : "#666",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: hasChanges ? "pointer" : "not-allowed",
            fontWeight: "bold"
          }}
        >
          ❌ Cancelar
        </button>
      </div>

      {/* Indicador de cambios pendientes */}
      {hasChanges && (
        <div style={{ 
          marginTop: "15px", 
          padding: "10px", 
          backgroundColor: "#ff9800", 
          borderRadius: "4px",
          textAlign: "center"
        }}>
          <p style={{ color: "#000", margin: 0, fontWeight: "bold" }}>
            ⚠️ Cambios pendientes
          </p>
        </div>
      )}
    </div>
  );
};

export default NotchConfigurationPanel;
