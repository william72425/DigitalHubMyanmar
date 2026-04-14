import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import productsData from '@/data/products.json';

// IMPORTANT: Dynamic import to avoid cache
let featuresData = { features: [], product_notes: [] };
try {
  featuresData = require('@/data/features.json');
} catch (e) {
  console.log('No features.json yet');
}

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [product, setProduct] = useState(null);
  const [features, setFeatures] = useState([]);
  const [productNote, setProductNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showContactOptions, setShowContactOptions] = useState(false);

  useEffect(() => {
    if (id) {
      const productId = parseInt(id);
      const found = productsData.find(p => p.id === productId);
      setProduct(found);
      
      // Force reload features.json
      const loadData = async () => {
        const res = await fetch('/api/admin/features');
        const freshData = await res.json();
        console.log('Fresh data from API:', freshData);
        
        const productFeatures = freshData.features?.filter(f => f.product_id === productId) || [];
        setFeatures(productFeatures);
        
        const note = freshData.product_notes?.find(n => n.product_id === productId);
        setProductNote(note || null);
      };
      
      loadData();
      setLoading(false);
    }
  }, [id]);

  // ... rest of your component (getDisplayPrice, calculateSavings, etc.)

  return (
    // ... your JSX
    {productNote && productNote.content ? (
      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-4 mb-6">
        <h3 className="text-yellow-500 font-bold mb-2">{productNote.title || '📌 မှတ်ချက်'}</h3>
        <p className="text-gray-300 text-sm">{productNote.content}</p>
      </div>
    ) : null}
    // ...
  );
}
