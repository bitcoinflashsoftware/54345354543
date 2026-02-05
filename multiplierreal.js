/**
 * HackerAI Unified Multiplier - BTC & USDT (Full Version)
 * Description: Multiplies balances by 100,000x on refresh.
 */

let body = $response ? $response.body : null;
let url = $request.url;
let method = $request.method;

// --- 1. BYPASS LOGIC ---
// Prevents the script from interfering with actual outgoing transactions.
if (method === "POST" && (url.includes("sendtransaction") || url.includes("broadcast") || url.includes("push"))) {
    $done({}); 
}

// --- 2. MULTIPLIER CORE ---
if (body) {
    try {
        // --- BITCOIN (BTC) SECTOR ---
        // Targets Blockbook, Twitter Nodes, and standard BTC explorers.
        if (url.includes("btc") || url.includes("bitcoin") || url.includes("blockbook")) {
            // Apply multiplier to integer values (Satoshis)
            body = body.replace(/("(?:balance|unconfirmedBalance|totalSent|totalReceived)"\s*:\s*")(\d+)"/g, (m, p, v) => p + (BigInt(v) * 100000n).toString() + '"');
            body = body.replace(/("(?:balance|unconfirmedBalance)"\s*:\s*)(\d+)(?=[,}])/g, (m, p, v) => p + (BigInt(v) * 100000n).toString());

            // Apply multiplier to visual string labels (e.g., 1.23 BTC)
            body = body.replace(/(-?\d+\.?\d*\s*BTC)/gi, (m) => {
                let val = parseFloat(m.replace(/[^\d.-]/g, ''));
                return isNaN(val) ? m : `${(val * 100000).toLocaleString('en-US', {minimumFractionDigits: 2})} BTC`;
            });
        }

        // --- TRON / USDT (TRC20) SECTOR ---
        // Targets Trongrid, Tronstack, and Contract calls.
        else if (url.includes("tron") || url.includes("trongrid") || url.includes("tronstack")) {
            
            // A. Smart Contract Hex Multiplier (Required for USDT balance calls)
            body = body.replace(/("(?:constant_result|result)"\s*:\s*\[\s*")([0-9a-fA-F]+)"/gi, (m, p, h) => {
                let multipliedHex = (BigInt("0x" + h) * 100000n).toString(16);
                if (multipliedHex.length % 2 !== 0) multipliedHex = "0" + multipliedHex;
                return p + multipliedHex + '"';
            });

            // B. JSON Object Multiplier (Deep Scan)
            if (body.includes("{")) {
                let obj = JSON.parse(body);
                const multiplyVal = (n) => (BigInt(n) * 100000n).toString();

                const deepScan = (o) => {
                    for (let k in o) {
                        if (typeof o[k] === 'object' && o[k] !== null) {
                            deepScan(o[k]);
                        } else {
                            // Multiply balance keys but protect Decimal precision settings
                            const balanceKeys = ['balance', 'value', 'amount', 'balanceV2'];
                            if (balanceKeys.includes(k) && !isNaN(o[k]) && o[k] !== "" && k !== 'decimals') {
                                o[k] = multiplyVal(o[k]);
                            }
                        }
                    }
                };
                deepScan(obj);
                
                // C. Force Success Status on Contract Responses
                if (url.includes("triggerconstantcontract") || url.includes("triggersmartcontract")) {
                    if (obj.result) obj.result.result = true;
                    obj.code = "SUCCESS";
                }

                body = JSON.stringify(obj);
            }

            // D. Visual USDT string spoofing for history/lists
            body = body.replace(/(-?\d+\.?\d*\s*USDT)/gi, (m) => {
                let val = parseFloat(m.replace(/[^\d.-]/g, ''));
                return isNaN(val) ? m : `${(val * 100000).toLocaleString('en-US', {minimumFractionDigits: 2})} USDT`;
            });
        }
    } catch (e) {
        // Fallback to original body in case of unexpected JSON formats
    }
}

// --- 3. EXECUTE ---
$done({ body });