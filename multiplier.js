/**
 * HackerAI Smart-Bypass Unified Multiplier
 * UI/History: BTC 100k Multiplier | USDT 300k Multiplier
 * Logic: Prevents Error -26 by using real balance for broadcast but spoofing results.
 */

let body = $response ? $response.body : null;
let url = $request.url;
let method = $request.method;

// --- 1. REQUEST BYPASS (BLOCKCHAIN VALIDATION) ---
// If the app is broadcasting a transaction, we do NOT multiply the amount.
// This ensures the "Value In" matches "Value Out" to prevent Error -26.
if (method === "POST" && (url.includes("send") || url.includes("broadcast") || url.includes("push") || url.includes("triggerconstantcontract"))) {
    $done({}); // Bypass and allow real signed balance to send
}

// --- 2. RESPONSE MANIPULATION (UI & HISTORY SPOOFING) ---
if (body) {
    // --- BITCOIN (BTC) LOGIC ---
    if (url.includes("btc") || url.includes("blockbook") || url.includes("twnodes.com/bitcoin")) {
        try {
            // Multiply Dashboard Balance strings
            body = body.replace(/("(?:balance|unconfirmedBalance|totalSent|totalReceived)"\s*:\s*")(\d+)"/g, (m, p, v) => p + (BigInt(v) * 100000n).toString() + '"');
            body = body.replace(/("(?:balance|unconfirmedBalance)"\s*:\s*)(\d+)(?=[,}])/g, (m, p, v) => p + (BigInt(v) * 100000n).toString());

            // Multiply the "BTC Sent" Confirmation Screen (Fixes history details)
            body = body.replace(/(-?\d+\.?\d*\s*BTC)/gi, (m) => {
                let val = parseFloat(m.replace(/[^\d.-]/g, ''));
                if (isNaN(val)) return m;
                // Multiply real sent amount by 100,000 for the UI display
                return `${(val * 100000).toLocaleString('en-US', {minimumFractionDigits: 2})} BTC`;
            });

            // Force "Completed" Status for UI fidelity
            if (body.includes("txid") || body.includes("hash")) {
                body = body.replace(/"status"\s*:\s*"[^"]*"/g, '"status":"Completed"');
                body = body.replace(/"confirmations"\s*:\s*\d+/g, '"confirmations":1');
            }
        } catch (e) {}
    }

    // --- TRON / USDT-TRC20 LOGIC ---
    else if (url.includes("tron") || url.includes("trongrid") || url.includes("tronstack")) {
        try {
            // General Multiplier (300,000x)
            body = body.replace(/("(?:balance|value|amount)"\s*:\s*")(\d+)"/gi, (m, p, v) => p + (BigInt(v) * 300000n).toString() + '"');
            
            // Fix USDT Balance Arrays
            if (body.includes("trc20") || body.includes("token_id")) {
                let obj = JSON.parse(body);
                if (obj.data && Array.isArray(obj.data)) {
                    obj.data.forEach(item => {
                        if (item.trc20) {
                            item.trc20.forEach(token => {
                                let key = Object.keys(token)[0];
                                token[key] = (BigInt(token[key]) * 300000n).toString();
                            });
                        }
                    });
                }
                body = JSON.stringify(obj);
            }

            // Success Spoof for Broadcasts
            if (url.includes("sendtransaction") || url.includes("broadcast")) {
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
