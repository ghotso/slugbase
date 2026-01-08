export interface User {
  id: string;
  email: string;
  name: string;
  user_key: string;
  is_admin: boolean;
  oidc_sub?: string;
  oidc_provider?: string;
  language: string;
  theme: string;
  created_at: string;
}

export interface OIDCProvider {
  id: string;
  provider_key: string;
  client_id: string;
  client_secret: string;
  issuer_url: string;
  scopes: string;
  created_at: string;
}

export interface Folder {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Bookmark {
  id: string;
  user_id: string;
  title: string;
  url: string;
  slug: string;
  forwarding_enabled: boolean;
  folder_id?: string;
  folder?: Folder;
  tags?: Tag[];
  created_at: string;
  updated_at: string;
}

export interface CreateBookmarkInput {
  title: string;
  url: string;
  slug?: string;
  forwarding_enabled: boolean;
  folder_ids?: string[];
  tag_ids?: string[];
  team_ids?: string[];
  user_ids?: string[];
  share_all_teams?: boolean;
}

export interface UpdateBookmarkInput {
  title?: string;
  url?: string;
  slug?: string;
  forwarding_enabled?: boolean;
  folder_ids?: string[];
  tag_ids?: string[];
  team_ids?: string[];
  user_ids?: string[];
  share_all_teams?: boolean;
}
