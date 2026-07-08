import { notFound } from 'next/navigation';
import { areaByNum } from '@/lib/content';
import LessonApp from '@/components/LessonApp';

export function generateStaticParams() {
  return [0, 1, 2, 3, 4, 5].map((n) => ({ num: String(n) }));
}

export default function AreaPage({ params }: { params: { num: string } }) {
  const area = areaByNum(Number(params.num));
  if (!area) notFound();
  return <LessonApp area={area} />;
}
