import React, { useEffect, useState } from 'react';
import { FaArrowLeft, FaArrowUp } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

export default function EngineSearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [engines, setEngines] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const navigate = useNavigate();

  const fetchEngines = async (search = searchTerm, pageNum = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: pageNum, page_size: 30 });
    if (search) params.append("q", search);

    try {
      const res = await fetch(`http://localhost:8000/api/engines?${params}`);
      const data = await res.json();
      const newData = pageNum === 1 ? data.results : [...engines, ...data.results];

      setEngines(newData);
      setHasMore(data.has_more);
      setPage(pageNum);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEngines();
  }, []);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    fetchEngines(val, 1);
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const loadMore = () => {
    if (!loading && hasMore) fetchEngines(searchTerm, page + 1);
  };

  // Group items by sheet name
  const groupedBySheet = engines.reduce((acc, item) => {
    const sheet = item.sheet || 'Unknown';
    if (!acc[sheet]) acc[sheet] = [];
    acc[sheet].push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 bg-gray-50 min-h-screen relative">
      <button
        className="flex items-center text-blue-600 hover:text-blue-800 mb-6"
        onClick={() => navigate(-1)}
      >
        <FaArrowLeft className="mr-2" />
        Back
      </button>

      <h1 className="text-4xl font-extrabold text-center text-gray-800 mb-10">
        Engine / OE Reference Lookup
      </h1>

      <div className="mb-12">
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Search by engine, OE ref..."
          className="w-full p-4 border border-gray-300 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
        />
      </div>

      {Object.keys(groupedBySheet).length > 0 ? (
        Object.entries(groupedBySheet).map(([sheet, items]) => (
          <div key={sheet} className="mb-16">
            <h2 className="text-2xl font-bold text-blue-700 mb-6 border-b-2 pb-2 border-blue-200">
              {sheet}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition"
                >
                  <h3 className="text-lg font-semibold text-blue-600 mb-2">
                    {item.PartNumber || item.Engine || item.OE || 'No title'}
                  </h3>

                  <ul className="text-sm text-gray-700 space-y-1">
                    {Object.entries(item).map(([key, val]) => {
                      if (['sheet', 'source'].includes(key)) return null;
                      return (
                        <li key={key}>
                          <strong className="capitalize">{key}:</strong>{' '}
                          <span className="text-gray-600">{String(val)}</span>
                        </li>
                      );
                    })}
                  </ul>

                  <div className="text-xs text-gray-400 mt-4">
                    {item.source && <>Source: {item.source}</>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <p className="text-center text-gray-500 italic text-lg">No matching results found.</p>
      )}

      {hasMore && (
        <div className="text-center mt-10">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-lg"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition"
          aria-label="Scroll to top"
        >
          <FaArrowUp />
        </button>
      )}
    </div>
  );
}
