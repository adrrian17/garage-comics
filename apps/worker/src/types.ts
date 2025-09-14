export interface OrderItem {
  productSlug: string;
  quantity: number;
  price: number;
}

export interface OrderConfirmationItem {
  productName: string;
  productImage?: string;
  productSlug: string;
  amount: number;
}

export interface OrderConfirmationData {
  orderId: string;
  customerEmail: string;
  customerName?: string;
  items: OrderConfirmationItem[];
  total: number;
  paymentMethod: string;
  createdAt: string;
  sessionId: string;
}

export interface OrderData {
  orderId: string;
  customerEmail: string;
  items: OrderItem[];
  total: number;
  timestamp: string;
}

export interface ProcessResult {
  success: boolean;
  uploadUrl?: string;
  presignedUrl?: string;
  error?: string;
}

export interface EmailConfirmationData {
  orderId: string;
  customerEmail: string;
  presignedUrl: string;
  expiresAt: string;
  items: OrderItem[];
  total: number;
  timestamp: string;
}

export interface WorkerConfig {
  database: {
    url: string;
  };
  queues: {
    orders: string;
    confirmationEmails: string;
    orderConfirmations: string;
  };
  r2: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    endpoint: string;
  };
  api: {
    url: string;
  };
  resend: {
    apiKey: string;
    fromEmail: string;
  };
}
