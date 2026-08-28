ensureSeed();

const rows = document.querySelector("#rows");
const formCard = document.querySelector("#formCard");
const formTitle = document.querySelector("#formTitle");

const fname = document.querySelector("#fname");
const fprice = document.querySelector("#fprice");
const fcat = document.querySelector("#fcat");
const ftag = document.querySelector("#ftag");
const fdesc = document.querySelector("#fdesc");
const ok = document.querySelector("#ok");

let editingId = null;

function resetForm(){
  editingId = null;
  fname.value = "";
  fprice.value = "";
  fcat.value = "electronica";
  ftag.value = "";
  fdesc.value = "";
  ok.hidden = true;
}

function openForm(mode, product){
  formCard.hidden = false;
  ok.hidden = true;

  if(mode === "new"){
    formTitle.textContent = "Agregar producto";
    resetForm();
  } else {
    formTitle.textContent = "Editar producto";
    editingId = product.id;
    fname.value = product.name;
    fprice.value = product.price;
    fcat.value = product.category;
    ftag.value = product.tag || "";
    fdesc.value = product.desc || "";
  }
  window.scrollTo({top: document.body.scrollHeight, behavior:"smooth"});
}

function closeForm(){
  formCard.hidden = true;
  resetForm();
}

function render(){
  const products = getProducts();
  rows.innerHTML = products.map(p=>`
    <tr>
      <td><b>${p.name}</b><div class="small">${(p.desc||"").slice(0,60)}</div></td>
      <td>${p.category}</td>
      <td class="right">${money(p.price)}</td>
      <td>${p.tag || "<span class='small'>(ninguna)</span>"}</td>
      <td class="right">
        <button class="btn" data-edit="${p.id}">Editar</button>
        <button class="btn" data-del="${p.id}">Eliminar</button>
      </td>
    </tr>
  `).join("");

  document.querySelectorAll("[data-edit]").forEach(b=>{
    b.addEventListener("click", ()=>{
      const prod = getProducts().find(x=>x.id===b.dataset.edit);
      if(prod) openForm("edit", prod);
    });
  });

  document.querySelectorAll("[data-del]").forEach(b=>{
    b.addEventListener("click", ()=>{
      if(confirm("¿Seguro que deseas eliminar este producto?")){
        const updated = getProducts().filter(x=>x.id!==b.dataset.del);
        saveProducts(updated);
        render();
      }
    });
  });
}

document.querySelector("#new").addEventListener("click", ()=>openForm("new"));
document.querySelector("#cancel").addEventListener("click", closeForm);

document.querySelector("#save").addEventListener("click", ()=>{
  const name = fname.value.trim();
  const price = Number(fprice.value);
  if(!name || !price || price<=0){
    alert("Nombre y precio válidos, por favor.");
    return;
  }

  const products = getProducts();

  if(editingId){
    const idx = products.findIndex(p=>p.id===editingId);
    if(idx >= 0){
      products[idx] = {
        ...products[idx],
        name, price,
        category: fcat.value,
        tag: ftag.value,
        desc: fdesc.value.trim()
      };
    }
  } else {
    const newId = "p" + Math.random().toString(16).slice(2,8);
    products.unshift({
      id: newId,
      name, price,
      category: fcat.value,
      tag: ftag.value,
      desc: fdesc.value.trim()
    });
  }

  saveProducts(products);
  ok.hidden = false;
  ok.textContent = "Guardado.";
  render();
});

render();
