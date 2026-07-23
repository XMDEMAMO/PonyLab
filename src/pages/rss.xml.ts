import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

import { siteConfig } from '../config/site';
import { sitePaths } from '../utils/paths';
import { filterPublishedPosts, sortPosts, toArticlePath } from '../utils/posts';

export async function GET(context: { site: URL | undefined }) {
  const posts = sortPosts(filterPublishedPosts(await getCollection('blog')));

  return rss({
    title: siteConfig.name,
    description: siteConfig.description,
    site: context.site
      ? new URL(sitePaths.page('/'), context.site)
      : new URL('https://xmdemamo.github.io/PonyLab/'),
    customData: `<language>${siteConfig.language}</language>`,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: toArticlePath(post.id),
      categories: [post.data.category, ...post.data.tags],
    })),
  });
}
