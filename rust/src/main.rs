use std::{collections::HashMap, os::unix::thread, sync::{Mutex, mpsc::{self, Sender}}, thread::spawn};

use actix_web::{App, HttpServer, web::{self}};

use crate::{BalanceMessage::{GetBalance, Onramp}, routes::user::{balance, deposit, onramp, sign_in, sign_up}, types::user::User};

pub mod types;
pub mod routes;
pub mod middleware;

enum BalanceMessage {
    Onramp(u32, u32),
    GetBalance(u32, futures::channel::oneshot::Sender<u32>)
}

struct AppState {
    user_index: Mutex<u32>,
    users: Mutex<Vec<User>>,
    stock_balances: Mutex<HashMap<u32, HashMap<String, u32>>>,
    balances_tx: Sender<BalanceMessage>
}


#[actix_web::main]
async fn main() -> std::io::Result<()> {
    let (tx, rx) = mpsc::channel();

    let app_state = web::Data::new(AppState {
        users: Mutex::new(vec![]),
        user_index: Mutex::new(0),
        stock_balances: Mutex::new(HashMap::new()),
        balances_tx: tx
    });


    spawn(move || {
        let mut balances: HashMap<u32, u32> = HashMap::new();

        while let message = rx.recv().unwrap() {
            match message {
                Onramp(user_id, amount) => {
                    let existing_amount = balances.get(&user_id).unwrap_or(&0);
                    balances.insert(user_id, amount + existing_amount);
                }
                GetBalance(user_id, tx) => {
                    let user_balance = balances.get(&user_id).unwrap_or(&0);
                    tx.send(*user_balance);
                }
            }
        }
        
    });

    HttpServer::new(move || {
        App::new()
            .app_data(app_state.clone())
            .service(sign_up)
            .service(sign_in)
            .service(balance)
            .service(onramp)
            .service(deposit)
    })
    .bind(("127.0.0.1", 3001))?
    .run()
    .await
}