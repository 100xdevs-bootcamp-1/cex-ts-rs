
use actix_web::{HttpResponse, Responder, get, post, web::{self, Json}};
use chrono::{Duration, Utc};
use jsonwebtoken::{EncodingKey, Header, encode};

use crate::{AppState, middleware::AuthUser, types::user::{Claims, DepositRequest, OnRampRequest, SigninInput, SigninResponse, SignupInput, SignupResponse, User}};

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


        println!("{}", users.len());

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
    let user_id = user.0;
    println!("{}", user_id);
    HttpResponse::Ok()
}

#[post("/onramp")]
pub async fn onramp(user: AuthUser, body: Json<OnRampRequest>) -> impl Responder {
    let user_id = user.0;
    println!("{}", user_id);
    println!("{}", body.qty);
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

