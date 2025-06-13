import React, { useState, useEffect, useMemo } from 'react';
import { FaCogs, FaTachometerAlt } from 'react-icons/fa';

const categories = [
  { name: 'Engines', icon: <FaCogs /> },
  { name: 'Service Parts', icon: <FaTachometerAlt /> },
];

const apiRoutes = {
  Engines: ['/api/engines'],
  'Service Parts': ['/api/sparkplugs', '/api/filters'],
};

const getBackendBaseUrl = () => {
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:8000`;
};

export default function PartsCategoriesPage() {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const backendBaseUrl = useMemo(() => getBackendBaseUrl(), []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedCategory || !debouncedSearchTerm) return;

      const urls = apiRoutes[selectedCategory];
      const params = new URLSearchParams({
        q: debouncedSearchTerm,
        page: 1,
        page_size: 30,
      });

      setIsLoading(true);
      setResults([]);

      try {
        const allResults = await Promise.all(
          urls.map(async (url) => {
            const res = await fetch(`${backendBaseUrl}${url}?${params}`);
            if (!res.ok) throw new Error(`Failed to fetch ${url}`);
            const json = await res.json();
            return json.results.map(item => ({
              ...item,
              sheet: item.sheet || url.split('/').pop(),
            }));
          })
        );
        setResults(allResults.flat());
      } catch (err) {
        console.error('❌ Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedCategory, debouncedSearchTerm, backendBaseUrl]);

  const groupedResults = useMemo(() => {
    return results.reduce((acc, item) => {
      const group = item.sheet || 'Other';
      acc[group] = acc[group] || [];
      acc[group].push(item);
      return acc;
    }, {});
  }, [results]);

  const renderCard = (item, index) => {
    const label = Object.entries(item).find(
      ([k, v]) => v && !['sheet', 'source', 'Qty', 'QTY', 'NOTE'].includes(k)
    );
    return (
      <div
        key={index}
        className="bg-white rounded-2xl shadow hover:shadow-lg p-4 border border-gray-200"
      >
        <h4 className="font-semibold text-blue-800 mb-2 text-md truncate">
          {label ? label[1] : 'Unnamed Part'}
        </h4>
        <ul className="text-sm text-gray-700 space-y-1">
          {Object.entries(item).map(([k, v]) =>
            !['sheet', 'source'].includes(k) && v ? (
              <li key={k}>
                <strong>{k}:</strong> {v}
              </li>
            ) : null
          )}
        </ul>
      </div>
    );
  };

  const renderSkeletons = () =>
    Array.from({ length: 6 }).map((_, i) => (
      <div
        key={i}
        className="bg-gray-200 animate-pulse rounded-2xl p-4 h-32"
      ></div>
    ));

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100 py-10 px-6">
      <h1 className="text-4xl font-extrabold text-center mb-10 text-gray-900">Browse Parts</h1>
      {selectedCategory ? (
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => {
              setSelectedCategory(null);
              setSearchTerm('');
              setResults([]);
            }}
            className="text-blue-600 hover:text-blue-800 font-semibold mb-6 flex items-center gap-2"
          >
            ← Back to Categories
          </button>
          <input
            type="text"
            placeholder="Search exact part, model, or OE number..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full mb-8 p-3 rounded-lg border border-gray-300 shadow focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
              {renderSkeletons()}
            </div>
          )}
          {!isLoading && Object.keys(groupedResults).length > 0 ? (
            Object.entries(groupedResults).map(([sheet, items]) => (
              <div key={sheet} className="mb-10">
                <h2 className="text-xl font-bold text-blue-700 mb-4 border-b pb-1 capitalize">
                  {sheet}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {items.map(renderCard)}
                </div>
              </div>
            ))
          ) : (
            debouncedSearchTerm && !isLoading && (
              <p className="text-center text-gray-500 italic">No matching parts found.</p>
            )
          )}
        </div>
      ) : (
        <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {categories.map((cat, i) => (
            <button
              key={i}
              onClick={() => setSelectedCategory(cat.name)}
              className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow hover:shadow-lg transition hover:scale-105"
            >
              <div className="text-4xl text-blue-500 mb-2">{cat.icon}</div>
              <span className="font-semibold text-sm text-gray-800">{cat.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
