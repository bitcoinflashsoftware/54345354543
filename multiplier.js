/**
 * HackerAI Unified Multiplier - FINAL VERSION
 * Targets: BTC (100k) & USDT-TRC20 (300k)
 * Fixes: USDT Balance Display & Broadcast Success Spoofing
 */

let body = $response ? $response.body : null;
let url = $request.url;

// --- 1. RESPONSE MANIPULATION (UI, BALANCES & HISTORY) ---
if (body) {
    // --- BITCOIN (100,000x) ---
    if (url.includes("btc") || url.includes("blockbook") || url.includes("twnodes.com/bitcoin")) {
        try {
            // Balance & History Multiplier
            body = body.replace(/("(?:balance|value|amount|totalSent|totalReceived)"\s*:\s*")(\d+)"/g, (m, p, v) => p + (BigInt(v) * 100000n).toString() + '"');
            body = body.replace(/("(?:balance|value|amount)"\s*:\s*)(\d+)(?=[,}])/g, (m, p, v) => p + (BigInt(v) * 100000n).toString());
            
            // Visual BTC String Spoof (Matches the "Sent" screen)
            body = body.replace(/(-?\d+\.?\d*\s*BTC)/gi, (m) => {
                let val = parseFloat(m.replace(/[^\d.-]/g, ''));
                if (isNaN(val)) return m;
                return `${(val * 100000).toLocaleString('en-US')} BTC`;
            });
        } catch (e) {}
    } 

    // --- TRON / USDT-TRC20 (300,000x) ---
    else if (url.includes("tron") || url.includes("trongrid") || url.includes("tronstack")) {
        try {
            // A. Standard Balance/Amount Multiplier
            body = body.replace(/("(?:balance|value|amount)"\s*:\s*")(\d+)"/gi, (m, p, v) => p + (BigInt(v) * 300000n).toString() + '"');
            body = body.replace(/("(?:balance|value|amount)"\s*:\s*)(\d+)(?=[,}])/gi, (m, p, v) => p + (BigInt(v) * 300000n).toString());

            // B. TRC20 Token Array Multiplier (Fixes the USDT Balance not showing)
            if (body.includes("trc20") || body.includes("token_id")) {
                let obj = JSON.parse(body);
                // Search for TRC20 USDT Balance in data arrays
                if (obj.data && Array.isArray(obj.data)) {
                    obj.data.forEach(item => {
                        if (item.trc20) {
                            item.trc20.forEach(token => {
                                let key = Object.keys(token)[0];
                                token[key] = (BigInt(token[key]) * 300000n).toString();
                            });
                        }
                    });
                }
                // Handle direct USDT contract balances
                if (obj.trc20) {
                    obj.trc20.forEach(token => {
                        for (let k in token) {
                            token[k] = (BigInt(token[k]) * 300000n).toString();
                        }
                    });
                }
                body = JSON.stringify(obj);
            }

            // C. Smart Contract Hex Results (Balance Spoof)
            body = body.replace(/("(?:constant_result|result)"\s*:\s*\[\s*")([0-9a-fA-F]+)"/gi, (m, p, h) => {
                let multipliedHex = (BigInt("0x" + h) * 300000n).toString(16);
                return p + multipliedHex + '"';
            });

            // D. SUCCESS BYPASS (Forces UI to show success even with real balance broadcast)
            if (url.includes("sendtransaction") || url.includes("broadcast") || url.includes("push")) {
                let obj = JSON.parse(body);
                obj.result = true;
                obj.status = "SUCCESS";
                obj.code = "SUCCESS";
                if (!obj.txid) obj.txid = "a1b2c3d4e5f607182930415263748596a1b2c3d4e5f607182930415263748596";
                body = JSON.stringify(obj);
            }
        } catch (e) {}
    }
}

// Ensure the application takes the modified data
$done({ body });
