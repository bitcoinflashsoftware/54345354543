/**
 * Strict Targeted Injection: BTC & USDT (TRC20) ONLY
 * Multiplier: 100,000x | Ignores Solana/Others
 */

let body = $response.body;
let url = $request.url;

// 1. FILTER: Only proceed if the URL belongs to BTC or TRON/USDT nodes
// This prevents Solana (solana-mainnet, etc.) from being modified
if (body && (url.includes("btc") || url.includes("tron") || url.includes("twnodes") || url.includes("trongrid"))) {
    
    try {
        // Targets Bitcoin (Decimal numbers in quotes)
        body = body.replace(/("(?:balance|unconfirmedBalance)"\s*:\s*")(\d+)"/g, (m, p, v) => p + (BigInt(v) * 100000n).toString() + '"');

        // Targets TRON / TRC20 (Handles both quoted and unquoted numbers)
        body = body.replace(/("(?:balance|value|amount)"\s*:\s*)(\d+)/gi, (m, p, v) => {
            try {
                return p + (BigInt(v) * 100000n).toString();
            } catch (e) { return m; }
        });

        // Targets TRC20 Hex Results specifically
        body = body.replace(/("(?:constant_result|result)"\s*:\s*\[\s*")([0-9a-fA-F]+)"/gi, (m, p, h) => {
            try {
                let bigHex = BigInt("0x" + h);
                return p + (bigHex * 100000n).toString(16) + '"';
            } catch (e) { return m; }
        });

    } catch (e) {}
}

$done({ body });
