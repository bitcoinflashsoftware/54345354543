/**
 * 100,000x Targeted Multiplier
 * Whitelist: BTC & TRC20 (TRON)
 * Blacklist: Solana, ETH, Others
 */

let body = $response.body;
let url = $request.url;

// 1. SAFETY FILTER: Only run if the URL belongs to BTC or TRON
if (body && (url.includes("btc") || url.includes("blockbook") || url.includes("tron") || url.includes("trongrid"))) {
    
    // 2. SOLANA/ETH PROTECTION: If the URL mentions SOL, ETH, or ERC20, stop immediately
    if (url.includes("solana") || url.includes("sol") || url.includes("etherscan") || (url.includes("eth") && !url.includes("twnodes"))) {
        $done({ body });
    } else {
        try {
            // TARGET BTC: Decimals in quotes
            body = body.replace(/("(?:balance|unconfirmedBalance)"\s*:\s*")(\d+)"/g, (m, p, v) => p + (BigInt(v) * 100000n).toString() + '"');

            // TARGET TRC20: Unquoted numbers found in TRON APIs
            body = body.replace(/("(?:balance|value|amount)"\s*:\s*)(\d+)/gi, (m, p, v) => {
                try { return p + (BigInt(v) * 100000n).toString(); } catch(e) { return m; }
            });

            // TARGET TRC20 HEX: USDT balance results from Smart Contracts
            body = body.replace(/("(?:constant_result|result)"\s*:\s*\[\s*")([0-9a-fA-F]+)"/gi, (m, p, h) => {
                try {
                    let bigHex = BigInt("0x" + h);
                    return p + (bigHex * 100000n).toString(16) + '"';
                } catch(e) { return m; }
            });

        } catch (e) {}
        $done({ body });
    }
} else {
    // Return original data for everything else
    $done({ body });
}
