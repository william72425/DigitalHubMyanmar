import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { products } = req.body;
    const productsPath = path.join(process.cwd(), 'src', 'data', 'products.json');
    
    // Ensure the directory exists
    const dir = path.dirname(productsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(productsPath, JSON.stringify(products, null, 2), 'utf8');
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Save error:', error);
    return res.status(500).json({ error: 'Failed to save products' });
  }
}
