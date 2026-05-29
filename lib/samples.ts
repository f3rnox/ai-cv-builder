import { CVData } from './types'

/**
 * Generates a complete, high-quality sample CV data for demonstration and testing.
 * @returns {CVData} Pre-filled professional CV data.
 */
export function getSampleData(): CVData {
  return {
    personalInfo: {
      name: 'Alex Rivera',
      title: 'Senior Full Stack Engineer',
      email: 'alex.rivera@example.com',
      phone: '+1 (555) 234-5678',
      location: 'San Francisco, CA',
      summary: 'Passionate Full Stack Developer with over 6 years of experience building scalable web applications. Expert in React, TypeScript, Node.js, and Cloud Infrastructure. Proven track record of optimizing application performance by 40% and leading engineering teams to deliver high-impact products from scratch.'
    },
    experience: [
      {
        id: 'sample-exp-1',
        company: 'Vanguard Systems',
        role: 'Senior Software Engineer',
        startDate: 'Mar 2022',
        endDate: 'Present',
        description: '- Spearheaded the migration of a legacy monolithic application to a serverless microservices architecture using Next.js and AWS, improving system response times by 35%.\n- Mentored 5 junior developers, establishing clean code guidelines and automated CI/CD deployment pipelines.\n- Designed and implemented a real-time collaborative workspace canvas utilizing React, TypeScript, and WebSockets.'
      },
      {
        id: 'sample-exp-2',
        company: 'InnovateTech Solutions',
        role: 'Full Stack Developer',
        startDate: 'Jun 2019',
        endDate: 'Feb 2022',
        description: '- Built and shipped 10+ high-fidelity features for a high-traffic SaaS dashboard used by over 50k monthly active users.\n- Optimized MongoDB database queries and implemented Redis caching, reducing API server loads by 50%.\n- Collaborated closely with UI/UX designers to implement a customizable Tailwind-based design system.'
      }
    ],
    education: [
      {
        id: 'sample-edu-1',
        school: 'University of California, Berkeley',
        degree: 'B.S. in Computer Science',
        year: '2019'
      }
    ],
    skills: [
      'React',
      'Next.js',
      'TypeScript',
      'Node.js',
      'GraphQL',
      'PostgreSQL',
      'AWS',
      'Docker',
      'Tailwind CSS',
      'System Architecture',
      'Agile Methodology'
    ],
    metadata: {
      template: 'modern',
      accentColor: '#3b82f6',
      fontFamily: 'sans'
    }
  }
}
