import { Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import CreateRun from './pages/CreateRun';
import Game from './pages/Game';

export default function App() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/create" element={<CreateRun />} />
        <Route path="/game/:runId" element={<Game />} />
      </Routes>
    </>
  );
}
