import React, { useEffect, useState, useRef } from 'react';
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function ServicePartsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [parts, setParts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const controllerRef = useRef(null);

  const endpoints = ['/api/sparkplugs', '/api/filters'];

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  const fetchParts = async (search = '', pageNum = 1) => {
    try {
      if (controllerRef.current) controllerRef.current.abort();
      controllerRef.current = new AbortController();
      setLoading(true);

      const params = new URLSearchParams({ page: pageNum, page_size: 30 });
      if (search) params.append('q', search);

      const allResults = [];

      for (const endpoint of endpoints) {
        const res = await fetch(`http://localhost:8000${endpoint}?${params}`, {
          signal: controllerRef.current.signal,
        });
        if (!res.ok) throw new Error(`Failed to fetch ${endpoint}`);
        const data = await res.json();
        allResults.push(...data.results);
      }

      setParts(prev => (pageNum === 1 ? allResults : [...prev, ...allResults]));
      setHasMore(allResults.length > 0);
      setPage(pageNum);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Fetch error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParts(debouncedSearch, 1);
  }, [debouncedSearch]);

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchParts(debouncedSearch, page + 1);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <button
        className="flex items-center text-blue-600 mb-6 hover:underline"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft className="mr-2" />
        Back
      </button>
      <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
        Service Parts Search
      </h2>
      <input
        type="text"
        placeholder="Search by exact Frame No, Part No, etc..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="w-full p-3 rounded-xl border border-gray-300 mb-6"
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {parts.map((item, idx) => (
          <div key={idx} className="bg-white rounded-xl p-5 shadow border">
            <h4 className="text-lg font-semibold text-blue-800 mb-1">
              {item.Description || item['Part Number'] || 'Unnamed'}
            </h4>
            <ul className="text-sm text-gray-700 space-y-1">
              {Object.entries(item).map(([k, v]) =>
                !['source', 'sheet'].includes(k) && v ? (
                  <li key={k}>
                    <strong>{k}:</strong> {String(v)}
                  </li>
                ) : null
              )}
            </ul>
            <div className="text-xs text-gray-400 mt-2">
              Source: {item.source || '-'} / {item.sheet || '-'}
            </div>
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="text-center mt-6">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
      {!loading && parts.length === 0 && debouncedSearch && (
        <p className="text-center text-red-500 italic mt-10">
          No exact match found.
        </p>
      )}
    </div>
  );
}
