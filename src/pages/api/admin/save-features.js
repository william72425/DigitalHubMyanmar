export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = 'william72425/DigitalHubMyanmar';
  const filePath = 'src/data/features.json';
  
  try {
    const response = await fetch(`https://api.github.com/repos/${repo}/contents/${filePath}`, {
      headers: { Authorization: `token ${token}` }
    });
    
    if (response.ok) {
      const data = await response.json();
      const content = Buffer.from(data.content, 'base64').toString('utf8');
      res.status(200).json(JSON.parse(content));
    } else {
      // File doesn't exist, return empty
      res.status(200).json({ features: [], notes: [] });
    }
  } catch (error) {
    res.status(200).json({ features: [], notes: [] });
  }
}
