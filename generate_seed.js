const fs = require('fs');

const content = fs.readFileSync('uploaded-image-urls.txt', 'utf8');
const lines = content.split('\n').filter(l => l.trim());

const items = lines.map(line => {
    const [path, url] = line.split(': ').map(s => s.trim());
    const category = path.split('/')[0];
    let cat = 'tops';
    if (category === 'top') cat = 'tops';
    else if (category === 'bottom') cat = 'bottoms';
    else if (category === 'shoes') cat = 'shoes';
    else if (category === 'accessories') cat = 'accessories';
    
    return { url, cat };
});

const sql = items.map(item => {
    return `INSERT INTO public.wardrobe_items (user_id, image_url, category) VALUES ('00000000-0000-0000-0000-000000000000', '${item.url}', '${item.cat}');`;
}).join('\n');

fs.writeFileSync('seed_items.sql', sql);
console.log('Generated seed_items.sql with', items.length, 'items');
