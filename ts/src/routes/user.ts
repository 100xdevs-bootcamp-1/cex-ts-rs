import { Router } from "express";
import jwt from "jsonwebtoken";

import { authMiddleware, JWT_SECRET, type AuthRequest } from "../middleware";
import type {
    Claims,
    DepositRequest,
    OnRampRequest,
    SigninInput,
    SignupInput,
    SignupResponse,
    User
} from "../types/user";

export const router = Router();

let userIndex = 0;
const users: User[] = [];

const usdBalances: Map<number, number> = new Map();
const stockBalances: Map<number, Map<String, number>> = new Map();

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

        usdBalances.set(userIndex, 0);
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
    res.json({
        usdBalance: usdBalances.get(userId),
        stockBalances: stockBalances.get(userId)
    });
});

router.post("/onramp", authMiddleware, (req: AuthRequest, res) => {
    const userId = req.userId!;
    const body = req.body as OnRampRequest;
    usdBalances.set(userId, usdBalances.get(userId)! + body.qty);
    res.sendStatus(200);
});

router.post("/deposit/:asset_symbol", authMiddleware, (req: AuthRequest, res) => {
    const userId = req.userId;
    const symbol = req.params.asset_symbol;
    const body = req.body as DepositRequest;
    console.log(userId);
    console.log(symbol);
    console.log(body.qty);
    res.sendStatus(200);
});
