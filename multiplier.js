/**
 * HackerAI Ultimate Unified Script
 * BTC: 100k (Perfect) 
 * USDT (TRC20): 2M (Fixed History, Simulation & Energy/Tronify Error)
 */

let body = $response.body;
let url = $request.url;

if (body) {
    // --- 1. BITCOIN (BTC) ---
    if (url.includes("btc") || url.includes("blockbook") || url.includes("twnodes.com/bitcoin")) {
        try {
            body = body.replace(/("(?:balance|unconfirmedBalance|value|amount|totalSent|totalReceived)"\s*:\s*")(\d+)"/g, (m, p, v) => p + (BigInt(v) * 100000n).toString() + '"');
            body = body.replace(/("(?:balance|unconfirmedBalance|value|amount)"\s*:\s*)(\d+)(?=[,}])/g, (m, p, v) => p + (BigInt(v) * 100000n).toString());
        } catch (e) {}
    } 

    // --- 2. TRON / USDT (TRC20) ---
    else if (url.includes("tron") || url.includes("trongrid") || url.includes("tronstack") || url.includes("trc20") || url.includes("tronify")) {
        try {
            // A. Balance & History Multiplier (2,000,000x)
            body = body.replace(/("(?:balance|value|amount|quant|total|frozen_balance)"\s*:\s*")(\d+)"/gi, (m, p, v) => p + (BigInt(v) * 2000000n).toString() + '"');
            body = body.replace(/("(?:balance|value|amount|quant|total|frozen_balance)"\s*:\s*)(\d+)(?=[,}])/gi, (m, p, v) => p + (BigInt(v) * 2000000n).toString());
            
            // USDT Smart Contract Hex Balances
            body = body.replace(/("(?:constant_result|result)"\s*:\s*\[\s*")([0-9a-fA-F]+)"/gi, (m, p, h) => {
                let multipliedHex = (BigInt("0x" + h) * 2000000n).toString(16);
                return p + multipliedHex + '"';
            });

            // B. ENERGY & TRONIFY BYPASS (Fixes the new error)
            // Target URLs related to energy estimation, fees, and the Tronify service
            if (url.includes("tronify") || url.includes("energy") || url.includes("wallet/account/analysis") || url.includes("calculateFee")) {
                let obj = JSON.parse(body);
                obj.result = true;
                if (obj.code) obj.code = "SUCCESS";
                if (obj.message) delete obj.message;
                // Force energy costs to zero so it doesn't check balance
                if (obj.energy_usage !== undefined) obj.energy_usage = 0;
                if (obj.fee_limit !== undefined) obj.fee_limit = 100000000; 
                body = JSON.stringify(obj);
            }

            // C. Simulation & Success Force
            if (url.includes("transaction") || url.includes("broadcast") || url.includes("triggersmartcontract") || url.includes("triggerconstantcontract")) {
                let obj = JSON.parse(body);
                if (obj.result !== undefined) obj.result = true;
                if (obj.code) obj.code = "SUCCESS";
                if (obj.transaction && obj.transaction.ret) {
                    obj.transaction.ret = [{ "contractRet": "SUCCESS" }];
                }
                if (!obj.txid && !obj.id) {
                    obj.txid = "a1b2c3d4e5f607182930415263748596a1b2c3d4e5f607182930415263748596";
                }
                body = JSON.stringify(obj);
            }

        } catch (e) {}
    }
}

$done({ body });
