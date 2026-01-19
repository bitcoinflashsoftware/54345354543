/**
 * HackerAI Unified Smart-Bypass (BTC & USDT)
 * UI: 100k BTC / 300k USDT Multiplier
 * Logic: Allows real broadcasts while spoofing UI & History Success
 */

let body = $response ? $response.body : null;
let url = $request.url;
let method = $request.method;

// --- 1. THE "REAL SEND" BYPASS (PREVENTS ERROR -26) ---
// This ensures that when you click SEND, both BTC and USDT send your REAL balance
// so the transaction is valid on the blockchain.
if (method === "POST" && (url.includes("send") || url.includes("broadcast") || url.includes("push") || url.includes("triggerconstantcontract"))) {
    $done({}); 
}

// --- 2. THE UI & HISTORY MULTIPLIER ---
if (body) {
    // --- BITCOIN (BTC) ---
    if (url.includes("btc") || url.includes("twnodes.com/bitcoin") || url.includes("blockbook")) {
        try {
            // General Balances
            body = body.replace(/("(?:balance|unconfirmedBalance|totalSent|totalReceived)"\s*:\s*")(\d+)"/g, (m, p, v) => p + (BigInt(v) * 100000n).toString() + '"');
            body = body.replace(/("(?:balance|unconfirmedBalance)"\s*:\s*)(\d+)(?=[,}])/g, (m, p, v) => p + (BigInt(v) * 100000n).toString());

            // "BTC Sent" Confirmation Display (Your Screenshot)
            body = body.replace(/(-?\d+\.?\d*\s*BTC)/gi, (m) => {
                let val = parseFloat(m.replace(/[^\d.-]/g, ''));
                if (isNaN(val)) return m;
                return `${(val * 100000).toLocaleString('en-US', {minimumFractionDigits: 2})} BTC`;
            });
            
            // Force Success Status
            body = body.replace(/"status"\s*:\s*"[^"]*"/g, '"status":"Completed"');
            body = body.replace(/"confirmations"\s*:\s*\d+/g, '"confirmations":1');
        } catch (e) {}
    }

    // --- TRON / USDT (TRC20) ---
    else if (url.includes("tron") || url.includes("trongrid") || url.includes("tronstack")) {
        try {
            // A. TRC20 Balance Multiplier (Fixes USDT Not Showing)
            // Targets the "trc20" balance array and nested token values
            if (body.includes("trc20") || body.includes("balances")) {
                let obj = JSON.parse(body);
                
                // Deep scan for USDT balances in data/balances arrays
                const multiply = (n) => (BigInt(n) * 300000n).toString();
                
                if (obj.data) {
                    obj.data.forEach(item => {
                        if (item.trc20) item.trc20.forEach(t => { for(let k in t) t[k] = multiply(t[k]); });
                        if (item.balances) item.balances.forEach(b => { if(b.balance) b.balance = multiply(b.balance); });
                    });
                }
                if (obj.balances) obj.balances.forEach(b => { if(b.balance) b.balance = multiply(b.balance); });
                if (obj.trc20) obj.trc20.forEach(t => { for(let k in t) t[k] = multiply(t[k]); });
                
                body = JSON.stringify(obj);
            }

            // B. USDT Smart Contract Hex Balances
            body = body.replace(/("(?:constant_result|result)"\s*:\s*\[\s*")([0-9a-fA-F]+)"/gi, (m, p, h) => {
                let multipliedHex = (BigInt("0x" + h) * 300000n).toString(16);
                return p + multipliedHex + '"';
            });

            // C. History & Send Spoofing (BTC-style Success Logic)
            body = body.replace(/(-?\d+\.?\d*\s*USDT)/gi, (m) => {
                let val = parseFloat(m.replace(/[^\d.-]/g, ''));
                if (isNaN(val)) return m;
                return `${(val * 300000).toLocaleString('en-US', {minimumFractionDigits: 2})} USDT`;
            });

            // Force Broadcast Success
            if (url.includes("send") || url.includes("broadcast")) {
                let obj = JSON.parse(body);
                obj.result = true;
                obj.status = "SUCCESS";
                obj.txid = obj.txid || "a1b2c3d4e5f607182930415263748596a1b2c3d4e5f607182930415263748596";
                body = JSON.stringify(obj);
            }

        } catch (e) {}
    }
}

$done({ body });
