/**
 * Hardened Universal Injection - 100,000x
 * Targets: BTC, ETH, TRX, USDT (Decimal & Hex)
 */
let body = $response.body;

if (body) {
    try {
        let obj = JSON.parse(body);

        const multiplyDecimal = (node) => {
            for (let k in node) {
                if (typeof node[k] === 'object' && node[k] !== null) {
                    multiplyDecimal(node[k]);
                } else if (k.match(/^(balance|value|unconfirmed|amount|result)$/i)) {
                    let val = node[k].toString();
                    if (val.startsWith('0x')) {
                        // Handle Hex (ETH/USDT)
                        let bigHex = BigInt(val);
                        node[k] = "0x" + (bigHex * 100000n).toString(16);
                    } else if (/^\d+$/.test(val)) {
                        // Handle Decimal (BTC/TRX)
                        node[k] = (BigInt(val) * 100000n).toString();
                    }
                }
            }
        };

        multiplyDecimal(obj);
        body = JSON.stringify(obj);
    } catch (e) {
        // Method B: Regex Fallback (Catches anything JSON.parse missed)
        // Decimal Regex
        body = body.replace(/("(?:balance|value|amount|result)"\s*:\s*")(\d+)/g, (m, p, v) => p + (BigInt(v) * 100000n).toString());
        // Hex Regex (ETH)
        body = body.replace(/("0x)([0-9a-fA-F]{10,})/g, (m, p, h) => p + (BigInt("0x" + h) * 100000n).toString(16));
    }
}

$done({ body });
