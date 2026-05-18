let tal = "";
let tal2 = "";
let uträckning = "";

function displayNew(str) {
	console.log(str);
	document.getElementsByClassName("display")[0].innerText = str;
}

function add(nuTal) {
	if (uträckning === "") {
		tal += nuTal;
		displayNew(tal);
	} else {
		tal2 += nuTal;
		displayNew(tal + " " + uträckning + " " + tal2);
	}
}

function addUt(uträ) {
	if (uträckning === "") {
		uträckning = uträ;
		displayNew(tal + " " + uträckning);
	}
}

function räkna() {
	let svar;
	tal = parseInt(tal);
	tal2 = parseInt(tal2);
	svar = eval(tal + " " + uträckning + " " + tal2);
	
	document.getElementsByClassName("svar")[0].innerText = svar;
	tal = "";
	tal2 = "";
	uträckning = "";
}

function ändFärg() {
	document.background.style.backgroundColor = "blue";
}