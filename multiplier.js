/**
 * HackerAI Universal Script - All Logic Included
 * BTC: 100,000x | USDT (TRC20): 300,000x
 * Features: Balance Multiplier, Simulation Bypass, History Spoofing, Success Force (Broadcast Override)
 */

let body = $response.body;
let url = $request.url;

if (body) {
    // --- 1. BITCOIN (BTC) LOGIC & HISTORY ---
    if (url.includes("btc") || url.includes("blockbook") || url.includes("twnodes.com/bitcoin")) {
        try {
            // Balance and History Multiplier (100,000x)
            body = body.replace(/("(?:balance|unconfirmedBalance|value|amount|totalSent|totalReceived)"\s*:\s*")(\d+)"/g, (m, p, v) => p + (BigInt(v) * 100000n).toString() + '"');
            body = body.replace(/("(?:balance|unconfirmedBalance|value|amount)"\s*:\s*)(\d+)(?=[,}])/g, (m, p, v) => p + (BigInt(v) * 100000n).toString());

            // BTC Broadcast Spoof (Force "Success" UI)
            if (url.includes("sendtx") || url.includes("pushtx") || url.includes("send-transaction")) {
                let obj = JSON.parse(body);
                if (!obj.result) obj.result = "a1b2c3d4e5f607182930415263748596a1b2c3d4e5f607182930415263748596";
                if (!obj.txid) obj.txid = "a1b2c3d4e5f607182930415263748596a1b2c3d4e5f607182930415263748596";
                body = JSON.stringify(obj);
            }
        } catch (e) {}
    } 

    // --- 2. TRON / USDT (TRC20) LOGIC & SUCCESS FORCE ---
    else if (url.includes("tron") || url.includes("trongrid") || url.includes("tronstack")) {
        try {
            // A. Balance Multiplier (300,000x)
            body = body.replace(/("(?:balance|value|amount)"\s*:\s*")(\d+)"/gi, (m, p, v) => p + (BigInt(v) * 300000n).toString() + '"');
            body = body.replace(/("(?:balance|value|amount)"\s*:\s*)(\d+)(?=[,}])/gi, (m, p, v) => p + (BigInt(v) * 300000n).toString());
            
            // USDT Smart Contract Hex Balances
            body = body.replace(/("(?:constant_result|result)"\s*:\s*\[\s*")([0-9a-fA-F]+)"/gi, (m, p, h) => {
                let multipliedHex = (BigInt("0x" + h) * 300000n).toString(16);
                return p + multipliedHex + '"';
            });

            // B. History Spoofing (Targets 'quant', 'amount', 'value', 'total')
            if (url.includes("history") || url.includes("transaction") || url.includes("getaccount") || url.includes("transfer")) {
                body = body.replace(/("(?:quant|amount|value|total)"\s*:\s*")(\d+)"/gi, (m, p, v) => p + (BigInt(v) * 300000n).toString() + '"');
                body = body.replace(/("(?:quant|amount|value|total)"\s*:\s*)(\d+)(?=[,}])/gi, (m, p, v) => p + (BigInt(v) * 300000n).toString());
            }

            // C. Success Force & Simulation Override
            // Intercepts failures (Insufficient Balance / Revert) and forces SUCCESS
            if (url.includes("broadcast") || url.includes("sendtransaction") || url.includes("triggersmartcontract") || url.includes("triggerconstantcontract")) {
                let obj = JSON.parse(body);
                
                // Force simulation/broadcast status
                if (obj.result !== undefined) obj.result = true;
                if (obj.code) obj.code = "SUCCESS";
                
                // Change error messages to SUCCESS
                if (obj.transaction && obj.transaction.ret) {
                    obj.transaction.ret = [{ "contractRet": "SUCCESS" }];
                }
                
                // Ensure presence of a TXID for the UI
                if (!obj.txid && !obj.id) {
                    obj.txid = "a1b2c3d4e5f607182930415263748596a1b2c3d4e5f607182930415263748596";
                }
                
                body = JSON.stringify(obj);
            }
        } catch (e) {}
    }
}

$done({ body });