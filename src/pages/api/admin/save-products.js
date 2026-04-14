import fs from 'fs';
import path from 'path';

const productsPath = path.join(process.cwd(), 'src', 'data', 'products.json');

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }
  
  const { products } = req.body;
  fs.writeFileSync(productsPath, JSON.stringify(products, null, 2));
  res.status(200).json({ success: true });
}
