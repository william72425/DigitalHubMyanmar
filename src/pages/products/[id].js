import { useRouter } from 'next/router';
import productsData from '@/data/products.json';

export default function ProductDetail() {
  const router = useRouter();
  const { id } = router.query;
  const product = productsData.find(p => p.id === parseInt(id));

  if (!product) return <div className="p-8 text-white">Product not found</div>;

  return (
    <div className="min-h-screen bg-[#020617] text-white p-8">
      <h1 className="text-3xl font-bold">{product.name}</h1>
      <p>Price: {product.hubby_price.toLocaleString()} MMK</p>
      {product.discount && <p>Discount: {product.discount}% OFF</p>}
      <p>Duration: {product.duration}</p>
      <h2>Features:</h2>
      <ul>
        {product.features?.map((f, i) => <li key={i}>✓ {f}</li>)}
      </ul>
    </div>
  );
}
