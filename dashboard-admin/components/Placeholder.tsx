import Layout from "./Layout";

export default function Placeholder({ title, descr, items }: { title: string; descr?: string; items?: string[] }) {
  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-2">{title}</h1>
      {descr && <p className="text-gray-500 mb-6 max-w-2xl">{descr}</p>}
      <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-8 text-center">
        <p className="font-medium text-gray-500">🚧 Sezione in preparazione</p>
        {items && items.length > 0 && (
          <ul className="mx-auto mt-4 inline-block space-y-1 text-left text-sm text-gray-600">
            {items.map((i, idx) => <li key={idx}>• {i}</li>)}
          </ul>
        )}
      </div>
    </Layout>
  );
}
