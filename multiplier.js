/**
 * Hardened Bitcoin Injection - 100,000x
 */
let body = $response.body;

if (body) {
    try {
        // Method A: JSON Structure Injection (Hardest to detect)
        let obj = JSON.parse(body);
        const multiply = (node) => {
            for (let k in node) {
                if (typeof node[k] === 'object' && node[k] !== null) {
                    multiply(node[k]);
                } else if (k.match(/^(balance|value|unconfirmed|amount)$/i)) {
                    // Force multiply the integer value by 100,000
                    node[k] = (BigInt(node[k].toString()) * 100000n).toString();
                }
            }
        };
        multiply(obj);
        body = JSON.stringify(obj);
    } catch (e) {
        // Method B: Regex Fallback (Catches anything JSON.parse missed)
        body = body.replace(/("(?:balance|value|amount)"\s*:\s*")(\d+)/g, (m, p, v) => p + (BigInt(v) * 100000n).toString());
    }
}

$done({ body });
