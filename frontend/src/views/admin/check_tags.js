const fs = require('fs');
const content = fs.readFileSync('c:\\Users\\Abhin\\Desktop\\Smart Valet\\frontend\\src\\views\\admin\\LocationDetails.vue', 'utf8');

const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
if (!templateMatch) {
    console.log('No template found');
    process.exit(1);
}

const template = templateMatch[1];

function countTags(str, open, close) {
    let count = 0;
    let pos = 0;
    while ((pos = str.indexOf(open, pos)) !== -1) {
        count++;
        pos += open.length;
    }
    let closeCount = 0;
    pos = 0;
    while ((pos = str.indexOf(close, pos)) !== -1) {
        closeCount++;
        pos += close.length;
    }
    return { open: count, close: closeCount };
}

// This is naive but helpful
const divs = countTags(template, '<div', '</div>');
console.log('DIVs:', divs);

const mains = countTags(template, '<main', '</main>');
console.log('MAINs:', mains);

const buttons = countTags(template, '<button', '</button>');
console.log('BUTTONs:', buttons);

const tables = countTags(template, '<table', '</table>');
console.log('TABLEs:', tables);

const forms = countTags(template, '<form', '</form>');
console.log('FORMs:', forms);

const sections = countTags(template, '<section', '</section>');
console.log('SECTIONs:', sections);
