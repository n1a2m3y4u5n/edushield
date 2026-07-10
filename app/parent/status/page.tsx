import { redirect } from 'next/navigation';

export default function StatusRedirect({ searchParams }: { searchParams: { id?: string } }) {
  const id = searchParams.id;
  if (id) redirect(`/parent/status/${id}`);
  redirect('/parent');
}
