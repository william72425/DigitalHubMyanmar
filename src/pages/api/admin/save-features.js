import fs from 'fs';
import path from 'path';

const featuresPath = path.join(process.cwd(), 'src', 'data', 'features.json');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }
  
  try {
    const { features, notes } = req.body;
    
    // Ensure directory exists
    const dir = path.dirname(featuresPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(featuresPath, JSON.stringify({ features, notes }, null, 2));
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Save features error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
