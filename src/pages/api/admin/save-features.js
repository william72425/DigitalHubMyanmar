import fs from 'fs';
import path from 'path';

const featuresPath = path.join(process.cwd(), 'src', 'data', 'features.json');

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { features, product_notes } = req.body;
    
    const dir = path.dirname(featuresPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const dataToSave = JSON.stringify({ features: features || [], product_notes: product_notes || [] }, null, 2);
    fs.writeFileSync(featuresPath, dataToSave, 'utf8');
    
    res.status(200).json({ success: true, message: 'Saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
