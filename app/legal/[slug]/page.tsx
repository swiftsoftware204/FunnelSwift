import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';

// Make this dynamic to avoid build-time Supabase calls
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Return empty array to skip static generation
export async function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  return {
    title: 'Legal Page',
  };
}

export default async function LegalPage({ params }: { params: { slug: string } }) {
  // For now, return a simple placeholder
  // This avoids the Supabase build-time error
  
  return (
    <div className="min-h-screen bg-[#0E0F12] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold text-[#F1F5F9] mb-4 capitalize">
              {params.slug.replace(/-/g, ' ')}
            </h1>
            <p className="text-[#94A3B8]">
              Legal content for {params.slug} will be loaded here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
