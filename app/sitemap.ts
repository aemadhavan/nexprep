import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://nexprep.io';

  // Static pages
  const routes = [
    '',
    '/dashboard',
    '/sign-in',
    '/sign-up',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  // Exam pages - add your available exam codes here
  const examCodes = ['ab-900', 'ab-731', 'aif-c01'];
  const examRoutes = examCodes.map((code) => ({
    url: `${baseUrl}/exam/${code}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  return [...routes, ...examRoutes];
}
