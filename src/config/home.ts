import heroSceneDark from '../assets/home/home-hero-scene-dark.jpg';
import heroSceneLight from '../assets/home/home-hero-scene-light.png';

export interface HomeHeroSceneConfig {
  src: ImageMetadata;
  alt: string;
  desktopObjectPosition: `${number}% ${number}%`;
  mobileObjectPosition: `${number}% ${number}%`;
  desktopCrop: {
    top: `${number}%`;
    bottom: `${number}%`;
  };
  mobileCrop: {
    top: `${number}%`;
    bottom: `${number}%`;
  };
  maskStrength: number;
}

export interface HomeConfig {
  eyebrow: string;
  title: string;
  titleLines: readonly string[];
  subtitle: string;
  typingLines: readonly string[];
  latestPostCount: number;
  heroScenes: {
    light: HomeHeroSceneConfig;
    dark: HomeHeroSceneConfig;
  };
  profile: {
    statusLabel: string;
    statusText: string;
    actionLabel: string;
    actionHref: '/about/';
  };
  latestPosts: {
    eyebrow: string;
    title: string;
    description: string;
    emptyMessage: string;
    actionLabel: string;
    actionHref: '/blog/';
  };
  stats: {
    eyebrow: string;
    title: string;
    postLabel: string;
    tagLabel: string;
  };
}

export const homeConfig = {
  eyebrow: 'Personal laboratory · 2026',
  title: 'PonyLab',
  titleLines: ['Pony', 'Lab'],
  subtitle: '在冷雾与代码之间，记录技术学习、项目实践与个人兴趣。',
  typingLines: [
    'ponylab:~$ whoami',
    'Developer · Learner · Dreamer_',
  ],
  latestPostCount: 4,
  heroScenes: {
    light: {
      src: heroSceneLight,
      alt: '两位人物站在冷青色植物之间的日间主题插画',
      desktopObjectPosition: '0% 50%',
      mobileObjectPosition: '48% 54%',
      desktopCrop: { top: '0%', bottom: '0%' },
      mobileCrop: { top: '0%', bottom: '0%' },
      maskStrength: 0.24,
    },
    dark: {
      src: heroSceneDark,
      alt: '带有光环、翅膀和向日葵人物的夜间城市主题插画',
      desktopObjectPosition: '50% 48%',
      mobileObjectPosition: '43% 46%',
      desktopCrop: { top: '11%', bottom: '10%' },
      mobileCrop: { top: '6%', bottom: '5%' },
      maskStrength: 0.78,
    },
  },
  profile: {
    statusLabel: '当前状态',
    statusText: '个人状态待填写 · 正在整理 PonyLab',
    actionLabel: '了解更多',
    actionHref: '/about/',
  },
  latestPosts: {
    eyebrow: 'Notebook / Latest',
    title: '最新文章',
    description: '从技术实践到学习随笔，按置顶与发布时间展示最近的记录。',
    emptyMessage: '当前还没有已发布文章。',
    actionLabel: '查看完整博客',
    actionHref: '/blog/',
  },
  stats: {
    eyebrow: 'Lab notes',
    title: '此刻的 PonyLab',
    postLabel: '已发布文章',
    tagLabel: '主题标签',
  },
} as const satisfies HomeConfig;
