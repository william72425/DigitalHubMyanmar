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
    const { image, productId, type } = req.body;
    
    // Remove data:image/png;base64, prefix if exists
    let base64Data = image;
    if (image.includes(',')) {
      base64Data = image.split(',')[1];
    }
    
    // Get file extension
    let ext = 'png';
    if (image.includes('jpeg') || image.includes('jpg')) {
      ext = 'jpg';
    } else if (image.includes('webp')) {
      ext = 'webp';
    } else if (image.includes('png')) {
      ext = 'png';
    }
    
    const fileName = `${productId}-${type}-${Date.now()}.${ext}`;
    const filePath = `public/posters/${fileName}`;
    
    // Check if file already exists (to get SHA for update)
    let sha = null;
    const getFileRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      headers: { 
        Authorization: `token ${token}`,
        'User-Agent': 'DigitalHub-Admin'
      }
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
        'User-Agent': 'DigitalHub-Admin'
      },
      body: JSON.stringify({
        message: `Upload ${type} poster for product ${productId}`,
        content: base64Data,
        sha: sha,
        branch: branch,
      }),
    });
    
    if (uploadRes.ok) {
      const imageUrl = `/posters/${fileName}`;
      res.status(200).json({ imageUrl });
    } else {
      const error = await uploadRes.json();
      console.error('GitHub upload error:', error);
      res.status(500).json({ error: error.message || 'Upload failed' });
    }
  } catch (error) {
    console.error('Upload poster error:', error);
    res.status(500).json({ error: error.message });
  }
}
