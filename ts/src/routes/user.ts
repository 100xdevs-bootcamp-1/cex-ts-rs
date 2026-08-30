import { Router } from "express";
import jwt from "jsonwebtoken";

import { authMiddleware, JWT_SECRET, type AuthRequest } from "../middleware";
import type {
    Claims,
    DepositRequest,
    DespositResponse,
    OnRampRequest,
    OrderRequest,
    SigninInput,
    SignupInput,
    SignupResponse,
    User
} from "../types/user";
import { AuthorityType } from "@solana/spl-token";
import { Ordebook } from "../orderbook";

export const router = Router();

let userIndex = 0;
const users: User[] = [];

const usdBalances: Map<number, { available: number, locked: number }> = new Map();
const stockBalances: Map<number, Map<String, { available: number, locked: number }>> = new Map();

const SOL_ORDERBOOK = new Ordebook("sol");

router.post("/signup", (req, res) => {
    const body = req.body as SignupInput;

    const userFound = users.find(u => u.username === body.username);

    if (!userFound) {
        userIndex = userIndex + 1;
        users.push({
            id: userIndex,
            username: body.username,
            password: body.password
        });

        usdBalances.set(userIndex, {available: 0, locked: 0});
        stockBalances.set(userIndex, new Map());

        res.json({
            message: "Successfully signed up"
        } satisfies SignupResponse);
    } else {
        res.status(401).json({
            message: "User already"
        } satisfies SignupResponse);
    }
});

router.post("/signin", (req, res) => {
    const body = req.body as SigninInput;
    const userFound = users.find(u => u.username === body.username && u.password === body.password);

    if (!userFound) {
        res.status(401).json({
            message: "Incorrect credentials"
        } satisfies SignupResponse);
        return;
    }

    const claims: Claims = {
        sub: userFound.id,
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60
    };

    const token = jwt.sign(claims, JWT_SECRET);

    res.json({
        token
    });
});

router.get("/balance", authMiddleware, (req: AuthRequest, res) => {
    const userId = req.userId!;
    const balances = stockBalances.get(userId) ?? new Map();
    let stock_balances = Object.fromEntries(balances);

    res.json({
        usdBalance: usdBalances.get(userId)?.available,
        stockBalances: stock_balances
    });
});

router.post("/onramp", authMiddleware, (req: AuthRequest, res) => {
    const userId = req.userId!;
    const body = req.body as OnRampRequest;
    usdBalances.set(userId, {
        locked: usdBalances.get(userId)?.locked!,
        available: usdBalances.get(userId)?.available! + body.qty
    });
    res.sendStatus(200);
});

router.post("/deposit/:asset_symbol", authMiddleware, (req: AuthRequest, res) => {
    const userId = req.userId!;
    const symbol = req.params.asset_symbol as string;
    const body = req.body as DepositRequest;

    const balances = stockBalances.get(userId)!;
    const existingBalance = balances.get(symbol);
    balances.set(symbol, {locked: existingBalance?.locked || 0, available: (existingBalance?.available || 0) + body.qty});

    res.json({
        message: "Successfully deposited"
    });
});

router.post("/order", authMiddleware, (req: AuthRequest, res) => {
    const userId = req.userId!;
    const body = req.body as OrderRequest;

    if (body.side == "bid") {
        const amountToSpend = body.price * body.qty;
        const userBalance = usdBalances.get(userId)?.available || 0;

        if (userBalance < amountToSpend) {
            res.status(411).json({
                message: "You have insufficient funds"
            })
            return 
        }

        if (body.asset === "sol") {
            let fills = SOL_ORDERBOOK.addOrder(userId, "bid", body.price, body.qty);
            fills.forEach(fill => {
                if (fill.type == "fill") {
                    stockBalances.get(fill.buyer)!.set("sol", {
                        available: stockBalances.get(fill.buyer)!.get("sol")!.available + fill.qty,
                        locked: stockBalances.get(fill.buyer)!.get("sol")!.locked
                    });

                    stockBalances.get(fill.seller)!.set("sol", {
                        available: stockBalances.get(fill.buyer)!.get("sol")!.available,
                        locked: stockBalances.get(fill.buyer)!.get("sol")!.locked -= fill.qty
                    })

                    usdBalances.set(userId, {
                        available: usdBalances.get(userId)!.available - fill.price * fill.qty,
                        locked: usdBalances.get(userId)!.locked
                    });

                    usdBalances.set(fill.seller, {
                        available: usdBalances.get(fill.seller)!.available + fill.price * fill.qty,
                        locked: usdBalances.get(fill.seller)!.locked
                    });
                }

                if (fill.type == "orderbook_update") {
                    usdBalances.set(userId, {
                        available: usdBalances.get(userId)!.available - fill.price * fill.qty,
                        locked: usdBalances.get(userId)!.locked + fill.price * fill.qty
                    });
                }
            })
        }
    } 

    if (body.side == "ask") {
        const existingAmount = stockBalances.get(userId)?.get(body.asset)?.available || 0;
        if (body.qty > existingAmount) {
            res.status(411).json({
                message: "You have insufficient stocks"
            })
        }

        if (body.asset === "sol") {
            let fills = SOL_ORDERBOOK.addOrder(userId, "ask", body.price, body.qty);

            fills.forEach(fill => {
                if (fill.type == "fill") {
                    stockBalances.get(fill.buyer)!.set("sol", {
                        available: stockBalances.get(fill.buyer)!.get("sol")!.available + fill.qty,
                        locked: stockBalances.get(fill.buyer)!.get("sol")!.locked
                    });

                    stockBalances.get(fill.seller)!.set("sol", {
                        available: stockBalances.get(fill.buyer)!.get("sol")!.available - fill.qty,
                        locked: stockBalances.get(fill.buyer)!.get("sol")!.locked
                    })

                    usdBalances.set(userId, {
                        available: usdBalances.get(userId)!.available + fill.price * fill.qty,
                        locked: usdBalances.get(userId)!.locked
                    });

                    usdBalances.set(fill.seller, {
                        available: usdBalances.get(fill.seller)!.available,
                        locked: usdBalances.get(fill.seller)!.locked - fill.price * fill.qty
                    });
                }

                if (fill.type == "orderbook_update") {
                    stockBalances.get(userId)!.set("sol", {
                        available: stockBalances.get(fill.buyer)!.get("sol")!.available - fill.qty,
                        locked: stockBalances.get(fill.buyer)!.get("sol")!.locked + fill.qty
                    })
                }
            })
        }
    }
})