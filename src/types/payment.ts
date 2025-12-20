/**
 * Payment related TypeScript types and interfaces
 */

export interface PricingPackage {
    id: string;
    name: string;
    credits: number;
    price: number;
    pricePerCredit: number;
    discount?: number;
    target: string;
    popular?: boolean;
    features?: string[];
}

export interface PaymentTransaction {
    id: string;
    user_id: string;
    transaction_id: string | null;
    order_id: string;
    package_id: string;
    amount: number;
    credits: number;
    status: 'pending' | 'completed' | 'failed' | 'cancelled';
    payment_method?: string | null;
    sepay_response?: any;
    created_at: string;
    completed_at?: string | null;
}

export interface CreatePaymentRequest {
    packageId: string;
    userId: string;
}

export interface CreatePaymentResponse {
    success: boolean;
    payment_url?: string;
    order_id?: string;
    error?: string;
}

export interface SepayCreateOrderRequest {
    amount: number;
    order_id: string;
    return_url: string;
    cancel_url: string;
    notify_url: string;
    buyer_name?: string;
    buyer_email?: string;
    buyer_phone?: string;
}

export interface SepayCreateOrderResponse {
    status: string;
    message: string;
    data?: {
        payment_url: string;
        order_id: string;
        qr_code?: string;
    };
}

export interface SepayWebhookPayload {
    transaction_id: string;
    order_id: string;
    amount: number;
    status: string;
    payment_time: string;
    payment_method?: string;
    signature?: string;
    [key: string]: any;
}

// Pricing packages configuration
export const PRICING_PACKAGES: PricingPackage[] = [
    {
        id: 'free',
        name: 'Free',
        credits: 50,
        price: 0,
        pricePerCredit: 0,
        target: 'Trial',
        features: ['Reset monthly', '50 credits miễn phí']
    },
    {
        id: 'starter',
        name: 'Starter',
        credits: 500,
        price: 49000,
        pricePerCredit: 98,
        target: 'Cá nhân',
        features: ['500 credits', 'Hỗ trợ cơ bản', 'Không giới hạn thời gian']
    },
    {
        id: 'creator',
        name: 'Creator',
        credits: 1500,
        price: 119000,
        pricePerCredit: 79,
        discount: 20,
        target: 'Freelancer',
        popular: true,
        features: ['1,500 credits', 'Ưu tiên xử lý', 'Hỗ trợ nhanh']
    },
    {
        id: 'pro',
        name: 'Pro',
        credits: 5000,
        price: 299000,
        pricePerCredit: 60,
        discount: 40,
        target: 'Agency nhỏ',
        features: ['5,000 credits', 'Ưu tiên cao', 'Hỗ trợ 24/7', 'API access']
    },
    {
        id: 'business',
        name: 'Business',
        credits: 20000,
        price: 899000,
        pricePerCredit: 45,
        discount: 55,
        target: 'Doanh nghiệp',
        features: ['20,000 credits', 'Team access', 'Báo cáo chi tiết', 'Dedicated support']
    },
    {
        id: 'enterprise',
        name: 'Enterprise',
        credits: 999999,
        price: 0,
        pricePerCredit: 0,
        target: 'Studio lớn',
        features: ['Unlimited credits', 'API access', 'Dedicated support', 'Custom integration']
    }
];
