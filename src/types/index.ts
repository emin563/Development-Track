export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at?: string;
}

export interface Client {
  id: string;
  user_id?: string;
  name: string;
  email: string;
  avatar_url?: string;
  created_at?: string;
  tags?: Tag[];
}

export type ProjectStatus = 'Active' | 'Pending' | 'Completed';

export interface Project {
  id: string;
  user_id?: string;
  title: string;
  client_id: string;
  status: ProjectStatus;
  due_date: string;
  share_token?: string;
  created_at?: string;
  client?: Client; // For joined queries
  tags?: Tag[];
}

export interface ProjectUpdate {
  id: string;
  project_id: string;
  version: string;
  description?: string;
  resource_url?: string;
  created_at: string;
}

export interface ProjectFeedback {
  id: string;
  project_id: string;
  update_id?: string;
  client_name: string;
  message: string;
  status: 'Open' | 'Resolved';
  developer_response?: string;
  created_at: string;
}
