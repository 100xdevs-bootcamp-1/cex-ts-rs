export interface User {
    id: number;
    username: string;
    password: string;
}

export interface SignupInput {
    username: string;
    password: string;
}

export interface SigninInput {
    username: string;
    password: string;
}

export interface SignupResponse {
    message: string;
}

export interface SigninResponse {
    token: string;
}

export interface Claims {
    sub: number;
    exp: number;
}

export interface OnRampRequest {
    qty: number;
}

export interface DepositRequest {
    qty: number;
}

export interface OrderRequest {
    // type: "market" | "limit", 
    side: "bid" | "ask", 
    qty: number, 
    price: number,
    asset: "sol" | "eth"
}

export interface OnRampResponse {
    message: string;
}

export interface DespositResponse {
    message: string;
}

export interface BalanceResponse {
    usd: number;
    assets: Record<string, number>;
}
