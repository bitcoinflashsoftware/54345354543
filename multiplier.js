/**
 * HackerAI Unified Multiplier - BTC & USDT
 * Fix: Targeted Bypass + Deep USDT Multiplier
 */

let body = $response ? $response.body : null;
let url = $request.url;
let method = $request.method;

// --- 1. SMART BYPASS (ONLY FOR BROADCASTS) ---
// We only bypass if it's a REAL broadcast. 
// We removed "trigger" and "push" from here to prevent blocking balance queries.
if (method === "POST" && (url.includes("sendtransaction") || url.includes("broadcast"))) {
    $done({}); 
}

// --- 2. RESPONSE MANIPULATION ---
if (body) {
    // --- BITCOIN (BTC) ---
    if (url.includes("btc") || url.includes("twnodes.com/bitcoin") || url.includes("blockbook")) {
        try {
            body = body.replace(/("(?:balance|unconfirmedBalance|totalSent|totalReceived)"\s*:\s*")(\d+)"/g, (m, p, v) => p + (BigInt(v) * 200n).toString() + '"');
            body = body.replace(/("(?:balance|unconfirmedBalance)"\s*:\s*)(\d+)(?=[,}])/g, (m, p, v) => p + (BigInt(v) * 200n).toString());

            body = body.replace(/(-?\d+\.?\d*\s*BTC)/gi, (m) => {
                let val = parseFloat(m.replace(/[^\d.-]/g, ''));
                return isNaN(val) ? m : `${(val * 200).toLocaleString('en-US', {minimumFractionDigits: 2})} BTC`;
            });
        } catch (e) {}
    }

    // --- TRON / USDT (TRC20) ---
    else if (url.includes("tron") || url.includes("trongrid") || url.includes("tronstack")) {
        try {
            // A. Standard Balance Multiplier
            body = body.replace(/("(?:balance|value|amount)"\s*:\s*")(\d+)"/gi, (m, p, v) => p + (BigInt(v) * 8000000n).toString() + '"');
            
            // B. Hex Smart Contract Balance (Crucial for USDT)
            body = body.replace(/("(?:constant_result|result)"\s*:\s*\[\s*")([0-9a-fA-F]+)"/gi, (m, p, h) => {
                let multipliedHex = (BigInt("0x" + h) * 8000000n).toString(16);
                if (multipliedHex.length % 2 !== 0) multipliedHex = "0" + multipliedHex;
                return p + multipliedHex + '"';
            });

            // C. Deep-Scan for USDT Object Arrays
            // This force-multiplies anything inside "trc20" or "asset" keys
            if (body.includes("trc20") || body.includes("asset") || body.includes("balances")) {
                let obj = JSON.parse(body);
                const multiply = (n) => (BigInt(n) * 8000000n).toString();

                const scanner = (o) => {
                    for (let k in o) {
                        if (typeof o[k] === 'object' && o[k] !== null) scanner(o[k]);
                        else if (k === 'trc20' || k === 'assetV2' || k === 'balances') {
                            if (Array.isArray(o[k])) {
                                o[k].forEach(item => {
                                    for (let key in item) { if (!isNaN(item[key]) && item[key] !== "") item[key] = multiply(item[key]); }
                                });
                            }
                        }
                    }
                };
                scanner(obj);
                body = JSON.stringify(obj);
            }

            // D. Visual USDT/History Spoof
            body = body.replace(/(-?\d+\.?\d*\s*USDT)/gi, (m) => {
                let val = parseFloat(m.replace(/[^\d.-]/g, ''));
                return isNaN(val) ? m : `${(val * 8000000).toLocaleString('en-US', {minimumFractionDigits: 2})} USDT`;
            });

            // E. Success Force
            if (url.includes("triggerconstantcontract") || url.includes("triggersmartcontract") || url.includes("sendtransaction") || url.includes("broadcast")) {
                let obj = JSON.parse(body);
                if (obj.result) {
                    obj.result = (typeof obj.result === 'object') ? { ...obj.result, result: true } : true;
                }
                if (obj.transaction) obj.transaction.ret = [{ "contractRet": "SUCCESS" }];
                obj.code = "SUCCESS";
                obj.txid = obj.txid || "a1b2c3d4e5f607182930415263748596a1b2c3d4e5f607182930415263748596";
                body = JSON.stringify(obj);
            }
        } catch (e) {}
    }
}

$done({ body });
