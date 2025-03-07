import { redirect } from 'next/navigation';

export default function Home() {
  // This will immediately redirect to the /sales route
  redirect('/sales');
}