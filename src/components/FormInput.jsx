export default function FormInput({
  label, type = 'text', value,
  onChange, placeholder, required
}) {
  return (
    <div className="space-y-1">
      {label && (
        <label className="text-sm text-gray-400">{label}</label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg outline-none border border-gray-700 focus:border-purple-500 transition text-sm"
      />
    </div>
  );
}
