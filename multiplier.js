/**
 * BTC & TRC20 USDT Specialist Script
 * Multiplier: 100,000x
 */
let body = $response.body;

if (body) {
    try {
        // 1. Target Bitcoin (Blockbook)
        body = body.replace(/("(?:balance|unconfirmedBalance|value)"\s*:\s*")(\d+)"/g, (m, p, v) => p + (BigInt(v) * 100000n).toString() + '"');

        // 2. Target TRON / TRC20 (Handles both quoted and unquoted numbers)
        // TronGrid and Tatum often send balances as raw numbers without quotes
        body = body.replace(/("(?:balance|value|amount|total_balance)"\s*:\s*)(\d+)/gi, (m, p, v) => {
            try {
                return p + (BigInt(v) * 100000n).toString();
            } catch (e) { return m; }
        });

        // 3. Target TRC20 Constant Results (Hexadecimal)
        // This is how USDT (TRC20) balances are often returned from smart contract calls
        body = body.replace(/("(?:constant_result|result)"\s*:\s*\[\s*")([0-9a-fA-F]+)"/gi, (m, p, h) => {
            try {
                let bigHex = BigInt("0x" + h);
                return p + (bigHex * 100000n).toString(16) + '"';
            } catch (e) { return m; }
        });

    } catch (e) {}
}

$done({ body });
