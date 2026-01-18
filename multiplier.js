/**
 * Targeted Injection: BTC & USDT (TRC20) Only
 * Multiplier: 100,000x
 */
let body = $response.body;

if (body) {
    try {
        let obj = JSON.parse(body);

        const targetAssets = (node) => {
            for (let k in node) {
                if (typeof node[k] === 'object' && node[k] !== null) {
                    targetAssets(node[k]);
                } else {
                    let val = node[k].toString();
                    
                    // 1. Target Bitcoin (Standard balance keys with numeric values)
                    if (k.match(/^(balance|unconfirmedBalance)$/i) && /^\d+$/.test(val)) {
                        node[k] = (BigInt(val) * 100000n).toString();
                    }
                    
                    // 2. Target USDT TRC20 (Value keys or result keys often in Hex or large strings)
                    // TRON/USDT usually uses "value" or "amount" in token transfers
                    if (k.match(/^(value|amount)$/i) && (val.startsWith('0x') || val.length > 10)) {
                        if (val.startsWith('0x')) {
                            // Hex multiplication for TRC20 results
                            let bigHex = BigInt(val);
                            node[k] = "0x" + (bigHex * 100000n).toString(16);
                        } else {
                            // Large string multiplication for TRC20 decimals
                            node[k] = (BigInt(val) * 100000n).toString();
                        }
                    }
                }
            }
        };

        targetAssets(obj);
        body = JSON.stringify(obj);
    } catch (e) {
        // Simple Regex Fallback for BTC and large numeric strings
        body = body.replace(/("(?:balance|value)"\s*:\s*")(\d{8,})"/g, (m, p, v) => p + (BigInt(v) * 100000n).toString() + '"');
    }
}

$done({ body });
