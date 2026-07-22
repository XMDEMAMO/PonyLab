export interface PostData {
  title: string;
  description: string;
  pubDate: Date;
  updatedDate?: Date;
  category: string;
  tags: readonly string[];
  cover?: ImageMetadata;
  coverAlt?: string;
  draft: boolean;
  pinned: boolean;
}

export interface PostRecord<TData extends PostData = PostData> {
  id: string;
  data: TData;
}

export interface AdjacentPosts<TPost extends PostRecord = PostRecord> {
  /** The next item in newest-first order, normally an older article. */
  previous?: TPost;
  /** The previous item in newest-first order, normally a newer article. */
  next?: TPost;
}
