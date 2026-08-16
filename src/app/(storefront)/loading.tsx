export default function Loading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block w-10 h-10 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
        <p className="text-sm text-gray-500 mt-4">Chargement...</p>
      </div>
    </div>
  );
}
