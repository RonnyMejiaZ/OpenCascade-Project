import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateStepFile } from './stepGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Endpoint para generar archivos STEP usando OpenCascade.js
app.post('/api/generate-step', async (req, res) => {
  try {
    const { geometryData, filename = 'model.step' } = req.body;
    
    if (!geometryData) {
      return res.status(400).json({ error: 'Geometry data is required' });
    }

    // Generar el archivo STEP usando OpenCascade.js
    const stepContent = await generateStepFile(geometryData);
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/step');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.send(stepContent);
  } catch (error) {
    console.error('Error generating STEP file:', error);
    res.status(500).json({ error: 'Failed to generate STEP file: ' + error.message });
  }
});

// Endpoint de salud
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'STEP Generator API is running' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
