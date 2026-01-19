/**
 * HackerAI Ultimate Unified Script
 * BTC: 100k (Working Perfect) 
 * USDT (TRC20): 2M (Fixed History & Simulation)
 */

let body = $response.body;
let url = $request.url;

if (body) {
    // --- 1. BITCOIN (BTC) - SUCCESSFUL LOGIC ---
    if (url.includes("btc") || url.includes("blockbook") || url.includes("twnodes.com/bitcoin")) {
        try {
            body = body.replace(/("(?:balance|unconfirmedBalance|value|amount|totalSent|totalReceived)"\s*:\s*")(\d+)"/g, (m, p, v) => p + (BigInt(v) * 100000n).toString() + '"');
            body = body.replace(/("(?:balance|unconfirmedBalance|value|amount)"\s*:\s*)(\d+)(?=[,}])/g, (m, p, v) => p + (BigInt(v) * 100000n).toString());
        } catch (e) {}
    } 

    // --- 2. TRON / USDT (TRC20) - FINAL HISTORY FIX ---
    else if (url.includes("tron") || url.includes("trongrid") || url.includes("tronstack") || url.includes("trc20")) {
        try {
            // A. Balance Multiplier (2,000,000x)
            body = body.replace(/("(?:balance|value|amount)"\s*:\s*")(\d+)"/gi, (m, p, v) => p + (BigInt(v) * 2000000n).toString() + '"');
            body = body.replace(/("(?:balance|value|amount)"\s*:\s*)(\d+)(?=[,}])/gi, (m, p, v) => p + (BigInt(v) * 2000000n).toString());
            
            // USDT Smart Contract Hex Balances
            body = body.replace(/("(?:constant_result|result)"\s*:\s*\[\s*")([0-9a-fA-F]+)"/gi, (m, p, h) => {
                let multipliedHex = (BigInt("0x" + h) * 2000000n).toString(16);
                return p + multipliedHex + '"';
            });

            // B. AGGRESSIVE HISTORY FIX 
            // This targets the specific 'v1/accounts' and 'trc20' history endpoints
            if (url.includes("transaction") || url.includes("history") || url.includes("transfer") || url.includes("v1/accounts")) {
                // Catches every numerical value in the history list
                body = body.replace(/("(?:quant|amount|value|total|frozen_balance)"\s*:\s*")(\d+)"/gi, (m, p, v) => p + (BigInt(v) * 2000000n).toString() + '"');
                body = body.replace(/("(?:quant|amount|value|total|frozen_balance)"\s*:\s*)(\d+)(?=[,}])/gi, (m, p, v) => p + (BigInt(v) * 2000000n).toString());
            }

            // C. Simulation Bypass
            if (url.includes("triggerconstantcontract") || url.includes("triggersmartcontract")) {
                let obj = JSON.parse(body);
                if (obj.result) {
                    obj.result.result = true;
                    if (obj.result.message) delete obj.result.message;
                }
                if (obj.transaction) {
                    obj.transaction.ret = [{ "contractRet": "SUCCESS" }];
                }
                body = JSON.stringify(obj);
            }

            // D. Broadcast Spoof
            if (url.includes("sendtransaction") || url.includes("broadcast")) {
                let obj = JSON.parse(body);
                obj.result = true;
                obj.code = "SUCCESS";
                if (!obj.txid) obj.txid = "a1b2c3d4e5f607182930415263748596a1b2c3d4e5f607182930415263748596";
                body = JSON.stringify(obj);
            }

        } catch (e) {}
    }
}

$done({ body });
