import fs from 'fs';
import path from 'path';

const featuresPath = path.join(process.cwd(), 'src', 'data', 'features.json');

export default async function handler(req, res) {
  // Allow CORS and disable cache
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { features, product_notes } = req.body;
    
    // Ensure directory exists
    const dir = path.dirname(featuresPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    // Read existing data to preserve what's not being updated
    let existingData = { features: [], product_notes: [] };
    if (fs.existsSync(featuresPath)) {
      try {
        existingData = JSON.parse(fs.readFileSync(featuresPath, 'utf8'));
      } catch (e) {
        console.log('Error parsing existing features.json');
      }
    }
    
    // Merge data: use new values if provided, otherwise keep existing
    const dataToSave = {
      features: features !== undefined ? features : existingData.features,
      product_notes: product_notes !== undefined ? product_notes : existingData.product_notes
    };
    
    fs.writeFileSync(featuresPath, JSON.stringify(dataToSave, null, 2), 'utf8');
    
    console.log('Saved to:', featuresPath);
    console.log('Features count:', dataToSave.features?.length);
    console.log('Notes count:', dataToSave.product_notes?.length);
    
    res.status(200).json({ success: true, message: 'Saved successfully' });
  } catch (error) {
    console.error('Save error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
