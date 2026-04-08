export default function Badge({ active }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium
      ${active
        ? 'bg-green-900/40 text-green-400'
        : 'bg-red-900/40 text-red-400'
      }`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}
