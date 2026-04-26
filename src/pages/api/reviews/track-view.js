// In-memory view tracking (no database storage)
const viewCounts = {};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { reviewId } = req.body;

  if (!reviewId) {
    return res.status(400).json({ error: 'Review ID is required' });
  }

  try {
    // Increment view count for this review
    if (!viewCounts[reviewId]) {
      viewCounts[reviewId] = 0;
    }
    viewCounts[reviewId]++;

    return res.status(200).json({
      reviewId,
      views: viewCounts[reviewId],
    });
  } catch (error) {
    console.error('Error tracking view:', error);
    return res.status(500).json({ error: 'Failed to track view' });
  }
}
