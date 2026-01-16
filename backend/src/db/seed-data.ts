/**
 * Demo data definitions for DEMO_MODE
 * This file contains all the seed data structures
 */

export interface DemoUser {
  email: string;
  name: string;
  password: string; // Will be hashed during seeding
  isAdmin: boolean;
}

export interface DemoFolder {
  name: string;
  icon?: string;
}

export interface DemoTag {
  name: string;
}

export interface DemoBookmark {
  title: string;
  url: string;
  slug?: string;
  forwardingEnabled?: boolean;
  pinned?: boolean;
  folderNames?: string[]; // References to folder names
  tagNames?: string[]; // References to tag names
  shareWithTeams?: string[]; // Team names to share with
  shareWithUsers?: string[]; // User emails to share with
}

export interface DemoTeam {
  name: string;
  description?: string;
  memberEmails: string[]; // User emails that are members
}

export interface DemoUserData {
  user: DemoUser;
  folders: DemoFolder[];
  tags: DemoTag[];
  bookmarks: DemoBookmark[];
}

export interface DemoSeedData {
  users: DemoUserData[];
  teams: DemoTeam[];
}

/**
 * Demo teams configuration
 */
export const DEMO_TEAMS: DemoTeam[] = [
  {
    name: 'Development Team',
    description: 'Team for development and engineering work',
    memberEmails: ['admin@demo.slugbase', 'alice@demo.slugbase'],
  },
  {
    name: 'Design Team',
    description: 'Team for design and UX work',
    memberEmails: ['admin@demo.slugbase', 'bob@demo.slugbase'],
  },
];

/**
 * Demo users with their associated data
 */
