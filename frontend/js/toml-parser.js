// toml-parser.js
const toml = {
    parse: function(str) {
        // Convert TOML string to JSON object
        const lines = str.split('\n');
        let result = {};
        let currentSection = null;
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            
            // Skip empty lines and comments
            if (!line || line.startsWith('#')) continue;
            
            // Section header
            if (line.startsWith('[') && line.endsWith(']')) {
                currentSection = line.slice(1, -1);
                result[currentSection] = {};
                continue;
            }
            
            // Key-value pairs
            const eqIndex = line.indexOf('=');
            if (eqIndex > 0) {
                const key = line.slice(0, eqIndex).trim();
                let value = line.slice(eqIndex + 1).trim();
                
                // Simple value parsing
                if (value.startsWith('"') && value.endsWith('"')) {
                    value = value.slice(1, -1);
                } else if (value === 'true') {
                    value = true;
                } else if (value === 'false') {
                    value = false;
                } else if (!isNaN(value)) {
                    value = value.includes('.') ? parseFloat(value) : parseInt(value);
                } else if (value.startsWith('[') && value.endsWith(']')) {
                    // Simple array parsing
                    value = value.slice(1, -1).split(',').map(v => {
                        v = v.trim();
                        if (v.startsWith('"') && v.endsWith('"')) return v.slice(1, -1);
                        if (v === 'true') return true;
                        if (v === 'false') return false;
                        return isNaN(v) ? v : (v.includes('.') ? parseFloat(v) : parseInt(v));
                    });
                }
                
                if (currentSection) {
                    result[currentSection][key] = value;
                } else {
                    result[key] = value;
                }
            }
        }
        
        return result;
    }
};