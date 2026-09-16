import Link from "next/link";

export default function AdminNotFound() {
  return (
    <main id="content" className="page py-24">
      <h1 className="text-[2.5rem] leading-tight">Not found</h1>
      <p className="mt-4">
        <Link href="/admin" className="u-thread font-sans">
          Back to the posts
        </Link>
      </p>
    </main>
  );
}
