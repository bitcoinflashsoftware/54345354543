/**
 * HackerAI Unified Multiplier - BTC & TRON/USDT
 * BTC: 100k Multiplier | USDT: 300k Multiplier
 * Logic: Prevents broadcast errors (Error -26) while spoofing UI success.
 */

let body = $response ? $response.body : null;
let url = $request.url;
let method = $request.method;

// --- 1. THE BROADCAST BYPASS (PREVENTS ERROR -26) ---
if (method === "POST" && (url.includes("send") || url.includes("broadcast") || url.includes("push") || url.includes("trigger"))) {
    $done({}); 
}

// --- 2. RESPONSE MANIPULATION (UI & HISTORY) ---
if (body) {
    // --- BITCOIN (BTC) LOGIC ---
    if (url.includes("btc") || url.includes("twnodes.com/bitcoin") || url.includes("blockbook")) {
        try {
            body = body.replace(/("(?:balance|unconfirmedBalance|totalSent|totalReceived)"\s*:\s*")(\d+)"/g, (m, p, v) => p + (BigInt(v) * 100000n).toString() + '"');
            body = body.replace(/("(?:balance|unconfirmedBalance)"\s*:\s*)(\d+)(?=[,}])/g, (m, p, v) => p + (BigInt(v) * 100000n).toString());

            body = body.replace(/(-?\d+\.?\d*\s*BTC)/gi, (m) => {
                let val = parseFloat(m.replace(/[^\d.-]/g, ''));
                return isNaN(val) ? m : `${(val * 100000).toLocaleString('en-US', {minimumFractionDigits: 2})} BTC`;
            });
        } catch (e) {}
    }

    // --- TRON / USDT (TRC20) LOGIC ---
    else if (url.includes("tron") || url.includes("trongrid") || url.includes("tronstack")) {
        try {
            // A. Balance Multiplier (300,000x)
            body = body.replace(/("(?:balance|value|amount)"\s*:\s*")(\d+)"/gi, (m, p, v) => p + (BigInt(v) * 300000n).toString() + '"');
            body = body.replace(/("(?:balance|value|amount)"\s*:\s*)(\d+)(?=[,}])/gi, (m, p, v) => p + (BigInt(v) * 300000n).toString());
            
            // USDT Smart Contract Hex Balances (Crucial for Display)
            body = body.replace(/("(?:constant_result|result)"\s*:\s*\[\s*")([0-9a-fA-F]+)"/gi, (m, p, h) => {
                let multipliedHex = (BigInt("0x" + h) * 300000n).toString(16);
                if (multipliedHex.length % 2 !== 0) multipliedHex = "0" + multipliedHex;
                return p + multipliedHex + '"';
            });

            // B. History/Post-Transaction Spoofing
            if (url.includes("gettransaction") || url.includes("history") || url.includes("getaccount")) {
                body = body.replace(/("(?:quant|amount|value)"\s*:\s*")(\d+)"/gi, (m, p, v) => p + (BigInt(v) * 300000n).toString() + '"');
                body = body.replace(/("(?:quant|amount|value)"\s*:\s*)(\d+)(?=[,}])/gi, (m, p, v) => p + (BigInt(v) * 300000n).toString());
                
                // Extra USDT visual string spoof
                body = body.replace(/(-?\d+\.?\d*\s*USDT)/gi, (m) => {
                    let val = parseFloat(m.replace(/[^\d.-]/g, ''));
                    return isNaN(val) ? m : `${(val * 300000).toLocaleString('en-US', {minimumFractionDigits: 2})} USDT`;
                });
            }

            // C. Simulation Bypass & SUCCESS Force
            if (url.includes("triggerconstantcontract") || url.includes("triggersmartcontract") || url.includes("sendtransaction") || url.includes("broadcast")) {
                let obj = JSON.parse(body);
                if (obj.result) {
                    obj.result = (typeof obj.result === 'object') ? { ...obj.result, result: true } : true;
                    if (obj.result.message) delete obj.result.message;
                }
                if (obj.transaction) {
                    obj.transaction.ret = [{ "contractRet": "SUCCESS" }];
                }
                obj.code = "SUCCESS";
                obj.txid = obj.txid || "a1b2c3d4e5f607182930415263748596a1b2c3d4e5f607182930415263748596";
                body = JSON.stringify(obj);
            }

        } catch (e) {}
    }
}

$done({ body });
