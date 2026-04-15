import fs from 'fs';
import path from 'path';

const featuresPath = path.join(process.cwd(), 'src', 'data', 'features.json');

export default function handler(req, res) {
  // Disable cache
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  if (req.method === 'GET') {
    try {
      if (!fs.existsSync(featuresPath)) {
        fs.writeFileSync(featuresPath, JSON.stringify({ features: [], product_notes: [] }, null, 2));
      }
      const data = fs.readFileSync(featuresPath, 'utf8');
      const jsonData = JSON.parse(data);
      
      // Ensure both arrays exist
      if (!jsonData.features) jsonData.features = [];
      if (!jsonData.product_notes) jsonData.product_notes = [];
      
      res.status(200).json(jsonData);
    } catch (error) {
      res.status(200).json({ features: [], product_notes: [] });
    }
  } else {
    res.status(405).end();
  }
}
