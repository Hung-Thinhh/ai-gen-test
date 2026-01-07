/**
 * Payment related TypeScript types and interfaces
 */

export interface PricingPackage {
    id: string;
    name: string;
    credits: number; // Keeping for compatibility, though we might rely on features text more
    price: number; // Monthly price default
    priceMonthly: number;
    // Actually, usually you store the actual billable amount.
    // Let's store: priceMonthly (e.g. 12), priceYearly (e.g. 120 - effective 10/mo)
    // To match the UI: Apprentice $12 -> $10. So priceMonthly=12, priceYearlyMonthlyEquivalent=10.
    priceYearlyMonthlyEquivalent: number;
    pricePerCredit: number;
    discount?: number;
    target: string;
    popular?: boolean;
    features: string[];
    description?: string; // "Perfect for..."
    buttonText?: string;
    category?: string;
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
        credits: 150,
        price: 0,
        priceMonthly: 0,
        priceYearlyMonthlyEquivalent: 0,
        pricePerCredit: 0,
        target: 'Casual creators who want to explore AI art',
        features: [
            '150 Fast Tokens daily for quick creations',
            'All images are public',
            'Use Presets for easy image creation'
        ],
        buttonText: 'Forever',
        description: 'Forever'
    },
    {
        id: 'apprentice',
        name: 'Apprentice',
        credits: 8500,
        price: 12,
        priceMonthly: 12,
        priceYearlyMonthlyEquivalent: 10,
        pricePerCredit: 0,
        target: 'Hobbyists and enthusiasts who create regularly',
        features: [
            '8,500 Fast Tokens Monthly',
            'Private creations - only you decide who sees your work',
            '25,500 Token Bank for peak creativity'
        ],
        buttonText: 'Subscribe',
        description: 'ex. tax'
    },
    {
        id: 'artisan',
        name: 'Artisan Unlimited',
        credits: 25000,
        price: 30, // For monthly billing
        priceMonthly: 30,
        priceYearlyMonthlyEquivalent: 24,
        pricePerCredit: 0,
        target: 'Professional creators, small businesses, and content producers',
        popular: true,
        features: [
            '25,000 Fast Tokens Monthly',
            'Unlimited Image Generation at relaxed pace for Leonardo hosted models*',
            '75,000 Token Bank for peak creativity'
        ],
        buttonText: 'Subscribe',
        description: 'ex. tax'
    },
    {
        id: 'maestro',
        name: 'Maestro Unlimited',
        credits: 60000,
        price: 60,
        priceMonthly: 60,
        priceYearlyMonthlyEquivalent: 48,
        pricePerCredit: 0,
        target: 'Professional creators, small businesses, and content producers',
        features: [
            '60,000 Fast Tokens Monthly',
            'Unlimited Image Generation at relaxed pace for Leonardo hosted models*',
            'Unlimited Video Generation'
        ],
        buttonText: 'Subscribe',
        description: 'ex. tax'
    },
    {
        id: 'teams',
        name: 'Leonardo for Teams',
        credits: 0, // Contact for details
        price: 0,
        priceMonthly: 0,
        priceYearlyMonthlyEquivalent: 0,
        pricePerCredit: 0,
        target: 'Design teams, studios, agencies, and businesses',
        features: [
            'Shared Fast Tokens pool',
            'Unlimited Generation for all members at relaxed pace',
            'Shared Token Bank'
        ],
        buttonText: 'Get Started Now'
    }
];
