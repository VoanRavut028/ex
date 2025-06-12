import { service } from "./data.js";

function loadService() {
  let card = ``;
  service.forEach((items) => {
    card += `
     <div  data-aos="zoom-in-up" class="col-12 col-sm-6 col-md-6 col-lg-4 col-xl-4 my-4 text-center">
         <div class="card custom-card mb-4">
         <img class="img bg-white text-center " src="${items.img}" alt="${items.name}">
         <div class="card-body">
            <h5 class="card-title text-center">${items.name}</h5>
            <p class="card-text">${items.description}</p>
            <a href="#" class=" text-center">  
              <a class="text-center fw-bold">Read more</a>
            </a>
          </div>  
         </div>
        </div>
    `;
  });
  document.querySelector(".load-service-section").innerHTML = card;
}
loadService();
