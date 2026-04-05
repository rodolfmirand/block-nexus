export type ModSearchItem = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
};

export type ModSearchResponse = {
  total: number;
  items: ModSearchItem[];
};
