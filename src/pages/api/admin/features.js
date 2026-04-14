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
    const { features, notes } = req.body;
    const content = Buffer.from(JSON.stringify({ features, notes }, null, 2)).toString('base64');
    
    // Get current file SHA
    let sha = null;
    const getFileRes = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      headers: { Authorization: `token ${token}` }
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
      },
      body: JSON.stringify({
        message: 'Update features via admin panel',
        content: content,
        sha: sha,
        branch: branch,
      }),
    });
    
    if (updateRes.ok) {
      res.status(200).json({ success: true });
    } else {
      const error = await updateRes.json();
      res.status(500).json({ success: false, error: error.message });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
