export interface ArticleHeading {
  depth: number;
  slug: string;
  text: string;
}

export interface ArticleHeadingNode extends ArticleHeading {
  children: ArticleHeadingNode[];
}

export function buildHeadingTree(
  headings: readonly ArticleHeading[],
): ArticleHeadingNode[] {
  const roots: ArticleHeadingNode[] = [];
  const stack: ArticleHeadingNode[] = [];

  for (const heading of headings) {
    if (heading.depth < 2 || heading.depth > 4) continue;

    const node: ArticleHeadingNode = {
      ...heading,
      children: [],
    };

    while (stack.length > 0 && stack.at(-1)!.depth >= node.depth) {
      stack.pop();
    }

    const parent = stack.at(-1);

    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }

    stack.push(node);
  }

  return roots;
}
