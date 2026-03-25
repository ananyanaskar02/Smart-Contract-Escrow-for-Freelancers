# 💼 Smart Contract Escrow for Freelancers (Soroban - Stellar)

## 📌 Project Description
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/ad224d68-2e82-4b89-afbe-6945f20e82a3" />
<img width="1920" height="1080" alt="image" src="https://github.com/user-attachments/assets/acd55501-cfd5-4daa-a07f-f6e36215adb7" />


This project is a basic escrow smart contract built using Soroban (Stellar’s smart contract platform). It is designed to facilitate secure payments between clients and freelancers by holding funds in escrow until work is completed.

---

## ⚙️ What it does
The contract allows:
- A client to deposit funds into escrow
- Funds to be securely held by the smart contract
- The client to release funds to the freelancer after work completion
- Refund option if the agreement is not fulfilled

---

## ✨ Features
- 🔒 Secure escrow mechanism
- 👤 Client authorization required for actions
- 💸 Fund release to freelancer
- 🔁 Refund capability
- 📊 Status tracking (Pending / Done)
- 🧱 Built on Soroban (Stellar smart contracts)

---

## 🚀 How it works
1. Client initializes escrow with freelancer address and amount
2. Funds are locked in the contract
3. After work completion:
   - Client calls `release()` → freelancer gets paid
4. If dispute:
   - Client calls `refund()` → funds returned

---

## 🛠 Tech Stack
- Rust
- Soroban SDK
- Stellar Blockchain

---

## 🔗 Deployed Smart Contract Link
https://stellar.expert/explorer/testnet/contract/CBMGCVQ2CETV2ZBT3XEJ5M7UCL7LBADH5BHZIB3LVI5NZTSAHKUZTDA3

---

## 📌 Future Improvements
- Multi-signature dispute resolution
- Milestone-based payments
- Integration with Stellar token contracts
- Frontend UI for easy interaction

---

## 📄 License
MIT License
