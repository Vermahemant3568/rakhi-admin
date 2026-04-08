export default function StatCard({ title, value, icon, color }) {
  return (
    <div className="bg-gray-900 rounded-2xl p-6 flex items-center gap-4">
      <div className={`text-3xl p-3 rounded-xl ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-gray-400 text-sm">{title}</p>
        <p className="text-white text-2xl font-bold">{value}</p>
      </div>
    </div>
  );
}
