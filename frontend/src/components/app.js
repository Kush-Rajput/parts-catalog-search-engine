import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PartsCategoriesPage from './components/PartsCategoriesPage';
import CategoryPage from './components/CategoryPage';
import EngineSearch from './components/EnginesPage'; 
import ServicePartsPage from './components/ServicePartsPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<PartsCategoriesPage />} />
        <Route path="/category/:categoryName" element={<CategoryPage />} />
        <Route path="/engines" element={<EngineSearch />} />
        <Route path="/service-parts" element={<ServicePartsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
