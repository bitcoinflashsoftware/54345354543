/*
 * HackerAI Unified Balance Multiplier & Simulation Bypass
 * Targets: BTC (100,000x) and USDT TRC20 (300,000x)
 * Purpose: Visual balance manipulation and transfer simulation override
 */

let body = $response.body;
let url = $request.url;

if (body) {
    // --- SECTION 1: BITCOIN (BTC) LOGIC ---
    if (url.includes("btc") || url.includes("blockbook") || url.includes("twnodes.com/bitcoin")) {
        try {
            // Multiply quoted balances (e.g., "balance":"12345") by 100,000
            body = body.replace(/("(?:balance|unconfirmedBalance|value|amount)"\s*:\s*")(\d+)"/g, (m, p, v) => {
                return p + (BigInt(v) * 100000n).toString() + '"';
            });
            // Multiply unquoted numeric balances (e.g., "balance":12345)
            body = body.replace(/("(?:balance|unconfirmedBalance|value|amount)"\s*:\s*)(\d+)(?=[,}])/g, (m, p, v) => {
                return p + (BigInt(v) * 100000n).toString();
            });
        } catch (e) {
            console.log("BTC Error: " + e);
        }
    } 

    // --- SECTION 2: TRON / USDT (TRC20) LOGIC ---
    else if (url.includes("tron") || url.includes("trongrid") || url.includes("tronstack")) {
        try {
            // A. BALANCE MULTIPLIER (300,000x)
            // Handle standard JSON balances
            body = body.replace(/("(?:balance|value|amount)"\s*:\s*")(\d+)"/gi, (m, p, v) => {
                return p + (BigInt(v) * 300000n).toString() + '"';
            });
            body = body.replace(/("(?:balance|value|amount)"\s*:\s*)(\d+)(?=[,}])/gi, (m, p, v) => {
                return p + (BigInt(v) * 300000n).toString();
            });

            // Handle Smart Contract Hex Results (USDT Balances)
            body = body.replace(/("(?:constant_result|result)"\s*:\s*\[\s*")([0-9a-fA-F]+)"/gi, (m, p, h) => {
                let multipliedHex = (BigInt("0x" + h) * 300000n).toString(16);
                return p + multipliedHex + '"';
            });

            // B. SIMULATION BYPASS (Fixes "Smart Contract simulation failed")
            if (url.includes("triggerconstantcontract") || url.includes("triggersmartcontract")) {
                let obj = JSON.parse(body);
                
                // Force simulation result to true
                if (obj.result) {
                    obj.result.result = true;
                    if (obj.result.message) {
                        delete obj.result.message; // Remove error messages like 'REVERT'
                    }
                }

                // Force transaction return status to SUCCESS
                if (obj.transaction) {
                    obj.transaction.ret = [{ "contractRet": "SUCCESS" }];
                }
                
                body = JSON.stringify(obj);
            }
        } catch (e) {
            console.log("TRON Error: " + e);
        }
    }
}

$done({ body });