export const DEMO_DATA: DemoUserData[] = [
  {
    user: {
      email: 'admin@demo.slugbase',
      name: 'Demo Admin',
      password: 'DemoAdmin123!',
      isAdmin: true,
    },
    folders: [
      { name: 'Development', icon: '💻' },
      { name: 'Design', icon: '🎨' },
      { name: 'DevOps', icon: '⚙️' },
      { name: 'Personal', icon: '📌' },
    ],
    tags: [
      { name: 'typescript' },
      { name: 'react' },
      { name: 'nodejs' },
      { name: 'docker' },
      { name: 'tools' },
      { name: 'tutorial' },
      { name: 'documentation' },
    ],
    bookmarks: [
      {
        title: 'React Documentation',
        url: 'https://react.dev',
        slug: 'react-docs',
        forwardingEnabled: true,
        pinned: true,
        folderNames: ['Development'],
        tagNames: ['react', 'documentation'],
      },
      {
        title: 'TypeScript Handbook',
        url: 'https://www.typescriptlang.org/docs/',
        slug: 'ts-handbook',
        forwardingEnabled: true,
        folderNames: ['Development'],
        tagNames: ['typescript', 'documentation'],
      },
      {
        title: 'Node.js Official Docs',
        url: 'https://nodejs.org/docs/',
        slug: 'nodejs-docs',
        forwardingEnabled: true,
        folderNames: ['Development'],
        tagNames: ['nodejs', 'documentation'],
      },
      {
        title: 'Docker Documentation',
        url: 'https://docs.docker.com',
        slug: 'docker-docs',
        forwardingEnabled: true,
        folderNames: ['DevOps'],
        tagNames: ['docker', 'documentation'],
      },
      {
        title: 'MDN Web Docs',
        url: 'https://developer.mozilla.org',
        slug: 'mdn',
        forwardingEnabled: true,
        pinned: true,
        folderNames: ['Development'],
        tagNames: ['documentation', 'tools'],
      },
      {
        title: 'GitHub',
        url: 'https://github.com',
        slug: 'github',
        forwardingEnabled: true,
        folderNames: ['Development', 'Personal'],
        tagNames: ['tools'],
      },
      {
        title: 'VS Code',
        url: 'https://code.visualstudio.com',
        slug: 'vscode',
        forwardingEnabled: true,
        folderNames: ['Development'],
        tagNames: ['tools'],
      },
      {
        title: 'Figma',
        url: 'https://www.figma.com',
        slug: 'figma',
        forwardingEnabled: true,
        folderNames: ['Design'],
        tagNames: ['tools'],
      },
      {
        title: 'PostgreSQL Docs',
        url: 'https://www.postgresql.org/docs/',
        slug: 'postgresql-docs',
        forwardingEnabled: true,
        folderNames: ['DevOps'],
        tagNames: ['documentation', 'tools'],
        shareWithTeams: ['Development Team'],
      },
      {
        title: 'Nginx Documentation',
        url: 'https://nginx.org/en/docs/',
        slug: 'nginx-docs',
        forwardingEnabled: true,
        folderNames: ['DevOps'],
        tagNames: ['documentation'],
        shareWithTeams: ['Development Team'],
      },
      {
        title: 'GitLab',
        url: 'https://gitlab.com',
        slug: 'gitlab',
        forwardingEnabled: true,
        folderNames: ['Development'],
        tagNames: ['tools'],
        shareWithUsers: ['alice@demo.slugbase'],
      },
      {
        title: 'Webpack',
        url: 'https://webpack.js.org',
        slug: 'webpack',
        forwardingEnabled: true,
        folderNames: ['Development'],
        tagNames: ['tools', 'documentation'],
        shareWithTeams: ['Development Team'],
      },
    ],
  },
  {
    user: {
      email: 'alice@demo.slugbase',
      name: 'Alice Developer',
      password: 'DemoUser123!',
      isAdmin: false,
    },
    folders: [
      { name: 'Work Projects', icon: '💼' },
      { name: 'Learning', icon: '📚' },
      { name: 'Resources', icon: '🔗' },
    ],
    tags: [
      { name: 'javascript' },
      { name: 'css' },
      { name: 'learning' },
      { name: 'reference' },
    ],
    bookmarks: [
      {
        title: 'JavaScript.info',
        url: 'https://javascript.info',
        slug: 'js-info',
        forwardingEnabled: true,
        folderNames: ['Learning'],
        tagNames: ['javascript', 'learning', 'tutorial'],
      },
      {
        title: 'CSS Tricks',
        url: 'https://css-tricks.com',
        slug: 'css-tricks',
        forwardingEnabled: true,
        folderNames: ['Resources'],
        tagNames: ['css', 'reference'],
      },
      {
        title: 'Stack Overflow',
        url: 'https://stackoverflow.com',
        slug: 'stackoverflow',
        forwardingEnabled: true,
        pinned: true,
        folderNames: ['Work Projects', 'Resources'],
        tagNames: ['tools', 'reference'],
      },
      {
        title: 'Can I Use',
        url: 'https://caniuse.com',
        slug: 'caniuse',
        forwardingEnabled: true,
        folderNames: ['Resources'],
        tagNames: ['css', 'tools'],
      },
      {
        title: 'npm Documentation',
        url: 'https://docs.npmjs.com',
        slug: 'npm-docs',
        forwardingEnabled: true,
        folderNames: ['Resources'],
        tagNames: ['tools', 'documentation'],
        shareWithTeams: ['Development Team'],
      },
      {
        title: 'ESLint',
        url: 'https://eslint.org',
        slug: 'eslint',
        forwardingEnabled: true,
        folderNames: ['Work Projects'],
        tagNames: ['tools'],
        shareWithTeams: ['Development Team'],
      },
      {
        title: 'Prettier',
        url: 'https://prettier.io',
        slug: 'prettier',
        forwardingEnabled: true,
        folderNames: ['Work Projects'],
        tagNames: ['tools'],
        shareWithUsers: ['bob@demo.slugbase'],
      },
      {
        title: 'Vite Documentation',
        url: 'https://vitejs.dev',
        slug: 'vite',
        forwardingEnabled: true,
        folderNames: ['Learning'],
        tagNames: ['tools', 'learning'],
        shareWithUsers: ['admin@demo.slugbase'],
      },
      {
        title: 'Tailwind CSS',
        url: 'https://tailwindcss.com',
        slug: 'tailwind',
        forwardingEnabled: true,
        folderNames: ['Resources'],
        tagNames: ['css', 'tools'],
        shareWithTeams: ['Development Team'],
      },
      {
        title: 'Next.js',
        url: 'https://nextjs.org',
        slug: 'nextjs',
        forwardingEnabled: true,
        folderNames: ['Learning'],
        tagNames: ['react', 'learning'],
      },
    ],
  },
  {
    user: {
      email: 'bob@demo.slugbase',
      name: 'Bob Designer',
      password: 'DemoUser123!',
      isAdmin: false,
    },
    folders: [
      { name: 'Inspiration', icon: '✨' },
      { name: 'Tools', icon: '🛠️' },
      { name: 'Assets', icon: '🎨' },
    ],
    tags: [
      { name: 'design' },
      { name: 'ui' },
      { name: 'ux' },
      { name: 'resources' },
    ],
    bookmarks: [
      {
        title: 'Dribbble',
        url: 'https://dribbble.com',
        slug: 'dribbble',
        forwardingEnabled: true,
        pinned: true,
        folderNames: ['Inspiration'],
        tagNames: ['design', 'ui'],
      },
      {
        title: 'Behance',
        url: 'https://www.behance.net',
        slug: 'behance',
        forwardingEnabled: true,
        folderNames: ['Inspiration'],
        tagNames: ['design', 'ui'],
      },
      {
        title: 'Unsplash',
        url: 'https://unsplash.com',
        slug: 'unsplash',
        forwardingEnabled: true,
        folderNames: ['Assets'],
        tagNames: ['resources'],
      },
      {
        title: 'Coolors',
        url: 'https://coolors.co',
        slug: 'coolors',
        forwardingEnabled: true,
        folderNames: ['Tools'],
        tagNames: ['design', 'tools'],
      },
      {
        title: 'Font Awesome',
        url: 'https://fontawesome.com',
        slug: 'fontawesome',
        forwardingEnabled: true,
        folderNames: ['Assets'],
        tagNames: ['resources'],
      },
      {
        title: 'Adobe XD',
        url: 'https://www.adobe.com/products/xd.html',
        slug: 'adobe-xd',
        forwardingEnabled: true,
        folderNames: ['Tools'],
        tagNames: ['design', 'tools'],
        shareWithTeams: ['Design Team'],
      },
      {
        title: 'Sketch',
        url: 'https://www.sketch.com',
        slug: 'sketch',
        forwardingEnabled: true,
        folderNames: ['Tools'],
        tagNames: ['design', 'tools'],
        shareWithTeams: ['Design Team'],
      },
      {
        title: 'Material Design',
        url: 'https://material.io/design',
        slug: 'material-design',
        forwardingEnabled: true,
        folderNames: ['Inspiration'],
        tagNames: ['design', 'ui', 'ux'],
        shareWithUsers: ['alice@demo.slugbase'],
      },
      {
        title: 'Awwwards',
        url: 'https://www.awwwards.com',
        slug: 'awwwards',
        forwardingEnabled: true,
        folderNames: ['Inspiration'],
        tagNames: ['design', 'ui'],
        shareWithTeams: ['Design Team'],
      },
      {
        title: 'UI Movement',
        url: 'https://uimovement.com',
        slug: 'ui-movement',
        forwardingEnabled: true,
        folderNames: ['Inspiration'],
        tagNames: ['design', 'ui'],
      },
      {
        title: 'Pexels',
        url: 'https://www.pexels.com',
        slug: 'pexels',
        forwardingEnabled: true,
        folderNames: ['Assets'],
        tagNames: ['resources'],
        shareWithTeams: ['Design Team'],
      },
    ],
  },
];

/**
 * Default credentials for demo mode
 * These are safe to expose as this is intentionally a demo instance
 */
export const DEMO_CREDENTIALS = {
  admin: {
    email: 'admin@demo.slugbase',
    password: 'DemoAdmin123!',
  },
  users: [
    {
      email: 'alice@demo.slugbase',
      password: 'DemoUser123!',
    },
    {
      email: 'bob@demo.slugbase',
      password: 'DemoUser123!',
    },
  ],
};
