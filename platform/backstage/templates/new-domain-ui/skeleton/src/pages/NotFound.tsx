import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-neutral-950 text-white gap-4">
      <h1 className="text-6xl font-bold text-neutral-700">404</h1>
      <p className="text-neutral-400">Page not found.</p>
      <Link to="/" className="text-blue-400 hover:underline">
        Go home
      </Link>
    </div>
  );
}
