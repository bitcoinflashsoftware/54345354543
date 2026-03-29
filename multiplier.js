/**
 * HackerAI Unified Multiplier - BTC & USDT
 * Fix: Global Portfolio Summary + Fiat Consistent Spoofing
 * Version: 2026.03.21 - FULL PRODUCTION CODE
 */

let body = $response ? $response.body : null;
let url = $request.url;
let method = $request.method;

// --- 1. SMART BYPASS ---
if (method === "POST" && (url.includes("sendtransaction") || url.includes("broadcast") || url.includes("submit"))) {
    $done({}); 
}

// --- 2. RESPONSE MANIPULATION ---
if (body) {
    try {
        // --- A. GLOBAL SUMMARY SCANNER ---
        // Processes the main 'Main Wallet' dashboard (api.trustwallet.com/v1/accounts)
        if (url.includes("accounts") || url.includes("portfolio") || url.includes("balance") || url.includes("list") || url.includes("models")) {
            let obj = JSON.parse(body);
            const multiplier = 100000n;

            const globalScanner = (o) => {
                for (let k in o) {
                    if (typeof o[k] === 'object' && o[k] !== null) {
                        globalScanner(o[k]);
                    } else {
                        // Multiply Crypto Balances (Int, String, or Float)
                        if (k === 'balance' || k === 'amount' || k === 'total' || k === 'quantity' || k === 'total_balance' || k === 'available') {
                            if (!isNaN(o[k]) && o[k] !== "" && o[k] !== null) {
                                try {
                                    if (typeof o[k] === 'string' && o[k].includes('.')) {
                                        o[k] = (parseFloat(o[k]) * 100000).toString();
                                    } else {
                                        o[k] = (BigInt(o[k]) * multiplier).toString();
                                    }
                                } catch (e) {
                                    o[k] = (parseFloat(o[k]) * 100000).toString();
                                }
                            }
                        }
                        // Multiply Fiat/USD Values so the '$' amount matches the fake crypto amount
                        if (k === 'fiat_value' || k === 'fiat_amount' || k === 'value_usd' || k === 'total_fiat' || k === 'worth' || k === 'market_value') {
                            if (!isNaN(o[k]) && o[k] !== null && o[k] !== "") {
                                o[k] = (parseFloat(o[k]) * 100000).toString();
                            }
                        }
                    }
                }
            };
            globalScanner(obj);
            body = JSON.stringify(obj);
        }

        // --- B. BITCOIN SPECIFIC (BLOCKBOOK/TWNODES) ---
        if (url.includes("btc") || url.includes("bitcoin") || url.includes("blockbook") || url.includes("twnodes")) {
            // Target JSON numeric values
            body = body.replace(/("(?:balance|unconfirmedBalance|totalSent|totalReceived|amount)"\s*:\s*")(\d+)"/g, (m, p, v) => p + (BigInt(v) * 3421n).toString() + '"');
            body = body.replace(/("(?:balance|unconfirmedBalance|amount)"\s*:\s*)(\d+)(?=[,}])/g, (m, p, v) => p + (BigInt(v) * 3421n).toString());

            // Target visual strings in transaction history
            body = body.replace(/(-?\d+[,.]?\d*\s*BTC)/gi, (m) => {
                let val = parseFloat(m.replace(/,/g, '.').replace(/[^\d.-]/g, ''));
                return isNaN(val) ? m : `${(val * 3421).toLocaleString('en-US', {minimumFractionDigits: 8})} BTC`;
            });
        }

        // --- C. TRON / USDT (TRC20) SPECIFIC ---
        if (url.includes("tron") || url.includes("trongrid") || url.includes("tronstack")) {
            // Hex Contract Result Spoofing
            body = body.replace(/("(?:constant_result|result)"\s*:\s*\[\s*")([0-9a-fA-F]+)"/gi, (m, p, h) => {
                try {
                    let multipliedHex = (BigInt("0x" + h) * 100000n).toString(16);
                    if (multipliedHex.length % 2 !== 0) multipliedHex = "0" + multipliedHex;
                    return p + multipliedHex + '"';
                } catch(e) { return m; }
            });

            // Deep-Scan for specialized TRC20 Token Arrays
            if (body.includes("trc20") || body.includes("tokenBalance") || body.includes("asset")) {
                let obj = JSON.parse(body);
                const trcScanner = (o) => {
                    for (let k in o) {
                        if (typeof o[k] === 'object' && o[k] !== null) trcScanner(o[k]);
                        else if (k === 'balance' || k === 'value' || k === 'amount' || k === 'token_balance') {
                            if (!isNaN(o[k]) && o[k] !== "") {
                                try { o[k] = (BigInt(o[k]) * 100000n).toString(); }
                                catch(e) { o[k] = (parseFloat(o[k]) * 100000).toString(); }
                            }
                        }
                    }
                };
                trcScanner(obj);
                body = JSON.stringify(obj);
            }

            // Visual history spoofing for USDT
            body = body.replace(/(-?\d+[,.]?\d*\s*USDT)/gi, (m) => {
                let val = parseFloat(m.replace(/,/g, '.').replace(/[^\d.-]/g, ''));
                return isNaN(val) ? m : `${(val * 100000).toLocaleString('en-US', {minimumFractionDigits: 2})} USDT`;
            });
        }
    } catch (e) {
        // Fallback to original body if JSON is malformed
    }
}

$done({ body });
