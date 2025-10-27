/**
 * Aplicación de Exportación STEP - Frontend Only
 * 
 * Esta aplicación permite crear y exportar modelos 3D como archivos STEP
 * directamente en el navegador usando OpenCASCADE.js (WebAssembly).
 * 
 * Características:
 * - Sin servidor backend (100% frontend)
 * - Visualización 3D con model-viewer
 * - Exportación directa a formato STEP
 * - Gestión automática de memoria WebAssembly
 * 
 * Tecnologías:
 * - React + Vite
 * - OpenCASCADE.js (WebAssembly)
 * - Google Model Viewer
 */

import "@google/model-viewer";
import initOpenCascade from "opencascade.js";
import { visualizeShapes } from "../js/visualize.js";
import { useEffect, useState } from "react";
import NotchConfigurationPanel from "./NotchConfigurationPanel";


export const App = () => {
  const [modelUrl, setModelUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [occ, setOcc] = useState(null);
  const [boxShape, setBoxShape] = useState(null);
  const [exporting, setExporting] = useState(false);
  // Configuración inicial de muescas
  const initialNotches = [
    { start: 0.730, end: 0.860, name: "Notch 1" },
    { start: 1.800, end: 1.930, name: "Notch 2" },
    { start: 2.250, end: 2.380, name: "Notch 3" },
    { start: 3.120, end: 3.250, name: "Notch 4" },
    { start: 3.900, end: 4.030, name: "Notch 5" },
    { start: 4.220, end: 4.350, name: "Notch 6" },
    { start: 5.080, end: 5.210, name: "Notch 7" },
    { start: 5.460, end: 5.590, name: "Notch 8" },
    { start: 6.520, end: 6.650, name: "Notch 9" },
    { start: 7.370, end: 7.500, name: "Notch 10" }
  ];

  const [notchPositions, setNotchPositions] = useState(initialNotches);
  const [tempNotchPositions, setTempNotchPositions] = useState(initialNotches);
  const [hasChanges, setHasChanges] = useState(false);

  /**
   * Inicializa OpenCASCADE.js y crea la geometría 3D
   * Se ejecuta una sola vez al montar el componente
   */
  useEffect(() => {
    let mounted = true;

    // Inicializar OpenCASCADE.js (WebAssembly)
    // Esto carga la librería OpenCASCADE en el navegador
    initOpenCascade()
      .then((occ) => {
        if (!mounted) return;
        try {
          // Factor de conversión: 1 pulgada = 25.4 mm
          const INCH_TO_MM = 25.4;

          // 1. Crear barra principal (1/2" x 1/2" x 8.000")
          let mainBody = new occ.BRepPrimAPI_MakeBox_2(0.5 * INCH_TO_MM, 8.000 * INCH_TO_MM, 0.5 * INCH_TO_MM).Shape();

          // 2. Crear muescas
          notchPositions.forEach((notch) => {
            try {
              // Crear muesca
              const innerSquare = new occ.BRepPrimAPI_MakeBox_2(
                0.5 * INCH_TO_MM,    // width
                0.130 * INCH_TO_MM,  // height
                0.130 * INCH_TO_MM   // depth
              ).Shape();

              // Posicionar muesca
              const trsf = new occ.gp_Trsf_1();
              const xyz = new occ.gp_XYZ_1();
              xyz.SetX(0);
              xyz.SetY(notch.end * INCH_TO_MM);
              xyz.SetZ(0);
              trsf.SetTranslation_1(new occ.gp_Vec_3(xyz));

              const translatedInnerSquare = new occ.BRepBuilderAPI_Transform_2(
                innerSquare,
                trsf,
                false
              ).Shape();

              // Cortar muesca
              const cutOperation = new occ.BRepAlgoAPI_Cut_3(
                mainBody,
                translatedInnerSquare,
                new occ.Message_ProgressRange_1()
              );
              cutOperation.Build(new occ.Message_ProgressRange_1());

              if (cutOperation.IsDone()) {
                mainBody = cutOperation.Shape();
              }

              // Limpiar memoria
              [trsf, xyz, translatedInnerSquare, innerSquare, cutOperation].forEach(obj => obj.delete());

            } catch (error) {
              console.log(`Error creando ${notch.name}:`, error.message);
            }
          });

          // 4. El resultado final es mainBody con todos los agujeros
          const finalShape = mainBody;

          // Almacenar referencias para la exportación STEP
          setOcc(occ);           // Instancia de OpenCASCADE
          setBoxShape(finalShape); // Forma 3D con muesca

          // Generar visualización 3D y obtener URL del modelo GLB
          const url = visualizeShapes(occ, finalShape);
          setModelUrl(url);
          setLoading(false);
        } catch (err) {
          console.error("Failed to create model:", err);
          setError(err.message);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to init OpenCascade:", err);
        setError(err.message);
        setLoading(false);
      });

    // Cleanup: prevenir actualizaciones de estado si el componente se desmonta
    return () => {
      mounted = false;
    };
  }, [notchPositions]);

  // Funciones de actualización simplificadas
  const updateTempNotchEnd = (index, newEnd) => {
    setTempNotchPositions(prev => 
      prev.map((notch, i) => 
        i === index ? { ...notch, end: parseFloat(newEnd) || 0 } : notch
      )
    );
    setHasChanges(true);
  };

  const applyChanges = () => {
    setNotchPositions([...tempNotchPositions]);
    setHasChanges(false);
  };

  const cancelChanges = () => {
    setTempNotchPositions([...notchPositions]);
    setHasChanges(false);
  };

  // Función de exportación simplificada
  const handleExportStep = () => {
    if (!occ || !boxShape) return;

    setExporting(true);
    try {
      const stepWriter = new occ.STEPControl_Writer_1();
      
      const transferStatus = stepWriter.Transfer(
        boxShape,
        occ.STEPControl_StepModelType.STEPControl_AsIs,
        true,
        new occ.Message_ProgressRange_1()
      );

      if (transferStatus !== occ.IFSelect_ReturnStatus.IFSelect_RetDone) {
        throw new Error(`Error transfiriendo forma: ${transferStatus}`);
      }

      const tempFileName = "temp_model.step";
      const writeResult = stepWriter.Write(tempFileName);

      if (writeResult === occ.IFSelect_ReturnStatus.IFSelect_RetDone) {
        const stepData = occ.FS.readFile(tempFileName, { encoding: "binary" });
        const blob = new Blob([stepData.buffer], { type: "application/step" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "token_model.step";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error(`Error escribiendo archivo: ${writeResult}`);
      }

      stepWriter.delete();
    } catch (error) {
      console.error("Error exportando STEP:", error);
      setError("Error al exportar: " + error.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: "20px", 
        backgroundColor: "#000000", 
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "#ffffff"
      }}>
        <h1>Generate Token App</h1>
        <p>Loading 3D model...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: "20px", 
        backgroundColor: "#000000", 
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        color: "#ffffff"
      }}>
        <h1>Generate Token App</h1>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ 
      padding: "20px", 
      maxWidth: "600px", 
      margin: "0 auto",
      backgroundColor: "#000000",
      minHeight: "100vh",
      color: "#ffffff"
    }}>
      {/* Título principal de la aplicación */}
      <h1>Exportador de STEP</h1>
      <p>Visualiza y exporta tu modelo 3D como archivo STEP</p>

      {/* Panel de configuración de muescas */}
      <NotchConfigurationPanel
        tempNotchPositions={tempNotchPositions}
        hasChanges={hasChanges}
        onUpdateNotchEnd={updateTempNotchEnd}
        onApplyChanges={applyChanges}
        onCancelChanges={cancelChanges}
      />

      {/* Solo mostrar el visor y botón cuando el modelo esté listo */}
      {modelUrl && (
        <>
          {/* Visor 3D usando model-viewer de Google */}
          {/* Muestra el modelo GLB generado por OpenCASCADE */}
          <model-viewer
            src={modelUrl}
            camera-controls
            enable-pan
            style={{ width: "100%", height: "400px", border: "1px solid #ddd", borderRadius: "8px" }}
          />

          {/* Controles de exportación */}
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              onClick={handleExportStep}
              disabled={exporting}
              style={{
                padding: "12px 24px",
                fontSize: "16px",
                backgroundColor: exporting ? "#ccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: exporting ? "not-allowed" : "pointer"
              }}
            >
              {exporting ? "Exportando..." : "Exportar como STEP"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};
