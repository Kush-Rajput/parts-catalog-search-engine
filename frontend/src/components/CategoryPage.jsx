import { useParams } from 'react-router-dom';

export default function CategoryPage() {
  const { categoryName } = useParams();

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold capitalize">
        {categoryName.replace(/-/g, ' ')}
      </h1>
      <p className="mt-4 text-gray-700">
        Showing parts for the <strong>{categoryName.replace(/-/g, ' ')}</strong> category.
      </p>
    </div>
  );
}
