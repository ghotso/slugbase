import React from 'react';
import * as LucideIcons from 'lucide-react';
import { Folder as DefaultFolderIcon } from 'lucide-react';

interface FolderIconProps {
  iconName?: string | null;
  className?: string;
  size?: number;
}

// Get all available icon names from lucide-react
// Filter out non-icon exports and get all icon component names
function getAllIconNames(): string[] {
  const iconNames: string[] = [];
  const excludeNames = new Set([
    'createLucideIcon',
    'Icon',
    'IconNode',
    'IconProps',
    'LucideProps',
    'default',
    // Exclude non-icon exports
    'defaultProps',
    'forwardRef',
    'memo',
    'lazy',
    'Suspense',
    'Fragment',
    'StrictMode',
  ]);

  for (const name in LucideIcons) {
    // Skip excluded names
    if (excludeNames.has(name)) continue;
    
    // Skip names starting with lowercase (likely not icon components)
    if (name[0] && name[0] === name[0].toLowerCase()) continue;
    
    const component = (LucideIcons as any)[name];
    
    // Check if it's a function/component
    if (typeof component !== 'function') continue;
    
    // Verify it's actually a React component by checking for render capability
    // All Lucide icons are React components, so if it's a function starting with uppercase, it's likely an icon
    if (name && name[0] === name[0].toUpperCase()) {
      iconNames.push(name);
    }
  }

  return iconNames.sort();
}

// Cache the icon names
let cachedIconNames: string[] | null = null;

export function getAllIcons(): string[] {
  if (!cachedIconNames) {
    cachedIconNames = getAllIconNames();
  }
  return cachedIconNames;
}

// Popular/recommended icons for quick access
const popularIcons = [
  'Folder',
  'FolderOpen',
  'Archive',
  'Briefcase',
  'FileText',
  'Image',
  'Video',
  'Music',
  'Code',
  'Database',
  'Book',
  'GraduationCap',
  'Heart',
  'Star',
  'Home',
  'Calendar',
  'Mail',
  'Settings',
  'Users',
  'Package',
  'Wrench',
  'Tool',
  'Hammer',
  'Screwdriver',
  'WrenchIcon',
  'FolderPlus',
  'FolderMinus',
  'FolderCheck',
  'FolderX',
  'File',
  'FileCode',
  'FileImage',
  'FileVideo',
  'FileAudio',
  'FileSpreadsheet',
  'FileType',
  'FolderKanban',
  'FolderTree',
  'FolderGit',
  'FolderGit2',
  'FolderSearch',
  'FolderSymlink',
  'FolderUp',
  'FolderDown',
  'FolderInput',
  'FolderOutput',
  'FolderRoot',
  'FolderLock',
  'FolderUnlock',
  'FolderHeart',
  'FolderKey',
  'FolderPen',
  'FolderArchive',
  'FolderOpenDot',
  'FolderDot',
  'FolderSync',
  'FolderClock',
  'FolderCog',
  'FolderPlus2',
  'FolderMinus2',
  'FolderCheck2',
  'FolderX2',
  'FolderQuestion',
  'FolderWarning',
  'FolderAlert',
  'FolderBan',
  'FolderOff',
  'FolderOn',
  'FolderUp2',
  'FolderDown2',
  'FolderInput2',
  'FolderOutput2',
  'FolderRoot2',
  'FolderLock2',
  'FolderUnlock2',
  'FolderHeart2',
  'FolderKey2',
  'FolderPen2',
  'FolderArchive2',
  'FolderOpenDot2',
  'FolderDot2',
  'FolderSync2',
  'FolderClock2',
  'FolderCog2',
  'FolderPlus2',
  'FolderMinus2',
  'FolderCheck2',
  'FolderX2',
  'FolderQuestion2',
  'FolderWarning2',
  'FolderAlert2',
  'FolderBan2',
  'FolderOff2',
  'FolderOn2',
];

export default function FolderIcon({ iconName, className = '', size = 20 }: FolderIconProps) {
  if (!iconName) {
    return <DefaultFolderIcon className={className} style={{ width: `${size}px`, height: `${size}px` }} />;
  }

  // Try to get the icon from lucide-react (exact match first)
  let IconComponent = (LucideIcons as any)[iconName] as React.ComponentType<{ className?: string; style?: React.CSSProperties }>;

  // If exact match not found, try case-insensitive lookup
  if (!IconComponent) {
    const iconNameLower = iconName.toLowerCase();
    for (const key in LucideIcons) {
      if (key.toLowerCase() === iconNameLower && typeof (LucideIcons as any)[key] === 'function') {
        IconComponent = (LucideIcons as any)[key] as React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
        break;
      }
    }
  }

  if (IconComponent) {
    return <IconComponent className={className} style={{ width: `${size}px`, height: `${size}px` }} />;
  }

  // Fallback to default folder icon
  return <DefaultFolderIcon className={className} style={{ width: `${size}px`, height: `${size}px` }} />;
}

export { popularIcons };
