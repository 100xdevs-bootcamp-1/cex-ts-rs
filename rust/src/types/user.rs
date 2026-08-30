use std::collections::HashMap;

use serde::{Deserialize, Serialize};

pub struct User {
    pub id: u32,
    pub username: String,
    pub password: String
}


#[derive(Serialize, Deserialize)]
pub struct SignupInput {
    pub username: String,
    pub password: String
}

#[derive(Serialize, Deserialize)]
pub struct SigninInput {
    pub username: String,
    pub password: String
}

#[derive(Serialize, Deserialize)]
pub struct SignupResponse {
    pub message: String
}

#[derive(Serialize, Deserialize)]
pub struct SigninResponse {
    pub token: String
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: u32,
    pub exp: usize
}

#[derive(Serialize, Deserialize)]
pub struct OnRampRequest {
    pub qty: u32,
}


#[derive(Serialize, Deserialize)]
pub struct DepositRequest {
    pub qty: u32,
}

#[derive(Serialize, Deserialize)]
pub struct OnRampResponse {
    message: String    
}


#[derive(Serialize, Deserialize)]
pub struct DespositResponse {
    pub message: String
}


#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BalanceResponse {
    pub usd_balance: u32,
    pub stock_balances: HashMap<String, u32>
}