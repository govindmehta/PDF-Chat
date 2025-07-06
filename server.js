import express from 'express';
import dotenv from 'dotenv';

import pdfRoutes from './routes/pdfRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { fileURLToPath } from 'url';
import path from 'path';
import env from 'dotenv';
import noteRoutes from './routes/noteRoutes.js';
import { authenticateUser } from './middlewares/authMiddleware.js';

import { swaggerSpec, swaggerUi } from './utils/swagger.js';

import YAML from 'yamljs';


const swaggerDocument = YAML.load('./openapi.yaml');


env.config();

import connectDB from './config/db.js';

connectDB();

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/pdf', authenticateUser, pdfRoutes);
app.use('/api/ai', authenticateUser, aiRoutes);
app.use('/api/user', userRoutes);
app.use('/api/notes', authenticateUser, noteRoutes); 

// Root route (optional)
app.get('/', (req, res) => {
  res.send('📄 PDF Helper AI Backend is Running!');
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
