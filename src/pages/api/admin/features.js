import fs from 'fs';
import path from 'path';

const featuresPath = path.join(process.cwd(), 'src', 'data', 'features.json');

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  if (req.method === 'GET') {
    try {
      if (!fs.existsSync(featuresPath)) {
        fs.writeFileSync(featuresPath, JSON.stringify({ features: [], product_notes: [] }, null, 2));
      }
      const data = fs.readFileSync(featuresPath, 'utf8');
      res.status(200).json(JSON.parse(data));
    } catch (error) {
      res.status(200).json({ features: [], product_notes: [] });
    }
  } else {
    res.status(405).end();
  }
}
