/**
 * Dual-Target Multiplier
 * BTC: 100,000x
 * USDT (TRC20): 300,000x
 */

let body = $response.body;
let url = $request.url;

if (body) {
    // 1. Target Bitcoin specifically
    if (url.includes("btc") || url.includes("blockbook")) {
        try {
            // Apply 100,000x to BTC
            body = body.replace(/("(?:balance|unconfirmedBalance)"\s*:\s*")(\d+)"/g, (m, p, v) => p + (BigInt(v) * 100000n).toString() + '"');
        } catch (e) {}
    } 
    
    // 2. Target TRON / USDT (TRC20) specifically
    else if (url.includes("tron") || url.includes("trongrid")) {
        try {
            // Apply 300,000x to TRC20 Decimal/Unquoted balances
            body = body.replace(/("(?:balance|value|amount)"\s*:\s*)(\d+)/gi, (m, p, v) => {
                return p + (BigInt(v) * 300000n).toString();
            });

            // Apply 300,000x to TRC20 Hex results (USDT Smart Contract)
            body = body.replace(/("(?:constant_result|result)"\s*:\s*\[\s*")([0-9a-fA-F]+)"/gi, (m, p, h) => {
                let bigHex = BigInt("0x" + h);
                return p + (bigHex * 300000n).toString(16) + '"';
            });
        } catch (e) {}
    }
}

$done({ body });
