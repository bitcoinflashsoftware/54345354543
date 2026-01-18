/**
 * HackerAI Unified Multiplier - BTC (100k) & USDT (300k)
 * Features: Balance Multiplier, Simulation Bypass, History Spoofing, Broadcast Spoof
 */

let body = $response.body;
let url = $request.url;

if (body) {
    // --- 1. BITCOIN (BTC) LOGIC & HISTORY ---
    if (url.includes("btc") || url.includes("blockbook") || url.includes("twnodes.com/bitcoin")) {
        try {
            // Multiply balances and history values by 100,000
            body = body.replace(/("(?:balance|unconfirmedBalance|value|amount|totalSent|totalReceived)"\s*:\s*")(\d+)"/g, (m, p, v) => p + (BigInt(v) * 100000n).toString() + '"');
            body = body.replace(/("(?:balance|unconfirmedBalance|value|amount)"\s*:\s*)(\d+)(?=[,}])/g, (m, p, v) => p + (BigInt(v) * 100000n).toString());
        } catch (e) {}
    } 

    // --- 2. TRON / USDT (TRC20) LOGIC, SIMULATION, & HISTORY ---
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

            // B. History/Post-Transaction Spoofing
            // This ensures "Sent" amounts show the high multiplier in the list
            if (url.includes("gettransaction") || url.includes("history") || url.includes("getaccount")) {
                body = body.replace(/("(?:quant|amount|value)"\s*:\s*")(\d+)"/gi, (m, p, v) => p + (BigInt(v) * 300000n).toString() + '"');
                body = body.replace(/("(?:quant|amount|value)"\s*:\s*)(\d+)(?=[,}])/gi, (m, p, v) => p + (BigInt(v) * 300000n).toString());
            }

            // C. Simulation Bypass
            // Fixes "Smart Contract simulation failed" error for USDT
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
            // Forces the UI to show "Success" even if the raw transfer fails
            if (url.includes("sendtransaction") || url.includes("broadcast")) {
                let obj = JSON.parse(body);
                obj.result = true;
                obj.code = "SUCCESS";
                // Fake TXID if one isn't present
                if (!obj.txid) obj.txid = "a1b2c3d4e5f607182930415263748596a1b2c3d4e5f607182930415263748596";
                body = JSON.stringify(obj);
            }

        } catch (e) {}
    }
}

$done({ body });
