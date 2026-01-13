/**
 * Centralized API client for making requests to Next.js API routes
 * Handles authentication, error handling, and response parsing
 */


interface ApiRequestOptions {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    body?: any;
    requireAuth?: boolean;
    guestId?: string;
}

class ApiClient {
    private baseUrl = '';

    /**
     * Get authentication token from Supabase
     */
    /**
     * Make authenticated API request
     */
    async request<T = any>(
        endpoint: string,
        options: ApiRequestOptions = {}
    ): Promise<T> {
        const {
            method = 'GET',
            body,
            requireAuth = true,
            guestId
        } = options;

        // Prepare headers
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        // Add authentication if required
        // if (requireAuth) {
        //     if (!token) {
        //         throw new Error('Authentication required');
        //     }
        //     headers['Authorization'] = `Bearer ${token}`;
        // }

        // Add guest ID if provided
        if (guestId) {
            headers['X-Guest-ID'] = guestId;
        }

        // Make request
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined,
        });

        // Parse response
        const data = await response.json();

        // Handle errors
        if (!response.ok) {
            const error = new Error(data.error || `API error: ${response.status}`);
            (error as any).status = response.status;
            (error as any).code = data.code;
            throw error;
        }

        return data;
    }

    // Convenience methods
    async get<T = any>(endpoint: string, requireAuth = true): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET', requireAuth });
    }

    async post<T = any>(endpoint: string, body: any, requireAuth = true): Promise<T> {
        return this.request<T>(endpoint, { method: 'POST', body, requireAuth });
    }

    async patch<T = any>(endpoint: string, body: any, requireAuth = true): Promise<T> {
        return this.request<T>(endpoint, { method: 'PATCH', body, requireAuth });
    }

    async delete<T = any>(endpoint: string, body?: any, requireAuth = true): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE', body, requireAuth });
    }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Typed API methods for better DX
export const api = {
    // User operations
    users: {
        getCurrent: () => apiClient.get('/api/users'),
        getById: (userId: string) => apiClient.get(`/api/users?userId=${userId}`),
        create: (data: { email: string; full_name?: string }) =>
            apiClient.post('/api/users', data),
        update: (data: { full_name?: string; avatar_url?: string }) =>
            apiClient.patch('/api/users', data),
    },

    // Credits operations
    credits: {
        get: () => apiClient.get<{ credits: number }>('/api/credits'),
        add: (amount: number, targetUserId?: string) =>
            apiClient.post('/api/credits/add', { amount, targetUserId }),
        reserve: (amount: number) =>
            apiClient.post('/api/credits/reserve', { amount }),

        // Guest credits
        guest: {
            get: (guestId: string) =>
                apiClient.get<{ credits: number }>(`/api/credits/guest?guestId=${guestId}`, false),
            reserve: (guestId: string, amount: number) =>
                apiClient.post('/api/credits/guest/reserve', { guestId, amount }, false),
        },
    },

    // Gallery operations
    gallery: {
        get: () => apiClient.get('/api/gallery'),
        add: (images: Array<{ image_url: string; thumbnail_url?: string; metadata?: any }>) =>
            apiClient.post('/api/gallery', { images }),
        delete: (imageIds: string[]) =>
            apiClient.delete('/api/gallery', { imageIds }),

        // Guest gallery
        guest: {
            get: (guestId: string) =>
                apiClient.get(`/api/gallery/guest?guestId=${guestId}`, false),
            add: (guestId: string, images: Array<{ image_url: string; thumbnail_url?: string; metadata?: any }>) =>
                apiClient.post('/api/gallery/guest', { guestId, images }, false),
        },
    },

    // History operations
    history: {
        get: (limit = 50, offset = 0) =>
            apiClient.get(`/api/history?limit=${limit}&offset=${offset}`),
        log: (data: {
            guestId?: string;
            toolId: number;
            prompt?: string;
            outputImages?: string[];
            creditsUsed?: number;
            apiModelUsed?: string;
            generationCount?: number;
            errorMessage?: string;
        }) => apiClient.post('/api/history', data, false), // Auth optional
    },

    // Static data
    data: {
        getTools: () => apiClient.get<{ tools: any[] }>('/api/data/tools', false),
        getPrompts: () => apiClient.get<{ prompts: any[] }>('/api/data/prompts', false),
        getCategories: () => apiClient.get<{ categories: any[] }>('/api/data/categories', false),
    },
};
