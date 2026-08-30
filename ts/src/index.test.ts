import { test, expect } from "bun:test";
import axios from "axios";

const BACKEND_URL = "http://localhost:3001";

test("signup works as expected", async () => {
    const response = await axios.post(`${BACKEND_URL}/signup`, {
        username: "harkirat" + Math.random(),
        password: "123123"
    })

    expect(response.status).toBe(200);
    expect(response.data.message).toBe("Successfully signed up");
})

test("balances endpoint works as expected", async () => {
    const username = "harkirat" + Math.random();
    await axios.post(`${BACKEND_URL}/signup`, {
        username: username,
        password: "123123"
    })

    const response = await axios.post(`${BACKEND_URL}/signin`, {
        username: username,
        password: "123123"
    })

    const token = response.data.token;

    const balancesResponse = await axios.get(`${BACKEND_URL}/balance`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    expect(balancesResponse.data.usdBalance).toBe(0);
})

test("onramp works as expected", async () => {
    const username = "harkirat" + Math.random();
    await axios.post(`${BACKEND_URL}/signup`, {
        username: username,
        password: "123123"
    })

    const response = await axios.post(`${BACKEND_URL}/signin`, {
        username: username,
        password: "123123"
    })

    const token = response.data.token;

    await axios.post(`${BACKEND_URL}/onramp`, {
        qty: 100
    }, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    const balancesResponse = await axios.get(`${BACKEND_URL}/balance`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    expect(balancesResponse.data.usdBalance).toBe(100);

})

test("deposit works as expected", async () => {
    const username = "harkirat" + Math.random();
    await axios.post(`${BACKEND_URL}/signup`, {
        username: username,
        password: "123123"
    })

    const response = await axios.post(`${BACKEND_URL}/signin`, {
        username: username,
        password: "123123"
    })

    const token = response.data.token;

    await axios.post(`${BACKEND_URL}/deposit/SOL`, {
        qty: 10
    }, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    const balancesResponse = await axios.get(`${BACKEND_URL}/balance`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    expect(balancesResponse.data.stockBalances.SOL).toBe(10);
})
