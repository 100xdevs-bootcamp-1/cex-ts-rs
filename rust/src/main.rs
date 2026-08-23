use std::sync::{Mutex};

use actix_web::{App, HttpServer, web::{self}};

use crate::{routes::user::{balance, sign_in, sign_up}, types::user::User};

pub mod types;
pub mod routes;
pub mod middleware;


struct AppState {
    user_index: Mutex<u32>,
    users: Mutex<Vec<User>>
}

#[actix_web::main] 
async fn main() -> std::io::Result<()> {
    let app_state = web::Data::new(AppState {
        users: Mutex::new(vec![]),
        user_index: Mutex::new(0)
    });

    HttpServer::new(move || {
        App::new()
            .app_data(app_state.clone())
            .service(sign_up)
            .service(sign_in)
            .service(balance)
    })
    .bind(("127.0.0.1", 3001))?
    .run()
    .await
}