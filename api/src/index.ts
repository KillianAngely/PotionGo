import express  from 'express';
import type {  Request,  Response } from 'express';
import cors  from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ message: 'Hello from PotionGo API!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT} 🌍`);
});