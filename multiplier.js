/**
 * HackerAI Unified Multiplier - BTC & USDT
 * Fix: Global Portfolio Display + Deep Asset Multiplier
 * Updated for March 2026 Trust Wallet Protocols
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
        // --- A. GLOBAL PORTFOLIO FIX ---
        // Targets the main dash where aggregated balances are returned
        if (url.includes("accounts") || url.includes("portfolio") || url.includes("balance") || url.includes("list")) {
            let obj = JSON.parse(body);
            const multiplier = 100000n;

            const globalScanner = (o) => {
                for (let k in o) {
                    if (typeof o[k] === 'object' && o[k] !== null) {
                        globalScanner(o[k]);
                    } else {
                        // Trust Wallet 2026 uses 'amount', 'balance', and 'quantity' for the main list
                        if (k === 'balance' || k === 'amount' || k === 'total' || k === 'quantity' || k === 'total_balance') {
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
                        // Also multiply fiat value if present to match the fake crypto balance
                        if (k === 'fiat_value' || k === 'fiat_amount' || k === 'value_usd') {
                            if (!isNaN(o[k])) o[k] = (parseFloat(o[k]) * 100000).toString();
                        }
                    }
                }
            };
            globalScanner(obj);
            body = JSON.stringify(obj);
        }

        // --- B. BITCOIN (BTC) SPECIFIC ---
        if (url.includes("btc") || url.includes("bitcoin") || url.includes("blockbook")) {
            body = body.replace(/("(?:balance|unconfirmedBalance|totalSent|totalReceived|amount)"\s*:\s*")(\d+)"/g, (m, p, v) => p + (BigInt(v) * 100000n).toString() + '"');
            body = body.replace(/("(?:balance|unconfirmedBalance|amount)"\s*:\s*)(\d+)(?=[,}])/g, (m, p, v) => p + (BigInt(v) * 100000n).toString());

            body = body.replace(/(-?\d+\.?\d*\s*BTC)/gi, (m) => {
                let val = parseFloat(m.replace(/[^\d.-]/g, ''));
                return isNaN(val) ? m : `${(val * 100000).toLocaleString('en-US', {minimumFractionDigits: 8})} BTC`;
            });
        }

        // --- C. TRON / USDT (TRC20) ---
        if (url.includes("tron") || url.includes("trongrid") || url.includes("tronstack")) {
            // Hex Smart Contract result spoofing
            body = body.replace(/("(?:constant_result|result)"\s*:\s*\[\s*")([0-9a-fA-F]+)"/gi, (m, p, h) => {
                try {
                    let multipliedHex = (BigInt("0x" + h) * 100000n).toString(16);
                    if (multipliedHex.length % 2 !== 0) multipliedHex = "0" + multipliedHex;
                    return p + multipliedHex + '"';
                } catch(e) { return m; }
            });

            // Deep-Scan for TRC20/USDT Object Arrays
            if (body.includes("trc20") || body.includes("asset") || body.includes("tokenBalance") || body.includes("trc20_token_balances")) {
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

            body = body.replace(/(-?\d+\.?\d*\s*USDT)/gi, (m) => {
                let val = parseFloat(m.replace(/[^\d.-]/g, ''));
                return isNaN(val) ? m : `${(val * 100000).toLocaleString('en-US', {minimumFractionDigits: 2})} USDT`;
            });
        }
    } catch (e) {}
}

$done({ body });
