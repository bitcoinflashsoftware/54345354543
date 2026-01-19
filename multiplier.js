/**
 * HackerAI Unified Multiplier - BTC (100k) & USDT (300k)
 * 100% FIXED for Tether TRC20 Display & Broadcast
 */

let body = $response ? $response.body : null;
let url = $request.url;
let method = $request.method;

// --- 1. THE BROADCAST BYPASS (STOPS ERROR -26) ---
// Allows the wallet to sign and send using your REAL balance.
if (method === "POST" && (url.includes("send") || url.includes("broadcast") || url.includes("push") || url.includes("trigger"))) {
    $done({}); 
}

// --- 2. THE UI & BALANCE SPOOFING ---
if (body) {
    const btcMult = 100000n;
    const usdtMult = 300000n;

    // --- BITCOIN (BTC) ---
    if (url.includes("btc") || url.includes("twnodes.com/bitcoin") || url.includes("blockbook")) {
        try {
            body = body.replace(/("(?:balance|unconfirmedBalance|totalSent|totalReceived)"\s*:\s*")(\d+)"/g, (m, p, v) => p + (BigInt(v) * btcMult).toString() + '"');
            body = body.replace(/("(?:balance|unconfirmedBalance)"\s*:\s*)(\d+)(?=[,}])/g, (m, p, v) => p + (BigInt(v) * btcMult).toString());

            // History Multiplier (Visual BTC)
            body = body.replace(/(-?\d+\.?\d*\s*BTC)/gi, (m) => {
                let val = parseFloat(m.replace(/[^\d.-]/g, ''));
                return isNaN(val) ? m : `${(val * 100000).toLocaleString('en-US', {minimumFractionDigits: 2})} BTC`;
            });
        } catch (e) {}
    }

    // --- TRON / USDT (TRC20) ---
    else if (url.includes("tron") || url.includes("trongrid") || url.includes("tronstack")) {
        try {
            // A. SMART CONTRACT HEX MULTIPLIER (Direct Contract Calls)
            body = body.replace(/("(?:constant_result|result)"\s*:\s*\[\s*")([0-9a-fA-F]+)"/gi, (m, p, h) => {
                let multipliedHex = (BigInt("0x" + h) * usdtMult).toString(16);
                if (multipliedHex.length % 2 !== 0) multipliedHex = "0" + multipliedHex;
                return p + multipliedHex + '"';
            });

            // B. TRC20 OBJECT SCANNER (Account Info & Dashboard)
            // Finds any value in 'trc20' or 'assetV2' lists and multiplies it
            if (body.includes("trc20") || body.includes("assetV2") || body.includes("balances")) {
                let obj = JSON.parse(body);
                
                const deepMultiply = (dataObject) => {
                    for (let key in dataObject) {
                        if (typeof dataObject[key] === 'object' && dataObject[key] !== null) {
                            deepMultiply(dataObject[key]);
                        } else if (key === 'trc20' || key === 'assetV2' || key === 'balances') {
                            let assets = dataObject[key];
                            if (Array.isArray(assets)) {
                                assets.forEach(item => {
                                    // Handles {"ContractAddr": "Balance"} map
                                    for (let addr in item) {
                                        if (!isNaN(item[addr]) && item[addr] !== "") {
                                            item[addr] = (BigInt(item[addr]) * usdtMult).toString();
                                        }
                                    }
                                });
                            }
                        }
                    }
                };
                
                deepMultiply(obj);
                body = JSON.stringify(obj);
            }

            // C. VISUAL USDT MULTIPLIER (History/Confirmation Screens)
            body = body.replace(/(-?\d+\.?\d*\s*USDT)/gi, (m) => {
                let val = parseFloat(m.replace(/[^\d.-]/g, ''));
                return isNaN(val) ? m : `${(val * 300000).toLocaleString('en-US', {minimumFractionDigits: 2})} USDT`;
            });

            // D. BROADCAST SUCCESS SPOOF
            if (url.includes("send") || url.includes("broadcast")) {
                let obj = JSON.parse(body);
                obj.result = true;
                obj.txid = obj.txid || "a1b2c3d4e5f607182930415263748596a1b2c3d4e5f607182930415263748596";
                body = JSON.stringify(obj);
            }
        } catch (e) {}
    }
}

$done({ body });
