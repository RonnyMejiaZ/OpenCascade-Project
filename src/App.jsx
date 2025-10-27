import "@google/model-viewer";
import initOpenCascade from "opencascade.js";
import { visualizeShapes } from "../js/visualize.js";
import { useEffect, useState } from "react";


export const App = () => {
  const [modelUrl, setModelUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [occ, setOcc] = useState(null);
  const [boxShape, setBoxShape] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let mounted = true;

    initOpenCascade()
      .then((occ) => {
        if (!mounted) return;
        try {
          // Create a simple box as our 3D model
          const box = new occ.BRepPrimAPI_MakeBox_2(1, 1, 1);
          const boxShape = box.Shape();

          // Store references for export
          setOcc(occ);
          setBoxShape(boxShape);

          // Visualize the shape and get the GLB URL
          const url = visualizeShapes(occ, boxShape);
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

    return () => {
      mounted = false;
    };
  }, []);

  const handleExportStep = () => {
    if (!occ || !boxShape) return;

    setExporting(true);
    try {
      // Crear STEP Writer usando la implementación correcta
      const stepWriter = new occ.STEPControl_Writer_1();
      console.log("STEP Writer creado");
      
      // Transferir la forma al modelo STEP
      const transferStatus = stepWriter.Transfer(boxShape, occ.STEPControl_StepModelType.STEPControl_AsIs, true, new occ.Message_ProgressRange_1());
      
      if (transferStatus !== occ.IFSelect_ReturnStatus.IFSelect_RetDone) {
        throw new Error(`Error transfiriendo forma al modelo STEP: ${transferStatus}`);
      }
      console.log("Forma transferida al modelo STEP exitosamente");
      
      // Escribir a un archivo temporal y leerlo
      const tempFileName = "temp_model.step";
      const writeResult = stepWriter.Write(tempFileName);
      
      if (writeResult === occ.IFSelect_ReturnStatus.IFSelect_RetDone) {
        console.log("Archivo STEP escrito exitosamente");
        
        // Leer el archivo desde el sistema de archivos virtual
        const stepData = occ.FS.readFile(tempFileName, { encoding: "binary" });
        console.log(`Datos STEP leídos, tamaño: ${stepData.length} bytes`);
        
        // Crear blob y descargar
        const blob = new Blob([stepData.buffer], { type: "application/step" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "mi_modelo.step";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        console.log("Archivo STEP exportado exitosamente");
      } else {
        throw new Error(`Error escribiendo archivo STEP: ${writeResult}`);
      }
      
      // Cleanup de memoria
      stepWriter.delete();
      console.log("Memoria liberada");
      
    } catch (error) {
      console.error("Error exportando STEP:", error);
      setError("Error al exportar archivo STEP: " + error.message);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div>
        <h1>Generate Token App</h1>
        <p>Loading 3D model...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1>Generate Token App</h1>
        <p>Error: {error}</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h1>Exportador de STEP</h1>
      <p>Visualiza y exporta tu modelo 3D como archivo STEP</p>
      
      {modelUrl && (
        <>
          <model-viewer
            src={modelUrl}
            camera-controls
            enable-pan
            style={{ width: "100%", height: "400px", border: "1px solid #ddd", borderRadius: "8px" }}
          />
          
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
