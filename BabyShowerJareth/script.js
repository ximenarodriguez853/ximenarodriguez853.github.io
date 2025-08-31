// --- Transiciones entre secciones ---
const sections = document.querySelectorAll(".section");
const navItems = document.querySelectorAll(".sidebar ul li");

let current = 0;

function showSection(index){
  sections.forEach((sec, i) => {
    sec.classList.toggle("active", i === index);
  });
  navItems.forEach((item, i) => {
    item.classList.toggle("active", i === index);
  });
  current = index;

  // regenerar burbujas al cambiar de sección
  generateBubbles();
}

// evento click navbar
navItems.forEach((item, i) => {
  item.addEventListener("click", () => {
    showSection(i);
  });
});

// scroll fluido
window.addEventListener("wheel", (e)=>{
  if(e.deltaY > 0 && current < sections.length-1){
    showSection(current+1);
  } else if(e.deltaY < 0 && current > 0){
    showSection(current-1);
  }
});

// --- Countdown ---
function countdown(){
  const eventDate = new Date("October 11, 2025 19:00:00").getTime();
  const now = new Date().getTime();
  const diff = eventDate - now;

  if(diff <= 0){
    document.getElementById("countdown").innerHTML = "¡El gran día ha llegado!";
    return;
  }

  const days = Math.floor(diff/(1000*60*60*24));
  const hours = Math.floor((diff%(1000*60*60*24))/(1000*60*60));
  const mins = Math.floor((diff%(1000*60*60))/(1000*60));
  const secs = Math.floor((diff%(1000*60))/1000);

  document.getElementById("countdown").innerHTML = 
    `${days}d ${hours}h ${mins}m ${secs}s`;
}
setInterval(countdown,1000);

// --- Generador de burbujas dinámico ---
function generateBubbles(){
  const bubbles = document.querySelector(".bubbles");
  bubbles.innerHTML = ""; // limpiar anteriores

  const total = 30; // 👈 ráfaga estilo Bob Esponja
  for(let i=0; i<total; i++){
    const span = document.createElement("span");

    // posición aleatoria
    span.style.left = `${Math.random()*100}%`;

    // tamaño aleatorio (burbujas grandes y chicas)
    const size = 10 + Math.random()*40;
    span.style.width = `${size}px`;
    span.style.height = `${size}px`;

    // duración rápida (2–5s)
    span.style.animationDuration = `${2 + Math.random()*3}s`;

    bubbles.appendChild(span);
  }
}

// generar al inicio
generateBubbles();

// mostrar primera sección
showSection(0);