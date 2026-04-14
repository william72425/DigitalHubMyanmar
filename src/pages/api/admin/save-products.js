export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  const { products } = req.body;
  const token = process.env.GITHUB_TOKEN;
  const repo = 'william72425/DigitalHubMyanmar';
  const path = 'src/data/products.json';
  
  // Log for debugging (will show in Vercel logs)
  console.log('Token exists:', !!token);
  console.log('Products count:', products?.length);
  
  if (!token) {
    return res.status(500).json({ success: false, error: 'GITHUB_TOKEN not set' });
  }
  
  try {
    // 1. Get current file info (to get SHA)
    const getFileRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      headers: { 
        Authorization: `token ${token}`,
        'User-Agent': 'DigitalHub-Admin'
      }
    });
    
    if (!getFileRes.ok) {
      console.error('GitHub GET error:', await getFileRes.text());
      return res.status(500).json({ success: false, error: `GitHub GET failed: ${getFileRes.status}` });
    }
    
    const fileData = await getFileRes.json();
    const sha = fileData.sha;
    
    // 2. Update file
    const content = Buffer.from(JSON.stringify(products, null, 2)).toString('base64');
    const updateRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
      method: 'PUT',
      headers: { 
        Authorization: `token ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'DigitalHub-Admin'
      },
      body: JSON.stringify({
        message: 'Update products via admin panel',
        content: content,
        sha: sha,
        branch: 'main'
      })
    });
    
    if (updateRes.ok) {
      res.status(200).json({ success: true });
    } else {
      const errorText = await updateRes.text();
      console.error('GitHub PUT error:', errorText);
      res.status(500).json({ success: false, error: `GitHub PUT failed: ${updateRes.status}` });
    }
  } catch (error) {
    console.error('Unexpected error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
}
