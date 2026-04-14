import fs from 'fs';
import path from 'path';

const featuresPath = path.join(process.cwd(), 'src', 'data', 'features.json');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }
  
  const { features, notes } = req.body;
  fs.writeFileSync(featuresPath, JSON.stringify({ features, notes }, null, 2));
  res.status(200).json({ success: true });
}
