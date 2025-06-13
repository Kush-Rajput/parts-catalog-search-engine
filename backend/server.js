import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/upload', uploadRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
