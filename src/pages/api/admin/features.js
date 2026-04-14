import fs from 'fs';
import path from 'path';

const featuresPath = path.join(process.cwd(), 'src', 'data', 'features.json');

export default function handler(req, res) {
  if (req.method === 'GET') {
    const data = fs.readFileSync(featuresPath, 'utf8');
    res.status(200).json(JSON.parse(data));
  } else {
    res.status(405).end();
  }
}
