import fs from 'fs';
import path from 'path';

const featuresPath = path.join(process.cwd(), 'src', 'data', 'features.json');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { features, product_notes } = req.body;
    
    const dir = path.dirname(featuresPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Keep existing data structure
    const existingData = fs.existsSync(featuresPath) 
      ? JSON.parse(fs.readFileSync(featuresPath, 'utf8')) 
      : { features: [], product_notes: [] };
    
    const dataToSave = {
      features: features !== undefined ? features : existingData.features,
      product_notes: product_notes !== undefined ? product_notes : existingData.product_notes
    };
    
    fs.writeFileSync(featuresPath, JSON.stringify(dataToSave, null, 2), 'utf8');
    
    res.status(200).json({ success: true, message: 'Saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
