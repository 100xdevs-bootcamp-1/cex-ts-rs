use actix_web::{FromRequest, HttpRequest, HttpResponse, ResponseError, dev::Payload, error::Error};
use jsonwebtoken::{DecodingKey, Validation, decode};
use std::future::{Ready, ready};
use std::fmt;

use crate::types::user::Claims;

pub const JWT_SECRET: &str = "secret";

#[derive(Debug)]
pub struct AuthError;

impl fmt::Display for AuthError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Invalid or missing token")
    }
}

impl ResponseError for AuthError {
    fn error_response(&self) -> HttpResponse {
        HttpResponse::BadRequest().json(serde_json::json!({
            "message": "Invalid or missing token"
        }))
    }
}

/// Extractor that pulls the authenticated user's id out of the JWT
/// sent in the `Authorization` header (`Bearer <token>` or just `<token>`).
pub struct AuthUser(pub u32);

impl FromRequest for AuthUser {
    type Error = Error;
    type Future = Ready<Result<Self, Self::Error>>;

    fn from_request(req: &HttpRequest, _payload: &mut Payload) -> Self::Future {
        let token = req
            .headers()
            .get("Authorization")
            .and_then(|value| value.to_str().ok())
            .map(|value| value.trim_start_matches("Bearer ").trim().to_string());

        let token = match token {
            Some(token) if !token.is_empty() => token,
            _ => return ready(Err(AuthError.into())),
        };
        
        let decoded = decode::<Claims>(
            &token,
            &DecodingKey::from_secret(String::from("secret").as_ref()),
            &Validation::default(),
        );

        match decoded {
            Ok(data) => ready(Ok(AuthUser(data.claims.sub))),
            Err(_) => ready(Err(AuthError.into())),
        }
    }
}
