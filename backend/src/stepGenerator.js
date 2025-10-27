// Generador de archivos STEP usando solo OpenCascade.js
export async function generateStepFile(geometryData) {
  console.log("Initializing OpenCascade.js...");
  const initOpenCascade = (await import("opencascade.js")).default;
  const oc = await initOpenCascade();
  console.log("OpenCascade.js initialized successfully");

  const { type, dimensions } = geometryData;
  let shape;
  let makeBox, makeCylinder, makeSphere;

  // Crear geometría según el tipo
  if (type === "box") {
    const { width, height, depth } = dimensions;
    console.log(`Creating box with dimensions: ${width}x${height}x${depth}`);
    
    // Crear puntos para el cubo
    const pt1 = new oc.gp_Pnt_3(0, 0, 0);
    const pt2 = new oc.gp_Pnt_3(width, height, depth);
    makeBox = new oc.BRepPrimAPI_MakeBox_2(pt1, pt2);
    
    if (!makeBox.IsDone()) {
      throw new Error("Error creating box geometry");
    }
    shape = makeBox.Shape();
    
    // Cleanup
    pt1.delete();
    pt2.delete();
    
  } else if (type === "cylinder") {
    const { radius, height } = dimensions;
    console.log(`Creating cylinder with radius: ${radius}, height: ${height}`);
    
    makeCylinder = new oc.BRepPrimAPI_MakeCylinder(radius, height);
    if (!makeCylinder.IsDone()) {
      throw new Error("Error creating cylinder geometry");
    }
    shape = makeCylinder.Shape();
    
  } else if (type === "sphere") {
    const { radius } = dimensions;
    console.log(`Creating sphere with radius: ${radius}`);
    
    makeSphere = new oc.BRepPrimAPI_MakeSphere(radius);
    if (!makeSphere.IsDone()) {
      throw new Error("Error creating sphere geometry");
    }
    shape = makeSphere.Shape();
    
  } else {
    throw new Error(`Unsupported geometry type: ${type}`);
  }

  console.log("Geometry created successfully");

  // Crear STEP Writer
  const stepWriter = new oc.STEPControl_Writer_1();
  console.log("STEP Writer created");

  // Transferir la forma al modelo STEP
  const transferStatus = stepWriter.Transfer(shape, oc.STEPControl_StepModelType.STEPControl_AsIs, true);
  
  if (transferStatus !== oc.IFSelect_ReturnStatus.IFSelect_RetDone) {
    throw new Error(`Error transferring shape to STEP model: ${transferStatus}`);
  }
  console.log("Shape transferred to STEP model successfully");

  // Escribir STEP data a string
  const stepString = stepWriter.WriteToString();
  console.log(`STEP string generated, length: ${stepString.length}`);

  // Cleanup de memoria
  if (makeBox) makeBox.delete();
  if (makeCylinder) makeCylinder.delete();
  if (makeSphere) makeSphere.delete();
  stepWriter.delete();
  console.log("Memory cleaned up");

  return stepString;
}

