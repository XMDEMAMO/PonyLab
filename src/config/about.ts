export interface AboutConfig {
  eyebrow: string;
  title: string;
  subtitle: string;
  role: string;
  location: string;
  profileNote: string;
  status: {
    eyebrow: string;
    title: string;
    description: string;
    items: readonly { label: string; value: string }[];
  };
  hobbies: {
    eyebrow: string;
    title: string;
    description: string;
  };
}

export const aboutConfig = {
  eyebrow: 'Identity / Profile',
  title: '关于我',
  subtitle: '这里放一份简短、可替换的个人说明，以及此刻正在关注的事情。',
  role: '身份信息待填写',
  location: '所在地待填写',
  profileNote: '更完整的个人介绍待填写；后续只修改配置，不需要调整页面结构。',
  status: {
    eyebrow: 'Status / Now',
    title: '当前状态',
    description: '把此刻的学习与创作状态保留成一条轻量记录，而不是技能百分比。',
    items: [
      { label: '正在整理', value: 'PonyLab 内容与页面' },
      { label: '正在学习', value: '学习主题待填写' },
      { label: '最近关注', value: '关注内容待填写' },
    ],
  },
  hobbies: {
    eyebrow: 'Personal archive',
    title: '爱好展柜',
    description: '作品、角色和游戏只是轻量陈列；正式图片与文字可按数据文件逐项替换。',
  },
} as const satisfies AboutConfig;
