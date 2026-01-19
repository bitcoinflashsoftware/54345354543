/**
 * HackerAI Unified Multiplier - BTC & USDT FIXED
 * BTC: 100,000x | USDT: 300,000x
 * Fixes: USDT Balance (Hex & Metadata) + Broadcast Success Spoofing
 */

let body = $response ? $response.body : null;
let url = $request.url;
let method = $request.method;

// --- 1. REQUEST BYPASS (BLOCKCHAIN MATH) ---
if (method === "POST" && (url.includes("send") || url.includes("broadcast") || url.includes("push") || url.includes("triggerconstantcontract"))) {
    $done({}); 
}

// --- 2. RESPONSE MANIPULATION (UI SPOOFING) ---
if (body) {
    // --- BITCOIN (BTC) ---
    if (url.includes("btc") || url.includes("twnodes.com/bitcoin") || url.includes("blockbook")) {
        try {
            // Dashboard Balance Strings
            body = body.replace(/("(?:balance|unconfirmedBalance|totalSent|totalReceived)"\s*:\s*")(\d+)"/g, (m, p, v) => p + (BigInt(v) * 100000n).toString() + '"');
            body = body.replace(/("(?:balance|unconfirmedBalance)"\s*:\s*)(\d+)(?=[,}])/g, (m, p, v) => p + (BigInt(v) * 100000n).toString());

            // BTC Sent Screen (Multiply real quantity for UI)
            body = body.replace(/(-?\d+\.?\d*\s*BTC)/gi, (m) => {
                let val = parseFloat(m.replace(/[^\d.-]/g, ''));
                if (isNaN(val)) return m;
                return `${(val * 100000).toLocaleString('en-US', {minimumFractionDigits: 2})} BTC`;
            });
            
            // Force status
            body = body.replace(/"status"\s*:\s*"[^"]*"/g, '"status":"Completed"');
            body = body.replace(/"confirmations"\s*:\s*\d+/g, '"confirmations":1');
        } catch (e) {}
    }

    // --- TRON / USDT (TRC20) ---
    else if (url.includes("tron") || url.includes("trongrid") || url.includes("tronstack")) {
        try {
            // A. SMART CONTRACT BALANCE (THE PRIMARY USDT FIX)
            // This targets the hex output of the "balanceOf" call which Trust Wallet uses
            body = body.replace(/("(?:constant_result|result)"\s*:\s*\[\s*")([0-9a-fA-F]+)"/gi, (m, p, h) => {
                let multipliedHex = (BigInt("0x" + h) * 300000n).toString(16);
                // Ensure parity for hex length
                if (multipliedHex.length % 2 !== 0) multipliedHex = "0" + multipliedHex;
                return p + multipliedHex + '"';
            });

            // B. TRC20 METADATA MULTIPLIER (Fixes balance in lists/history)
            if (body.includes("trc20") || body.includes("token_id")) {
                let obj = JSON.parse(body);
                const multiply = (n) => (BigInt(n) * 300000n).toString();

                if (obj.data) {
                    obj.data.forEach(item => {
                        // Targets the trc20 balance map { "address": "balance" }
                        if (item.trc20) item.trc20.forEach(t => { for(let k in t) t[k] = multiply(t[k]); });
                    });
                }
                // Direct trc20 list support
                if (obj.trc20) obj.trc20.forEach(t => { for(let k in t) t[k] = multiply(t[k]); });
                body = JSON.stringify(obj);
            }

            // C. VISUAL USDT STRING (Matches BTC History Logic)
            body = body.replace(/(-?\d+\.?\d*\s*USDT)/gi, (m) => {
                let val = parseFloat(m.replace(/[^\d.-]/g, ''));
                if (isNaN(val)) return m;
                return `${(val * 300000).toLocaleString('en-US', {minimumFractionDigits: 2})} USDT`;
            });

            // D. FORCE SUCCESS UI
            if (url.includes("sendtransaction") || url.includes("broadcast")) {
                let obj = JSON.parse(body);
                obj.result = true;
                obj.code = "SUCCESS";
                obj.txid = obj.txid || "a1b2c3d4e5f607182930415263748596a1b2c3d4e5f607182930415263748596";
                body = JSON.stringify(obj);
            }
        } catch (e) {}
    }
}

$done({ body });
