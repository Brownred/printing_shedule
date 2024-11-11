export const VALID_STATUSES = ['PENDING', 'PRINTING', 'COMPLETED', 'FAILED'] as const;
export type OrderStatus = typeof VALID_STATUSES[number];

export interface OrderResponse {
  id: string;
  fileName: string;
  originalName: string;
  mpesaRef: string;
  status: OrderStatus;
  uploadedAt: Date;
  completedAt: Date | null;
  customerId: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
  };
}