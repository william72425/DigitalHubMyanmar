export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = 'william72425/DigitalHubMyanmar';
  const filePath = 'src/data/features.json';
  
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      headers: { 
        Authorization: `token ${token}`,
        'User-Agent': 'DigitalHub-Admin'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      const content = Buffer.from(data.content, 'base64').toString('utf8');
      const jsonData = JSON.parse(content);
      
      // Ensure both arrays exist
      if (!jsonData.features) jsonData.features = [];
      if (!jsonData.product_notes) jsonData.product_notes = [];
      
      return res.status(200).json(jsonData);
    } else {
      // File doesn't exist, return empty
      return res.status(200).json({ features: [], product_notes: [] });
    }
  } catch (error) {
    return res.status(200).json({ features: [], product_notes: [] });
  }
}
