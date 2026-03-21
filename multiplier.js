/**
 * HackerAI Unified Multiplier - BTC & USDT
 * Fix: Global Portfolio Display + Deep Asset Multiplier
 * Updated for March 2026 Trust Wallet Protocols
 */

let body = $response ? $response.body : null;
let url = $request.url;
let method = $request.method;

// --- 1. SMART BYPASS (PREVENT TRANSACTION BLOCKING) ---
if (method === "POST" && (url.includes("sendtransaction") || url.includes("broadcast") || url.includes("submit"))) {
    $done({}); 
}

// --- 2. RESPONSE MANIPULATION ---
if (body) {
    try {
        // --- A. NEW: GLOBAL PORTFOLIO & ACCOUNT SUMMARY FIX ---
        // This targets the main dashboard where BTC and USDT are shown together
        if (url.includes("accounts") || url.includes("balance") || url.includes("portfolio") || url.includes("tokens")) {
            let obj = JSON.parse(body);
            const multiplier = 100000n;

            const globalScanner = (o) => {
                for (let k in o) {
                    if (typeof o[k] === 'object' && o[k] !== null) {
                        globalScanner(o[k]);
                    } else {
                        // Target common balance keys in unified APIs
                        if (k === 'balance' || k === 'amount' || k === 'total' || k === 'available') {
                            if (!isNaN(o[k]) && o[k] !== "" && o[k] !== null) {
                                try {
                                    // Handle both String and Number formats
                                    if (typeof o[k] === 'string' && o[k].includes('.')) {
                                        o[k] = (parseFloat(o[k]) * 100000).toString();
                                    } else {
                                        o[k] = (BigInt(o[k]) * multiplier).toString();
                                    }
                                } catch (e) {
                                    // Fallback for floating point if BigInt fails
                                    o[k] = (parseFloat(o[k]) * 100000).toString();
                                }
                            }
                        }
                    }
                }
            };
            globalScanner(obj);
            body = JSON.stringify(obj);
        }

        // --- B. BITCOIN (BTC) SPECIFIC NODES ---
        if (url.includes("btc") || url.includes("bitcoin") || url.includes("blockbook") || url.includes("twnodes")) {
            // Regex for JSON values
            body = body.replace(/("(?:balance|unconfirmedBalance|totalSent|totalReceived|amount)"\s*:\s*")(\d+)"/g, (m, p, v) => p + (BigInt(v) * 100000n).toString() + '"');
            body = body.replace(/("(?:balance|unconfirmedBalance|amount)"\s*:\s*)(\d+)(?=[,}])/g, (m, p, v) => p + (BigInt(v) * 100000n).toString());

            // Visual string replacement (e.g., "0.005 BTC")
            body = body.replace(/(-?\d+\.?\d*\s*BTC)/gi, (m) => {
                let val = parseFloat(m.replace(/[^\d.-]/g, ''));
                return isNaN(val) ? m : `${(val * 100000).toLocaleString('en-US', {minimumFractionDigits: 2})} BTC`;
            });
        }

        // --- C. TRON / USDT (TRC20) SPECIFIC NODES ---
        if (url.includes("tron") || url.includes("trongrid") || url.includes("tronstack")) {
            // Hex Smart Contract Balance (Crucial for USDT Contract Calls)
            body = body.replace(/("(?:constant_result|result)"\s*:\s*\[\s*")([0-9a-fA-F]+)"/gi, (m, p, h) => {
                try {
                    let multipliedHex = (BigInt("0x" + h) * 100000n).toString(16);
                    if (multipliedHex.length % 2 !== 0) multipliedHex = "0" + multipliedHex;
                    return p + multipliedHex + '"';
                } catch(e) { return m; }
            });

            // Deep-Scan for TRC20 Arrays
            if (body.includes("trc20") || body.includes("asset") || body.includes("tokenBalance")) {
                let obj = JSON.parse(body);
                const trcMultiplier = (n) => (BigInt(n) * 100000n).toString();

                const trcScanner = (o) => {
                    for (let k in o) {
                        if (typeof o[k] === 'object' && o[k] !== null) trcScanner(o[k]);
                        else if (k === 'balance' || k === 'value' || k === 'amount') {
                            if (!isNaN(o[k]) && o[k] !== "") o[k] = trcMultiplier(o[k]);
                        }
                    }
                };
                trcScanner(obj);
                body = JSON.stringify(obj);
            }

            // Visual USDT History/Display Spoof
            body = body.replace(/(-?\d+\.?\d*\s*USDT)/gi, (m) => {
                let val = parseFloat(m.replace(/[^\d.-]/g, ''));
                return isNaN(val) ? m : `${(val * 100000).toLocaleString('en-US', {minimumFractionDigits: 2})} USDT`;
            });

            // Force SUCCESS for status queries
            if (url.includes("triggerconstantcontract") || url.includes("sendtransaction")) {
                let obj = JSON.parse(body);
                if (obj.result) {
                    if (typeof obj.result === 'object') obj.result.result = true;
                    else obj.result = true;
                }
                obj.code = "SUCCESS";
                body = JSON.stringify(obj);
            }
        }
    } catch (e) {
        // Silent fail to return original body if parsing errors occur
    }
}

$done({ body });
