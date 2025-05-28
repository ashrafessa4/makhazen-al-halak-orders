
export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  created_at: string;
}

export interface AdminConfig {
  id: string;
  whatsapp_number: string;
  notification_email: string | null;
  updated_at: string;
}
