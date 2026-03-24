#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, Env, Address, Symbol
};

#[contract]
pub struct EscrowContract;

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Client,
    Freelancer,
    Token,
    Amount,
    Released,
}

#[contractimpl]
impl EscrowContract {

    // Initialize escrow and deposit funds
    pub fn init(
        env: Env,
        client: Address,
        freelancer: Address,
        token: Address,
        amount: i128,
    ) {
        client.require_auth();

        if amount <= 0 {
            panic!("Invalid amount");
        }

        // Store values
        env.storage().instance().set(&DataKey::Client, &client);
        env.storage().instance().set(&DataKey::Freelancer, &freelancer);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::Amount, &amount);
        env.storage().instance().set(&DataKey::Released, &false);

        // Transfer tokens from client → contract
        let token_client = soroban_sdk::token::Client::new(&env, &token);
        token_client.transfer(&client, &env.current_contract_address(), &amount);
    }

    // Release funds to freelancer
    pub fn release(env: Env) {
        let client: Address = env.storage().instance().get(&DataKey::Client).unwrap();
        let freelancer: Address = env.storage().instance().get(&DataKey::Freelancer).unwrap();
        let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let amount: i128 = env.storage().instance().get(&DataKey::Amount).unwrap();
        let released: bool = env.storage().instance().get(&DataKey::Released).unwrap();

        client.require_auth();

        if released {
            panic!("Already released");
        }

        let token_client = soroban_sdk::token::Client::new(&env, &token);

        // Transfer tokens from contract → freelancer
        token_client.transfer(&env.current_contract_address(), &freelancer, &amount);

        env.storage().instance().set(&DataKey::Released, &true);
    }

    // Refund to client
    pub fn refund(env: Env) {
        let client: Address = env.storage().instance().get(&DataKey::Client).unwrap();
        let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let amount: i128 = env.storage().instance().get(&DataKey::Amount).unwrap();
        let released: bool = env.storage().instance().get(&DataKey::Released).unwrap();

        client.require_auth();

        if released {
            panic!("Already released, cannot refund");
        }

        let token_client = soroban_sdk::token::Client::new(&env, &token);

        // Transfer tokens back to client
        token_client.transfer(&env.current_contract_address(), &client, &amount);

        env.storage().instance().set(&DataKey::Released, &true);
    }

    // Check escrow status
    pub fn status(env: Env) -> Symbol {
        let released: bool = env.storage().instance().get(&DataKey::Released).unwrap();

        if released {
            Symbol::short("DONE")
        } else {
            Symbol::short("PEND")
        }
    }
}