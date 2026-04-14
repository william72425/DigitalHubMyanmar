import formidable from 'formidable-serverless';
import fs from 'fs';
import path from 'path';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = new formidable.IncomingForm();
  form.uploadDir = './tmp';
  form.keepExtensions = true;

  form.parse(req, async (err, fields, files) => {
    if (err) {
      return res.status(500).json({ error: 'Upload failed' });
    }

    const file = files.logo;
    const productId = fields.productId || Date.now();
    const ext = path.extname(file.name);
    const fileName = `${productId}-${Date.now()}${ext}`;
    const publicDir = path.join(process.cwd(), 'public', 'logos');
    
    // Ensure directory exists
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }
    
    const filePath = path.join(publicDir, fileName);
    fs.renameSync(file.filepath, filePath);
    
    const logoUrl = `/logos/${fileName}`;
    res.status(200).json({ logoUrl });
  });
  }
