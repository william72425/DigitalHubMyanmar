import fs from 'fs';
import path from 'path';

const productsPath = path.join(process.cwd(), 'src', 'data', 'products.json');

export default function handler(req, res) {
  if (req.method === 'GET') {
    const data = fs.readFileSync(productsPath, 'utf8');
    res.status(200).json(JSON.parse(data));
  } else {
    res.status(405).end();
  }
}
