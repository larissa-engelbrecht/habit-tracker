import ThemeToggle from './ThemeToggle';

export default function Header({ title }: { title: string }) {
  return (
    <header className="bg-gradient-to-r from-purple-500 to-indigo-500 text-white px-6 py-4 flex justify-between items-center rounded-b-2xl shadow-md">
      <h1 className="text-lg font-bold">{title}</h1>
      <ThemeToggle />
    </header>
  );
}
