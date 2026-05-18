
// node = { id, text, done, collapsed, children[] }
let roots = [];
let nextId = 1;

const MAX_VISUAL_DEPTH = 4; // colours cycle after this
const DEPTH_LABELS     = ['Huvudmål', 'Delmål', 'Underdelmål', 'Nivå 4', 'Nivå 5'];
const DEPTH_COLORS     = ['var(--c0)','var(--c1)','var(--c2)','var(--c3)','var(--c4)'];

function uid() { return nextId++; }
function makeNode(text = '') { return { id: uid(), text, done: false, collapsed: false, children: [] }; }


// Räknar ut hur långt man har kommit på ett mål
function pct(node) {
	if (!node.children.length) return node.done ? 100 : 0;
	return Math.round(node.children.reduce((s, c) => s + pct(c), 0) / node.children.length);
}

// Går genom alla och ser hur långt de kommit
function overallPct() {
	if (!roots.length) return 0;
	return Math.round(roots.reduce((s, r) => s + pct(r), 0) / roots.length);
}

// Sätter done om alla dess barn är färdiga
function syncDoneUp(node) {
    if (!node.children.length) return;
    node.done = node.children.every(c => { syncDoneUp(c); return c.done; });
}

// Kör syncDoneUp på alla träd
function syncAll() { roots.forEach(syncDoneUp); }

// Om man förändrar något långt upp i listan ändrar detta alla under
function setAllDone(node, val) {
    node.done = val;
    node.children.forEach(c => setAllDone(c, val));
}

  // Går igenom alla noder för att hitta rätt id
function findNode(list, id) {
    for (const n of list) {
		if (n.id === id) return n;
		const f = findNode(n.children, id);
		if (f) return f;
    }
    return null;
}

// Hittar rätt nod och sen tar bort den
function removeById(list, id) {
    const i = list.findIndex(n => n.id === id);
    if (i !== -1) { list.splice(i, 1); return true; }
    for (const n of list) { if (removeById(n.children, id)) return true; }
    return false;
}

// Skapar HTML koden för varje node. Beroende på vilken depth kan den gå igenom alla nodes
function buildNodeEl(node, depth) {
	// Hittar depthen för att bestäma färgen
    const d = Math.min(depth, MAX_VISUAL_DEPTH); 
	
	// Skapar diven runt kortet
    const card = document.createElement('div');
    card.className = 'node-card' + (node.done ? ' done' : '');
    card.dataset.depth = d;
    card.dataset.id    = node.id;

    // Lägger till en header vid behov
    const header = document.createElement('div');
    header.className = 'node-header';

	// Lägger till en button för att förminska fältet vid behov
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'toggle-btn' + (node.children.length === 0 ? ' hidden' : '');
    toggleBtn.textContent = node.collapsed ? '▶' : '▼';
    toggleBtn.title = node.collapsed ? 'Visa delmål' : 'Dölj delmål';
    toggleBtn.addEventListener('click', () => {
		node.collapsed = !node.collapsed;
		render();
    });

	// Lägger till en checkbutton
    const checkBtn = document.createElement('button');
    checkBtn.className = 'check-btn' + (node.done ? ' checked' : '');
    checkBtn.textContent = '✓';
    checkBtn.title = node.done ? 'Markera som ej klar' : 'Markera som klar';
    checkBtn.addEventListener('click', () => {
		if (node.children.length) {
			setAllDone(node, !node.done);
		} else {
			node.done = !node.done;
		}
		syncAll();
		render();
    });

	// Lägger till resterande av HTMLen
    const titleInput = document.createElement('input');
    titleInput.className  = 'node-title';
    titleInput.type        = 'text';
    titleInput.placeholder = (DEPTH_LABELS[d] || 'Delmål') + '…';
    titleInput.value       = node.text;
    titleInput.addEventListener('input', () => { node.text = titleInput.value; });

    const badge = document.createElement('span');
    badge.className   = 'depth-badge';
    badge.textContent = DEPTH_LABELS[d] || ('Nivå ' + (depth + 1));

    const delBtn = document.createElement('button');
    delBtn.className   = 'delete-btn';
    delBtn.textContent = '✕';
    delBtn.title       = 'Ta bort';
    delBtn.addEventListener('click', () => {
		removeById(roots, node.id);
		syncAll();
		render();
    });

	// Lägger till objectet vi skapat till koden
    header.append(toggleBtn, checkBtn, titleInput, badge, delBtn);
    card.appendChild(header);

    // Om noden som hålls på att ändras har barn läggs en progress bar till
    if (node.children.length > 0) {
		const nodePct  = pct(node);
		const doneCount = countDirectlyDone(node.children);

		const prog = document.createElement('div');
		prog.className = 'node-progress';
		prog.innerHTML = `
        <div class="label-row">
			<span>${doneCount} av ${node.children.length} delmål klara</span>
			<span>${nodePct}%</span>
        </div>
        <div class="bar-track">
			<div class="bar-fill" style="width:${nodePct}%; background:${DEPTH_COLORS[d]};"></div>
        </div>`;
		card.appendChild(prog);
    }

    // Lägger till ytan där barn får platts
    const childrenArea = document.createElement('div');
    childrenArea.className = 'children-area' + (node.collapsed ? ' collapsed' : '');

	// Går genom samma funktion igen för alla dess barn
    node.children.forEach(child => {
		childrenArea.appendChild(buildNodeEl(child, depth + 1));
    });

    // Knappen för att lägga till barn
    const addChildBtn  = document.createElement('button');
    addChildBtn.className   = 'add-child-btn';
    const nextD = Math.min(d + 1, MAX_VISUAL_DEPTH);
    addChildBtn.textContent = '+ Lägg till ' + (DEPTH_LABELS[nextD] || 'delmål').toLowerCase();
    addChildBtn.addEventListener('click', () => {
		const child = makeNode();
		node.children.push(child);
		node.collapsed = false;
		syncAll();
		render();
		setTimeout(() => {
			const newCard = document.querySelector(`.node-card[data-id="${child.id}"]`);
			if (newCard) { 
				const inp = newCard.querySelector('.node-title'); 
				if (inp) inp.focus(); 
			}
        }, 30);
    });

	// Lägger till barnets kod
    childrenArea.appendChild(addChildBtn);
    card.appendChild(childrenArea);

    return card;
}

// Räknar på hur många barn som är färdiga
function countDirectlyDone(children) {
    return children.filter(c => pct(c) === 100).length;
}

// När något ska uppdateras renderar vi ut hela sidan varje gång. Gör det lättare att hitta buggar men kan försämra prestanda vid gigantiska listor
function render() {
    const list = document.getElementById('goals-list');
    list.innerHTML = '';

    if (!roots.length) {
		list.innerHTML = '<p id="empty-state">Inga mål ännu. Tryck på knappen ovan för att börja!</p>';
    } else {
		roots.forEach(node => list.appendChild(buildNodeEl(node, 0)));
    }

    const op = overallPct();
    document.getElementById('overall-pct').textContent = op + '%';
    document.getElementById('overall-bar').style.width  = op + '%';
}

// Den stora knappen för att lägga till root goals
document.getElementById('add-goal-btn').addEventListener('click', () => {
    const node = makeNode();
    roots.push(node);
    render();
    setTimeout(() => {
		const newCard = document.querySelector(`.node-card[data-id="${node.id}"]`);
		if (newCard) { 
			const inp = newCard.querySelector('.node-title'); 
			if (inp) inp.focus(); 
		}
    }, 30);
});

render();