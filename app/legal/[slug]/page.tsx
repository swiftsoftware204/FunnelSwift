import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';

export async function generateStaticParams() {
  const supabase = createClient();
  const { data: pages } = await supabase
    .from('legal_pages')
    .select('slug')
    .eq('is_published', true);

  return (pages || []).map((page) => ({
    slug: page.slug,
  }));
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: page } = await supabase
    .from('legal_pages')
    .select('title')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single();

  return {
    title: page?.title || 'Legal Page',
  };
}

export default async function LegalPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  
  const { data: page } = await supabase
    .from('legal_pages')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single();

  if (!page) {
    notFound();
  }

  // Simple markdown to HTML conversion
  const htmlContent = page.content
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-[#F1F5F9] mb-4">$1</h1>')
    .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-[#F1F5F9] mt-8 mb-4">$1</h2>')
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-[#F1F5F9] mt-6 mb-3">$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-[#F1F5F9]">$1</strong>')
    .replace(/\n\n/g, '</p><p class="text-[#94A3B8] mb-4">')
    .replace(/^/g, '<p class="text-[#94A3B8] mb-4">')
    .replace(/$/g, '</p>');

  return (
    <div className="min-h-screen bg-[#0E0F12] py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-[#16181D] border-[#2A2D38]">
          <CardContent className="p-8">
            <div 
              className="prose prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
            <div className="mt-8 pt-8 border-t border-[#2A2D38]">
              <p className="text-sm text-[#64748B]">
                Last updated: {new Date(page.last_updated).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
