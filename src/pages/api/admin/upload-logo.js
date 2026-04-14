export const config = {
  api: {
    bodyParser: {
      sizeLimit: '5mb',
    },
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = 'william72425/DigitalHubMyanmar';
  const branch = 'main';
  
  if (!token) {
    return res.status(500).json({ error: 'GITHUB_TOKEN not set' });
  }

  try {
    // Get the file from the request
    const { logo, productId } = req.body;
    const base64Data = logo.split(',')[1];
    const ext = logo.split(';')[0].split('/')[1];
    const fileName = `${productId}-${Date.now()}.${ext}`;
    const filePath = `public/logos/${fileName}`;
    
    // Get current file SHA (if exists)
    let sha = null;
    const getFileRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      headers: { Authorization: `token ${token}` }
    });
    if (getFileRes.ok) {
      const fileData = await getFileRes.json();
      sha = fileData.sha;
    }
    
    // Upload to GitHub
    const uploadRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `Upload logo for product ${productId}`,
        content: base64Data,
        sha: sha,
        branch: branch,
      }),
    });
    
    if (uploadRes.ok) {
      const logoUrl = `/logos/${fileName}`;
      res.status(200).json({ logoUrl });
    } else {
      const error = await uploadRes.json();
      res.status(500).json({ error: error.message });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
