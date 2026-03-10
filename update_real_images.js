const fs = require('fs');
let code = fs.readFileSync('frontend/src/api/client.ts', 'utf8');

const imageMap = {
  'STL-RB-16': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=400', // Rebar
  'STL-CI-28': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400', // Corrugated Iron
  'STL-WE-32': 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=400', // Welding
  'STL-AP-4': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=400', // Angle Iron
  'CMT-PC-50': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400', // Cement
  'CMT-SC-25': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400', // Screed
  'TIL-CF-40': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400', // Tiles
  'PNT-EW-20': 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=400', // Paint
  'PIP-PV-4': 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=400', // Pipe
  'HW-BB-M16': 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=400', // Bolts
};

for (const [codeKey, url] of Object.entries(imageMap)) {
  const regex = new RegExp(`(name: '${codeKey}',[^{}]+image: ')([^']+)'`);
  code = code.replace(regex, `$1${url}'`);
}

fs.writeFileSync('frontend/src/api/client.ts', code);
console.log('Updated with real construction images!');
