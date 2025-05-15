export interface PaymentApiResponse {
    transaction_id: string;
    status: 'approved' | 'rejected' | 'pending';
    timestamp: string;
    currency: string;
    amount: number;
}

export interface PaymentRequest {
    user_id: number;
    reservations: {
        reservation_id: number;
        amount: number;
    }[];
    total_amount: number;
}