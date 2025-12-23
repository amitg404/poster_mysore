import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-950/50">
        <h2 className="mb-4 text-6xl font-black text-gray-200 dark:text-gray-800">404</h2>
        <h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">Page Not Found</h3>
        <p className="mb-8 text-gray-500 dark:text-gray-400">
          Oops! The poster you are looking for might have been moved or removed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-900/90 focus:outline-none focus:ring-2 focus:ring-gray-900/50 dark:bg-white dark:text-gray-900 dark:hover:bg-white/90 dark:focus:ring-white/50"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
