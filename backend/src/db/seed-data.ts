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
}

export interface DemoUserData {
  user: DemoUser;
  folders: DemoFolder[];
  tags: DemoTag[];
  bookmarks: DemoBookmark[];
}

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
