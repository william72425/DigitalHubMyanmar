export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = 'william72425/DigitalHubMyanmar';
  const branch = 'main';
  const filePath = 'src/data/features.json';
  
  if (!token) {
    return res.status(500).json({ success: false, error: 'GITHUB_TOKEN not set' });
  }

  try {
    const { features, product_notes } = req.body;
    
    const dataToSave = JSON.stringify({ 
      features: features || [], 
      product_notes: product_notes || [] 
    }, null, 2);
    
    const content = Buffer.from(dataToSave).toString('base64');
    
    // Get current file SHA (if exists)
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
    
    // Update file on GitHub
    const updateRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      method: 'PUT',
      headers: {
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'DigitalHub-Admin'
      },
      body: JSON.stringify({
        message: 'Update features and notes via admin panel',
        content: content,
        sha: sha,
        branch: branch,
      }),
    });
    
    if (updateRes.ok) {
      return res.status(200).json({ success: true, message: 'Saved to GitHub' });
    } else {
      const error = await updateRes.json();
      console.error('GitHub API error:', error);
      return res.status(500).json({ success: false, error: error.message });
    }
  } catch (error) {
    console.error('Save features error:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
