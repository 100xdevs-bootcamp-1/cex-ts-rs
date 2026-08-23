
use std::collections::HashMap;

use actix_web::{HttpResponse, Responder, get, post, web::{self, Json}};
use chrono::{Duration, Utc};
use jsonwebtoken::{EncodingKey, Header, encode};

use crate::{AppState, middleware::AuthUser, types::user::{BalanceResponse, Claims, DepositRequest, OnRampRequest, SigninInput, SigninResponse, SignupInput, SignupResponse, User}};

#[post("/signup")]
async fn sign_up(body: Json<SignupInput>, app_state: web::Data<AppState>) -> impl Responder {
    let mut users = app_state.users.lock().unwrap();
    let mut user_index = app_state.user_index.lock().unwrap();

    let user_found = users.iter().find(|u| u.username == body.username);

    if user_found.is_none() {
        *user_index = *user_index + 1;
        users.push(User {
            id: user_index.clone(),
            username: body.username.clone(),
            password: body.password.clone()
        });

        let mut usd_balances = app_state.usd_balances.lock().unwrap();
        usd_balances.insert(user_index.clone(), 0);
        
        let mut stock_balances = app_state.stock_balances.lock().unwrap();
        stock_balances.insert(user_index.clone(), HashMap::new());

        HttpResponse::Ok().json(SignupResponse {
            message: String::from("Successfully signed up")
        })
    } else {
        HttpResponse::Unauthorized().json(SignupResponse {
            message: String::from("User already")
        })
    }
}

#[post("/signin")]
pub async fn sign_in(app_state: web::Data<AppState>, body: Json<SigninInput>) -> impl Responder {
    let mut users = app_state.users.lock().unwrap();
    let user_found = users.iter().find(|u| u.username == body.username && u.password == body.password);

    if user_found.is_none() {
        return HttpResponse::Unauthorized().json(SignupResponse {
            message: String::from("Incorrect credentials")
        });
    }

    let user = user_found.unwrap();

    let exp = Utc::now()
        .checked_add_signed(Duration::hours(24))
        .expect("valid timestamp")
        .timestamp() as usize;

    let claims = Claims {
        sub: user.id,
        exp
    };

    let token = encode(&Header::default(), &claims, &EncodingKey::from_secret("secret".as_ref())).unwrap();
    
    HttpResponse::Ok().json(SigninResponse {
        token
    })
}


#[get("/balance")]
pub async fn balance(app_state: web::Data<AppState>, user: AuthUser) -> impl Responder {
    println!("hi there hello");
    let user_id = user.0;
    let usd_balance = app_state.usd_balances.lock().unwrap().get(&user_id).unwrap_or(&0).clone();
    let stock_balances = app_state.stock_balances.lock().unwrap().get(&user_id).unwrap_or(&HashMap::new()).clone();

    println!("hi thte balance endpoint");
    HttpResponse::Ok().json(BalanceResponse {
        usd_balance: usd_balance,
        stock_balances: stock_balances
    })
}

#[post("/onramp")]
pub async fn onramp(app_state: web::Data<AppState>, user: AuthUser, body: Json<OnRampRequest>) -> impl Responder {
    let user_id = user.0;
    let mut balances = app_state.usd_balances.lock().unwrap();

    let existing_balance = balances.get(&user_id).unwrap_or(&0).clone();

    balances.insert(user_id, existing_balance + body.qty);

    HttpResponse::Ok()
}

#[post("/deposit/{asset_symbol}")]
pub async fn desposit(user: AuthUser, symbol: web::Path<String>, body: Json<DepositRequest>) -> impl Responder {
    let user_id = user.0;
    println!("{}", user_id);
    println!("{}", symbol);
    println!("{}", body.qty);
    HttpResponse::Ok()
}

// order endpoint. 
#[post("/order")]
pub async fn order() {

}

#[post("/cancel")]
pub async fn cancel() {

}

