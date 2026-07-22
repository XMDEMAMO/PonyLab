import authorAvatar from '../assets/brand/author-avatar.jpg';
import SiteLogo from '../assets/brand/site-logo.svg';

export type SiteLanguage = 'zh-CN';

export interface NavigationItem {
  label: string;
  href: '/' | '/blog/' | '/projects/' | '/about/';
}

export interface SocialLink {
  label: string;
  href: string | null;
  isPlaceholder: boolean;
}

export interface SiteConfig {
  name: string;
  description: string;
  language: SiteLanguage;
  timeZone: string;
  author: {
    name: string;
    bio: string;
    avatar: ImageMetadata;
    avatarAlt: string;
  };
  logo: {
    component: typeof SiteLogo;
    alt: string;
  };
  socials: readonly SocialLink[];
  navigation: readonly NavigationItem[];
  footer: {
    copyrightName: string;
    note: string;
  };
}

export const siteConfig = {
  name: 'PonyLab',
  description: '记录技术学习、项目实践与个人兴趣的静态博客。',
  language: 'zh-CN',
  timeZone: 'Asia/Hong_Kong',
  author: {
    name: '作者名称待填写',
    bio: '个人简介待填写',
    avatar: authorAvatar,
    avatarAlt: 'PonyLab 作者头像',
  },
  logo: {
    component: SiteLogo,
    alt: 'PonyLab',
  },
  socials: [
    {
      label: 'GitHub（链接待填写）',
      href: null,
      isPlaceholder: true,
    },
  ],
  navigation: [
    { label: '首页', href: '/' },
    { label: '博客', href: '/blog/' },
    { label: '项目', href: '/projects/' },
    { label: '关于', href: '/about/' },
  ],
  footer: {
    copyrightName: 'PonyLab',
    note: 'Built with Astro.',
  },
} as const satisfies SiteConfig;
