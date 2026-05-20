export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  cursor: string | null;
  has_more: boolean;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  picture_url: string | null;
  role: string;
  organization_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  plan: "free" | "pro" | "enterprise";
  gmail_connected: boolean;
  last_gmail_sync: string | null;
  created_at: string;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: "owner" | "admin" | "member" | "viewer";
  is_active: boolean;
  joined_at: string | null;
  user: User;
}

export interface FinancialGoal {
  id: string;
  organization_id: string;
  created_by_id: string;
  title: string;
  description: string | null;
  category: string | null;
  target_amount: string;
  current_amount: string;
  currency: string;
  deadline: string | null;
  status: "ACTIVE" | "ACHIEVED" | "PAUSED" | "CANCELLED";
  progress_pct: number;
  created_at: string;
  updated_at: string;
}

export interface GmailStatus {
  connected: boolean;
  last_sync_at: string | null;
  total_emails: number;
  pending_review: number;
  emails_this_month: number;
}

export interface AIInsight {
  type: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical" | "positive";
  action_recommended: string | null;
}

export interface ForecastPoint {
  period: string;
  projected_inflow: number;
  projected_outflow: number;
  projected_net: number;
  confidence: "low" | "medium" | "high";
}

export interface SpendTrend {
  month: string;
  categories: Array<{ name: string; amount: number }>;
}

export interface Transaction {
  id: string;
  organization_id: string;
  user_id: string;
  type: "CREDIT" | "DEBIT";
  amount: string;
  currency: string;
  amount_inr: string;
  description: string;
  category: string | null;
  vendor_id: string | null;
  invoice_id: string | null;
  transaction_date: string;
  reference_number: string | null;
  status: "PENDING" | "CLEARED" | "RECONCILED" | "VOIDED";
  is_flagged: boolean;
  created_at: string;
}

export interface Invoice {
  id: string;
  organization_id: string;
  user_id: string;
  invoice_number: string;
  vendor_id: string | null;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED" | "PAID" | "OVERDUE" | "VOIDED";
  type: "PAYABLE" | "RECEIVABLE";
  issue_date: string;
  due_date: string | null;
  paid_date: string | null;
  subtotal: string;
  tax_amount: string;
  gst_number: string | null;
  total_amount: string;
  currency: string;
  source_email_id: string | null;
  line_items: LineItem[];
  created_at: string;
}

export interface LineItem {
  id: string;
  description: string;
  quantity: string;
  unit_price: string;
  tax_rate: string | null;
  line_total: string;
}

export interface Vendor {
  id: string;
  organization_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  gst_number: string | null;
  pan_number: string | null;
  payment_terms_days: number | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
}

export interface EmailMessage {
  id: string;
  organization_id: string;
  gmail_message_id: string;
  subject: string;
  sender: string;
  received_at: string;
  has_attachments: boolean;
  ai_processed: boolean;
  financial_type: string | null;
  confidence_score: number | null;
  needs_review: boolean;
  ai_extraction_result: Record<string, unknown> | null;
}

export interface DashboardStats {
  total_revenue: string;
  total_expenses: string;
  net_cash_flow: string;
  pending_invoices_count: number;
  pending_invoices_amount: string;
  overdue_invoices_count: number;
  pending_approvals_count: number;
  unread_alerts_count: number;
  last_sync_at: string | null;
}

export interface Report {
  id: string;
  organization_id: string;
  title: string;
  report_type: string;
  period_start: string;
  period_end: string;
  status: "GENERATING" | "COMPLETED" | "FAILED";
  ai_generated_content: string | null;
  created_at: string;
}

export interface AlertNotification {
  id: string;
  organization_id: string;
  title: string;
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  is_read: boolean;
  created_at: string;
}
